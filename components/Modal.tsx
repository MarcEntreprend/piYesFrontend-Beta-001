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

  // Drag down state
  const [dragStartY, setDragStartY] = useState<number | null>(null);
  const [dragOffset, setDragOffset] = useState(0);
  const modalRef = useRef<HTMLDivElement>(null);

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

  // Reset drag offset when modal closes or opens
  useEffect(() => {
    if (!isOpen) {
      setDragOffset(0);
      setDragStartY(null);
    }
  }, [isOpen]);

  // Handle touch start
  const handleTouchStart = (e: React.TouchEvent) => {
    // Only trigger if touch starts on the modal content area
    const target = e.target as HTMLElement;
    const isDraggableArea = target.closest('.drag-handle-area') !== null;

    if (!isDraggableArea) return;

    setDragStartY(e.touches[0].clientY);
    setDragOffset(0);
  };

  // Handle touch move
  const handleTouchMove = (e: React.TouchEvent) => {
    if (dragStartY === null) return;

    const currentY = e.touches[0].clientY;
    const delta = currentY - dragStartY;

    // Only allow drag downward (positive delta)
    if (delta > 0) {
      setDragOffset(delta);
      // Prevent page scroll while dragging modal
      e.preventDefault();
    }
  };

  // Handle touch end
  const handleTouchEnd = () => {
    if (dragStartY === null) return;

    // Close if dragged more than 100px
    if (dragOffset > 100) {
      onClose();
    }

    // Reset drag state
    setDragStartY(null);
    setDragOffset(0);
  };

  // Centered modal - unchanged
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

  // Calculate animated height with drag offset
  const getAnimatedHeight = () => {
    if (dragOffset > 0 && contentHeight) {
      const newHeight = Math.max(50, contentHeight + 16 - dragOffset / 2);
      return `${newHeight}px`;
    }
    return targetHeight;
  };

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

          {/* Modal "tiroir" - WITH DRAG DOWN SUPPORT */}
          <motion.div
            ref={modalRef}
            className="relative w-full max-w-md theme-card-bg rounded-t-[48px] shadow-2xl overflow-hidden"
            onClick={(e) => e.stopPropagation()}
            aria-modal="true"
            role="dialog"
            animate={{
              height: getAnimatedHeight(),
              y: dragOffset > 0 ? Math.min(dragOffset / 2, 80) : 0,
            }}
            transition={{
              type: 'spring',
              stiffness: dragOffset > 0 ? 400 : 300,
              damping: 30,
              mass: 0.8,
            }}
            exit={{
              height: [targetHeight, `calc(${targetHeight} + 30px)`, '0px'],
              transition: {
                duration: 0.6,
                times: [0, 0.3, 1],
                ease: 'easeInOut',
              }
            }}
          >
            {/* Drag handle area - add class "drag-handle-area" */}
            <div
              className="drag-handle-area w-full pt-3 pb-2 flex justify-center cursor-grab active:cursor-grabbing touch-none"
              onTouchStart={handleTouchStart}
              onTouchMove={handleTouchMove}
              onTouchEnd={handleTouchEnd}
            >
              <div className="w-12 h-1.5 bg-gray-300 dark:bg-gray-700 rounded-full opacity-60 active:opacity-100 transition-opacity" />
            </div>
            <div
              ref={contentRef}
              className="flex-1 overflow-y-auto no-scrollbar px-1 pb-6"
              style={{
                touchAction: dragStartY !== null ? 'none' : 'pan-y',
              }}
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