
import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import BankIcon from './BankIcon';
import { ShieldCheck } from 'lucide-react';

interface AnimatedButtonProps {
  isSelected: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
  // Customization
  accentColor?: string; // Main color for active state
  activeBg?: string;
  activeText?: string;
  inactiveBg?: string;
  inactiveText?: string;
  iconActiveBg?: string;
  iconInactiveBg?: string;
  iconActiveColor?: string;
  iconInactiveColor?: string;
  logoUrl?: string;
  id?: string;
  className?: string;
  showBadge?: boolean;
}

const AnimatedButton: React.FC<AnimatedButtonProps> = ({
  isSelected,
  onClick,
  icon,
  label,
  accentColor = '#830AD1',
  activeBg = '#FFFFFF',
  activeText,
  inactiveBg = 'rgba(255, 255, 255, 0.1)',
  inactiveText = '#FFFFFF',
  iconActiveBg,
  iconInactiveBg,
  iconActiveColor = '#FFFFFF',
  iconInactiveColor = '#FFFFFF',
  logoUrl,
  id,
  className = '',
  showBadge = false
}) => {
  // Determine text color if not provided
  const textColor = activeText || accentColor;
  const iconBgActive = iconActiveBg || accentColor;
  const iconBgInactive = iconInactiveBg || 'rgba(255, 255, 255, 0.2)';

  return (
    <motion.button
      layout
      onClick={onClick}
      initial={false}
      animate={{
        width: isSelected ? 'auto' : '44px',
        backgroundColor: isSelected ? activeBg : inactiveBg,
        color: isSelected ? textColor : inactiveText,
      }}
      transition={{ type: 'spring', stiffness: 500, damping: 30 }}
      className={`flex items-center ${isSelected ? 'px-3' : 'justify-center'} py-2 rounded-full whitespace-nowrap text-xs font-bold overflow-hidden h-10 shadow-sm transition-shadow hover:shadow-md ${className}`}
    >
      <motion.div 
        layout
        animate={{
          backgroundColor: isSelected ? iconBgActive : iconBgInactive,
          color: isSelected ? iconActiveColor : iconInactiveColor,
        }}
        className="flex-shrink-0 flex items-center justify-center w-6 h-6 rounded-full text-[10px] overflow-hidden relative"
      >
        {logoUrl ? (
          <>
            <BankIcon 
              logoUrl={logoUrl} 
              logoText={label} 
              color="transparent" 
              size="xs" 
              rounded="rounded-full"
              className="shadow-none"
              id={id}
            />
            {showBadge && (
              <div className="absolute bottom-0 right-0 bg-white rounded-full p-0.5 shadow-sm">
                <ShieldCheck size={8} className="text-blue-500 fill-blue-500" />
              </div>
            )}
          </>
        ) : icon}
      </motion.div>
      
      <AnimatePresence mode="popLayout" initial={false}>
        {isSelected && (
          <motion.span
            layout
            initial={{ opacity: 0, x: -10, width: 0 }}
            animate={{ opacity: 1, x: 0, width: 'auto', marginLeft: '8px' }}
            exit={{ opacity: 0, x: -10, width: 0, marginLeft: 0 }}
            transition={{ duration: 0.2 }}
            className="origin-left overflow-hidden"
          >
            {label}
          </motion.span>
        )}
      </AnimatePresence>
    </motion.button>
  );
};

export default AnimatedButton;
