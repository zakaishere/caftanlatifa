import 'server-only';
import type { Locale } from './config';

// We enumerate all dictionaries here for better webpack bundling
const dictionaries = {
  fr: () => import('./dictionaries/fr.json').then((module) => module.default),
  ar: () => import('./dictionaries/ar.json').then((module) => module.default),
};

export const getDictionary = async (locale: Locale) => {
  return dictionaries[locale]?.() ?? dictionaries.fr();
};
