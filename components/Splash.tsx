// components/Splash.tsx

import React, { useEffect, useRef, useState } from "react";
import animatedLogo from "../src/assets/images/logo-animated.svg";

interface SplashProps {
  onComplete?: () => void;
  isFast?: boolean; // Gardé pour compatibilité, mais ignoré
}

const Splash: React.FC<SplashProps> = ({ onComplete }) => {
  const [isAnimating, setIsAnimating] = useState(true);
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsAnimating(false);
      onComplete?.();
    }, 4000); // Durée à ajuster selon besoin

    return () => clearTimeout(timer);
  }, [onComplete]);

  return (
    <div className="fixed inset-y-0 left-1/2 -translate-x-1/2 w-full max-w-md bg-[#830AD1] flex flex-col items-center justify-center z-100">
      <div className="animate-in fade-in duration-500">
        <img
          src={animatedLogo}
          alt="piYès Animation"
          className="w-64 h-64 object-contain"
        />
      </div>
    </div>
  );
};

export default Splash;