import React, { useState, useEffect, useCallback, useMemo } from "react";
import {
  Search,
  X,
  UserPlus,
  UserMinus,
  CheckCircle,
  ChevronRight,
  Loader2,
  AlertCircle,
} from "lucide-react";
import { api } from "../services/apiService";
import { User, Contact, getInitials } from "../shared/types";
import { useTranslation } from "../App";
import {
  isOwnKey,
  getRecipientType,
  RecipientType,
} from "../shared/recipientUtils";

interface SearchInputProps {
  contacts: Contact[];
  onSelect: (user: Partial<User> | Contact) => void;
  onContactChange?: () => void;
  onQueryChange?: (query: string) => void;
  placeholder?: string;
  autoFocus?: boolean;
  currentUser?: User | null;
}

const SearchInput: React.FC<SearchInputProps> = ({
  contacts,
  onSelect,
  onContactChange,
  onQueryChange,
  placeholder,
  autoFocus = false,
  currentUser,
}) => {
  const { t } = useTranslation();
  const [query, setQuery] = useState("");
  const [globalResults, setGlobalResults] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [isFocused, setIsFocused] = useState(false);

  useEffect(() => {
    if (onQueryChange) {
      onQueryChange(query);
    }
  }, [query, onQueryChange]);

  // Search logic for local contacts
  const localResults = useMemo(() => {
    if (!query.trim()) return [];
    const q = query.toLowerCase();

    return contacts.filter((c) => {
      const nameMatch = c.name.toLowerCase().includes(q);
      const tagMatch = c.tag?.toLowerCase().includes(q);
      const phoneMatch = c.phone?.toLowerCase().includes(q);
      const emailMatch = c.email?.toLowerCase().includes(q);
      const randomKeyMatch = c.randomKey?.toLowerCase().includes(q);

      if (q.startsWith("@")) {
        const tagQ = q.substring(1);
        return c.tag?.toLowerCase().includes(tagQ);
      } else if (q.startsWith("+")) {
        const phoneQ = q.substring(1);
        return c.phone?.toLowerCase().includes(phoneQ);
      } else if (/^\d+$/.test(q)) {
        return phoneMatch;
      } else if (q.includes("@")) {
        return emailMatch;
      }
      return (
        nameMatch || tagMatch || phoneMatch || emailMatch || randomKeyMatch
      );
    });
  }, [contacts, query]);

  // Global search with debounce
  useEffect(() => {
    if (query.length < 2) {
      setGlobalResults([]);
      return;
    }

    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const results = await api.searchUsers(query);
        // Filter out users who are already in contacts
        const filteredGlobal = results.filter(
          (u) =>
            !contacts.some(
              (c) =>
                c.contactUserId === u.id ||
                c.tag === u.tag ||
                c.phone === u.phone ||
                c.email === u.email,
            ),
        );
        setGlobalResults(filteredGlobal);
      } catch (error) {
        console.error("Global search error:", error);
      } finally {
        setLoading(false);
      }
    }, 400);

    return () => clearTimeout(timer);
  }, [query, contacts]);

  const handleAddContact = async (user: User) => {
    try {
      await api.saveContact({
        contactUserId: user.id,
        name: user.name,
        tag: user.tag,
        phone: user.phone,
        email: user.email,
        avatarUrl: user.avatarUrl,
        isVerified: user.verificationStatus === "verified",
      });
      if (onContactChange) onContactChange();
    } catch (error) {
      console.error("Add contact error:", error);
    }
  };

  const highlightMatch = (text: string, q: string) => {
    if (!q || !text) return text;
    const parts = text.split(new RegExp(`(${q})`, "gi"));
    return (
      <span>
        {parts.map((part, i) =>
          part.toLowerCase() === q.toLowerCase() ? (
            <span key={i} className="theme-primary-text font-black">
              {part}
            </span>
          ) : (
            part
          ),
        )}
      </span>
    );
  };

  const isNewRecipient =
    query.length >= 2 &&
    localResults.length === 0 &&
    globalResults.length === 0 &&
    !loading;
  const isSelf = useMemo(
    () => isOwnKey(query, currentUser),
    [query, currentUser],
  );
  const recipientType = useMemo(() => getRecipientType(query), [query]);
  const hasSpace = query.trim().includes(" ");
  const isInvalidWithSpace = isNewRecipient && hasSpace;

  return (
    <div className="relative w-full">
      <div
        className={`relative flex items-center transition-all duration-300 ${isFocused ? "scale-[1.02]" : ""}`}
      >
        <Search
          className={`absolute left-4 transition-colors ${isFocused ? "theme-primary-text" : "theme-text-secondary opacity-40"}`}
          size={20}
        />
        <input
          autoFocus={autoFocus}
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setTimeout(() => setIsFocused(false), 200)}
          placeholder={placeholder || t("contacts.search_placeholder")}
          className="w-full theme-bubble-bg rounded-2xl py-4 pl-12 pr-12 theme-text-main outline-none border-2 border-transparent focus:border-(--primary-color) transition-all font-bold shadow-sm"
        />
        {query && (
          <button
            onClick={() => setQuery("")}
            className="absolute right-4 p-1 theme-bubble-bg rounded-full theme-text-secondary hover:theme-primary-text transition-colors"
          >
            <X size={16} />
          </button>
        )}
      </div>

      {/* Results Dropdown */}
      {query.length >= 1 && isFocused && (
        <div className="absolute top-full left-0 right-0 mt-2 theme-card-bg border theme-border rounded-4xl shadow-2xl z-50 max-h-[60vh] overflow-y-auto no-scrollbar animate-in fade-in slide-in-from-top-2 duration-200">
          {/* Contacts Section */}
          {localResults.length > 0 && (
            <div className="p-2">
              <h3 className="px-4 py-2 text-[10px] font-black theme-text-secondary uppercase tracking-widest">
                {t("contacts.all_title")}
              </h3>
              {localResults.map((contact) => {
                const isContactSelf = isOwnKey(
                  contact.tag ||
                    contact.phone ||
                    contact.email ||
                    contact.randomKey ||
                    "",
                  currentUser,
                );
                return (
                  <button
                    key={contact.id}
                    onClick={() => !isContactSelf && onSelect(contact)}
                    className={`w-full flex items-center justify-between p-4 rounded-2xl hover:theme-bubble-bg transition-all group text-left ${isContactSelf ? "opacity-50 cursor-not-allowed" : ""}`}
                  >
                    <div className="flex items-center gap-4">
                      <div
                        className={`w-12 h-12 theme-bubble-bg rounded-full flex items-center justify-center font-bold text-sm border theme-border overflow-hidden ${isContactSelf ? "border-red-500 text-red-500" : "theme-primary-text"}`}
                      >
                        {contact.avatarUrl ? (
                          <img
                            src={contact.avatarUrl}
                            alt=""
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          getInitials(contact.name)
                        )}
                      </div>
                      <div>
                        <p
                          className={`text-[10px] font-bold ${isContactSelf ? "text-red-500" : "theme-text-secondary"}`}
                        >
                          {highlightMatch(
                            contact.tag ||
                              contact.phone ||
                              contact.email ||
                              contact.randomKey ||
                              "",
                            query,
                          )}
                        </p>
                        <p
                          className={`font-bold text-sm uppercase ${isContactSelf ? "text-red-500" : "theme-text-main"}`}
                        >
                          {highlightMatch(contact.name, query)}
                        </p>
                        {isContactSelf && (
                          <p className="text-[9px] font-black text-red-500 uppercase tracking-tighter">
                            {t("transfer.is_your_key")}
                          </p>
                        )}
                      </div>
                    </div>
                    {!isContactSelf && (
                      <ChevronRight
                        size={18}
                        className="theme-text-secondary opacity-20 group-hover:opacity-100 transition-opacity"
                      />
                    )}
                  </button>
                );
              })}
            </div>
          )}

          {/* Global Search Section */}
          {(globalResults.length > 0 || loading) && (
            <div className="p-2 border-t theme-border">
              <div className="px-4 py-2 flex items-center justify-between">
                <h3 className="text-[10px] font-black theme-text-secondary uppercase tracking-widest">
                  Réseau piYès
                </h3>
                {loading && (
                  <Loader2
                    size={14}
                    className="animate-spin theme-primary-text"
                  />
                )}
              </div>

              {globalResults.map((user) => {
                const isUserSelf = user.id === currentUser?.id;
                return (
                  <div
                    key={user.id}
                    className={`w-full flex items-center justify-between p-4 rounded-2xl hover:theme-bubble-bg transition-all group ${isUserSelf ? "opacity-50" : ""}`}
                  >
                    <button
                      onClick={() => !isUserSelf && onSelect(user)}
                      className={`flex-1 flex items-center gap-4 text-left ${isUserSelf ? "cursor-not-allowed" : ""}`}
                    >
                      <div
                        className={`w-12 h-12 theme-bubble-bg rounded-full flex items-center justify-center font-bold text-sm border theme-border overflow-hidden ${isUserSelf ? "border-red-500 text-red-500" : "theme-primary-text"}`}
                      >
                        {user.avatarUrl ? (
                          <img
                            src={user.avatarUrl}
                            alt=""
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          getInitials(user.name)
                        )}
                      </div>
                      <div>
                        <div className="flex items-center gap-1.5">
                          <p
                            className={`text-[10px] font-bold ${isUserSelf ? "text-red-500" : "theme-text-secondary"}`}
                          >
                            {highlightMatch(
                              user.tag || user.phone || user.email || "",
                              query,
                            )}
                          </p>
                          {user.verificationStatus === "verified" && (
                            <CheckCircle size={14} className="text-blue-500" />
                          )}
                        </div>
                        <p
                          className={`font-bold text-sm uppercase ${isUserSelf ? "text-red-500" : "theme-text-main"}`}
                        >
                          {highlightMatch(user.name, query)}
                        </p>
                        {isUserSelf && (
                          <p className="text-[9px] font-black text-red-500 uppercase tracking-tighter">
                            {t("transfer.is_your_key")}
                          </p>
                        )}
                      </div>
                    </button>
                    {!isUserSelf && (
                      <button
                        onClick={() => handleAddContact(user)}
                        className="p-3 theme-bubble-bg theme-primary-text rounded-xl active:scale-90 transition-transform hover:bg-purple-500 hover:text-white"
                      >
                        <UserPlus size={18} />
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {/* New Recipient Section */}
          {isNewRecipient && (
            <div className="p-2 border-t theme-border">
              <button
                onClick={() => {
                  if (!isSelf && !isInvalidWithSpace) {
                    const contactData: Partial<Contact> = {
                      name: query.trim(),
                    };
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
                className={`w-full flex items-center justify-between p-4 rounded-2xl hover:theme-bubble-bg transition-all group text-left ${isSelf || isInvalidWithSpace ? "cursor-not-allowed" : ""}`}
              >
                <div className="flex items-center gap-4">
                  <div
                    className={`w-12 h-12 theme-bubble-bg rounded-full flex items-center justify-center font-bold text-sm border theme-border overflow-hidden ${isSelf || isInvalidWithSpace ? "border-red-500 text-red-500" : "theme-primary-text"}`}
                  >
                    {getInitials(query)}
                  </div>
                  <div>
                    <p
                      className={`text-[10px] font-bold ${isSelf || isInvalidWithSpace ? "text-red-500" : "theme-text-secondary"}`}
                    >
                      {query}
                    </p>
                    <p
                      className={`font-bold text-sm uppercase ${isSelf || isInvalidWithSpace ? "text-red-500" : "theme-text-main"}`}
                    >
                      {isSelf
                        ? t("transfer.is_your_key")
                        : isInvalidWithSpace
                          ? t("contacts.check_recipient")
                          : t("contacts.new_recipient")}
                    </p>
                  </div>
                </div>
                {!(isSelf || isInvalidWithSpace) && (
                  <ChevronRight
                    size={18}
                    className="theme-text-secondary opacity-20 group-hover:opacity-100 transition-opacity"
                  />
                )}
                {(isSelf || isInvalidWithSpace) && (
                  <AlertCircle size={18} className="text-red-500" />
                )}
              </button>
            </div>
          )}

          {!loading &&
            query.length >= 2 &&
            localResults.length === 0 &&
            globalResults.length === 0 &&
            !isNewRecipient && (
              <div className="py-8 text-center opacity-40 italic text-sm">
                Aucun résultat pour "{query}"
              </div>
            )}
        </div>
      )}
    </div>
  );
};

export default SearchInput;
