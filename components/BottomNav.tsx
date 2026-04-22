// components\BottomNav.tsx

import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router";
import { NAV_ITEMS } from "../constants";
import { useTranslation } from "../App";
import { useNotifications } from "../hooks/useNotifications";
import { useMarketplaceBadges } from "../hooks/useMarketplaceBadges";
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
  const [touchStartX, setTouchStartX] = useState<number | null>(null); // État pour le swipe
  const marketplaceBadge = useMarketplaceBadges();
  const isExpanded = MAIN_ROUTES.includes(location.pathname);
  const [showSideItems, setShowSideItems] = React.useState(false);

  React.useEffect(() => {
    if (isExpanded) {
      //  Délai plus court pour correspondre au spring (stiffness 350, damping 35)
      const timer = setTimeout(() => setShowSideItems(true), 50);
      return () => clearTimeout(timer);
    } else {
      // Cacher immédiatement
      setShowSideItems(false);
    }
  }, [isExpanded]);

  const handleNavClick = (route: string, id: string) => {
    const isCurrentlyOnRoute = location.pathname === route;

    if (isCurrentlyOnRoute) {
      if (id === "home") {
        window.scrollTo({ top: 0, behavior: "smooth" });
        window.dispatchEvent(new CustomEvent("piyes:switch_to_piyes"));
      } else if (id === "services") {
        window.scrollTo({ top: 0, behavior: "smooth" });
        window.dispatchEvent(new CustomEvent("piyes:reset_services"));
      } else if (id === "keys") {
        window.scrollTo({ top: 0, behavior: "smooth" });
        window.dispatchEvent(new CustomEvent("piyes:reset_settings"));
      }
    } else {
      navigate(route);
    }
  };

  // Gestion du swipe
  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchStartX(e.touches[0].clientX);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!touchStartX) return;
    const deltaX = e.touches[0].clientX - touchStartX;
    if (Math.abs(deltaX) > 50) {
      const currentIndex = NAV_ITEMS.findIndex(
        item => item.route === location.pathname ||
          (item.id === 'home' && location.pathname === '/')
      );
      if (deltaX > 0 && currentIndex > 0) {
        navigate(NAV_ITEMS[currentIndex - 1].route);
      } else if (deltaX < 0 && currentIndex < NAV_ITEMS.length - 1) {
        navigate(NAV_ITEMS[currentIndex + 1].route);
      }
      setTouchStartX(null);
    }
  };

  const handleTouchEnd = () => setTouchStartX(null);

  const leftItems = NAV_ITEMS.filter((item) => item.id === "services");
  const centerItem = NAV_ITEMS.find((item) => item.id === "home");
  const rightItems = NAV_ITEMS.filter((item) => item.id === "keys");

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
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        transition={{
          type: "spring",
          stiffness: 350,
          damping: 35,
          mass: 1,
        }}
        style={{ height: "72px" }} //  Hauteur fixe
        className="relative theme-card-bg bg-opacity-80 dark:bg-opacity-80 backdrop-blur-xl border theme-border rounded-4xl py-3 flex justify-between items-center shadow-[0_10px_40px_-10px_rgba(0,0,0,0.2)] pointer-events-auto overflow-hidden"
      >
        {/* Zone gauche - Marketplace */}
        <div className="flex items-center justify-start gap-2">
          {showSideItems && (
            <AnimatePresence>
              {leftItems.map((item) => {
                const isActive = location.pathname === item.route;
                return (
                  <motion.button
                    key={item.id}
                    initial={{ opacity: 0, x: 10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -10 }}
                    transition={{ duration: 0.2 }}
                    onClick={() => handleNavClick(item.route, item.id)}
                    style={{
                      color: isActive
                        ? "var(--nav-active)"
                        : "var(--nav-inactive)",
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
                      {t("nav.services")}
                    </span>
                    {marketplaceBadge > 0 && (
                      <span className="absolute -top-1.5 -right-1.5 bg-red-500 text-white text-[7px] font-black w-4 h-4 flex items-center justify-center rounded-full border-2 border-white dark:border-gray-900 shadow-sm animate-pulse">
                        {marketplaceBadge > 9 ? "9+" : marketplaceBadge}
                      </span>
                    )}
                    {isActive && (
                      <div className="absolute -bottom-1 w-1 h-1 bg-(--nav-active) rounded-full"></div>
                    )}
                  </motion.button>
                );
              })}
            </AnimatePresence>
          )}
        </div>

        {/* Zone droite - Opérations */}
        <div className="flex items-center justify-end gap-2">
          {showSideItems && (
            <AnimatePresence>
              {rightItems.map((item) => {
                const isActive = location.pathname === item.route;
                return (
                  <motion.button
                    key={item.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 10 }}
                    transition={{ duration: 0.2 }}
                    onClick={() => handleNavClick(item.route, item.id)}
                    style={{
                      color: isActive
                        ? "var(--nav-active)"
                        : "var(--nav-inactive)",
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
                      {t("nav.keys")}
                    </span>
                    {isActive && (
                      <div className="absolute -bottom-1 w-1 h-1 bg-(--nav-active) rounded-full"></div>
                    )}
                  </motion.button>
                );
              })}
            </AnimatePresence>
          )}
        </div>

        {/*  Bouton central - Dashboard - POSITION ABSOLUE, parfaitement centré */}
        {centerItem && (
          <button
            onClick={() => handleNavClick(centerItem.route, centerItem.id)}
            style={{
              color:
                location.pathname === centerItem.route
                  ? "var(--nav-active)"
                  : "var(--nav-inactive)",
              position: "absolute",
              left: "50%",
              transform: "translateX(-50%)",
            }}
            className="flex flex-col items-center gap-1 transition-colors active:scale-90 relative group whitespace-nowrap"
          >
            <div
              className="transition-all duration-300 ease-out"
              style={{
                transform:
                  location.pathname === centerItem.route
                    ? "scale(1.1) translateY(-2px)"
                    : "scale(1)",
                filter:
                  location.pathname === centerItem.route
                    ? "drop-shadow(0 0 8px var(--primary-color))"
                    : "none",
              }}
            >
              {centerItem.icon}
            </div>
            <span
              className={`text-[10px] font-bold tracking-tight transition-opacity duration-300 ${location.pathname === centerItem.route ? "opacity-100" : "opacity-60 group-hover:opacity-100"}`}
            >
              {t("nav.home")}
            </span>
            {unreadCount > 0 && (
              <span className="absolute -top-1.5 -right-1.5 bg-red-500 text-white text-[7px] font-black w-4 h-4 flex items-center justify-center rounded-full border-2 border-white dark:border-gray-900 shadow-sm animate-pulse">
                {unreadCount > 9 ? "9+" : unreadCount}
              </span>
            )}
            {location.pathname === centerItem.route && (
              <div className="absolute -bottom-1 w-1 h-1 bg-(--nav-active) rounded-full"></div>
            )}
          </button>
        )}
      </motion.nav>
    </div>
  );
};

export default BottomNav;
