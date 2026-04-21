import React, { useEffect } from "react";
import RotatingText from "./RotatingText";
import logo from "../src/assets/images/logo-piyes-ppl-wh-wh-svg.svg";

interface SplashProps {
  onComplete?: () => void;
  isFast?: boolean;
}

const Splash: React.FC<SplashProps> = ({ onComplete, isFast }) => {
  // Correction pour le mode rapide : onNext n'est pas appelé si texts.length === 1
  useEffect(() => {
    if (isFast) {
      const timer = setTimeout(() => {
        onComplete?.();
      }, 1500); // Durée fixe de 1.5s en mode rapide
      return () => clearTimeout(timer);
    }
  }, [isFast, onComplete]);

  return (
    <div className="fixed inset-y-0 left-1/2 -translate-x-1/2 w-full max-w-md bg-[#830AD1] flex flex-col items-center justify-center z-100">
      <div className="flex flex-col items-center">
        <div className="mb-6 animate-in zoom-in fade-in duration-700">
          <img
            src={logo}
            alt="piYès Logo"
            className="w-32 h-32 drop-shadow-2xl"
          />
        </div>
        <div className="mb-12 flex items-center text-5xl font-bold tracking-tighter text-white h-20">
          <span className="opacity-90">pi</span>
          <RotatingText
            texts={isFast ? ["Yes !"] : ["Fasil", " Ba Pri", "Yes !"]}
            staggerFrom={"last"}
            initial={{ y: "100%", opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: "-120%", opacity: 0 }}
            staggerDuration={0.025}
            splitLevelClassName="overflow-hidden pb-1"
            transition={{ type: "spring", damping: 30, stiffness: 400 }}
            rotationInterval={isFast ? 1000 : 2500}
            loop={false}
            onNext={(index) => {
              // En mode normal (non rapide), on gère la fin après le 3ème texte
              if (!isFast && index === 2) {
                setTimeout(() => {
                  onComplete?.();
                }, 2500);
              }
            }}
          />
        </div>
      </div>
      <div className="w-10 h-10 border-4 border-white/20 border-t-white rounded-full animate-spin"></div>
    </div>
  );
};

export default Splash;
