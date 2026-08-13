// src/i18n/LanguageContext.tsx
import { createContext, useContext, type ReactNode } from "react";
import { translations, type Language } from "./translations";

interface LanguageContextValue {
    language: Language;
}

const LanguageContext = createContext<LanguageContextValue>({ language: "fr" });

export function LanguageProvider({ children }: { children: ReactNode }) {
    return <LanguageContext.Provider value={{ language: "fr" }}>{children}</LanguageContext.Provider>;
}

export function useLanguageContext() {
    return useContext(LanguageContext);
}

export function useTranslation() {
    const { language } = useLanguageContext();
    return translations[language];
}