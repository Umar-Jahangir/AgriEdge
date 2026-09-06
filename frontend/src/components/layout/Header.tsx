import { Menu, Bell, User, LogOut } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { DemoModeBanner } from '../ui/DemoModeBanner';
import { StatusBadge } from '../ui/StatusBadge';
import { useNavigate } from 'react-router-dom';

interface HeaderProps {
  onMenuClick: () => void;
  farmName?: string;
  roverConnected?: boolean;
  lastSync?: string;
}

export function Header({ onMenuClick, farmName = 'Demo Farm', roverConnected = true, lastSync }: HeaderProps) {
  const { logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <header className="sticky top-0 z-30 border-b border-earth-200 bg-white/95 backdrop-blur-sm">
      <div className="flex items-center justify-between px-4 py-3 lg:px-6">
        <div className="flex items-center gap-3">
          <button onClick={onMenuClick} className="rounded-lg p-1.5 hover:bg-earth-50 lg:hidden">
            <Menu className="h-5 w-5 text-earth-600" />
          </button>
          <div>
            <h1 className="text-sm font-bold text-farm-800 lg:text-base">
              AgriEdge Rover
            </h1>
            <div className="mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-[11px] text-earth-400">
              <span>
                Farm: <span className="font-medium text-earth-600">{farmName}</span>
              </span>
              <span className="hidden sm:inline">|</span>
              <span className="flex items-center gap-1">
                Rover:
                <StatusBadge
                  label={roverConnected ? 'Connected' : 'Offline'}
                  variant={roverConnected ? 'success' : 'danger'}
                  dot
                />
              </span>
              {lastSync && (
                <>
                  <span className="hidden md:inline">|</span>
                  <span className="hidden md:inline">Last sync: {lastSync}</span>
                </>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <DemoModeBanner />
          <button className="relative rounded-lg p-2 hover:bg-earth-50">
            <Bell className="h-4 w-4 text-earth-500" />
            <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-red-500" />
          </button>
          <button className="rounded-lg p-2 hover:bg-earth-50">
            <User className="h-4 w-4 text-earth-500" />
          </button>
          <button
            onClick={handleLogout}
            className="hidden rounded-lg p-2 hover:bg-earth-50 sm:block"
            title="Logout"
          >
            <LogOut className="h-4 w-4 text-earth-500" />
          </button>
        </div>
      </div>
    </header>
  );
}
