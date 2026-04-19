
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, Shield, CheckCircle2, ChevronRight, Info, Camera, Scan, 
  Smartphone, UserCheck, Loader2, FileCheck, Landmark, Globe, Check, XCircle
} from 'lucide-react';
import { useTranslation } from '../App';

interface IdentityVerificationProps {
  user: any;
  onVerified?: (user: any) => void;
}

const IdentityVerification: React.FC<IdentityVerificationProps> = ({ user, onVerified }) => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [step, setStep] = useState(0); 
  const [loading, setLoading] = useState(false);
  const [selectedDoc, setSelectedDoc] = useState('');
  const [progress, setProgress] = useState(0);

  const nextStep = () => {
    setStep(prev => prev + 1);
  };

  const startPersona = () => {
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      nextStep();
    }, 1500);
  };

  useEffect(() => {
    if (step === 5) {
        setProgress(0);
        const timer = setInterval(() => {
            setProgress(p => {
                if (p >= 100) {
                    clearInterval(timer);
                    setTimeout(() => nextStep(), 800);
                    return 100;
                }
                return p + 10;
            });
        }, 300);
        return () => clearInterval(timer);
    }

    if (step === 8) {
        const timer = setTimeout(() => {
            nextStep();
        }, 3000);
        return () => clearTimeout(timer);
    }
  }, [step]);

  if (step === 0) {
    return (
      <div className="theme-card-bg min-h-screen flex flex-col p-8 animate-in fade-in duration-500">
        <header className="pt-8">
            <button onClick={() => navigate(-1)} className="theme-text-secondary"><ArrowLeft size={24} /></button>
        </header>
        <div className="flex-1 flex flex-col items-center justify-center text-center space-y-8">
          <div className="w-24 h-24 theme-bubble-bg rounded-3xl flex items-center justify-center theme-primary-text shadow-xl animate-bounce">
            <Shield size={60} strokeWidth={1.5} />
          </div>
          <div className="space-y-4">
            <h1 className="text-3xl font-bold theme-text-main">{t('identity_process.main_title')}</h1>
            <p className="theme-text-secondary leading-relaxed max-w-xs mx-auto">
              {t('identity_process.sub_title')}
            </p>
          </div>
          <div className="p-4 theme-bubble-bg rounded-2xl flex items-start gap-3 text-left border theme-border">
            <Info size={18} className="theme-primary-text shrink-0 mt-0.5" />
            <p className="text-[11px] theme-primary-text font-medium">
              {t('identity_process.persona_note')}
            </p>
          </div>
        </div>
        <div className="pb-[96px]">
            <button 
            onClick={startPersona}
            disabled={loading}
            className="w-full theme-primary-bg text-white py-4 rounded-full font-bold flex items-center justify-center gap-2 active:scale-95 transition-all shadow-lg"
            >
            {loading ? <Loader2 className="animate-spin" /> : t('identity_process.start_btn')}
            {!loading && <ChevronRight size={20} />}
            </button>
        </div>
      </div>
    );
  }

  const PersonaWrapper = ({ children }: { children?: React.ReactNode }) => (
    <div className="fixed inset-y-0 left-1/2 -translate-x-1/2 w-full max-w-md bg-[#0A0A0A] text-white z-[100] flex flex-col animate-in slide-in-from-bottom duration-500">
        <header className="p-6 flex items-center justify-between border-b border-white/10">
            <div className="flex items-center gap-3">
                <div className="w-6 h-6 bg-white rounded-full flex items-center justify-center">
                    <Check className="text-black" size={14} strokeWidth={3} />
                </div>
                <span className="text-sm font-bold tracking-tight">{t('identity_process.header_title')}</span>
            </div>
            <button onClick={() => setStep(0)} className="p-2 opacity-60 hover:opacity-100"><XCircle size={20} /></button>
        </header>
        <div className="flex-1 overflow-y-auto flex flex-col">
            {children}
        </div>
        <footer className="p-6 border-t border-white/10 text-center flex items-center justify-center gap-2 opacity-50">
            <Shield size={12} />
            <span className="text-[10px] font-bold uppercase tracking-widest">Sécurisé par Persona</span>
        </footer>
    </div>
  );

  if (step === 1) {
    return (
      <PersonaWrapper>
        <div className="p-8 space-y-12 flex-1">
            <h2 className="text-3xl font-bold">{t('identity_process.step1_title')}</h2>
            <div className="space-y-6">
                <div className="flex gap-4">
                    <div className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center shrink-0"><FileCheck size={20} /></div>
                    <div><p className="font-bold text-sm">{t('identity_process.step1_sub')}</p><p className="text-xs text-white/50">{t('identity_process.step1_hint')}</p></div>
                </div>
            </div>
            <button onClick={nextStep} className="w-full bg-white text-black py-4 rounded-xl font-bold active:scale-95 transition-all">{t('common.continue')}</button>
        </div>
      </PersonaWrapper>
    );
  }

  if (step === 2) {
    const docs = [
        { id: 'id_card', label: t('identity_process.step2_id_card'), icon: <Landmark size={24} /> },
        { id: 'passport', label: t('identity_process.step2_passport'), icon: <Globe size={24} /> },
    ];
    return (
        <PersonaWrapper>
            <div className="p-8 space-y-8 flex-1">
                <h2 className="text-2xl font-bold">{t('identity_process.step2_title')}</h2>
                <div className="space-y-3">
                    {docs.map(doc => (
                        <button key={doc.id} onClick={() => { setSelectedDoc(doc.id); nextStep(); }} className="w-full flex items-center justify-between p-5 bg-white/5 border border-white/10 rounded-2xl hover:bg-white/10 transition-all text-left group active:scale-95">
                            <div className="flex items-center gap-4"><div className="text-white/60 group-hover:text-white transition-colors">{doc.icon}</div><span className="font-bold text-sm">{doc.label}</span></div>
                            <ChevronRight size={18} className="opacity-30" />
                        </button>
                    ))}
                </div>
            </div>
        </PersonaWrapper>
    );
  }

  if (step === 3 || step === 4) {
      const isVerso = step === 4;
      return (
          <PersonaWrapper>
              <div className="flex-1 flex flex-col">
                  <div className="p-8 text-center space-y-2"><h2 className="text-xl font-bold">{isVerso ? t('identity_process.verso_title') : t('identity_process.recto_title')}</h2></div>
                  <div className="flex-1 relative flex items-center justify-center p-8">
                      <div className="w-full aspect-[1.6/1] bg-white/5 rounded-3xl border-2 border-dashed border-white/20 flex flex-col items-center justify-center relative overflow-hidden">
                          <Scan size={48} className="opacity-10 animate-pulse" />
                      </div>
                  </div>
                  <div className="p-8 flex flex-col items-center gap-6">
                      <div className="w-16 h-16 rounded-full border-4 border-white/20 p-1"><button onClick={nextStep} className="w-full h-full bg-white rounded-full active:scale-90 transition-transform"></button></div>
                  </div>
              </div>
          </PersonaWrapper>
      );
  }

  if (step === 5) {
      return (
          <PersonaWrapper>
              <div className="flex-1 flex flex-col items-center justify-center p-8 space-y-8">
                  <div className="relative w-32 h-32">
                      <svg className="w-full h-full" viewBox="0 0 100 100">
                          <circle cx="50" cy="50" r="45" fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="5" />
                          <circle cx="50" cy="50" r="45" fill="none" stroke="white" strokeWidth="5" strokeDasharray="283" strokeDashoffset={283 - (283 * progress) / 100} className="transition-all duration-300" />
                      </svg>
                      <div className="absolute inset-0 flex items-center justify-center font-bold text-lg">{progress}%</div>
                  </div>
                  <h2 className="text-xl font-bold">{t('identity_process.analyzing')}</h2>
              </div>
          </PersonaWrapper>
      )
  }

  if (step === 6) {
      return (
          <PersonaWrapper>
              <div className="p-8 flex-1 flex flex-col space-y-12">
                  <h2 className="text-3xl font-bold">{t('identity_process.selfie_title')}</h2>
                  <div className="flex-1 flex items-center justify-center">
                    <div className="w-48 h-64 border-2 border-white/20 rounded-[100px] flex items-center justify-center bg-white/5"><UserCheck size={60} className="opacity-20" /></div>
                  </div>
                  <button onClick={nextStep} className="w-full bg-white text-black py-4 rounded-xl font-bold active:scale-95 transition-all">{t('identity_process.selfie_ready')}</button>
              </div>
          </PersonaWrapper>
      );
  }

  if (step === 7) {
      return (
          <PersonaWrapper>
              <div className="flex-1 flex flex-col items-center justify-center relative p-8">
                  <div className="w-64 h-64 rounded-full border-4 border-white/20 relative flex items-center justify-center overflow-hidden">
                      <div className="absolute inset-0 bg-white/5 animate-pulse"></div>
                      <Scan size={80} className="opacity-10" />
                  </div>
                  <button onClick={nextStep} className="mt-12 w-12 h-12 bg-white/10 rounded-full flex items-center justify-center border border-white/20 active:scale-90 transition-transform"><Check size={20} /></button>
              </div>
          </PersonaWrapper>
      );
  }

  if (step === 8) {
      return (
          <PersonaWrapper>
              <div className="flex-1 flex flex-col items-center justify-center p-8 space-y-12">
                  <div className="w-32 h-32 border-4 border-white/10 rounded-full flex items-center justify-center"><Loader2 size={60} className="animate-spin text-white" /></div>
                  <h2 className="text-2xl font-bold">{t('identity_process.finalizing')}</h2>
              </div>
          </PersonaWrapper>
      )
  }

  return (
    <div className="fixed inset-y-0 left-1/2 -translate-x-1/2 w-full max-w-md theme-card-bg flex flex-col p-8 items-center justify-center text-center space-y-12 animate-in zoom-in duration-500 z-[130]">
        <div className="w-24 h-24 bg-green-500 text-white rounded-[32px] flex items-center justify-center shadow-2xl animate-in slide-in-from-top duration-700">
            <CheckCircle2 size={64} strokeWidth={1.5} />
        </div>
        <div className="space-y-4">
            <h1 className="text-3xl font-bold theme-text-main">{t('identity_process.congrats')}</h1>
            <p className="theme-text-secondary leading-relaxed max-w-xs">{t('identity_process.verified_msg')}</p>
        </div>
        <button onClick={() => { const updatedUser = { ...user, verificationStatus: 'verified' }; if (onVerified) onVerified(updatedUser); navigate('/'); }} className="w-full theme-primary-bg text-white py-4 rounded-full font-bold flex items-center justify-center gap-2 active:scale-95 transition-all shadow-lg">
            {t('identity_process.back_home')}
            <ChevronRight size={20} />
        </button>
    </div>
  );
};

export default IdentityVerification;
