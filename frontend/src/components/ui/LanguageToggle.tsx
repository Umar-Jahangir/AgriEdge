import { Globe } from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';
import { cn } from '../../utils/cn';
import type { Language } from '../../i18n/translations';

const languages: { code: Language; label: string; nativeName: string }[] = [
  { code: 'en', label: 'EN', nativeName: 'English' },
  { code: 'hi', label: 'HI', nativeName: 'हिंदी' },
  { code: 'mr', label: 'MR', nativeName: 'मराठी' },
];

interface LanguageToggleProps {
  className?: string;
  showLabels?: boolean;
}

export function LanguageToggle({ className, showLabels = true }: LanguageToggleProps) {
  const { language, setLanguage } = useLanguage();

  return (
    <div className={cn('inline-flex items-center border border-earth-300 bg-white p-0.5', className)}>
      <div className="flex items-center gap-1 border-r border-earth-200 px-1.5 py-0.5 text-earth-500">
        <Globe className="h-3 w-3" />
        <span className="font-mono text-[9px] font-bold tracking-wider uppercase hidden sm:inline">
          LANG
        </span>
      </div>

      <div className="flex items-center gap-0.5">
        {languages.map((lang) => {
          const isActive = language === lang.code;
          return (
            <button
              key={lang.code}
              onClick={() => setLanguage(lang.code)}
              title={`${lang.nativeName} (${lang.label})`}
              className={cn(
                'px-2 py-0.5 font-mono text-[10px] font-bold tracking-wider transition-all uppercase',
                isActive
                  ? 'bg-earth-900 text-white shadow-xs'
                  : 'text-earth-600 hover:text-earth-900 hover:bg-earth-100'
              )}
            >
              {lang.label}
              {showLabels && (
                <span className="ml-1 text-[9px] font-normal opacity-90 hidden md:inline">
                  {lang.nativeName}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
