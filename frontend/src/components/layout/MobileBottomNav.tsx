import { NavLink } from 'react-router-dom';
import { LayoutDashboard, Map, Camera, CloudSun, Lightbulb } from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';
import { cn } from '../../utils/cn';

export function MobileBottomNav() {
  const { language } = useLanguage();

  const labels = {
    home: language === 'hi' ? 'होम' : language === 'mr' ? 'मुख्य' : 'Home',
    map: language === 'hi' ? 'नक्शा' : language === 'mr' ? 'नकाशा' : 'Map',
    scan: language === 'hi' ? 'स्कैन' : language === 'mr' ? 'स्कॅन' : 'AI Scan',
    weather: language === 'hi' ? 'मौसम' : language === 'mr' ? 'हवामान' : 'Weather',
    advisory: language === 'hi' ? 'सलाह' : language === 'mr' ? 'सल्ला' : 'Advisory',
  };

  const navItems = [
    { to: '/dashboard', icon: LayoutDashboard, label: labels.home },
    { to: '/farm-map', icon: Map, label: labels.map },
    { to: '/crop-health', icon: Camera, label: labels.scan, isCenterAction: true },
    { to: '/environmental-risk', icon: CloudSun, label: labels.weather },
    { to: '/recommendations', icon: Lightbulb, label: labels.advisory },
  ];

  return (
    <nav
      aria-label="Mobile Navigation"
      className="fixed bottom-0 left-0 right-0 z-40 md:hidden border-t-2 border-earth-300 bg-white/95 backdrop-blur-md pb-safe shadow-[0_-4px_16px_rgba(0,0,0,0.08)]"
    >
      <div className="flex items-center justify-around px-2 py-1.5">
        {navItems.map((item) => {
          if (item.isCenterAction) {
            return (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  cn(
                    'relative -top-3 flex flex-col items-center justify-center transition-transform active:scale-95',
                    isActive ? 'scale-105' : ''
                  )
                }
              >
                <div className="flex h-12 w-12 items-center justify-center rounded-full border-2 border-farm-950 bg-farm-800 text-white shadow-md hover:bg-farm-900">
                  <Camera className="h-6 w-6 text-white" />
                </div>
                <span className="mt-0.5 text-[10px] font-bold tracking-tight text-farm-900">
                  {item.label}
                </span>
              </NavLink>
            );
          }

          return (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                cn(
                  'flex flex-col items-center justify-center py-1 px-2.5 rounded transition-colors text-[10px] font-medium min-w-[56px]',
                  isActive
                    ? 'text-farm-900 font-bold'
                    : 'text-earth-500 hover:text-earth-900'
                )
              }
            >
              {({ isActive }) => (
                <>
                  <item.icon className={cn('h-5 w-5 mb-0.5', isActive ? 'text-farm-800 stroke-[2.5]' : 'text-earth-500')} />
                  <span>{item.label}</span>
                </>
              )}
            </NavLink>
          );
        })}
      </div>
    </nav>
  );
}
