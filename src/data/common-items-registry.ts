import type { ItemCategory } from '../core/schemas/item';
import commonItemsEn from './common-items.json';
import commonItemsHe from './common-items.he.json';
import commonItemsEs from './common-items.es.json';

export interface CommonItemBase {
  name: string;
  category: ItemCategory;
  subcategory?: string;
  unit: string;
}

export interface CommonItemEnriched extends CommonItemBase {
  id: string;
  aliases: string[];
  tags: string[];
}

const ITEMS_BY_LANG: Record<string, CommonItemBase[]> = {
  en: commonItemsEn as CommonItemEnriched[],
  he: commonItemsHe as CommonItemBase[],
  es: commonItemsEs as CommonItemBase[],
};

export function getCommonItems(language: string): CommonItemBase[] {
  return ITEMS_BY_LANG[language] ?? ITEMS_BY_LANG['en'];
}

export function getEnrichedItems(): CommonItemEnriched[] {
  return commonItemsEn as CommonItemEnriched[];
}
