// components/Modal.tsx

import React, { ReactNode, useEffect, useState } from 'react';

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
  const [isRendered, setIsRendered] = useState(isOpen);
  const [isClosing, setIsClosing] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setIsRendered(true);
      setIsClosing(false);
      document.body.style.overflow = 'hidden';
    } else if (isRendered) {
      // Trigger closing animation
      setIsClosing(true);
      const timer = setTimeout(() => {
        setIsRendered(false);
        setIsClosing(false);
        document.body.style.overflow = '';
      }, 400); // Durée légèrement inférieure à celle du CSS pour éviter les flashs
      return () => clearTimeout(timer);
    }
  }, [isOpen, isRendered]);

  // Clean up on unmount
  useEffect(() => {
    return () => { document.body.style.overflow = ''; };
  }, []);

  if (!isRendered && !isOpen) return null;

  const isBottomSheet = type === 'bottom-sheet';

  return (
    <div
      className={`fixed inset-0 z-150 flex justify-center bg-black/60 backdrop-blur-sm ${isClosing ? 'animate-fade-out' : 'animate-in fade-in duration-300'
        } ${isBottomSheet ? 'items-end' : 'items-center p-6'}`}
      onClick={() => dismissOnBackdropClick && onClose()}
      aria-modal="true"
      role="dialog"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className={`w-full max-w-md theme-card-bg shadow-2xl overflow-hidden flex flex-col transition-all ${isBottomSheet
            ? `rounded-t-[48px] max-h-[95vh] ${isClosing ? 'animate-bottom-sheet-out' : 'animate-in slide-in-from-bottom duration-400'}`
            : `rounded-[48px] ${isClosing ? 'animate-fade-out scale-95' : 'animate-in zoom-in duration-400'}`
          }`}
      >
        {isBottomSheet && (
          <div className="w-12 h-1 bg-gray-200 dark:bg-gray-800 rounded-full mx-auto mt-4 mb-2 shrink-0"></div>
        )}
        <div className="overflow-y-auto no-scrollbar">
          {children}
        </div>
      </div>
    </div>
  );
};

export default Modal;