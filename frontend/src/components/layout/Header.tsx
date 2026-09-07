import { Menu, Bell, User, LogOut } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import { DemoModeBanner } from '../ui/DemoModeBanner';
import { LanguageToggle } from '../ui/LanguageToggle';
import { useNavigate } from 'react-router-dom';
import { cn } from '../../utils/cn';

interface HeaderProps {
  onMenuClick: () => void;
  farmName?: string;
  roverConnected?: boolean;
  lastSync?: string;
}

export function Header({ onMenuClick, farmName = 'Demo Farm', roverConnected = true, lastSync }: HeaderProps) {
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
        <div className="flex items-center gap-3">
          <button
            onClick={onMenuClick}
            className="border border-earth-300 p-1.5 hover:bg-earth-100 lg:hidden"
            aria-label="Open menu"
          >
            <Menu className="h-4 w-4 text-earth-800" />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-display text-sm font-bold tracking-tight text-earth-950 sm:text-base">
                {t('workstationTitle')}
              </h1>
              <span className="hidden sm:inline-block bg-earth-200 px-1.5 py-0.2 text-[9px] font-mono font-bold tracking-widest text-earth-800">
                {t('prototype')}
              </span>
            </div>
            <div className="mt-0.5 flex flex-wrap items-center gap-x-2.5 font-mono text-[11px] text-earth-600">
              <span>
                {t('site')}: <strong className="text-earth-900">{farmName.toUpperCase()}</strong>
              </span>
              <span className="text-earth-300">/</span>
              <span className="flex items-center gap-1.5">
                {t('roverStatus')}:
                <span
                  className={cn(
                    'px-1.5 py-0.2 text-[10px] font-bold',
                    roverConnected ? 'bg-farm-100 text-farm-800' : 'bg-red-100 text-red-800'
                  )}
                >
                  {roverConnected ? t('connected') : t('offline')}
                </span>
              </span>
              {lastSync && (
                <>
                  <span className="hidden md:inline text-earth-300">/</span>
                  <span className="hidden md:inline text-earth-500">{t('sync')}: {lastSync}</span>
                </>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <LanguageToggle />
          <div className="hidden sm:block">
            <DemoModeBanner />
          </div>
          <button className="relative border border-earth-300 p-1.5 hover:bg-earth-100 text-earth-700">
            <Bell className="h-4 w-4" />
            <span className="absolute -right-0.5 -top-0.5 h-2 w-2 bg-clay-600 ring-2 ring-white" />
          </button>
          <button className="border border-earth-300 p-1.5 hover:bg-earth-100 text-earth-700">
            <User className="h-4 w-4" />
          </button>
          <button
            onClick={handleLogout}
            className="hidden border border-earth-300 p-1.5 hover:bg-earth-100 text-earth-700 sm:block"
            title={t('logout')}
          >
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </div>
    </header>
  );
}
