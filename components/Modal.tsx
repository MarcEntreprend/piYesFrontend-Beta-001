// components/Modal.tsx

import React, { ReactNode, useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  children: ReactNode;
  dismissOnBackdropClick?: boolean;
  type?: 'bottom-sheet' | 'centered';
}

const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  children,
  dismissOnBackdropClick = true,
  type = 'bottom-sheet'
}) => {
  const isBottomSheet = type === 'bottom-sheet';
  const [contentHeight, setContentHeight] = useState<number | null>(null);
  const contentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      if (contentRef.current && isBottomSheet) {
        setTimeout(() => {
          if (contentRef.current) {
            setContentHeight(contentRef.current.scrollHeight);
          }
        }, 10);
      }
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen, isBottomSheet]);

  // Centered modal - inchangé
  if (!isBottomSheet) {
    return (
      <AnimatePresence>
        {isOpen && (
          <div className="fixed inset-0 z-150 flex items-center justify-center p-6">
            <motion.div
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              onClick={() => dismissOnBackdropClick && onClose()}
            />
            <motion.div
              className="relative w-full max-w-md theme-card-bg rounded-[48px] shadow-2xl overflow-hidden"
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              transition={{ type: 'spring', stiffness: 350, damping: 30 }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="overflow-y-auto no-scrollbar max-h-[85vh]">
                {children}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    );
  }

  const targetHeight = contentHeight ? `${contentHeight + 16}px` : 'auto';

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-150 flex items-end justify-center">
          {/* Backdrop */}
          <motion.div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            onClick={() => dismissOnBackdropClick && onClose()}
          />

          {/* Modal "tiroir" - EFFET RESSORT UNIFORME */}
          <motion.div
            className="relative w-full max-w-md theme-card-bg rounded-t-[48px] shadow-2xl overflow-hidden"
            onClick={(e) => e.stopPropagation()}
            aria-modal="true"
            role="dialog"
            //  OUVERTURE : effet ressort
            initial={{ height: 0 }}
            animate={{ height: targetHeight }}
            transition={{
              type: 'spring',
              stiffness: 300,
              damping: 24,
              mass: 1,
            }}
            //  FERMETURE : MÊME vitesse, MÊME courbe (avec chaîne acceptée)
            exit={{
              height: [targetHeight, `calc(${targetHeight} + 30px)`, '0px'],
              transition: {
                duration: 0.6,
                times: [0, 0.3, 1],
                ease: 'easeInOut', //  Chaîne acceptée par Framer Motion
              }
            }}
          >
            <div className="w-12 h-1 bg-gray-200 dark:bg-gray-800 rounded-full mx-auto mt-4 mb-2 shrink-0"></div>
            <div
              ref={contentRef}
              className="flex-1 overflow-y-auto no-scrollbar px-1 pb-6"
            >
              {children}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default Modal;