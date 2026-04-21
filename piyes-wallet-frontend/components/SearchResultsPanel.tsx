import React, { useEffect, useRef } from "react";
import { useNavigate } from "react-router";
import {
  ChevronRight,
  History,
  HelpCircle,
  Search,
  Clock,
  Info,
  X,
} from "lucide-react";
import * as Icons from "lucide-react";
import { useTranslation } from "../App";
import { SearchResult } from "../services/searchService";

interface SearchResultsPanelProps {
  isOpen: boolean;
  onClose: () => void;
  searchTerm: string;
  results: SearchResult[];
  onResultClick: (result: SearchResult) => void;
  recentSearches: string[];
  onRecentSearchClick: (query: string) => void;
  faqs: Array<{ q: string; a: string }>;
}

const SearchResultsPanel: React.FC<SearchResultsPanelProps> = ({
  isOpen,
  onClose,
  searchTerm,
  results,
  onResultClick,
  recentSearches,
  onRecentSearchClick,
  faqs,
}) => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const panelRef = useRef<HTMLDivElement>(null);

  const DynamicIcon = ({
    name,
    size = 18,
  }: {
    name: string;
    size?: number;
  }) => {
    const IconComp = (Icons as any)[name];
    return IconComp ? <IconComp size={size} /> : <Icons.Circle size={size} />;
  };

  const handleFaqClick = (index: number) => {
    onClose();
    navigate(`/help?scroll=faq-${index}`);
  };

  // Fermer sur Escape
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleEsc);
    return () => window.removeEventListener("keydown", handleEsc);
  }, [onClose]);

  return (
    <>
      {/* 
        BACKDROP : Flou plein écran "Full Viewport" (z-120)
        Défini en fixed inset-0 pour garantir qu'aucune marge ne subsiste.
      */}
      <div
        onClick={onClose}
        className={`fixed inset-0 bg-black/60 backdrop-blur-md z-[120] transition-all duration-500 ease-in-out cursor-pointer ${
          isOpen
            ? "opacity-100 visible"
            : "opacity-0 invisible pointer-events-none"
        }`}
      ></div>

      {/* 
        PANEL DE RÉSULTATS : Positionné au-dessus du flou (z-130)
        La largeur est contrainte par max-w-md et centrée horizontalement.
      */}
      <div
        className={`fixed top-[104px] left-1/2 -translate-x-1/2 w-full max-w-md px-6 z-[130] transition-all duration-500 ease-out ${
          isOpen
            ? "opacity-100 translate-y-0 visible scale-100"
            : "opacity-0 -translate-y-8 invisible scale-[0.98] pointer-events-none"
        }`}
      >
        <div
          ref={panelRef}
          className="theme-card-bg rounded-[40px] shadow-[0_32px_64px_-12px_rgba(0,0,0,0.6)] border theme-border overflow-hidden flex flex-col max-h-[70vh] ring-1 ring-white/10"
        >
          <div className="overflow-y-auto no-scrollbar py-4">
            {searchTerm ? (
              // --- ÉTAT : RÉSULTATS DE RECHERCHE ---
              results.length > 0 ? (
                <div className="divide-y theme-border divide-opacity-40">
                  {results.map((result) => (
                    <button
                      key={result.id}
                      onClick={() => onResultClick(result)}
                      className="w-full flex items-center justify-between px-6 py-4.5 hover:theme-bubble-bg transition-colors text-left group"
                    >
                      <div className="flex items-center gap-4">
                        <div className="w-11 h-11 theme-bubble-bg rounded-2xl flex items-center justify-center theme-primary-text border theme-border shadow-sm group-hover:scale-110 transition-transform duration-300">
                          <DynamicIcon name={result.iconName} size={20} />
                        </div>
                        <div>
                          <p className="font-bold theme-text-main text-sm leading-tight group-hover:theme-primary-text transition-colors">
                            {result.title}
                          </p>
                          <p className="text-[9px] font-black theme-text-secondary uppercase tracking-[0.15em] opacity-50 mt-0.5">
                            {result.category}
                          </p>
                        </div>
                      </div>
                      <ChevronRight
                        size={16}
                        className="theme-text-secondary opacity-20 group-hover:opacity-100 group-hover:translate-x-1 transition-all"
                      />
                    </button>
                  ))}
                </div>
              ) : (
                <div className="py-20 text-center space-y-4 opacity-40 px-10 animate-in fade-in duration-300">
                  <div className="w-20 h-20 theme-bubble-bg rounded-full flex items-center justify-center mx-auto mb-2">
                    <Search
                      size={32}
                      className="theme-text-main"
                      strokeWidth={1.5}
                    />
                  </div>
                  <p className="text-sm font-bold theme-text-main">
                    Aucun résultat pour "{searchTerm}"
                  </p>
                  <p className="text-[10px] theme-text-secondary uppercase tracking-widest leading-relaxed">
                    Vérifiez l'orthographe ou essayez un mot-clé plus général
                  </p>
                </div>
              )
            ) : (
              // --- ÉTAT : VIDE (RÉCENTS + FAQS) ---
              <div className="animate-in fade-in duration-500">
                {recentSearches.length > 0 && (
                  <section className="py-2">
                    <div className="px-6 mb-4 flex items-center gap-2">
                      <History
                        size={14}
                        className="theme-text-secondary opacity-40"
                      />
                      <h4 className="text-[10px] font-black theme-text-secondary uppercase tracking-[0.2em]">
                        Recherches récentes
                      </h4>
                    </div>
                    <div className="space-y-1">
                      {recentSearches.map((query, i) => (
                        <button
                          key={i}
                          onClick={() => onRecentSearchClick(query)}
                          className="w-full flex items-center justify-between px-6 py-3.5 hover:theme-bubble-bg transition-colors text-left group"
                        >
                          <div className="flex items-center gap-4">
                            <Clock
                              size={16}
                              className="theme-text-secondary opacity-30 group-hover:theme-primary-text transition-colors"
                            />
                            <span className="text-sm font-bold theme-text-main group-hover:theme-primary-text transition-colors">
                              {query}
                            </span>
                          </div>
                          <ChevronRight
                            size={14}
                            className="opacity-0 group-hover:opacity-20 transition-opacity"
                          />
                        </button>
                      ))}
                    </div>
                  </section>
                )}

                <section
                  className={`py-4 ${recentSearches.length > 0 ? "mt-4 border-t theme-border pt-6" : ""}`}
                >
                  <div className="px-6 mb-5 flex items-center gap-2">
                    <HelpCircle
                      size={14}
                      className="theme-text-secondary opacity-40"
                    />
                    <h4 className="text-[10px] font-black theme-text-secondary uppercase tracking-[0.2em]">
                      Questions fréquentes
                    </h4>
                  </div>
                  <div className="space-y-2 px-2">
                    {faqs.map((faq, i) => (
                      <button
                        key={i}
                        onClick={() => handleFaqClick(i)}
                        className="w-full flex flex-col p-4 hover:theme-bubble-bg transition-all text-left group rounded-3xl border border-transparent hover:theme-border active:scale-[0.98]"
                      >
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 theme-bubble-bg rounded-xl flex items-center justify-center theme-primary-text shrink-0 border theme-border shadow-inner group-hover:scale-105 transition-transform duration-300">
                            <HelpCircle size={18} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <span className="text-sm font-bold theme-text-main block truncate group-hover:theme-primary-text transition-colors">
                              {faq.q}
                            </span>
                            <p className="text-[10px] theme-text-secondary truncate opacity-60 italic font-medium leading-relaxed">
                              "{faq.a}"
                            </p>
                          </div>
                          <ChevronRight
                            size={14}
                            className="theme-text-secondary opacity-10 group-hover:opacity-100 group-hover:translate-x-1 transition-all"
                          />
                        </div>
                      </button>
                    ))}
                  </div>
                </section>
              </div>
            )}
          </div>

          <div className="px-6 py-4 bg-gray-50/50 dark:bg-white/5 border-t theme-border flex items-center justify-center gap-2">
            <span className="text-[9px] font-black theme-text-secondary uppercase tracking-widest opacity-40">
              Appuyez sur Échap pour fermer
            </span>
          </div>
        </div>
      </div>
    </>
  );
};

export default SearchResultsPanel;
