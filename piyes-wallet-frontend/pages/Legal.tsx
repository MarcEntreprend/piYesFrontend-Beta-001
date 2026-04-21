
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Shield, FileText, Info } from 'lucide-react';
import { useTranslation } from '../App';
import PageHeader from '../components/PageHeader';
import logo from '../src/assets/images/logo-piyes-ppl-wh-wh-svg.svg';

interface LegalProps {
  type: 'about' | 'terms' | 'privacy';
}

const Legal: React.FC<LegalProps> = ({ type }) => {
  const { t, language } = useTranslation();
  const navigate = useNavigate();

  const monthNames = {
    fr: ["Janvier", "Février", "Mars", "Avril", "Mai", "Juin", "Juillet", "Août", "Septembre", "Octobre", "Novembre", "Décembre"],
    ht: ["Janvye", "Fevriye", "Mas", "Avril", "Me", "Jen", "Jiyè", "Out", "Septanm", "Oktòb", "Novanm", "Desanm"],
    en: ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"]
  };

  const currentMonth = monthNames[language as keyof typeof monthNames][new Date().getMonth()];

  const content = {
    about: {
      title: t('legal_pages.about.title'),
      icon: <img src={logo} alt="piYès logo" className="w-full h-full object-contain p-2" />,
      text: `${t('legal_pages.about.content')}\n\n${t('legal_pages.about.build')}\n${t('legal_pages.about.made_in')}`
    },
    terms: {
      title: t('legal_pages.terms.title'),
      icon: <FileText className="theme-primary-text" size={32} />,
      text: `${t('legal_pages.terms.content')}\n\n${t('legal_pages.terms.list')}\n\n${t('legal_pages.terms.last_update', { month: currentMonth })}`
    },
    privacy: {
      title: t('legal_pages.privacy.title'),
      icon: <Shield className="theme-primary-text" size={32} />,
      text: `${t('legal_pages.privacy.content')}\n\n${t('legal_pages.privacy.persona_note')}`
    }
  }[type];

  return (
    <div className="theme-card-bg min-h-screen flex flex-col animate-in fade-in duration-500">
      <PageHeader
        title={content.title}
        onBack={() => navigate(-1)}
        className="sticky top-0 theme-card-bg z-10 hover:bg-gray-50/50 dark:hover:bg-white/5 transition-all cursor-pointer group"
      />

      <div className="p-8 space-y-8 flex-1 overflow-y-auto">
        <div className="flex justify-center py-6">
            <div className="w-20 h-20 theme-bubble-bg rounded-3xl flex items-center justify-center shadow-inner">
                {content.icon}
            </div>
        </div>

        <div className="space-y-4">
            <h2 className="text-xl font-bold theme-text-main">{content.title}</h2>
            <div className="theme-text-secondary text-sm leading-relaxed whitespace-pre-wrap">
                {content.text}
                {"\n\n"}
                m.marcruben@yahoo.fr / +509 4780 4142.
            </div>
        </div>
      </div>
    </div>
  );
};

export default Legal;
