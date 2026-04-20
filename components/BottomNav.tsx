import React from "react";
/* Use react-router core for hooks as react-router-dom exports appear to be missing or mismatched in this environment */
import { useNavigate, useLocation } from "react-router";
import { NAV_ITEMS } from "../constants";
import { useTranslation } from "../App";
import { useNotifications } from "../hooks/useNotifications";
import { motion, AnimatePresence } from "motion/react";

const MAIN_ROUTES = [
  "/",
  "/services",
  "/keys",
  "/settings",
  "/profile",
  "/security",
  "/privacy-settings",
  "/verification",
  "/help",
  "/support",
  "/about",
  "/terms",
  "/privacy",
];

const BottomNav: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { t } = useTranslation();
  const { unreadCount } = useNotifications();

  const isExpanded = MAIN_ROUTES.includes(location.pathname);

  const handleNavClick = (route: string, id: string) => {
    const isCurrentlyOnRoute = location.pathname === route;

    if (isCurrentlyOnRoute) {
      // Second click logic: Dispatch specific reset events
      if (id === "home") {
        // ✅ Pour Dashboard : scroller vers le haut ET revenir au compte piYès
        window.scrollTo({ top: 0, behavior: "smooth" });
        window.dispatchEvent(new CustomEvent("piyes:switch_to_piyes"));
      } else if (id === "services") {
        window.dispatchEvent(new CustomEvent("piyes:reset_services"));
      } else if (id === "keys") {
        window.dispatchEvent(new CustomEvent("piyes:reset_settings"));
      }
    } else {
      // First click: Navigate normally
      navigate(route);
    }
  };

  return (
    <div className="fixed bottom-4 left-1/2 -translate-x-1/2 w-full max-w-md px-4 z-50 pointer-events-none flex justify-center">
      <motion.nav
        layout
        initial={false}
        animate={{
          width: isExpanded ? "100%" : "auto",
          paddingLeft: isExpanded ? "2rem" : "1.5rem",
          paddingRight: isExpanded ? "2rem" : "1.5rem",
        }}
        transition={{ type: "spring", stiffness: 400, damping: 30 }}
        className="theme-card-bg bg-opacity-80 dark:bg-opacity-80 backdrop-blur-xl border theme-border rounded-4xl py-3 flex justify-between items-center shadow-[0_10px_40px_-10px_rgba(0,0,0,0.2)] pointer-events-auto overflow-hidden"
      >
        <AnimatePresence initial={false}>
          {NAV_ITEMS.map((item) => {
            const isCenter = item.id === "home";
            const isActive = location.pathname === item.route;
            const isBoutique = item.id === "services";
            const isHome = item.id === "home";

            if (!isExpanded && !isCenter) return null;

            // Dynamic labels based on i18n keys
            const label =
              item.id === "home"
                ? t("nav.home")
                : item.id === "services"
                  ? t("nav.services")
                  : item.id === "keys"
                    ? t("nav.keys")
                    : item.label;

            return (
              <motion.button
                key={item.id}
                layout
                initial={{ opacity: 0, scale: 0.8, width: 0 }}
                animate={{ opacity: 1, scale: 1, width: "auto" }}
                exit={{ opacity: 0, scale: 0.8, width: 0 }}
                transition={{
                  opacity: { duration: 0.2 },
                  layout: { type: "spring", stiffness: 400, damping: 30 },
                  default: { type: "spring", stiffness: 400, damping: 30 },
                }}
                onClick={() => handleNavClick(item.route, item.id)}
                style={{
                  color: isActive ? "var(--nav-active)" : "var(--nav-inactive)",
                }}
                className="flex flex-col items-center gap-1 transition-colors active:scale-90 relative group whitespace-nowrap"
              >
                <div
                  className="transition-all duration-300 ease-out"
                  style={{
                    transform: isActive
                      ? "scale(1.1) translateY(-2px)"
                      : "scale(1)",
                    filter: isActive
                      ? "drop-shadow(0 0 8px var(--primary-color))"
                      : "none",
                  }}
                >
                  {item.icon}
                </div>
                <span
                  className={`text-[10px] font-bold tracking-tight transition-opacity duration-300 ${isActive ? "opacity-100" : "opacity-60 group-hover:opacity-100"}`}
                >
                  {label}
                </span>

                {/* Notification Badge on Home (Sync with Bell) */}
                {isHome && unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[7px] font-black w-4 h-4 flex items-center justify-center rounded-full border-2 border-white dark:border-gray-900 shadow-sm animate-pulse">
                    {unreadCount > 9 ? "9+" : unreadCount}
                  </span>
                )}

                {/* Message/Boutique Badge */}
                {isBoutique && (
                  <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[7px] font-black w-4 h-4 flex items-center justify-center rounded-full border-2 border-white dark:border-gray-900 shadow-sm animate-pulse">
                    3
                  </span>
                )}

                {isActive && (
                  <div className="absolute -bottom-1 w-1 h-1 bg-(--nav-active) rounded-full animate-in zoom-in duration-300"></div>
                )}
              </motion.button>
            );
          })}
        </AnimatePresence>
      </motion.nav>
    </div>
  );
};

export default BottomNav;
