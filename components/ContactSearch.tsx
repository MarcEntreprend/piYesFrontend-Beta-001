// components/ContactSearch.tsx 

import React, { useState, useEffect } from "react";
import { useTranslation } from "@/App";
import { Search, X, UserPlus, CheckCircle, AlertCircle } from "lucide-react";
import { Contact, getInitials, User } from "@/shared/types";
import {
  isOwnKey,
  getRecipientType,
  RecipientType,
} from "@/shared/recipientUtils";

interface ContactSearchProps {
  contacts: Contact[];
  onSelect: (contact: Partial<Contact>) => void;
  placeholder?: string;
  autoFocus?: boolean;
  query: string;
  setQuery: (query: string) => void;
  currentUser?: User | null;
}

export const ContactSearch: React.FC<ContactSearchProps> = ({
  contacts,
  onSelect,
  placeholder,
  autoFocus = false,
  query,
  setQuery,
  currentUser,
}) => {
  const { t } = useTranslation();
  const [results, setResults] = useState<Contact[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      setIsSearching(false);
      return;
    }

    setIsSearching(true);
    const q = query.toLowerCase().trim();

    // Search in local contacts
    const filtered = contacts.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        c.tag?.toLowerCase().includes(q) ||
        c.phone?.includes(q) ||
        c.email?.toLowerCase().includes(q) ||
        c.randomKey?.toLowerCase().includes(q),
    );

    setResults(filtered);
  }, [query, contacts]);

  const handleClear = () => {
    setQuery("");
    setResults([]);
  };

  const isNewRecipient = query.trim().length > 0 && results.length === 0;
  const showResults = query.trim().length > 0;
  const isSelf = isOwnKey(query, currentUser);
  const recipientType = getRecipientType(query);
  const hasSpace = query.trim().includes(" ");
  const isInvalidWithSpace = isNewRecipient && hasSpace;

  return (
    <div className="relative w-full px-6 mb-6">
      <div className="relative">
        <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
          <Search size={20} className="theme-text-secondary" />
        </div>
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={placeholder || t("contacts.add_info_label")}
          autoFocus={autoFocus}
          className="w-full h-14 pl-12 pr-12 theme-bubble-bg border theme-border rounded-2xl theme-text-main focus:outline-none focus:ring-2 focus:ring-purple-500/20 transition-all shadow-sm"
        />
        {query && (
          <button
            onClick={handleClear}
            className="absolute inset-y-0 right-4 flex items-center"
          >
            <X size={20} className="theme-text-secondary" />
          </button>
        )}
      </div>

      {showResults && (
        <div className="absolute left-6 right-6 mt-2 theme-bubble-bg border theme-border rounded-2xl shadow-xl z-50 overflow-hidden max-h-100 overflow-y-auto no-scrollbar">
          {results.map((contact) => {
            const isContactSelf = isOwnKey(
              contact.tag ||
              contact.phone ||
              contact.email ||
              contact.randomKey ||
              "",
              currentUser,
            );
            return (
              <div
                key={contact.id}
                onClick={() => {
                  if (!isContactSelf) {
                    onSelect(contact);
                  }
                }}
                className={`flex items-center gap-4 p-4 hover:bg-black/5 active:bg-black/10 transition-colors cursor-pointer border-b theme-border last:border-0 ${isContactSelf ? "opacity-50 cursor-not-allowed" : ""}`}
              >
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm ${isContactSelf ? "bg-red-100 text-red-500" : "bg-linear-to-br from-purple-500 to-indigo-600 text-white"}`}
                >
                  {contact.avatarUrl ? (
                    <img
                      src={contact.avatarUrl}
                      alt={contact.name}
                      className="w-full h-full rounded-full object-cover"
                      referrerPolicy="no-referrer"
                    />
                  ) : (
                    getInitials(contact.name)
                  )}
                </div>
                <div className="flex-1">
                  <p
                    className={`font-bold text-sm ${isContactSelf ? "text-red-500" : "theme-text-main"}`}
                  >
                    {contact.tag ||
                      contact.phone ||
                      contact.email ||
                      contact.randomKey}
                  </p>
                  <p
                    className={`text-xs ${isContactSelf ? "text-red-500" : "theme-text-secondary"}`}
                  >
                    {contact.name}
                  </p>
                  {isContactSelf && (
                    <p className="text-[9px] font-black text-red-500 uppercase tracking-tighter">
                      {t("transfer.is_your_key")}
                    </p>
                  )}
                </div>
                {contact.isVerified && !isContactSelf && (
                  <CheckCircle
                    size={16}
                    className="text-blue-500 fill-blue-500"
                  />
                )}
                {isContactSelf && (
                  <AlertCircle size={16} className="text-red-500" />
                )}
              </div>
            );
          })}

          {isNewRecipient && (
            <div
              onClick={() => {
                if (!isSelf && !isInvalidWithSpace) {
                  const contactData: Partial<Contact> = {};
                  const cleanQuery = query.trim();
                  if (recipientType === RecipientType.EMAIL)
                    contactData.email = cleanQuery;
                  else if (recipientType === RecipientType.PHONE)
                    contactData.phone = cleanQuery;
                  else if (recipientType === RecipientType.TAG)
                    contactData.tag = cleanQuery;
                  else if (recipientType === RecipientType.RANDOM_KEY)
                    contactData.randomKey = cleanQuery;
                  else contactData.tag = cleanQuery;

                  onSelect(contactData);
                }
              }}
              className={`flex items-center gap-4 p-4 hover:bg-black/5 active:bg-black/10 transition-colors cursor-pointer ${isSelf || isInvalidWithSpace ? "opacity-50 cursor-not-allowed" : ""}`}
            >
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm ${isSelf || isInvalidWithSpace ? "bg-red-100 text-red-500" : "bg-gray-100 dark:bg-gray-800 text-gray-400"}`}
              >
                {getInitials(query)}
              </div>
              <div className="flex-1">
                <p
                  className={`font-bold text-sm ${isSelf || isInvalidWithSpace ? "text-red-500" : "theme-text-main"}`}
                >
                  {query}
                </p>
                <p
                  className={`text-xs font-bold uppercase tracking-wider ${isSelf || isInvalidWithSpace ? "text-red-500" : "text-purple-500"}`}
                >
                  {isSelf
                    ? t("transfer.is_your_key")
                    : isInvalidWithSpace
                      ? t("contacts.check_recipient")
                      : t("contacts.new_recipient")}
                </p>
              </div>
              {isSelf || isInvalidWithSpace ? (
                <AlertCircle size={18} className="text-red-500" />
              ) : (
                <UserPlus size={18} className="text-purple-500" />
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
