// components/SegmentedControl.tsx

import React, { useRef, useEffect, useState } from "react";
import { motion } from "motion/react";

interface SegmentedOption<T extends string> {
  id: T;
  label: string;
  icon?: React.ReactNode;
  badge?: string | number;
}

interface SegmentedControlProps<T extends string> {
  options: SegmentedOption<T>[];
  value: T;
  onChange: (value: T) => void;
  className?: string;
  activeClass?: string;
  inactiveClass?: string;
}

const SegmentedControl = <T extends string>({
  options,
  value,
  onChange,
  className = "",
  activeClass = "theme-primary-bg text-white shadow-md",
  inactiveClass = "theme-text-secondary",
}: SegmentedControlProps<T>): React.ReactElement => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [indicatorStyle, setIndicatorStyle] = useState({ left: 0, width: 0 });

  // Calculer la position de l'indicateur quand la valeur change
  useEffect(() => {
    if (!containerRef.current) return;

    const activeIndex = options.findIndex((opt) => opt.id === value);
    if (activeIndex === -1) return;

    const buttons = containerRef.current.querySelectorAll("button");
    const activeButton = buttons[activeIndex];

    if (activeButton) {
      const containerRect = containerRef.current.getBoundingClientRect();
      const buttonRect = activeButton.getBoundingClientRect();

      setIndicatorStyle({
        left: buttonRect.left - containerRect.left,
        width: buttonRect.width,
      });
    }
  }, [value, options]);

  return (
    <div
      ref={containerRef}
      className={`relative flex gap-2 p-1 theme-bubble-bg rounded-full border theme-border ${className}`}
    >
      {/* Indicateur animé */}
      <motion.div
        className="absolute top-1 bottom-1 rounded-full theme-primary-bg shadow-md"
        animate={{
          left: indicatorStyle.left,
          width: indicatorStyle.width,
        }}
        transition={{
          type: "spring",
          stiffness: 500,
          damping: 35,
          mass: 0.8,
        }}
      />

      {/* Boutons */}
      {options.map((option) => (
        <button
          key={option.id}
          onClick={() => onChange(option.id)}
          className={`relative z-10 flex-1 py-2.5 rounded-full text-[10px] font-black uppercase tracking-widest transition-colors duration-200 flex items-center justify-center gap-1.5 ${
            value === option.id ? "text-white" : inactiveClass
          }`}
        >
          {option.icon && <span className="shrink-0">{option.icon}</span>}
          <span className="truncate">{option.label}</span>
          {option.badge && (
            <span
              className={`text-[8px] font-black px-1.5 py-0.5 rounded-full leading-none ${
                value === option.id
                  ? "bg-white/30 text-white"
                  : option.id === "outgoing"
                    ? "bg-red-500 text-white"
                    : option.id === "incoming"
                      ? "bg-green-500 text-white"
                      : "bg-red-500 text-white"
              }`}
            >
              {option.badge}
            </span>
          )}
        </button>
      ))}
    </div>
  );
};

export default SegmentedControl;
