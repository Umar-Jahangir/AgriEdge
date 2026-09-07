import { Globe } from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';
import { cn } from '../../utils/cn';
import type { Language } from '../../i18n/translations';

const languages: { code: Language; label: string; shortLabel: string }[] = [
  { code: 'en', label: 'English', shortLabel: 'EN' },
  { code: 'hi', label: 'हिंदी', shortLabel: 'हिंदी' },
  { code: 'mr', label: 'मराठी', shortLabel: 'मराठी' },
];

interface LanguageToggleProps {
  className?: string;
}

export function LanguageToggle({ className }: LanguageToggleProps) {
  const { language, setLanguage } = useLanguage();

  return (
    <div
      className={cn(
        'inline-flex items-center border border-earth-300 bg-earth-50/80 p-0.5',
        className
      )}
    >
      <div className="hidden sm:flex items-center px-1.5 text-earth-500">
        <Globe className="h-3.5 w-3.5" />
      </div>

      <div className="flex items-center gap-0.5">
        {languages.map((lang) => {
          const isActive = language === lang.code;
          return (
            <button
              key={lang.code}
              onClick={() => setLanguage(lang.code)}
              className={cn(
                'px-2.5 py-1 text-xs font-semibold transition-all duration-150',
                isActive
                  ? 'bg-farm-900 text-white shadow-xs'
                  : 'text-earth-700 hover:text-earth-950 hover:bg-earth-200/60'
              )}
            >
              <span className="hidden sm:inline">{lang.label}</span>
              <span className="sm:hidden">{lang.shortLabel}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
