// components/StepIndicator.tsx

import React from "react";

interface StepIndicatorProps {
  currentStep: number;
  totalSteps: number;
  className?: string;
  activeColor?: string;
  inactiveColor?: string;
}

const StepIndicator: React.FC<StepIndicatorProps> = ({
  currentStep,
  totalSteps,
  className = "",
  activeColor = "theme-primary-bg",
  inactiveColor = "bg-gray-200 dark:bg-gray-700",
}) => {
  // Ne pas afficher si on est à la dernière étape (ex: step 4 sur 4 = succès)
  if (currentStep >= totalSteps) {
    return null;
  }

  return (
    <div className={`flex gap-2 px-6 pt-4 ${className}`}>
      {Array.from({ length: totalSteps - 1 }, (_, i) => i + 1).map((step) => (
        <div
          key={step}
          className={`h-1 flex-1 rounded-full transition-all duration-300 ${
            step <= currentStep ? activeColor : inactiveColor
          }`}
        />
      ))}
    </div>
  );
};

export default StepIndicator;
