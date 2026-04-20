// App.tsx

import React, {
  useState,
  useEffect,
  createContext,
  useContext,
  useCallback,
  useRef,
} from "react";
/* Use MemoryRouter from react-router core as react-router-dom exports appear to be missing or mismatched in this environment */
import {
  Routes,
  Route,
  Navigate,
  useLocation,
  useNavigate,
} from "react-router-dom";
import { App as CapacitorApp } from "@capacitor/app";
import { api } from "./services/apiService";
import { cacheService } from "./services/cacheService";
import { User } from "./shared/types";
import { translations, Language } from "./translations";
import {
  Info,
  X,
  CheckCircle,
  AlertCircle,
  Shield,
  ChevronRight,
  PartyPopper,
  Wifi,
  WifiOff,
} from "lucide-react";

// Pages
import Dashboard from "./pages/Dashboard";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import KeysManagement from "./pages/KeysManagement";
import History from "./pages/History";
import BankHistory from "./pages/BankHistory";
import TransferFlow from "./pages/TransferFlow";
import InternationalTransfer from "./pages/InternationalTransfer";
import InternationalProviders from "./pages/InternationalProviders";
import DepositFlow from "./pages/DepositFlow";
import WithdrawFlow from "./pages/WithdrawFlow";
import Contacts from "./pages/Contacts";
import ContactDetail from "./pages/ContactDetail";
import ReceiptDetail from "./pages/ReceiptDetail";
import Settings from "./pages/Settings";
import Security from "./pages/Security";
import Verification from "./pages/Verification";
import Advanced from "./pages/Advanced";
import RequestPayment from "./pages/RequestPayment";
import SchedulerCreate from "./pages/SchedulerCreate";
import CardsHub from "./pages/CardsHub";
import Report from "./pages/Report";
import IdentityVerification from "./pages/IdentityVerification";
import Profile from "./pages/Profile";
import ForgotPassword from "./pages/ForgotPassword";
import IdentityHub from "./pages/IdentityHub";
import Notifications from "./pages/Notifications";
import NotificationsSettings from "./pages/NotificationsSettings";
import HelpCenter from "./pages/HelpCenter";
import Support from "./pages/Support";
import Feedback from "./pages/Feedback";
import Legal from "./pages/Legal";
import FinancialTools from "./pages/FinancialTools";
import ScheduledPayments from "./pages/ScheduledPayments";
import ServicesMarket from "./pages/ServicesMarket";
import MarketplaceDashboard from "./pages/MarketplaceDashboard";
import MarketplaceSearch from "./pages/MarketplaceSearch";
import AdDetail from "./pages/AdDetail";
import ChatDetail from "./pages/ChatDetail";
import InterBankTransfer from "./pages/InterBankTransfer";
import Promotions from "./pages/Promotions";
import Plans from "./pages/Plans";
import MobileRecharge from "./pages/MobileRecharge";
import MessagingHub from "./pages/MessagingHub";
import PrivacySettings from "./pages/PrivacySettings";
import TransferInteractions from "./pages/TransferInteractions";
import Onboarding from "./pages/Onboarding";

const PayRedirect: React.FC = () => {
  const { search } = useLocation();
  const searchParams = new URLSearchParams(search);
  const to = searchParams.get("to");
  const type = searchParams.get("type");
  const amount = searchParams.get("amount");
  const expiry = searchParams.get("expiry");

  if (!to) return <Navigate to="/" replace />;

  let recipientKey = to;
  if (type === "tag") recipientKey = "@" + to;
  else if (type === "email") recipientKey = decodeURIComponent(to);

  const query = new URLSearchParams();
  query.append("recipient", recipientKey);
  if (amount) query.append("amount", amount);
  if (expiry) query.append("expiry", expiry);
  query.append("locked", amount ? "true" : "false");
  query.append("source", "link");
  query.append("from", "external");

  return <Navigate to={`/transfer?${query.toString()}`} replace />;
};

// Components
import BottomNav from "./components/BottomNav";
import Splash from "./components/Splash";
import PinOverlay from "./components/PinOverlay";
import OtpOverlay from "./components/OtpOverlay";
import Modal from "./components/Modal";

import { useSync } from "./hooks/useSync";
import { SyncResponse } from "./shared/types";

// --- SYNC CONTEXT ---
interface SyncContextType {
  syncData: SyncResponse | null;
  syncLoading: boolean;
  isRefreshing: boolean;
  refresh: () => Promise<void>;
}

const SyncContext = createContext<SyncContextType | undefined>(undefined);

export const useGlobalSync = () => {
  const context = useContext(SyncContext);
  if (!context)
    throw new Error("useGlobalSync must be used within a SyncProvider");
  return context;
};

// --- SECURITY CONTEXT ---
interface SecurityContextType {
  isDeviceVerified: boolean;
  hasPin: boolean;
  triggerSensitiveAction: (action: (pin?: string) => void) => void;
  setSecurityStatus: (status: {
    hasPin?: boolean;
    isDeviceVerified?: boolean;
  }) => void;
  showPostSignupSecurity: () => void;
  handleForgotPin: () => void;
}

export const SecurityContext = createContext<SecurityContextType | undefined>(
  undefined,
);

export const useSecurity = () => {
  const context = useContext(SecurityContext);
  if (!context)
    throw new Error("useSecurity must be used within a SecurityProvider");
  return context;
};

// I18n Context
interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (path: string, params?: Record<string, any>) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(
  undefined,
);

export const useTranslation = () => {
  const context = useContext(LanguageContext);
  if (!context)
    throw new Error("useTranslation must be used within a LanguageProvider");
  return context;
};

// Theme Context
interface ThemeContextType {
  theme: string;
  setTheme: (theme: string) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) throw new Error("useTheme must be used within a ThemeProvider");
  return context;
};

// Toast Context
interface ToastContextType {
  showToast: (message: string, type?: "info" | "success" | "error") => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) throw new Error("useToast must be used within a ToastProvider");
  return context;
};

const ScrollToTop: React.FC = () => {
  const { pathname } = useLocation();

  useEffect(() => {
    // Scroll le conteneur de scroll de la page active, pas le <main>
    // Chercher tous les éléments avec overflow-y-auto dans le main
    const scrollContainers = document.querySelectorAll(
      '[class*="overflow-y-auto"]',
    );

    scrollContainers.forEach((container) => {
      if (container.scrollTop > 0) {
        container.scrollTo({ top: 0, behavior: "instant" });
      }
    });

    // Fallback : aussi scroller la fenêtre
    window.scrollTo({ top: 0, behavior: "instant" });
  }, [pathname]);

  return null;
};

const App: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();

  //  AJOUTER TOUT CE BLOC ICI (juste après les deux lignes ci-dessus)
  useEffect(() => {
    const handleBackButton = () => {
      const path = location.pathname;
      const exitPages = ["/login", "/signup", "/forgot-password", "/"];

      if (exitPages.includes(path)) {
        CapacitorApp.exitApp();
      } else {
        navigate(-1);
      }
    };

    CapacitorApp.addListener("backButton", handleBackButton);
    return () => {
      CapacitorApp.removeAllListeners();
    };
  }, [location.pathname, navigate]);

  const [user, setUser] = useState<User | null>(() => {
    const saved = localStorage.getItem("piyes-user");
    return saved ? JSON.parse(saved) : null;
  });
  const [loading, setLoading] = useState(false);
  const [isAuthLoading, setIsAuthLoading] = useState(false);
  const [showSplash, setShowSplash] = useState(true);
  const [isLocked, setIsLocked] = useState(false);
  const [theme, setTheme] = useState(() => {
    const saved = localStorage.getItem("piyes-theme");
    return saved && saved !== "system" ? saved : "default";
  });
  const [fontSize, setFontSize] = useState(
    localStorage.getItem("piyes-font-size") || "default",
  );
  const [language, setLanguage] = useState<Language>(
    (localStorage.getItem("piyes-lang") as Language) || "fr",
  );
  const [showOnboarding, setShowOnboarding] = useState(() => {
    return !localStorage.getItem("piyes-onboarding-completed");
  });

  // Network State
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [wasOffline, setWasOffline] = useState(false);
  const [showBackOnlineBar, setShowBackOnlineBar] = useState(false);

  // Security Logic States
  const [securityQueue, setSecurityQueue] = useState<{
    type: "otp" | "pin_setup" | "pin_verify" | "pin_intro" | "welcome";
    data?: any;
    resolve: (pin?: string) => void;
  } | null>(null);
  const pendingActionRef = useRef<((pin?: string) => void) | null>(null);

  const [hasPin, setHasPin] = useState(false);
  const [isDeviceVerified, setIsDeviceVerified] = useState(false);

  // Toast State
  const [toast, setToast] = useState<{
    message: string;
    type: "info" | "success" | "error";
  } | null>(null);

  const {
    data: syncData,
    loading: syncLoading,
    isRefreshing,
    refresh,
  } = useSync();

  // Sync user state and security status with syncData
  useEffect(() => {
    if (syncData?.user) {
      const isFirstLoad = !user;
      setUser(syncData.user);
      setHasPin(syncData.user.hasPin);
      setIsDeviceVerified(syncData.user.isDeviceVerified);
      localStorage.setItem("piyes-user", JSON.stringify(syncData.user));
      if (syncData.user.avatarUrl) {
        localStorage.setItem("piyes-avatar", syncData.user.avatarUrl);
      }

      // Lock app on first load if user has PIN
      if (isFirstLoad && syncData.user.hasPin) {
        setIsLocked(true);
      }
    }
  }, [syncData]);

  const t = useCallback(
    (path: string, params?: Record<string, any>): string => {
      const keys = path.split(".");
      let result: any = translations[language];

      for (const key of keys) {
        if (!result || result[key] === undefined) {
          let fallback: any = translations["fr"];
          for (const fKey of keys) {
            if (!fallback || fallback[fKey] === undefined) return path;
            fallback = fallback[fKey];
          }
          result = fallback;
          break;
        }
        result = result[key];
      }

      if (typeof result === "string" && params) {
        Object.keys(params).forEach((param) => {
          result = result.replace(
            new RegExp(`{{${param}}}`, "g"),
            params[param],
          );
        });
      }

      return result;
    },
    [language],
  );

  const showToast = useCallback(
    (message: string, type: "info" | "success" | "error" = "info") => {
      setToast({ message, type });
      setTimeout(() => setToast(null), 3500);
    },
    [],
  );

  // --- CONNECTIVITY MONITORING ---
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      if (wasOffline) {
        setShowBackOnlineBar(true);
        showToast(t("common.online_msg"), "success");
        // Hide success bar after delay
        setTimeout(() => setShowBackOnlineBar(false), 3000);
      }
    };

    const handleOffline = () => {
      setIsOnline(false);
      setWasOffline(true);
      showToast(t("common.offline_msg"), "error");
    };

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, [wasOffline, t, showToast]);

  useEffect(() => {
    const applyTheme = (themeName: string) => {
      document.documentElement.setAttribute("data-theme", themeName);
    };

    applyTheme(theme);
    localStorage.setItem("piyes-theme", theme);
  }, [theme]);

  useEffect(() => {
    document.documentElement.setAttribute("data-font-size", fontSize);
    localStorage.setItem("piyes-font-size", fontSize);
  }, [fontSize]);

  useEffect(() => {
    localStorage.setItem("piyes-lang", language);
  }, [language]);

  useEffect(() => {
    // Le Splash screen est maintenant géré par sa propre animation interne
    // via la prop onComplete passée au composant <Splash />
  }, []);

  const triggerSensitiveAction = (action: (pin?: string) => void) => {
    pendingActionRef.current = action;

    if (!isDeviceVerified) {
      setSecurityQueue({
        type: "otp",
        data: { email: user?.email },
        resolve: () => {
          setIsDeviceVerified(true);
          if (!hasPin) {
            setSecurityQueue({ type: "pin_intro", resolve: action });
          } else {
            setSecurityQueue({ type: "pin_verify", resolve: action });
          }
        },
      });
      return;
    }

    if (!hasPin) {
      setSecurityQueue({
        type: "pin_intro",
        resolve: (pin) => {
          action(pin);
        },
      });
      return;
    }

    setSecurityQueue({ type: "pin_verify", resolve: action });
  };

  const handleForgotPin = useCallback(() => {
    setSecurityQueue({
      type: "otp",
      resolve: () => {
        setSecurityQueue({
          type: "pin_setup",
          resolve: () => {
            showToast(t("pin.setup_success"), "success");
            if (isLocked) setIsLocked(false);
          },
        });
      },
    });
  }, [t, isLocked, showToast]);

  const showPostSignupSecurity = () => {
    setSecurityQueue({
      type: "pin_intro",
      resolve: () => {
        setSecurityQueue({ type: "welcome", resolve: () => {} });
      },
    });
  };

  const handleSecurityStatus = (status: {
    hasPin?: boolean;
    isDeviceVerified?: boolean;
  }) => {
    if (status.hasPin !== undefined) setHasPin(status.hasPin);
    if (status.isDeviceVerified !== undefined)
      setIsDeviceVerified(status.isDeviceVerified);
  };

  const handleLogin = async (credentials: any) => {
    setIsAuthLoading(true);
    try {
      const res = await api.login(credentials);

      if (res.mfaRequired) {
        setSecurityQueue({
          type: "otp",
          data: {
            requestId: res.requestId,
            email: credentials.email,
            mode: "login",
          },
          resolve: async (verifyResponse: any) => {
            // verifyResponse = { user: {...}, token: "..." } retourné par verify-session-otp
            const userData = verifyResponse?.user || verifyResponse;
            const newToken = verifyResponse?.token;

            // Sauvegarder le nouveau token JWT (session du nouveau device)
            if (newToken) {
              localStorage.setItem("piyes-auth-token", newToken);
            }

            setUser(userData);
            setHasPin(userData.hasPin);
            setIsDeviceVerified(true);
            localStorage.setItem("piyes-user", JSON.stringify(userData));
            if (userData.hasPin) {
              localStorage.setItem("piyes-app-pin", "true");
            }
            await refresh();
          },
        });
        return;
      }

      setUser(res.user);
      setHasPin(res.user.hasPin);
      setIsDeviceVerified(res.user.isDeviceVerified);
      localStorage.setItem("piyes-user", JSON.stringify(res.user));

      if (res.user.hasPin) {
        localStorage.setItem("piyes-app-pin", "true");
      }

      await refresh();

      if (!res.user.isDeviceVerified) {
        setSecurityQueue({
          type: "otp",
          data: { email: res.user.email },
          resolve: () => setIsDeviceVerified(true),
        });
      }
    } catch (e: any) {
      // Afficher le message spécifique retourné par le backend, ou un message générique
      const code = e?.data?.error?.code || "";
      const msg = e?.data?.error?.message || e?.message || "";

      if (code === "WRONG_PASSWORD" || msg.includes("Mot de passe")) {
        showToast(
          'Mot de passe incorrect. Essayez "J´ai oublié mon mot de passe".',
          "error",
        );
      } else if (
        code === "INVALID_CREDENTIALS" ||
        msg.includes("Identifiants")
      ) {
        showToast(
          "Aucun compte trouvé avec ces informations. Vérifiez votre email ou numéro de téléphone.",
          "error",
        );
      } else if (code === "ACCOUNT_DISABLED" || msg.includes("désactivé")) {
        showToast("Compte désactivé. Contactez le support.", "error");
      } else if (
        e?.status === 0 ||
        msg.includes("fetch") ||
        msg.includes("network")
      ) {
        showToast("Connexion internet instable. Réessayez.", "error");
      } else {
        showToast(msg || t("auth.login_error"), "error");
      }
    } finally {
      setIsAuthLoading(false);
    }
  };

  const handleSignup = async (data: any) => {
    setIsAuthLoading(true);
    try {
      const res = await api.signup(data);
      setUser(res.user);
      localStorage.setItem("piyes-user", JSON.stringify(res.user));
      await refresh();
      showPostSignupSecurity();
    } catch (e) {
      showToast(t("auth.signup_error"), "error");
    } finally {
      setIsAuthLoading(false);
    }
  };

  const handleUpdateUser = async (updatedUser: User) => {
    try {
      // Persist to backend
      const savedUser = await api.updateProfile(updatedUser);
      setUser(savedUser);
      localStorage.setItem("piyes-user", JSON.stringify(savedUser));
    } catch (error) {
      console.error("Failed to update profile:", error);
      // Fallback to local update if API fails (optional, but good for UX)
      setUser(updatedUser);
      localStorage.setItem("piyes-user", JSON.stringify(updatedUser));
    }
  };

  const handleLogout = () => {
    setUser(null);
    cacheService.clearSensitiveData();
    localStorage.removeItem("piyes_show_balance");
    setIsLocked(false);
    setIsDeviceVerified(false);
  };

  useEffect(() => {
    const handleAuthExpired = () => {
      handleLogout();
      showToast(t("common.session_expired"), "error");
    };

    window.addEventListener("piyes:auth_expired", handleAuthExpired);
    return () =>
      window.removeEventListener("piyes:auth_expired", handleAuthExpired);
  }, [handleLogout, showToast, t]);

  const handlePinFailure = () => {
    handleLogout();
  };

  if (showSplash)
    return <Splash onComplete={() => setShowSplash(false)} isFast={!!user} />;

  if (showOnboarding && !user) {
    return (
      <LanguageContext.Provider value={{ language, setLanguage, t }}>
        <ThemeContext.Provider value={{ theme, setTheme }}>
          <Onboarding
            onComplete={() => {
              localStorage.setItem("piyes-onboarding-completed", "true");
              setShowOnboarding(false);
            }}
          />
        </ThemeContext.Provider>
      </LanguageContext.Provider>
    );
  }

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      <ThemeContext.Provider value={{ theme, setTheme }}>
        <ToastContext.Provider value={{ showToast }}>
          <SecurityContext.Provider
            value={{
              isDeviceVerified,
              hasPin,
              triggerSensitiveAction,
              setSecurityStatus: handleSecurityStatus,
              showPostSignupSecurity,
              handleForgotPin,
            }}
          >
            <SyncContext.Provider
              value={{ syncData, syncLoading, isRefreshing, refresh }}
            >
              {user && isLocked && (
                <PinOverlay
                  mode="unlock"
                  onSuccess={() => setIsLocked(false)}
                  onFailure={handlePinFailure}
                  onForgot={handleForgotPin}
                />
              )}

              {/* SECURITY OVERLAYS MANAGER */}
              {securityQueue?.type === "otp" && (
                <OtpOverlay
                  requestId={
                    securityQueue.data?.requestId ||
                    securityQueue.data?.email ||
                    user?.email ||
                    "manual"
                  }
                  mode={securityQueue.data?.mode || "verify"}
                  onSuccess={(data) => {
                    const resolve = securityQueue.resolve;
                    setSecurityQueue(null);
                    if (resolve) resolve(data);
                  }}
                  onCancel={() => setSecurityQueue(null)}
                />
              )}

              {securityQueue?.type === "pin_intro" && (
                <Modal
                  isOpen={true}
                  onClose={() => setSecurityQueue(null)}
                  type="bottom-sheet"
                >
                  <div className="p-10 space-y-8 animate-in slide-in-from-bottom duration-500">
                    <div className="w-20 h-20 theme-bubble-bg rounded-4xl flex items-center justify-center mx-auto theme-primary-text shadow-inner">
                      <Shield size={48} strokeWidth={1.5} />
                    </div>
                    <div className="text-center space-y-3">
                      <h3 className="text-2xl font-black theme-text-main tracking-tight">
                        {t("security_flow.pin_intro_title")}
                      </h3>
                      <p className="text-sm theme-text-secondary leading-relaxed">
                        {t("security_flow.pin_intro_desc")}
                      </p>
                    </div>
                    <button
                      onClick={() =>
                        setSecurityQueue({
                          type: "pin_setup",
                          resolve: securityQueue.resolve,
                        })
                      }
                      className="w-full theme-primary-bg text-white py-5 rounded-3xl font-black shadow-xl flex items-center justify-center gap-3 active:scale-95 transition-all uppercase tracking-widest"
                    >
                      {t("security_flow.pin_setup_btn")}{" "}
                      <ChevronRight size={20} />
                    </button>
                  </div>
                </Modal>
              )}

              {securityQueue?.type === "pin_setup" && (
                <PinOverlay
                  mode="setup"
                  onSuccess={async (p) => {
                    try {
                      await api.setupPin(p);
                      setHasPin(true);
                      localStorage.setItem("piyes-app-pin", "true");
                      setSecurityQueue(null);
                      if (securityQueue.resolve) securityQueue.resolve(p);
                    } catch (err) {
                      showToast(
                        "Erreur lors de la configuration du PIN",
                        "error",
                      );
                    }
                  }}
                  onCancel={() => setSecurityQueue(null)}
                />
              )}

              {securityQueue?.type === "pin_verify" && (
                <PinOverlay
                  mode="verify"
                  onSuccess={(p) => {
                    setSecurityQueue(null);
                    if (securityQueue.resolve) securityQueue.resolve(p);
                  }}
                  onCancel={() => setSecurityQueue(null)}
                  onForgot={handleForgotPin}
                />
              )}

              {securityQueue?.type === "welcome" && (
                <Modal
                  isOpen={true}
                  onClose={() => setSecurityQueue(null)}
                  type="centered"
                >
                  <div className="p-10 space-y-8 text-center animate-in zoom-in duration-500">
                    <div className="w-24 h-24 bg-green-500 text-white rounded-[40px] flex items-center justify-center mx-auto shadow-2xl animate-bounce">
                      <PartyPopper size={48} />
                    </div>
                    <div className="space-y-2">
                      <h3 className="text-2xl font-black theme-text-main">
                        {t("security_flow.welcome_title")}
                      </h3>
                      <p className="text-sm theme-text-secondary">
                        {t("security_flow.welcome_desc")}
                      </p>
                    </div>
                    <button
                      onClick={() => setSecurityQueue(null)}
                      className="w-full theme-primary-bg text-white py-4 rounded-2xl font-bold shadow-lg"
                    >
                      {t("security_flow.welcome_btn")}
                    </button>
                  </div>
                </Modal>
              )}

              {/* Toast Notification Component */}
              {toast && (
                <div className="fixed top-14 left-1/2 -translate-x-1/2 w-[90%] max-w-sm z-200 animate-in slide-in-from-top duration-300">
                  <div className="bg-black/80 dark:bg-white/90 backdrop-blur-xl p-4 rounded-2xl shadow-2xl flex items-center gap-3 border border-white/10 dark:border-black/5">
                    <div
                      className={
                        toast.type === "error"
                          ? "text-red-500"
                          : toast.type === "success"
                            ? "text-green-500"
                            : "text-[#830AD1]"
                      }
                    >
                      {toast.type === "error" ? (
                        <AlertCircle size={20} />
                      ) : toast.type === "success" ? (
                        <CheckCircle size={20} />
                      ) : (
                        <Info size={20} />
                      )}
                    </div>
                    <p className="flex-1 text-xs font-bold text-white dark:text-black leading-tight">
                      {toast.message}
                    </p>
                    <button
                      onClick={() => setToast(null)}
                      className="text-white/40 dark:text-black/40 active:scale-90"
                    >
                      <X size={16} />
                    </button>
                  </div>
                </div>
              )}

              {/* Main App Content */}
              <ScrollToTop />
              <div className="flex flex-col min-h-screen theme-bg max-w-md mx-auto relative shadow-2xl">
                {/* --- PERSISTENT NETWORK STATUS BAR --- */}
                {!isOnline && (
                  <div className="w-full bg-red-600 text-white py-1.5 px-4 flex items-center justify-center gap-2 animate-in slide-in-from-top duration-500 z-160 shrink-0">
                    <WifiOff size={14} className="animate-pulse" />
                    <span className="text-[10px] font-black uppercase tracking-widest">
                      {t("common.no_internet")}
                    </span>
                  </div>
                )}
                {showBackOnlineBar && (
                  <div className="w-full bg-green-500 text-white py-1.5 px-4 flex items-center justify-center gap-2 animate-out slide-out-to-top duration-500 delay-2000 fill-mode-forwards z-160 shrink-0">
                    <Wifi size={14} />
                    <span className="text-[10px] font-black uppercase tracking-widest">
                      {t("common.back_online")}
                    </span>
                  </div>
                )}

                <main className="flex-1 relative">
                  <Routes>
                    {!user ? (
                      <>
                        <Route
                          path="/login"
                          element={<Login onLogin={handleLogin} />}
                        />
                        <Route
                          path="/forgot-password"
                          element={<ForgotPassword />}
                        />
                        <Route
                          path="/signup"
                          element={<Signup onSignup={handleSignup} />}
                        />
                        <Route
                          path="*"
                          element={<Navigate to="/login" replace />}
                        />
                      </>
                    ) : (
                      <>
                        <Route
                          path="/"
                          element={
                            <Dashboard user={user} onLogout={handleLogout} />
                          }
                        />
                        <Route path="/services" element={<ServicesMarket />} />
                        <Route
                          path="/marketplace/dashboard"
                          element={<MarketplaceDashboard />}
                        />
                        <Route
                          path="/marketplace/search"
                          element={<MarketplaceSearch />}
                        />
                        <Route path="/ad/:id" element={<AdDetail />} />
                        <Route path="/chat/:id" element={<ChatDetail />} />
                        <Route path="/messages" element={<MessagingHub />} />
                        <Route path="/keys" element={<KeysManagement />} />
                        <Route path="/cards" element={<CardsHub />} />
                        <Route
                          path="/request-payment"
                          element={<RequestPayment user={user} />}
                        />
                        <Route
                          path="/scheduler/create"
                          element={<SchedulerCreate />}
                        />
                        <Route
                          path="/settings"
                          element={
                            <Settings
                              user={user}
                              currentTheme={theme}
                              currentFontSize={fontSize}
                              onThemeChange={setTheme}
                              onFontSizeChange={setFontSize}
                              onLogout={handleLogout}
                            />
                          }
                        />
                        <Route
                          path="/security"
                          element={
                            <Security user={user} onLogout={handleLogout} />
                          }
                        />
                        <Route
                          path="/verification"
                          element={<Verification />}
                        />
                        <Route path="/advanced" element={<Advanced />} />
                        <Route
                          path="/privacy-settings"
                          element={<PrivacySettings />}
                        />
                        <Route path="/history" element={<History />} />
                        <Route
                          path="/bank-history/:accountId"
                          element={<BankHistory />}
                        />
                        <Route path="/report" element={<Report />} />
                        <Route
                          path="/verify-identity"
                          element={
                            <IdentityVerification
                              user={user}
                              onVerified={handleUpdateUser}
                            />
                          }
                        />
                        <Route
                          path="/transfer"
                          element={
                            <TransferFlow
                              user={user}
                              onUpdateUser={handleUpdateUser}
                            />
                          }
                        />
                        <Route
                          path="/international-transfer"
                          element={<InternationalProviders />}
                        />
                        <Route
                          path="/piyes-international"
                          element={
                            <InternationalTransfer
                              user={user}
                              onUpdateUser={handleUpdateUser}
                            />
                          }
                        />
                        <Route
                          path="/deposit"
                          element={
                            <DepositFlow
                              user={user}
                              onUpdateUser={handleUpdateUser}
                            />
                          }
                        />
                        <Route
                          path="/withdraw"
                          element={
                            <WithdrawFlow
                              user={user}
                              onUpdateUser={handleUpdateUser}
                            />
                          }
                        />
                        <Route
                          path="/inter-bank-transfer"
                          element={
                            <InterBankTransfer
                              user={user}
                              onUpdateUser={handleUpdateUser}
                            />
                          }
                        />
                        <Route path="/recharge" element={<MobileRecharge />} />
                        <Route
                          path="/contacts"
                          element={<Contacts user={user} />}
                        />
                        <Route
                          path="/contact-detail/:contactId"
                          element={<ContactDetail user={user} />}
                        />
                        <Route
                          path="/transfer-interactions"
                          element={<TransferInteractions />}
                        />
                        <Route
                          path="/receipt/:id"
                          element={<ReceiptDetail />}
                        />
                        <Route path="/tools" element={<FinancialTools />} />
                        <Route
                          path="/scheduler"
                          element={<ScheduledPayments />}
                        />
                        <Route path="/promotions" element={<Promotions />} />
                        <Route path="/plans" element={<Plans />} />
                        <Route
                          path="/profile"
                          element={
                            <Profile
                              user={user}
                              onUpdate={handleUpdateUser}
                              onLogout={handleLogout}
                            />
                          }
                        />
                        <Route
                          path="/identity-hub"
                          element={
                            <IdentityHub
                              user={user}
                              onUpdate={handleUpdateUser}
                            />
                          }
                        />
                        <Route
                          path="/notifications"
                          element={<Notifications />}
                        />
                        <Route
                          path="/notifications/settings"
                          element={<NotificationsSettings />}
                        />
                        <Route path="/help" element={<HelpCenter />} />
                        <Route path="/support" element={<Support />} />
                        <Route path="/feedback" element={<Feedback />} />
                        <Route path="/about" element={<Legal type="about" />} />
                        <Route path="/terms" element={<Legal type="terms" />} />
                        <Route
                          path="/privacy"
                          element={<Legal type="privacy" />}
                        />
                        <Route path="*" element={<Navigate to="/" replace />} />
                      </>
                    )}
                  </Routes>
                </main>
                {user && !isLocked && <BottomNav />}
              </div>
            </SyncContext.Provider>
          </SecurityContext.Provider>
        </ToastContext.Provider>
      </ThemeContext.Provider>
    </LanguageContext.Provider>
  );
};

export default App;
