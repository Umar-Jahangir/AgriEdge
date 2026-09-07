"""Train a timm classifier on the unified manifest."""
import argparse, json, math, os, sys, time
from collections import defaultdict
from pathlib import Path

import timm
import torch
import torch.nn.functional as F
from timm.data import Mixup
from timm.utils import ModelEmaV3
from torch.utils.data import DataLoader

sys.path.insert(0, os.path.dirname(__file__))
from data import PlantDataset, load_manifest
from labels import CLASSES

ROOT = Path(__file__).resolve().parent.parent


@torch.no_grad()
def evaluate(model, loader, sources, device):
    model.eval()
    correct, total = defaultdict(int), defaultdict(int)
    for (x, y), src in zip(loader, sources):
        x, y = x.to(device, non_blocking=True), y.to(device, non_blocking=True)
        with torch.autocast("cuda", dtype=torch.bfloat16):
            pred = model(x.to(memory_format=torch.channels_last)).argmax(1)
        for s, c in zip(src, (pred == y).tolist()):
            correct[s] += c
            total[s] += 1
    acc = {s: correct[s] / total[s] for s in total}
    acc["all"] = sum(correct.values()) / sum(total.values())
    acc["balanced"] = sum(v for k, v in acc.items() if k != "all") / (len(acc) - 1)
    return acc


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--model", default="mobilenetv3_large_100")
    ap.add_argument("--img-size", type=int, default=224)
    ap.add_argument("--epochs", type=int, default=20)
    ap.add_argument("--batch-size", type=int, default=128)
    ap.add_argument("--lr", type=float, default=2e-3)
    ap.add_argument("--wd", type=float, default=0.05)
    ap.add_argument("--warmup-epochs", type=float, default=1)
    ap.add_argument("--label-smoothing", type=float, default=0.1)
    ap.add_argument("--mix-prob", type=float, default=0.3)
    ap.add_argument("--composite-p", type=float, default=0.5)
    ap.add_argument("--drop-rate", type=float, default=0.2)
    ap.add_argument("--ema-decay", type=float, default=0.9998)
    ap.add_argument("--workers", type=int, default=32)
    ap.add_argument("--out", default=None)
    ap.add_argument("--seed", type=int, default=0)
    ap.add_argument("--resume", action="store_true", help="continue from <out>/resume.pt")
    args = ap.parse_args()

    torch.manual_seed(args.seed)
    device = "cuda"
    out = Path(args.out or ROOT / "outputs" / args.model)
    out.mkdir(parents=True, exist_ok=True)
    json.dump(vars(args), open(out / "args.json", "w"), indent=1)

    train_rows = load_manifest("train")
    val_rows = load_manifest("val")
    train_ds = PlantDataset(train_rows, args.img_size, train=True, composite_p=args.composite_p)
    val_ds = PlantDataset(val_rows, args.img_size, train=False)
    train_dl = DataLoader(train_ds, args.batch_size, shuffle=True, num_workers=args.workers, pin_memory=True,
                          drop_last=True, persistent_workers=True, prefetch_factor=4)
    val_dl = DataLoader(val_ds, 256, num_workers=16, pin_memory=True)
    val_sources = [[r["source"] for r in val_rows[i:i + 256]] for i in range(0, len(val_rows), 256)]
    print(f"train samples/epoch {len(train_ds)} (unique {len(train_rows)}), val {len(val_rows)}", flush=True)

    model = timm.create_model(args.model, pretrained=True, num_classes=len(CLASSES), drop_rate=args.drop_rate)
    model = model.to(device).to(memory_format=torch.channels_last)
    ema = ModelEmaV3(model, decay=args.ema_decay)
    print(f"{args.model}: {sum(p.numel() for p in model.parameters()) / 1e6:.2f}M params", flush=True)

    decay, no_decay = [], []
    for n, p in model.named_parameters():
        (no_decay if p.ndim <= 1 or n.endswith(".bias") else decay).append(p)
    opt = torch.optim.AdamW([{"params": decay, "weight_decay": args.wd}, {"params": no_decay, "weight_decay": 0}], lr=args.lr)
    steps_per_epoch = len(train_dl)
    total_steps = args.epochs * steps_per_epoch
    warmup = int(args.warmup_epochs * steps_per_epoch)
    sched = torch.optim.lr_scheduler.LambdaLR(
        opt, lambda s: s / max(1, warmup) if s < warmup else 0.5 * (1 + math.cos(math.pi * (s - warmup) / max(1, total_steps - warmup))))
    mixup = Mixup(mixup_alpha=0.2, cutmix_alpha=1.0, prob=args.mix_prob, label_smoothing=args.label_smoothing, num_classes=len(CLASSES))

    best, start_epoch = -1.0, 0
    if args.resume and (out / "resume.pt").exists():
        st = torch.load(out / "resume.pt", map_location="cpu", weights_only=False)
        model.load_state_dict(st["model"])
        ema.module.load_state_dict(st["ema"])
        opt.load_state_dict(st["opt"])
        sched.load_state_dict(st["sched"])
        best, start_epoch = st["best"], st["epoch"] + 1
        print(f"resumed from epoch {st['epoch']} (best {best:.4f})", flush=True)
    log = open(out / "log.jsonl", "a")
    for epoch in range(start_epoch, args.epochs):
        model.train()
        t0, run_loss, n = time.time(), 0.0, 0
        for step, (x, y) in enumerate(train_dl):
            x = x.to(device, non_blocking=True).to(memory_format=torch.channels_last)
            y = y.to(device, non_blocking=True)
            x, y_soft = mixup(x, y)
            with torch.autocast("cuda", dtype=torch.bfloat16):
                loss = torch.sum(-y_soft * F.log_softmax(model(x), dim=-1), dim=-1).mean()
            opt.zero_grad(set_to_none=True)
            loss.backward()
            torch.nn.utils.clip_grad_norm_(model.parameters(), 5.0)
            opt.step()
            sched.step()
            ema.update(model)
            run_loss += loss.item()
            n += 1
            if step % 100 == 0:
                print(f"ep {epoch} step {step}/{steps_per_epoch} loss {run_loss / n:.4f} lr {sched.get_last_lr()[0]:.2e}", flush=True)
        acc = evaluate(model, val_dl, val_sources, device)
        acc_ema = evaluate(ema.module, val_dl, val_sources, device)
        rec = dict(epoch=epoch, loss=run_loss / n, time=time.time() - t0, val=acc, val_ema=acc_ema)
        log.write(json.dumps(rec) + "\n")
        log.flush()
        print(f"== ep {epoch} loss {rec['loss']:.4f} {rec['time']:.0f}s | val {json.dumps({k: round(v, 4) for k, v in acc.items()})} | ema {json.dumps({k: round(v, 4) for k, v in acc_ema.items()})}", flush=True)
        # keep whichever of raw/EMA has the best source-balanced val accuracy
        for tag, m, a in (("raw", model, acc), ("ema", ema.module, acc_ema)):
            if a["balanced"] > best:
                best = a["balanced"]
                torch.save({"model": args.model, "img_size": args.img_size, "classes": CLASSES, "state_dict": m.state_dict(),
                            "epoch": epoch, "which": tag, "val": a}, out / "best.pt")
                print(f"   saved best ({tag}) balanced={best:.4f}", flush=True)
        torch.save({"model": args.model, "img_size": args.img_size, "classes": CLASSES, "state_dict": ema.module.state_dict(), "epoch": epoch}, out / "last_ema.pt")
        torch.save({"model": model.state_dict(), "ema": ema.module.state_dict(), "opt": opt.state_dict(), "sched": sched.state_dict(),
                    "best": best, "epoch": epoch}, out / "resume.pt")
    print("best balanced val acc:", best)


if __name__ == "__main__":
    main()
