"use client";

import { useLanguage } from "@/lib/language-context";
import { Globe } from "lucide-react";

export function LanguageSwitcher() {
  const { currentLanguage, setCurrentLanguage, languages, isLoading } = useLanguage();

  if (isLoading || languages.length === 0) {
    return null;
  }

  return (
    <div className="language-switcher">
      <button className="language-switcher-button" title="Change language">
        <Globe size={18} />
        <span className="language-code">{currentLanguage.toUpperCase()}</span>
      </button>
      <div className="language-switcher-menu">
        {languages.map((lang) => (
          <button
            key={lang.code}
            className={`language-option${currentLanguage === lang.code ? " active" : ""}`}
            onClick={() => setCurrentLanguage(lang.code)}
            title={`${lang.name} (${lang.nativeName})`}
          >
            <span className="language-native">{lang.nativeName}</span>
            <span className="language-english">({lang.name})</span>
          </button>
        ))}
      </div>
    </div>
  );
}
