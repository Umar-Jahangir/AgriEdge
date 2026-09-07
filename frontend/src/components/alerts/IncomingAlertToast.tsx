import { useState, useEffect, useRef } from 'react';
import { X, Volume2, CheckCircle2, Phone, MessageSquare, Bell } from 'lucide-react';
import { api } from '../../services/api';
import { useLanguage } from '../../context/LanguageContext';

export function IncomingAlertToast() {
  const { speakText } = useLanguage();

  const [activeAlert, setActiveAlert] = useState<{
    dispatchId: string;
    payloadPreview: string;
    phoneNumber: string;
    channel: string;
    operator: string;
    receivedAt: string;
  } | null>(null);

  const [permission, setPermission] = useState<NotificationPermission>(
    typeof Notification !== 'undefined' ? Notification.permission : 'default'
  );

  const lastSeenIdRef = useRef<string | null>(null);

  // Play retro incoming SMS ringtone via Web Audio API
  const playIncomingSmsChime = () => {
    try {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioCtx) {
        const ctx = new AudioCtx();
        const now = ctx.currentTime;
        // Classic Nokia SMS tone: High-High-High-Low
        const notes = [
          { freq: 880, start: now + 0.0, dur: 0.1 },
          { freq: 880, start: now + 0.15, dur: 0.1 },
          { freq: 880, start: now + 0.3, dur: 0.1 },
          { freq: 659, start: now + 0.5, dur: 0.25 },
        ];
        notes.forEach(({ freq, start, dur }) => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = 'sine';
          osc.frequency.setValueAtTime(freq, start);
          gain.gain.setValueAtTime(0.08, start);
          gain.gain.exponentialRampToValueAtTime(0.001, start + dur);
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.start(start);
          osc.stop(start + dur);
        });
      }
    } catch {
      // AudioContext unavailable
    }
  };

  const triggerDeviceFeedback = (body: string) => {
    // 1. Physically vibrate device
    if ('vibrate' in navigator) {
      try {
        navigator.vibrate([300, 100, 300, 100, 500]);
      } catch {
        // Vibration not permitted
      }
    }

    // 2. Play ringtone
    playIncomingSmsChime();

    // 3. Drop native OS notification
    if (typeof Notification !== 'undefined' && Notification.permission === 'granted') {
      try {
        new Notification('🔔 [Kisan Alert] 51969', {
          body,
          icon: '/favicon.ico',
        });
      } catch {
        // Notifications blocked
      }
    }
  };

  // Poll for latest incoming dispatch every 2.5 seconds
  useEffect(() => {
    let isMounted = true;
    const interval = setInterval(async () => {
      try {
        const data = await api.getLiveAlertDispatch();
        if (!isMounted || !data || !data.dispatchId) return;

        // Check if this is a newly arrived dispatch
        if (lastSeenIdRef.current === null) {
          // Initialize with current without annoying on page load
          lastSeenIdRef.current = data.dispatchId;
          return;
        }

        if (data.dispatchId !== lastSeenIdRef.current) {
          lastSeenIdRef.current = data.dispatchId;
          const incoming = {
            dispatchId: data.dispatchId,
            payloadPreview: data.payloadPreview || '',
            phoneNumber: data.phoneNumber || '',
            channel: data.channel || 'SMS',
            operator: 'mKisan 51969 Telecom Node',
            receivedAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
          };
          setActiveAlert(incoming);
          triggerDeviceFeedback(incoming.payloadPreview);
        }
      } catch {
        // Backend not reachable
      }
    }, 2500);

    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, []);

  const requestPushPermission = async () => {
    if (typeof Notification !== 'undefined') {
      const res = await Notification.requestPermission();
      setPermission(res);
      if (res === 'granted') {
        triggerDeviceFeedback('AgriEdge Live Alert Receiver Active!');
      }
    }
  };

  if (!activeAlert) {
    // Show a subtle pill in corner allowing the user to enable OS notifications if not yet granted
    if (permission === 'default') {
      return (
        <div className="fixed bottom-4 right-4 z-40">
          <button
            type="button"
            onClick={requestPushPermission}
            className="flex items-center gap-2 border border-farm-700 bg-farm-900 px-3 py-1.5 text-xs font-semibold text-white shadow-xl hover:bg-farm-800 transition-all cursor-pointer rounded-full"
          >
            <Bell className="h-3.5 w-3.5 text-farm-300 animate-bounce" />
            <span>Enable Phone Alert Chime</span>
          </button>
        </div>
      );
    }
    return null;
  }

  return (
    <div className="fixed top-4 right-4 left-4 sm:left-auto sm:w-110 z-50 animate-bounce-short">
      <div className="border-2 border-emerald-600 bg-slate-950 p-4 text-white shadow-2xl rounded-lg">
        {/* Header Strip */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-2">
          <div className="flex items-center gap-2">
            <div className="flex h-6 w-6 items-center justify-center rounded-full bg-emerald-500 text-slate-950 animate-pulse">
              {activeAlert.channel === 'WHATSAPP' ? (
                <MessageSquare className="h-3.5 w-3.5" />
              ) : (
                <Phone className="h-3.5 w-3.5" />
              )}
            </div>
            <div>
              <span className="font-mono text-xs font-bold uppercase tracking-wider text-emerald-400">
                📩 INCOMING ALERT RECEIVED
              </span>
              <span className="text-[10px] text-slate-400 ml-2">
                {activeAlert.receivedAt}
              </span>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setActiveAlert(null)}
            className="text-slate-400 hover:text-white cursor-pointer"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Origin & Target Meta */}
        <div className="my-2 flex items-center justify-between font-mono text-[10px] text-slate-400">
          <span>FROM: 51969 (mKisan-AgriEdge)</span>
          <span className="text-emerald-300">TO: {activeAlert.phoneNumber}</span>
        </div>

        {/* Message Payload in High-Contrast Devanagari */}
        <div className="rounded bg-slate-900 border border-slate-800 p-2.5 my-2">
          <p className="font-medium text-xs leading-relaxed text-emerald-200">
            {activeAlert.payloadPreview}
          </p>
        </div>

        {/* Action Controls */}
        <div className="flex items-center justify-between pt-1">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => speakText(activeAlert.payloadPreview)}
              className="inline-flex items-center gap-1.5 border border-slate-700 bg-slate-800 px-2.5 py-1 text-xs font-semibold text-slate-200 hover:bg-slate-700 hover:text-white cursor-pointer rounded"
            >
              <Volume2 className="h-3.5 w-3.5 text-farm-300" />
              <span>Read Aloud</span>
            </button>

            <span className="text-[10px] font-mono text-emerald-400 flex items-center gap-1">
              <CheckCircle2 className="h-3 w-3" />
              <span>DELIVERED (Ack 200)</span>
            </span>
          </div>

          <button
            type="button"
            onClick={() => setActiveAlert(null)}
            className="border border-slate-700 px-2.5 py-1 text-xs text-slate-400 hover:text-white cursor-pointer rounded"
          >
            Dismiss
          </button>
        </div>
      </div>
    </div>
  );
}
