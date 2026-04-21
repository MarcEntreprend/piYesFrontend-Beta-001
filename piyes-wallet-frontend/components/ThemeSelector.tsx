// components/ThemeSelector.tsx

import React from 'react';
import { Palette, Sun, Moon } from 'lucide-react';
import { useTranslation, useTheme } from '../App';

interface ThemeSelectorProps {
  variant?: 'minimal' | 'full';
}

const ThemeSelector: React.FC<ThemeSelectorProps> = ({ variant = 'minimal' }) => {
  const { t } = useTranslation();
  const { theme, setTheme } = useTheme();

  const themes = [
    { id: 'default', name: t('settings.themes.default'), icon: <Sun size={16} /> },
    { id: 'dark', name: t('settings.themes.dark'), icon: <Moon size={16} /> },
    { id: 'bleu_cendre', name: t('settings.themes.bleu_cendre'), icon: <Palette size={16} /> }
  ];

  // Trouver l’index du thème actuel
  const currentIndex = themes.findIndex(th => th.id === theme);
  const currentTheme = themes[currentIndex] || themes[0];

  // Fonction pour passer au thème suivant
  const cycleTheme = () => {
    const nextIndex = (currentIndex + 1) % themes.length;
    setTheme(themes[nextIndex].id);
  };

  if (variant === 'minimal') {
    return (
      <button
        onClick={cycleTheme}
        className="flex items-center justify-center w-10 h-10 theme-bubble-bg rounded-full border theme-border active:scale-95 transition-all"
      >
        <div className="theme-primary-text">
          {currentTheme.icon}
        </div>
      </button>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3 px-1">
        <Palette size={18} className="theme-primary-text" />
        <h3 className="text-sm font-black theme-text-main uppercase tracking-widest">
          {t('settings.theme_title')}
        </h3>
      </div>
      <div className="grid grid-cols-3 gap-3">
        {themes.map((th) => (
          <button
            key={th.id}
            onClick={() => setTheme(th.id)}
            className={`flex flex-col items-center gap-3 p-4 rounded-2xl border-2 transition-all ${
              theme === th.id 
                ? 'theme-primary-bg text-white border-transparent shadow-lg scale-105' 
                : 'theme-bubble-bg theme-text-secondary border-transparent'
            }`}
          >
            {th.icon}
            <span className="text-[10px] font-black uppercase tracking-tighter">{th.name}</span>
          </button>
        ))}
      </div>
    </div>
  );
};

export default ThemeSelector;
