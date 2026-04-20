// components\AnimatedButton.tsx

import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import BankIcon from "./BankIcon";
import { ShieldCheck } from "lucide-react";

interface AnimatedButtonProps {
  isSelected: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
  // Customization
  accentColor?: string;
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
  accentColor = "#830AD1",
  activeBg = "#FFFFFF",
  activeText,
  inactiveBg = "rgba(255, 255, 255, 0.1)",
  inactiveText = "#FFFFFF",
  iconActiveBg,
  iconInactiveBg,
  iconActiveColor = "#FFFFFF",
  iconInactiveColor = "#FFFFFF",
  logoUrl,
  id,
  className = "",
  showBadge = false,
}) => {
  const [textWidth, setTextWidth] = useState(0);

  useEffect(() => {
    const measureEl = document.createElement("span");
    measureEl.style.visibility = "hidden";
    measureEl.style.position = "absolute";
    measureEl.style.fontSize = "12px";
    measureEl.style.fontWeight = "700";
    measureEl.style.whiteSpace = "nowrap";
    measureEl.style.fontFamily = "inherit";
    measureEl.style.letterSpacing = "normal";
    measureEl.textContent = label;
    document.body.appendChild(measureEl);
    const width = measureEl.getBoundingClientRect().width;
    document.body.removeChild(measureEl);
    setTextWidth(width + 8);
  }, [label]);

  // Boutons plus larges : 52px au lieu de 44px
  const collapsedWidth = 52;
  const expandedWidth = collapsedWidth + textWidth + 12;

  const textColor = activeText || accentColor;
  const iconBgActive = iconActiveBg || accentColor;
  const iconBgInactive = iconInactiveBg || "rgba(255, 255, 255, 0.2)";

  return (
    <motion.button
      onClick={onClick}
      initial={false}
      animate={{
        width: isSelected ? expandedWidth : collapsedWidth,
        backgroundColor: isSelected ? activeBg : inactiveBg,
        color: isSelected ? textColor : inactiveText,
      }}
      transition={{
        type: "spring",
        stiffness: 400,
        damping: 35,
        mass: 0.8,
      }}
      className={`flex items-center ${isSelected ? "pl-3 pr-4" : "justify-center px-0"} py-2 rounded-full whitespace-nowrap text-xs font-bold overflow-hidden shadow-sm hover:shadow-md ${className}`}
      style={{
        height: "48px", //  Hauteur = largeur pour un cercle parfait
      }}
    >
      <motion.div
        animate={{
          backgroundColor: isSelected ? iconBgActive : iconBgInactive,
          color: isSelected ? iconActiveColor : iconInactiveColor,
        }}
        transition={{ type: "spring", stiffness: 400, damping: 35 }}
        className="shrink-0 flex items-center justify-center w-6 h-6 rounded-full text-[10px] overflow-hidden relative"
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
        ) : (
          icon
        )}
      </motion.div>

      <AnimatePresence mode="wait">
        {isSelected && (
          <motion.span
            initial={{ opacity: 0, maxWidth: 0 }}
            animate={{ opacity: 1, maxWidth: textWidth + 12 }}
            exit={{ opacity: 0, maxWidth: 0 }}
            transition={{
              duration: 0.2,
              ease: "easeInOut",
            }}
            className="origin-left overflow-visible ml-2"
          >
            {label}
          </motion.span>
        )}
      </AnimatePresence>
    </motion.button>
  );
};

export default AnimatedButton;
