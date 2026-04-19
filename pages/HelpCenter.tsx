// pages/HelpCenter.tsx

import React, { useState, useMemo, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { ArrowLeft, Search, ChevronRight, HelpCircle, CreditCard, Shield, Repeat, Smartphone } from 'lucide-react';
import { useTranslation } from '../App';
import PageHeader from '../components/PageHeader';

const HelpCenter: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { search: urlSearch } = useLocation();
  const searchParams = useMemo(() => new URLSearchParams(urlSearch), [urlSearch]);
  const [search, setSearch] = useState('');

  useEffect(() => {
    const scrollTo = searchParams.get('scroll');
    if (scrollTo) {
        setTimeout(() => {
            const el = document.getElementById(scrollTo);
            if (el) {
                el.scrollIntoView({ behavior: 'smooth', block: 'center' });
                el.classList.add('ring-4', 'ring-[var(--primary-color)]', 'ring-opacity-20', 'transition-all', 'duration-500');
                setTimeout(() => el.classList.remove('ring-4', 'ring-opacity-20'), 3000);
            }
        }, 300);
    }
  }, [searchParams]);

  const categories = [
    { id: 'pix', label: t('help_center.categories.pix'), icon: <Repeat size={20} /> },
    { id: 'card', label: t('help_center.categories.card'), icon: <CreditCard size={20} /> },
    { id: 'security', label: t('help_center.categories.security'), icon: <Shield size={20} /> },
    { id: 'account', label: t('help_center.categories.account'), icon: <Smartphone size={20} /> },
  ];

  const faqs = [
  { q: t('help_center.faqs.q1'), a: t('help_center.faqs.a1') },
  { q: t('help_center.faqs.q2'), a: t('help_center.faqs.a2') },
  { q: t('help_center.faqs.q3'), a: t('help_center.faqs.a3') },
  { q: t('help_center.faqs.q4'), a: t('help_center.faqs.a4') },
  { q: t('help_center.faqs.q5'), a: t('help_center.faqs.a5') },
  { q: t('help_center.faqs.q6'), a: t('help_center.faqs.a6') },
  { q: t('help_center.faqs.q7'), a: t('help_center.faqs.a7') },
  { q: t('help_center.faqs.q8'), a: t('help_center.faqs.a8') },
  { q: t('help_center.faqs.q9'), a: t('help_center.faqs.a9') },
    ];


  return (
    <div className="theme-card-bg min-h-screen flex flex-col animate-in fade-in duration-500 pb-24">
     <PageHeader
      title={t('help_center.title')}
      onBack={() => navigate(-1)}
      className="sticky top-0 theme-card-bg z-10 hover:bg-gray-50/50 dark:hover:bg-white/5 transition-all cursor-pointer group"
    />


      <div className="p-6 space-y-8">
        <div className="relative group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 theme-text-secondary opacity-40 group-focus-within:theme-primary-text transition-colors" size={20} />
            <input 
                type="text" 
                placeholder={t('help_center.placeholder')}
                value={search}
                /* FIX: Corrected typo where non-existent setSearchTerm was called inside setSearch. Directly passing e.target.value to setSearch now. */
                onChange={(e) => setSearch(e.target.value)}
                className="w-full theme-bubble-bg p-4 pl-12 pr-4 rounded-2xl outline-none theme-text-main border theme-border focus:theme-card-bg focus:border-[var(--primary-color)] transition-all shadow-sm"
            />
        </div>

        <div className="grid grid-cols-2 gap-3">
            {categories.map(cat => (
                <button key={cat.id} className="p-4 theme-bubble-bg border theme-border rounded-2xl flex flex-col items-center gap-2 text-center group active:scale-95 transition-all shadow-sm">
                    <div className="theme-primary-text group-hover:scale-110 transition-transform">{cat.icon}</div>
                    <span className="text-[10px] font-bold theme-text-main uppercase tracking-wider">{cat.label}</span>
                </button>
            ))}
        </div>

        <div className="space-y-4">
            <h3 className="text-xs font-bold theme-text-secondary uppercase tracking-widest px-1">{t('help_center.faqs.title')}</h3>
            <div className="space-y-2">
                {faqs.map((faq, i) => (
                    <button 
                        key={i} 
                        id={`faq-${i}`}
                        className="w-full text-left p-5 hover:bg-gray-50 dark:hover:bg-white/5 rounded-[28px] border theme-border flex justify-between items-center group active:scale-[0.98] transition-all shadow-sm"
                    >
                        <div className="space-y-1 min-w-0 pr-2">
                            <p className="font-bold theme-text-main text-sm leading-tight group-hover:theme-primary-text transition-colors">{faq.q}</p>
                            <p className="text-[10px] theme-text-secondary italic opacity-70">"{faq.a}"</p>
                        </div>
                        <ChevronRight size={16} className="theme-text-secondary opacity-30 group-hover:opacity-100 group-hover:translate-x-1 transition-all shrink-0" />
                    </button>
                ))}
            </div>
        </div>

        <div className="pt-8 border-t theme-border">
            <button 
                onClick={() => navigate('/support')}
                className="w-full theme-primary-bg text-white py-5 rounded-[24px] font-black shadow-xl flex items-center justify-center gap-3 active:scale-95 transition-all uppercase tracking-widest"
            >
                <HelpCircle size={22} /> {t('help_center.btn_contact')}
            </button>
        </div>
      </div>
    </div>
  );
};

export default HelpCenter;
