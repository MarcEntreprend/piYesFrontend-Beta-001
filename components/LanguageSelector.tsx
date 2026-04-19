// components/LanguageSelector.tsx
import React from 'react';
import { useTranslation } from '../App';
import { Language } from '../translations';
import { Check, Globe } from 'lucide-react';

export const languages = [
  { id: 'ht', label: 'Kreyòl Ayisyen', code: 'HT', flag: 'https://flagcdn.com/w80/ht.png' },
  { id: 'fr', label: 'Français', code: 'FR', flag: 'https://flagcdn.com/w80/fr.png' },
  { id: 'en', label: 'English', code: 'US', flag: 'https://flagcdn.com/w80/us.png' },
];

interface LanguageSelectorProps {
  variant?: 'minimal' | 'full';
}

const LanguageSelector: React.FC<LanguageSelectorProps> = ({ variant = 'minimal' }) => {
  const { language, setLanguage } = useTranslation();

  const currentIndex = languages.findIndex(l => l.id === language);
  const currentLang = languages[currentIndex] || languages[0];

  // Fonction pour passer à la langue suivante
  const cycleLanguage = () => {
    const nextIndex = (currentIndex + 1) % languages.length;
    setLanguage(languages[nextIndex].id as Language);
  };

  if (variant === 'full') {
    return (
      <div className="space-y-3">
        {languages.map(lang => (
          <button 
            key={lang.id}
            onClick={() => setLanguage(lang.id as Language)}
            className={`w-full flex items-center justify-between p-4 rounded-2xl border transition-all active:scale-[0.98] ${
              language === lang.id 
                ? 'theme-primary-bg text-white border-transparent shadow-lg' 
                : 'theme-bubble-bg theme-text-main theme-border'
            }`}
          >
            <div className="flex items-center gap-4">
              <div className="w-8 h-8 rounded-full overflow-hidden border border-white/20 shrink-0">
                <img src={lang.flag} alt={lang.code} className="w-full h-full object-cover" />
              </div>
              <span className="font-bold text-sm">{lang.label}</span>
            </div>
            {language === lang.id && <Check size={18} />}
          </button>
        ))}
      </div>
    );
  }

  // Variante minimal : cycle direct au clic
  return (
    <button 
      onClick={cycleLanguage}
      className="flex items-center gap-2 px-3 py-2 rounded-full theme-bubble-bg border theme-border active:scale-95 transition-all"
    >
      <div className="w-5 h-5 rounded-full overflow-hidden border border-white/20">
        <img src={currentLang.flag} alt={currentLang.code} className="w-full h-full object-cover" />
      </div>
      <span className="text-[10px] font-black uppercase tracking-widest theme-text-main">
        {currentLang.label}
      </span>
    </button>
  );
};

export default LanguageSelector;
