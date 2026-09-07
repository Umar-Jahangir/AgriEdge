import { useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { Sprout, Loader2, ArrowRight } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { DemoModeBanner } from '../components/ui/DemoModeBanner';

export function LoginPage() {
  const [email, setEmail] = useState('farmer@demo.com');
  const [password, setPassword] = useState('demo123');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const success = await login(email, password);
      if (success) navigate('/dashboard');
      else setError('Invalid credentials entered');
    } catch {
      setError('Terminal connection error. Please retry.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen field-grid-bg">
      {/* Left Heavy Editorial Slab */}
      <div className="hidden flex-1 flex-col justify-between bg-[#0d2a14] p-12 text-[#f3f2eb] lg:flex border-r-2 border-earth-900">
        <div>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center border-2 border-farm-400 bg-farm-900">
              <Sprout className="h-6 w-6 text-farm-300" />
            </div>
            <div>
              <span className="font-mono text-[10px] font-bold uppercase tracking-widest text-farm-300">
                // EDGE WORKSTATION
              </span>
              <h1 className="font-display text-lg font-bold tracking-tight text-white uppercase">
                AgriEdge Autonomous Rover
              </h1>
            </div>
          </div>
        </div>

        <div className="max-w-lg space-y-6">
          <div className="space-y-2">
            <span className="inline-block border border-farm-400/40 bg-farm-900/60 px-2 py-0.5 font-mono text-xs font-bold uppercase tracking-wider text-farm-300">
              SYSTEM ARCHITECTURE: ZERO CLOUD DEPENDENCY
            </span>
            <h2 className="font-display text-4xl font-bold uppercase tracking-tight text-white leading-[1.05]">
              Autonomous Rover Field Intelligence
            </h2>
          </div>
          <p className="font-sans text-sm text-farm-100/90 leading-relaxed">
            Eliminating hundreds of static field nodes. A single autonomous rover systematically maps soil chemistry, sub-surface moisture gradients, and leaf canopy pathologies — processed entirely on-device via quantized neural models.
          </p>

          {/* Monospace Telemetry Badges */}
          <div className="grid grid-cols-3 gap-3 border-t border-farm-800/80 pt-6 font-mono">
            <div className="border border-farm-800/80 bg-farm-950/40 p-3">
              <p className="text-2xl font-bold text-farm-300">30+</p>
              <p className="text-[10px] uppercase text-farm-400">WAYPOINTS / CYCLE</p>
            </div>
            <div className="border border-farm-800/80 bg-farm-950/40 p-3">
              <p className="text-2xl font-bold text-farm-300">4</p>
              <p className="text-[10px] uppercase text-farm-400">FIELD QUADRANTS</p>
            </div>
            <div className="border border-farm-800/80 bg-farm-950/40 p-3">
              <p className="text-2xl font-bold text-farm-300">ONNX</p>
              <p className="text-[10px] uppercase text-farm-400">QUANTIZED INT8</p>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between border-t border-farm-800/80 pt-4 font-mono text-[11px] text-farm-400">
          <span>SMART INDIA HACKATHON 2026</span>
          <span>STATION ID: AGRI-BASE-01</span>
        </div>
      </div>

      {/* Right Sign-in Form */}
      <div className="flex flex-1 flex-col items-center justify-center p-6 sm:p-12">
        <div className="w-full max-w-md">
          {/* Mobile Header */}
          <div className="mb-8 flex items-center gap-3 lg:hidden">
            <div className="flex h-10 w-10 items-center justify-center border-2 border-farm-800 bg-farm-900 text-white">
              <Sprout className="h-6 w-6 text-farm-300" />
            </div>
            <div>
              <span className="font-mono text-[10px] font-bold uppercase tracking-widest text-farm-800">
                // AGRIEDGE ROVER
              </span>
              <h1 className="font-display text-base font-bold uppercase text-earth-900">
                Autonomous Field Station
              </h1>
            </div>
          </div>

          <div className="mb-6">
            <DemoModeBanner />
          </div>

          <div className="tactile-card bg-white p-6 sm:p-8">
            <div className="border-b border-earth-200 pb-3 mb-5">
              <span className="font-mono text-[10px] font-bold uppercase tracking-widest text-farm-800">
                // OPERATOR AUTHENTICATION
              </span>
              <h2 className="font-display text-xl font-bold uppercase tracking-tight text-earth-900">
                Station Terminal Sign-In
              </h2>
              <p className="font-mono text-xs text-earth-500 mt-0.5">
                Enter operator credentials to access field control console.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block font-mono text-xs font-bold uppercase tracking-wider text-earth-700">
                  OPERATOR IDENTIFIER (EMAIL)
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="mt-1 w-full border-2 border-earth-300 bg-earth-50/50 px-3 py-2 font-mono text-sm text-earth-900 outline-none transition-colors focus:border-earth-900 focus:bg-white"
                  placeholder="farmer@demo.com"
                />
              </div>

              <div>
                <label className="block font-mono text-xs font-bold uppercase tracking-wider text-earth-700">
                  SECURITY KEY (PASSWORD)
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="mt-1 w-full border-2 border-earth-300 bg-earth-50/50 px-3 py-2 font-mono text-sm text-earth-900 outline-none transition-colors focus:border-earth-900 focus:bg-white"
                  placeholder="••••••••"
                />
              </div>

              {error && (
                <div className="border border-red-300 bg-red-50 p-2 font-mono text-xs font-bold text-red-800">
                  [AUTH ERROR]: {error}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="mt-2 flex w-full items-center justify-center gap-2 border-2 border-earth-900 bg-earth-900 py-3 font-mono text-xs font-bold uppercase tracking-widest text-white transition-all hover:bg-farm-900 active:translate-y-0.5 disabled:opacity-60 shadow-xs"
              >
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    AUTHENTICATING...
                  </>
                ) : (
                  <>
                    INITIALIZE WORKSTATION
                    <ArrowRight className="h-4 w-4" />
                  </>
                )}
              </button>
            </form>

            <div className="mt-6 border-t border-earth-200 pt-3 text-center">
              <p className="font-mono text-[11px] text-earth-500">
                PROTOTYPE ACCESS: ANY CREDENTIALS ADMITTED IN DEMO MODE
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
