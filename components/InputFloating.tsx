// components/InputFloating.tsx

import React, { useState } from "react";
import { motion } from "motion/react";
import { CheckCircle2, Eye, EyeOff } from "lucide-react";

interface InputFloatingProps {
    icon: React.ReactNode;
    label: string;
    name: string;
    type: string;
    placeholder: string;
    isValid: boolean | null;
    value: string;
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
    showPasswordToggle?: boolean;
    showValidationErrors?: boolean;
    required?: boolean;
    autoFocus?: boolean;
}

const InputFloating: React.FC<InputFloatingProps> = ({
    icon,
    label,
    name,
    type,
    placeholder,
    isValid,
    value,
    onChange,
    showPasswordToggle,
    showValidationErrors,
    required,
    autoFocus,
}) => {
    const [isFocused, setIsFocused] = useState(false);
    const [isPasswordVisible, setIsPasswordVisible] = useState(false);
    const hasValue = String(value).length > 0;
    const isFloated = isFocused || hasValue || placeholder;
    const inputType = showPasswordToggle && isPasswordVisible ? "text" : type;

    return (
        <div className="space-y-1 w-full relative">
            <div className="flex justify-end items-center px-1 absolute right-2 top-2 z-10">
                {value &&
                    isValid !== null &&
                    (isValid ? (
                        <CheckCircle2 size={12} className="text-green-500 animate-in zoom-in" />
                    ) : (
                        <div className="w-1 h-1 rounded-full bg-red-500 animate-pulse" />
                    ))}
            </div>
            <div
                className={`relative flex items-center w-full theme-bubble-bg rounded-2xl border transition-all duration-300 ${value && isValid === false
                        ? "border-red-500/50 bg-red-50/5 dark:bg-red-900/10"
                        : isValid === false && showValidationErrors
                            ? "border-red-500/50 bg-red-50/5 dark:bg-red-900/10"
                            : isFocused
                                ? "border-(--primary-color) glow-primary bg-transparent"
                                : "border-transparent"
                    }`}
            >
                <motion.div
                    animate={{ scale: isFocused ? 1.1 : 1 }}
                    className="pl-4 pr-2 shrink-0 transition-colors"
                    style={{
                        color: isFocused ? "var(--primary-color)" : "var(--theme-text-secondary)",
                        opacity: isFocused ? 1 : 0.5,
                    }}
                >
                    {icon}
                </motion.div>

                <div className="relative flex-1 px-1 pt-5 pb-2">
                    <label
                        className={`absolute left-1 transition-all duration-300 pointer-events-none font-bold ${isFloated
                                ? "top-1 text-[10px] uppercase tracking-widest text-(--theme-text-secondary) opacity-70"
                                : "top-1/2 -translate-y-1/2 text-(--theme-text-secondary) text-sm"
                            }`}
                        style={
                            isFocused && isValid !== false
                                ? { color: "var(--primary-color)", opacity: 1 }
                                : undefined
                        }
                    >
                        {label} {required && <span className="text-red-400 ml-0.5">*</span>}
                    </label>
                    <input
                        name={name}
                        type={inputType}
                        value={value}
                        onChange={onChange}
                        onFocus={() => setIsFocused(true)}
                        onBlur={() => setIsFocused(false)}
                        placeholder={isFocused ? placeholder : ""}
                        autoComplete="off"
                        autoFocus={autoFocus}
                        className="w-full bg-transparent outline-none theme-text-main text-sm font-bold placeholder:font-normal placeholder:opacity-40 h-6"
                    />
                </div>
                {showPasswordToggle && (
                    <button
                        type="button"
                        onClick={() => setIsPasswordVisible(!isPasswordVisible)}
                        className="pr-4 pl-2 theme-text-secondary opacity-40 active:scale-90 transition-transform shrink-0"
                    >
                        {isPasswordVisible ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                )}
            </div>
        </div>
    );
};

export default InputFloating;