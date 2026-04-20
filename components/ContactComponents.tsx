// components/ContactComponents.tsx

import React, { useState } from "react";
import { useTranslation } from "@/App";
import { motion, AnimatePresence } from "motion/react";
import {
  Star,
  CheckCircle,
  ChevronRight,
  ChevronDown,
  User as UserIcon,
} from "lucide-react";
import { Contact, getInitials } from "@/shared/types";

interface ContactItemProps {
  contact: Contact;
  variant?: "circle" | "list";
  onToggleFavorite?: (e: React.MouseEvent) => void;
  onClick?: () => void;
}

export const ContactItem: React.FC<ContactItemProps> = ({
  contact,
  variant = "circle",
  onToggleFavorite,
  onClick,
}) => {
  const { t } = useTranslation();
  const initials = getInitials(contact.name);
  const firstName = contact.name.split(" ")[0];

  if (variant === "list") {
    return (
      <div
        onClick={onClick}
        className="flex items-center gap-4 p-4 hover:theme-bubble-bg/5 active:theme-bubble-bg transition-colors cursor-pointer"
      >
        <div className="relative">
          {contact.avatarUrl ? (
            <img
              src={contact.avatarUrl}
              alt={contact.name}
              className="w-12 h-12 rounded-full object-cover border theme-border"
              referrerPolicy="no-referrer"
            />
          ) : (
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center text-white font-bold">
              {initials}
            </div>
          )}
          {contact.isVerified && (
            <div className="absolute -bottom-1 -right-1 bg-white rounded-full p-0.5 shadow-sm">
              <CheckCircle size={14} className="text-blue-500 fill-blue-500" />
            </div>
          )}
        </div>
        <div className="flex-1">
          <p className="font-bold theme-text-main">{contact.name}</p>
          <p className="text-xs theme-text-secondary">
            {contact.tag ||
              contact.phone ||
              contact.email ||
              t("common.piyes_contact")}
          </p>
        </div>
        {onToggleFavorite && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onToggleFavorite(e);
            }}
            className="p-2"
          >
            <Star
              size={20}
              className={
                contact.isFavorite
                  ? "text-yellow-500 fill-yellow-500"
                  : "text-gray-300"
              }
            />
          </button>
        )}
      </div>
    );
  }

  return (
    <div
      onClick={onClick}
      className="flex flex-col items-center gap-2 min-w-[80px] cursor-pointer group"
    >
      <div className="relative">
        {contact.avatarUrl ? (
          <img
            src={contact.avatarUrl}
            alt={contact.name}
            className="w-16 h-16 rounded-full object-cover border-2 theme-border group-active:scale-95 transition-transform"
            referrerPolicy="no-referrer"
          />
        ) : (
          <div className="w-16 h-16 rounded-full bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center text-white font-bold text-xl group-active:scale-95 transition-transform">
            {initials}
          </div>
        )}

        {/* Favorite Star */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            onToggleFavorite?.(e);
          }}
          className="absolute -top-1 -left-1 bg-white/80 backdrop-blur-sm rounded-full p-1 shadow-sm border theme-border"
        >
          <Star
            size={14}
            className={
              contact.isFavorite
                ? "text-yellow-500 fill-yellow-500"
                : "text-gray-400"
            }
          />
        </button>

        {/* Verified Icon */}
        {contact.isVerified && (
          <div className="absolute -bottom-1 -right-1 bg-white rounded-full p-0.5 shadow-sm border theme-border">
            <CheckCircle size={14} className="text-blue-500 fill-blue-500" />
          </div>
        )}
      </div>
      <p className="text-xs font-bold theme-text-main text-center truncate w-full px-1">
        {firstName}
      </p>
    </div>
  );
};

interface ContactSectionProps {
  title: string;
  contacts: Contact[];
  type: "favoris" | "recents" | "all";
  onExpand?: () => void;
  onContactClick: (contact: Contact) => void;
  onToggleFavorite?: (contact: Contact) => void;
}

export const ContactSection: React.FC<ContactSectionProps> = ({
  title,
  contacts,
  type,
  onExpand,
  onContactClick,
  onToggleFavorite,
}) => {
  const { t } = useTranslation();
  const [isCollapsed, setIsCollapsed] = useState(false);

  if (contacts.length === 0 && type !== "all") return null;

  return (
    <div className="mb-6">
      <div
        className="flex items-center justify-between px-6 mb-4 cursor-pointer"
        onClick={() => setIsCollapsed(!isCollapsed)}
      >
        <div className="flex items-center gap-2">
          <h3 className="text-[11px] font-bold theme-text-secondary uppercase tracking-[0.2em]">
            {title}
          </h3>
          <ChevronDown
            size={14}
            className={`theme-text-secondary transition-transform ${isCollapsed ? "-rotate-90" : ""}`}
          />
        </div>
        {onExpand && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onExpand();
            }}
            className="theme-primary-text"
          >
            <ChevronRight size={20} />
          </button>
        )}
      </div>

      <AnimatePresence>
        {!isCollapsed && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            {type === "all" ? (
              <div className="theme-bubble-bg rounded-4xl overflow-hidden border theme-border mx-4">
                {contacts.length === 0 ? (
                  <div className="p-8 text-center">
                    <UserIcon
                      size={40}
                      className="mx-auto mb-2 text-gray-300"
                    />
                    <p className="text-sm theme-text-secondary">
                      {t("contacts.no_results")}
                    </p>
                  </div>
                ) : (
                  contacts.map((contact) => (
                    <ContactItem
                      key={contact.id}
                      contact={contact}
                      variant="list"
                      onClick={() => onContactClick(contact)}
                      onToggleFavorite={() => onToggleFavorite?.(contact)}
                    />
                  ))
                )}
              </div>
            ) : (
              <div className="flex gap-4 overflow-x-auto px-6 pb-2 no-scrollbar">
                {contacts.map((contact) => (
                  <ContactItem
                    key={contact.id}
                    contact={contact}
                    onClick={() => onContactClick(contact)}
                    onToggleFavorite={() => onToggleFavorite?.(contact)}
                  />
                ))}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
