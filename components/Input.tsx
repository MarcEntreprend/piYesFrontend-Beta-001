// components\Input.tsx

import React, { useState } from "react";
import { cn } from "../src/lib/utils";
import { motion } from "motion/react";

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  error?: string;
  containerClassName?: string;
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  (
    {
      className,
      containerClassName,
      label,
      leftIcon,
      rightIcon,
      error,
      value,
      defaultValue,
      onChange,
      onFocus,
      onBlur,
      ...props
    },
    ref
  ) => {
    const [isFocused, setIsFocused] = useState(false);

    // Check if input has value to keep label floated
    const hasValue = value !== undefined ? String(value).length > 0 : false;
    const isFloated = isFocused || hasValue || props.placeholder;

    return (
      <div className={cn("w-full space-y-1", containerClassName)}>
        <div
          className={cn(
            "relative flex items-center w-full theme-bubble-bg rounded-2xl border transition-all duration-300",
            isFocused ? "border-(--primary-color) glow-primary bg-transparent" : "border-transparent",
            error ? "border-red-500/50 bg-red-50/5 dark:bg-red-900/10" : ""
          )}
        >
          {leftIcon && (
            <motion.div
              animate={{ scale: isFocused ? 1.1 : 1 }}
              className="pl-4 pr-2 text-(--theme-text-secondary) shrink-0 transition-colors"
              style={{ color: isFocused ? "var(--primary-color)" : undefined }}
            >
              {leftIcon}
            </motion.div>
          )}

          <div className="relative flex-1 px-4 pt-5 pb-2">
            <label
              className={cn(
                "absolute left-4 transition-all duration-300 pointer-events-none font-bold",
                isFloated
                  ? "top-1 text-[10px] uppercase tracking-widest text-(--theme-text-secondary) opacity-70"
                  : "top-1/2 -translate-y-1/2 text-(--theme-text-secondary) text-base"
              )}
              style={isFocused && !error ? { color: "var(--primary-color)", opacity: 1 } : undefined}
            >
              {label}
            </label>
            <input
              ref={ref}
              className={cn(
                "w-full bg-transparent outline-none theme-text-main font-bold text-base h-6",
                "placeholder:opacity-0 focus:placeholder:opacity-40 transition-opacity",
                className
              )}
              value={value}
              defaultValue={defaultValue}
              onChange={onChange}
              onFocus={(e) => {
                setIsFocused(true);
                onFocus?.(e);
              }}
              onBlur={(e) => {
                setIsFocused(false);
                onBlur?.(e);
              }}
              {...props}
            />
          </div>

          {rightIcon && (
            <div className="pr-4 pl-2 shrink-0">
              {rightIcon}
            </div>
          )}
        </div>

        {error && (
          <motion.p
            initial={{ opacity: 0, y: -5 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-red-500 text-[10px] font-bold uppercase tracking-widest px-2"
          >
            {error}
          </motion.p>
        )}
      </div>
    );
  }
);

Input.displayName = "Input";

export default Input;
