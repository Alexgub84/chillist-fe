import { describe, expect, it } from 'vitest';
import {
  SUPPORTED_LANGUAGES,
  LANGUAGE_META,
  type AppLanguage,
} from '../../../src/contexts/language-context';
import {
  getCommonItems,
  type CommonItemBase,
} from '../../../src/data/common-items-registry';
import i18n from '../../../src/i18n';

const VALID_CATEGORIES = ['food', 'equipment'];
const MIN_ITEMS_PER_LANG = 100;

describe('language selection completeness', () => {
  it('SUPPORTED_LANGUAGES has at least en and he', () => {
    expect(SUPPORTED_LANGUAGES).toContain('en');
    expect(SUPPORTED_LANGUAGES).toContain('he');
    expect(SUPPORTED_LANGUAGES.length).toBeGreaterThanOrEqual(2);
  });

  it('every supported language has metadata', () => {
    for (const lang of SUPPORTED_LANGUAGES) {
      const meta = LANGUAGE_META[lang];
      expect(meta, `missing LANGUAGE_META for "${lang}"`).toBeDefined();
      expect(meta.code).toBe(lang);
      expect(meta.nativeLabel.length).toBeGreaterThan(0);
      expect(meta.currencySymbol.length).toBeGreaterThan(0);
      expect(meta.currencyCode.length).toBe(3);
    }
  });

  it('every supported language has an i18n resource bundle', () => {
    for (const lang of SUPPORTED_LANGUAGES) {
      const bundle = i18n.getResourceBundle(lang, 'translation');
      expect(
        bundle,
        `i18n missing resource bundle for "${lang}"`
      ).toBeDefined();
      expect(
        Object.keys(bundle).length,
        `i18n bundle for "${lang}" is empty`
      ).toBeGreaterThan(0);
    }
  });

  it.each([...SUPPORTED_LANGUAGES])(
    'getCommonItems("%s") returns a non-empty array of valid items',
    (lang: AppLanguage) => {
      const items = getCommonItems(lang);
      expect(
        items.length,
        `common items for "${lang}" has fewer than ${MIN_ITEMS_PER_LANG} items`
      ).toBeGreaterThanOrEqual(MIN_ITEMS_PER_LANG);

      for (const item of items) {
        expect(
          item.name.length,
          `empty name in "${lang}" items`
        ).toBeGreaterThan(0);
        expect(
          VALID_CATEGORIES,
          `invalid category "${item.category}" in "${lang}" items`
        ).toContain(item.category);
        expect(
          item.unit.length,
          `empty unit in "${lang}" items`
        ).toBeGreaterThan(0);
      }
    }
  );

  it('getCommonItems falls back to English for unknown language', () => {
    const fallback = getCommonItems('zz');
    const english = getCommonItems('en');
    expect(fallback).toBe(english);
  });

  it('every language has the same item count as English (± 5%)', () => {
    const enCount = getCommonItems('en').length;
    for (const lang of SUPPORTED_LANGUAGES) {
      if (lang === 'en') continue;
      const count = getCommonItems(lang).length;
      const diff = Math.abs(count - enCount) / enCount;
      expect(
        diff,
        `"${lang}" has ${count} items vs English ${enCount} (${(diff * 100).toFixed(1)}% diff)`
      ).toBeLessThan(0.05);
    }
  });

  it('no duplicate item names within any language', () => {
    for (const lang of SUPPORTED_LANGUAGES) {
      const items = getCommonItems(lang);
      const names = items.map((i: CommonItemBase) => i.name.toLowerCase());
      const unique = new Set(names);
      const dupes = names.filter((n, idx) => names.indexOf(n) !== idx);
      expect(
        unique.size,
        `"${lang}" has duplicate items: ${[...new Set(dupes)].slice(0, 5).join(', ')}`
      ).toBe(names.length);
    }
  });

  it('all languages cover the same set of categories', () => {
    const categoriesByLang: Record<string, Set<string>> = {};
    for (const lang of SUPPORTED_LANGUAGES) {
      const items = getCommonItems(lang);
      categoriesByLang[lang] = new Set(
        items.map((i: CommonItemBase) => i.category)
      );
    }
    const enCategories = categoriesByLang['en'];
    for (const lang of SUPPORTED_LANGUAGES) {
      if (lang === 'en') continue;
      expect(
        categoriesByLang[lang],
        `"${lang}" categories differ from English`
      ).toEqual(enCategories);
    }
  });
});
