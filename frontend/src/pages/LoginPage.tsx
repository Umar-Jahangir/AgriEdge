import { useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { Sprout, Loader2 } from 'lucide-react';
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
      else setError('Invalid credentials');
    } catch {
      setError('Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen">
      <div className="hidden flex-1 flex-col justify-between bg-farm-800 p-12 text-white lg:flex">
        <div className="flex items-center gap-3">
          <div className="rounded-xl bg-farm-600 p-2">
            <Sprout className="h-8 w-8" />
          </div>
          <div>
            <p className="text-lg font-bold">AGRIEDGE ROVER</p>
            <p className="text-sm text-farm-200">Offline-First Edge AI Smart Farming</p>
          </div>
        </div>

        <div>
          <h2 className="text-3xl font-bold leading-tight">
            Autonomous Rover-Based<br />Farm Intelligence
          </h2>
          <p className="mt-4 max-w-md text-farm-200 leading-relaxed">
            Instead of installing hundreds of sensor nodes, our autonomous agricultural rover
            systematically collects soil, environmental, and crop data across your farm —
            processed locally by Edge AI for actionable recommendations.
          </p>
          <div className="mt-8 flex gap-6 text-sm">
            <div>
              <p className="text-2xl font-bold">30+</p>
              <p className="text-farm-300">Sampling Points</p>
            </div>
            <div>
              <p className="text-2xl font-bold">4</p>
              <p className="text-farm-300">Farm Zones</p>
            </div>
            <div>
              <p className="text-2xl font-bold">Edge</p>
              <p className="text-farm-300">AI Processing</p>
            </div>
          </div>
        </div>

        <p className="text-xs text-farm-400">SIH 2026 Prototype — Demo Mode</p>
      </div>

      <div className="flex flex-1 flex-col items-center justify-center px-6 py-12">
        <div className="w-full max-w-sm">
          <div className="mb-8 flex items-center gap-2 lg:hidden">
            <div className="rounded-lg bg-farm-600 p-1.5">
              <Sprout className="h-6 w-6 text-white" />
            </div>
            <div>
              <p className="font-bold text-farm-800">AGRIEDGE ROVER</p>
              <p className="text-xs text-earth-400">Offline-First Edge AI Smart Farming</p>
            </div>
          </div>

          <div className="mb-6">
            <DemoModeBanner />
          </div>

          <h2 className="text-xl font-semibold text-farm-800">Sign in to your farm</h2>
          <p className="mt-1 text-sm text-earth-400">Access your field intelligence dashboard</p>

          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            <div>
              <label className="block text-sm font-medium text-earth-600">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="mt-1 w-full rounded-lg border border-earth-200 px-3 py-2.5 text-sm outline-none focus:border-farm-400 focus:ring-2 focus:ring-farm-100"
                placeholder="farmer@demo.com"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-earth-600">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="mt-1 w-full rounded-lg border border-earth-200 px-3 py-2.5 text-sm outline-none focus:border-farm-400 focus:ring-2 focus:ring-farm-100"
                placeholder="••••••••"
              />
            </div>

            {error && <p className="text-sm text-red-600">{error}</p>}

            <button
              type="submit"
              disabled={loading}
              className="flex w-full items-center justify-center gap-2 rounded-lg bg-farm-600 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-farm-700 disabled:opacity-60"
            >
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Login'}
            </button>
          </form>

          <p className="mt-4 text-center text-xs text-earth-400">
            Prototype login — any credentials will work
          </p>
        </div>
      </div>
    </div>
  );
}
