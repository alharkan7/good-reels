'use client';

import { createContext, useContext, ReactNode } from 'react';

type Lang = 'id' | 'en';

interface LanguageContextType {
  lang: Lang;
  setLang: (l: Lang) => void;
  toggleLang: () => void;
}

const LanguageContext = createContext<LanguageContextType>({
  lang: 'id',
  setLang: () => {},
  toggleLang: () => {},
});

export const LanguageProvider = ({ 
  children, 
  lang, 
  toggleLang, 
  setLang 
}: { 
  children: ReactNode, 
  lang: Lang, 
  toggleLang: () => void, 
  setLang: (l: Lang) => void 
}) => {
  return (
    <LanguageContext.Provider value={{ lang, toggleLang, setLang }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => useContext(LanguageContext);
