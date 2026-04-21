// pages/Onboarding.tsx

import React, { useState } from 'react';
import { Landmark, PieChart, Zap, ShieldCheck } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import Button from '../components/Button';
import LanguageSelector from '../components/LanguageSelector';
import ThemeSelector from '../components/ThemeSelector';
import { useTranslation } from '../App';

interface Props {
  onComplete: () => void;
}

const Onboarding: React.FC<Props> = ({ onComplete }) => {
  const { t } = useTranslation();
  const [currentStep, setCurrentStep] = useState(0);

  const steps = [
    {
      title: t('onboarding.step1.title'),
      subtitle: t('onboarding.step1.subtitle'),
      description: t('onboarding.step1.description'),
      icon: <Landmark size={48} className="theme-primary-text" />,
    },
    {
      title: t('onboarding.step2.title'),
      subtitle: t('onboarding.step2.subtitle'),
      description: t('onboarding.step2.description'),
      icon: <PieChart size={48} className="theme-primary-text" />,
    },
    {
      title: t('onboarding.step3.title'),
      subtitle: t('onboarding.step3.subtitle'),
      description: t('onboarding.step3.description'),
      icon: <Zap size={48} className="theme-primary-text" />,
    },
    {
      title: t('onboarding.step4.title'),
      subtitle: t('onboarding.step4.subtitle'),
      description: t('onboarding.step4.description'),
      icon: <ShieldCheck size={48} className="theme-primary-text" />,
    }
  ];

  const next = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(s => s + 1);
    } else {
      onComplete();
    }
  };

  const step = steps[currentStep];

  return (
    <div className="theme-card-bg min-h-screen flex flex-col max-w-[430px] mx-auto relative pb-32">
      <div className="flex justify-between items-center pt-6 px-6 mb-8 shrink-0">
        <div className="flex items-center gap-3">
          <ThemeSelector />
          <LanguageSelector />
        </div>
        <button
          onClick={onComplete}
          className="theme-text-secondary font-bold text-sm uppercase tracking-wider hover:theme-primary-text transition-colors"
        >
          {t('onboarding.skip')}
        </button>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center text-center gap-12 px-6">
        <div className="w-32 h-32 rounded-[40px] theme-bubble-bg flex items-center justify-center shadow-inner">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentStep}
              initial={{ opacity: 0, scale: 0.8, rotate: -10 }}
              animate={{ opacity: 1, scale: 1, rotate: 0 }}
              exit={{ opacity: 0, scale: 0.8, rotate: 10 }}
              transition={{ duration: 0.3, ease: "easeOut" }}
            >
              {step.icon}
            </motion.div>
          </AnimatePresence>
        </div>

        <div className="space-y-8 px-4">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentStep}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.25, ease: "easeOut" }}
              className="space-y-4"
            >
              <h1 className="text-3xl font-black theme-text-main tracking-tight leading-tight">
                {step.title}
              </h1>
              <p className="text-lg font-bold theme-primary-text">
                {step.subtitle}
              </p>
            </motion.div>
          </AnimatePresence>

          <AnimatePresence mode="wait">
            <motion.p
              key={`desc-${currentStep}`}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.2, ease: "easeOut", delay: 0.05 }}
              className="theme-text-secondary leading-relaxed text-sm"
            >
              {step.description}
            </motion.p>
          </AnimatePresence>
        </div>
      </div>

      <div className="fixed bottom-0 left-0 right-0 theme-card-bg border-t theme-border p-6 pb-8 z-50">
        <div className="max-w-[430px] mx-auto space-y-8">
          {/* Indicateurs de steps avec animation */}
          <div className="flex justify-center gap-3">
            {steps.map((_, i) => (
              <motion.div
                key={i}
                layout
                animate={{
                  width: currentStep === i ? 40 : 8,
                  backgroundColor: currentStep === i
                    ? "var(--primary-color)"
                    : "var(--bubble-bg)",
                }}
                transition={{
                  type: "spring",
                  stiffness: 500,
                  damping: 35,
                  mass: 0.8,
                }}
                className="h-1.5 rounded-full"
              />
            ))}
          </div>

          <Button
            onClick={next}
            fullWidth
            size="lg"
            className="uppercase tracking-widest font-black"
          >
            {currentStep === steps.length - 1 ? t('onboarding.get_started') : t('onboarding.next')}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Onboarding;