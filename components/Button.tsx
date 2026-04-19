// components/Button.tsx

import React from 'react';
import { motion } from 'motion/react';
import { Loader2 } from 'lucide-react';
import { cn } from '../src/lib/utils';

type ButtonVariant = 'primary' | 'secondary' | 'danger' | 'utility' | 'text';
type ButtonSize = 'sm' | 'md' | 'lg';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  isLoading?: boolean;
  fullWidth?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', size = 'md', leftIcon, rightIcon, isLoading, fullWidth, children, disabled, ...props }, ref) => {
    
    const variants = {
      primary: 'bg-[var(--theme-primary-bg)] text-white shadow-lg shadow-[var(--theme-primary-bg)]/20 hover:opacity-90 disabled:opacity-50 disabled:shadow-none',
      secondary: 'theme-bubble-bg theme-primary-text hover:bg-[var(--theme-bubble-bg)]/80 disabled:opacity-50',
      danger: 'bg-red-500 text-white shadow-lg shadow-red-500/20 hover:bg-red-600 disabled:opacity-50 disabled:shadow-none',
      utility: 'theme-bubble-bg theme-text-main hover:opacity-80 disabled:opacity-50',
      text: 'bg-transparent theme-primary-text hover:theme-bubble-bg disabled:opacity-50',
    };

    const sizes = {
      sm: 'px-3 py-1.5 text-xs rounded-xl min-h-[36px]',
      md: 'px-6 py-3 text-sm rounded-2xl min-h-[48px]',
      lg: 'px-8 py-4 text-base rounded-3xl min-h-[56px]',
    };

    return (
      <motion.button
        ref={ref}
        whileTap={!disabled && !isLoading ? { scale: 0.98 } : undefined}
        disabled={disabled || isLoading}
        className={cn(
          'relative flex items-center justify-center gap-2 font-bold transition-all duration-200 outline-none focus-visible:ring-2 focus-visible:ring-[var(--primary-color)] focus-visible:ring-offset-2',
          variants[variant],
          sizes[size],
          fullWidth ? 'w-full' : 'w-fit',
          className
        )}
        {...props}
      >
        {isLoading && <Loader2 className="animate-spin shrink-0" size={size === 'sm' ? 14 : 18} />}
        {!isLoading && leftIcon && <span className="shrink-0">{leftIcon}</span>}
        <span className={cn(isLoading && 'opacity-0')}>{children}</span>
        {!isLoading && rightIcon && <span className="shrink-0">{rightIcon}</span>}
        
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center">
            <Loader2 className="animate-spin" size={size === 'sm' ? 14 : 18} />
          </div>
        )}
      </motion.button>
    );
  }
);

Button.displayName = 'Button';

export default Button;
