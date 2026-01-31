'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';

type LanguageContextType = {
  currentLanguage: string;
  setCurrentLanguage: (lang: string) => void;
  languages: Array<{
    code: string;
    name: string;
    nativeName: string;
    isDefault: boolean;
  }>;
  isLoading: boolean;
};

const LanguageContext = createContext<LanguageContextType | undefined>(
  undefined,
);

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [currentLanguage, setCurrentLanguageState] = useState<string>('en');
  const [languages, setLanguages] = useState<
    Array<{
      code: string;
      name: string;
      nativeName: string;
      isDefault: boolean;
    }>
  >([]);
  const [isLoading, setIsLoading] = useState(true);

  // Load languages from API on mount
  useEffect(() => {
    async function loadLanguages() {
      try {
        const response = await fetch('/api/languages');
        const data = (await response.json()) as {
          languages: Array<{
            code: string;
            name: string;
            nativeName: string;
            isDefault: boolean;
          }>;
        };
        setLanguages(data.languages);

        // Get saved language from localStorage or use default
        const savedLang = localStorage.getItem('selectedLanguage');
        const defaultLang =
          data.languages.find((l) => l.isDefault)?.code ||
          data.languages[0]?.code ||
          'en';
        setCurrentLanguageState(savedLang || defaultLang);
      } catch (error) {
        console.error('Failed to load languages:', error);
        setLanguages([
          {
            code: 'en',
            name: 'English',
            nativeName: 'English',
            isDefault: true,
          },
          {
            code: 'bn',
            name: 'Bengali',
            nativeName: 'বাংলা',
            isDefault: false,
          },
          { code: 'zh', name: 'Chinese', nativeName: '中文', isDefault: false },
        ]);
        setCurrentLanguageState('en');
      } finally {
        setIsLoading(false);
      }
    }

    loadLanguages();
  }, []);

  const setCurrentLanguage = (lang: string) => {
    setCurrentLanguageState(lang);
    localStorage.setItem('selectedLanguage', lang);
  };

  return (
    <LanguageContext.Provider
      value={{ currentLanguage, setCurrentLanguage, languages, isLoading }}
    >
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within LanguageProvider');
  }
  return context;
}
