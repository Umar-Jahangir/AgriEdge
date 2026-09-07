import { Menu, Bell, User, LogOut, Sprout } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import { LanguageToggle } from '../ui/LanguageToggle';
import { useNavigate } from 'react-router-dom';

interface HeaderProps {
  onMenuClick: () => void;
  farmName?: string;
  roverConnected?: boolean;
  lastSync?: string;
}

export function Header({ onMenuClick, farmName = 'Patil Farm', roverConnected = true }: HeaderProps) {
  const { logout } = useAuth();
  const { t } = useLanguage();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <header className="sticky top-0 z-30 border-b border-earth-300 bg-white">
      <div className="flex items-center justify-between px-4 py-2.5 lg:px-6">
        {/* Left: Branding & Farm Context */}
        <div className="flex items-center gap-3">
          <button
            onClick={onMenuClick}
            className="border border-earth-300 p-2 hover:bg-earth-100 lg:hidden text-earth-800"
            aria-label="Open menu"
          >
            <Menu className="h-4 w-4" />
          </button>

          <div className="flex items-center gap-2.5">
            <div className="hidden sm:flex h-8 w-8 items-center justify-center bg-farm-900 text-farm-300">
              <Sprout className="h-4 w-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="font-display text-base font-bold tracking-tight text-earth-950 sm:text-lg">
                  {t('workstationTitle')}
                </h1>
                <span className="text-earth-400 font-normal hidden sm:inline">•</span>
                <span className="text-xs font-semibold text-earth-700 hidden sm:inline">
                  {farmName}
                </span>
              </div>
              <p className="text-[11px] text-earth-500 font-medium">
                {t('smartAssistant')}
              </p>
            </div>
          </div>
        </div>

        {/* Right: Rover Status, Language Toggle, Actions */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Calm Rover Status Pill */}
          <div
            className={`hidden md:inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium border ${
              roverConnected
                ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                : 'bg-red-50 text-red-800 border-red-200'
            }`}
          >
            <span
              className={`h-2 w-2 rounded-full ${
                roverConnected ? 'bg-emerald-500 animate-pulse' : 'bg-red-500'
              }`}
            />
            <span>{roverConnected ? t('roverOnline') : t('roverOffline')}</span>
          </div>

          {/* Clean Segmented Language Switcher */}
          <LanguageToggle />

          {/* Notification Alert */}
          <button
            className="relative border border-earth-300 p-2 hover:bg-earth-100 text-earth-700"
            title="Alerts"
          >
            <Bell className="h-4 w-4" />
            <span className="absolute right-1 top-1 h-2 w-2 bg-clay-600 ring-2 ring-white" />
          </button>

          {/* Farmer Profile */}
          <button
            className="border border-earth-300 p-2 hover:bg-earth-100 text-earth-700"
            title="Profile"
          >
            <User className="h-4 w-4" />
          </button>

          {/* Logout */}
          <button
            onClick={handleLogout}
            className="hidden sm:inline-flex items-center gap-1.5 border border-earth-300 px-2.5 py-1.5 text-xs font-medium text-earth-700 hover:bg-earth-100 hover:text-earth-950"
            title={t('logout')}
          >
            <LogOut className="h-3.5 w-3.5" />
            <span>{t('logout')}</span>
          </button>
        </div>
      </div>
    </header>
  );
}
