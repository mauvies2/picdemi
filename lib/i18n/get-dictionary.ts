import type enDict from '@/dictionaries/en.json';
import type { Locale } from './config';

export type Dictionary = typeof enDict;

export async function getDictionary(locale: Locale): Promise<Dictionary> {
  return import(`@/dictionaries/${locale}.json`).then((m) => m.default);
}
