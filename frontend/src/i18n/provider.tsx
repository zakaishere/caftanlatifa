"use client";

import { createContext, useContext } from 'react';

type Dictionary = Record<string, any>;

const I18nContext = createContext<{ dictionary: Dictionary; locale: string } | null>(null);

export function I18nProvider({ 
  dictionary, 
  locale,
  children 
}: { 
  dictionary: Dictionary; 
  locale: string;
  children: React.ReactNode 
}) {
  return (
    <I18nContext.Provider value={{ dictionary, locale }}>
      {children}
    </I18nContext.Provider>
  );
}

export function useTranslation() {
  const context = useContext(I18nContext);
  
  if (!context) {
    throw new Error('useTranslation must be used within I18nProvider');
  }

  const { dictionary, locale } = context;

  const t = (key: string, variables?: Record<string, string | number>) => {
    const translation = key.split('.').reduce((obj, k) => (obj || {})[k], dictionary);
    
    if (translation === undefined) return key;

    let result = String(translation);
    
    if (variables) {
      Object.keys(variables).forEach((variableKey) => {
        result = result.replace(`{${variableKey}}`, String(variables[variableKey]));
      });
    }

    return result;
  };

  return { t, locale };
}
