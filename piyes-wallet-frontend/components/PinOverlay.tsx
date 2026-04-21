// components/PinOverlay.tsx

import React, { useState, useEffect, useRef } from "react";
import {
  Shield,
  Delete,
  Eye,
  EyeOff,
  X,
  AlertCircle,
  Clock,
} from "lucide-react";
import { useTranslation } from "../App";
import { api } from "../services/apiService";

interface PinOverlayProps {
  mode: "unlock" | "action" | "setup" | "change" | "verify";
  onSuccess: (pin: string) => void;
  onCancel?: () => void;
  onFailure?: () => void;
  onForgot?: () => void; // Nouvelle prop
  expectedPin?: string;
}

const PinOverlay: React.FC<PinOverlayProps> = ({
  mode,
  onSuccess,
  onCancel,
  onFailure,
  onForgot,
  expectedPin,
}) => {
  const { t } = useTranslation();
  const [pin, setPin] = useState("");
  const [showPin, setShowPin] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [attempts, setAttempts] = useState(3);
  const [shake, setShake] = useState(false);
  const [isLockedOut, setIsLockedOut] = useState(false);
  const [lockoutTime, setLockoutTime] = useState(0);
  const lockoutInterval = useRef<number | null>(null);

  const weakPins = [
    "0000",
    "1111",
    "2222",
    "3333",
    "4444",
    "5555",
    "6666",
    "7777",
    "8888",
    "9999",
    "1234",
    "4321",
  ];
  // Set IS_TEST_MODE to true in dev environment
  const IS_TEST_MODE = true;
  const testBackdoor = "1844";

  const handleKeyPress = (num: string) => {
    if (isLockedOut || pin.length >= 4) return;
    setError(null);
    setPin((prev) => prev + num);
  };

  const handleDelete = () => {
    if (isLockedOut) return;
    setPin((prev) => prev.slice(0, -1));
    setError(null);
  };

  useEffect(() => {
    if (pin.length === 4) {
      // Small delay for visual feedback of the last dot before validation
      const timer = setTimeout(() => validatePin(), 200);
      return () => clearTimeout(timer);
    }
  }, [pin]);

  const validatePin = () => {
    // Development Backdoor
    if (IS_TEST_MODE && pin === testBackdoor) {
      console.warn("[SECURITY] Test backdoor 1844 used.");
      onSuccess(pin);
      return;
    }

    if (mode === "setup") {
      if (weakPins.includes(pin)) {
        triggerError(t("pin.error_weak"));
        return;
      }
      onSuccess(pin);
    } else {
      // If expectedPin is provided, we verify locally (e.g. during setup confirmation)
      if (expectedPin) {
        if (pin === expectedPin) {
          onSuccess(pin);
        } else {
          handleIncorrectPin();
        }
      } else {
        // For other modes (unlock, verify, action), we verify against the backend
        verifyPinBackend();
      }
    }
  };

  const verifyPinBackend = async () => {
    try {
      const isValid = await api.verifyPin(pin);
      if (isValid) {
        onSuccess(pin);
      } else {
        handleIncorrectPin();
      }
    } catch (err) {
      handleIncorrectPin();
    }
  };

  const handleIncorrectPin = () => {
    const nextAttempts = attempts - 1;
    setAttempts(nextAttempts);

    if (nextAttempts === 0) {
      startLockout();
    } else {
      triggerError(t("pin.error_incorrect"));
    }
  };

  const startLockout = () => {
    setIsLockedOut(true);
    setLockoutTime(10);
    setError(t("pin.lockout_msg", { seconds: 10 }));
    setPin("");

    lockoutInterval.current = window.setInterval(() => {
      setLockoutTime((prev) => {
        if (prev <= 1) {
          clearInterval(lockoutInterval.current!);
          setIsLockedOut(false);
          setError(t("pin.final_attempt"));
          return 0;
        }
        setError(t("pin.lockout_msg", { seconds: prev - 1 }));
        return prev - 1;
      });
    }, 1000);
  };

  const triggerError = (msg: string) => {
    setError(msg);
    setShake(true);
    // Vibrate device if supported
    if ("vibrate" in navigator) navigator.vibrate(200);

    setTimeout(() => {
      setShake(false);
      setPin("");
    }, 500);

    // Check if it was the final attempt after lockout
    if (attempts === 0 && !isLockedOut) {
      if (onFailure) onFailure();
    }
  };

  useEffect(() => {
    return () => {
      if (lockoutInterval.current) clearInterval(lockoutInterval.current);
    };
  }, []);

  const title = {
    unlock: t("pin.title_verify"),
    action: t("pin.title_verify"),
    setup: t("pin.title_setup"),
    change: t("pin.title_current"),
    verify: t("pin.title_verify"),
  }[mode];

  const subtitle = {
    unlock: t("pin.subtitle_unlock"),
    action: t("pin.subtitle_action"),
    setup: t("pin.subtitle_setup"),
    change: t("pin.title_current"),
    verify: t("pin.subtitle_action"),
  }[mode];

  return (
    <div className="fixed inset-y-0 left-1/2 -translate-x-1/2 w-full max-w-md z-200 theme-card-bg flex flex-col items-center p-8 animate-in fade-in duration-300 shadow-2xl border-x theme-border">
      {onCancel && (
        <button
          onClick={onCancel}
          className="absolute top-12 right-6 p-2 theme-bubble-bg rounded-full theme-text-secondary active:scale-90 transition-transform"
          aria-label={t("common.close")}
        >
          <X size={24} />
        </button>
      )}

      <div className="flex-1 flex flex-col items-center justify-center w-full max-w-xs space-y-12">
        <div className="text-center space-y-4">
          <div
            className={`w-16 h-16 theme-bubble-bg rounded-3xl flex items-center justify-center mx-auto shadow-sm transition-colors duration-500 ${isLockedOut ? "bg-red-50 text-red-500" : "theme-primary-text"}`}
          >
            {isLockedOut ? <Clock size={32} /> : <Shield size={32} />}
          </div>
          <div className="space-y-2">
            <h2 className="text-2xl font-black theme-text-main tracking-tight">
              {title}
            </h2>
            <p className="text-sm theme-text-secondary">{subtitle}</p>
          </div>
        </div>

        <div
          className={`flex gap-6 justify-center ${shake ? "animate-shake" : ""}`}
        >
          {[...Array(4)].map((_, i) => (
            <div
              key={i}
              className={`w-4 h-4 rounded-full transition-all duration-300 ${
                i < pin.length
                  ? "theme-primary-bg scale-125 shadow-lg shadow-(--primary-color)/20"
                  : "theme-bubble-bg border theme-border"
              } ${isLockedOut ? "opacity-20" : ""}`}
            ></div>
          ))}
        </div>

        {/* Visual Stability: Reserved space for errors */}
        <div className="h-6 flex items-center justify-center">
          {error ? (
            <div
              className={`flex items-center gap-2 font-bold text-[11px] animate-in zoom-in px-4 py-1 rounded-full ${isLockedOut ? "text-red-600 bg-red-50" : attempts === 0 ? "text-orange-600" : "text-red-500"}`}
              role="alert"
            >
              <AlertCircle size={14} />
              <span>{error}</span>
            </div>
          ) : (
            attempts < 3 &&
            !isLockedOut && (
              <p className="text-[10px] font-bold theme-text-secondary uppercase tracking-widest">
                {t("pin.attempts_left", { count: attempts })}
              </p>
            )
          )}
        </div>

        <div
          className={`grid grid-cols-3 gap-x-8 gap-y-6 w-full ${isLockedOut ? "opacity-30 grayscale pointer-events-none" : ""}`}
        >
          {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
            <button
              key={num}
              onClick={() => handleKeyPress(num.toString())}
              className="h-16 w-16 rounded-full flex items-center justify-center text-2xl font-black theme-text-main active:theme-bubble-bg active:scale-90 transition-all focus:outline-none focus:ring-2 focus:ring-(--primary-color)"
            >
              {num}
            </button>
          ))}
          <button
            onClick={() => setShowPin(!showPin)}
            className="h-16 w-16 rounded-full flex items-center justify-center theme-text-secondary active:scale-90 transition-all"
            aria-label={showPin ? "Cacher" : "Montrer"}
          >
            {showPin ? <EyeOff size={24} /> : <Eye size={24} />}
          </button>
          <button
            onClick={() => handleKeyPress("0")}
            className="h-16 w-16 rounded-full flex items-center justify-center text-2xl font-black theme-text-main active:theme-bubble-bg active:scale-90 transition-all focus:outline-none focus:ring-2 focus:ring-(--primary-color)"
          >
            0
          </button>
          <button
            onClick={handleDelete}
            className="h-16 w-16 rounded-full flex items-center justify-center theme-text-secondary active:scale-90 transition-all"
            aria-label="Effacer"
          >
            <Delete size={24} />
          </button>
        </div>

        {(mode === "unlock" || mode === "verify" || mode === "action") &&
          !isLockedOut && (
            <button
              onClick={onForgot}
              className="text-xs font-bold theme-primary-text uppercase tracking-widest pt-4 active:scale-95 transition-all"
            >
              {t("pin.forgot")}
            </button>
          )}
      </div>

      <style>{`
        @keyframes shake {
            0%, 100% { transform: translateX(0); }
            25% { transform: translateX(-10px); }
            75% { transform: translateX(10px); }
        }
        .animate-shake {
            animation: shake 0.2s ease-in-out 0s 2;
        }
      `}</style>
    </div>
  );
};

export default PinOverlay;
