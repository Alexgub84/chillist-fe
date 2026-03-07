import { readFileSync, writeFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');

type BaseItem = {
  name: string;
  category: 'food' | 'equipment';
  unit: string;
  subcategory?: string;
  [key: string]: unknown;
};

const QUANTITY_PER_POINT: Record<string, number> = {
  'Beverages (non-alcoholic):l': 0.5,
  'Beverages (non-alcoholic):pack': 0.3,
  'Beverages (non-alcoholic):pcs': 0.2,

  'Alcohol and Mixers:l': 0.3,
  'Alcohol and Mixers:pack': 0.2,
  'Alcohol and Mixers:pcs': 0.15,

  'Hot Drinks (coffee, tea, cocoa):pack': 0.15,
  'Hot Drinks (coffee, tea, cocoa):pcs': 0.1,
  'Hot Drinks (coffee, tea, cocoa):l': 0.2,

  'Water and Ice:l': 0.75,
  'Water and Ice:kg': 0.3,
  'Water and Ice:pack': 0.3,

  'Fresh Vegetables:kg': 0.15,
  'Fresh Vegetables:pack': 0.15,
  'Fresh Vegetables:pcs': 0.15,

  'Fresh Fruit:kg': 0.1,
  'Fresh Fruit:pack': 0.15,
  'Fresh Fruit:pcs': 0.2,

  'Fresh Herbs:pack': 0.1,
  'Fresh Herbs:pcs': 0.1,

  'Leafy Greens and Salads:pack': 0.15,
  'Leafy Greens and Salads:kg': 0.1,

  'Aromatics (onion, garlic, ginger):pcs': 0.15,
  'Aromatics (onion, garlic, ginger):kg': 0.1,

  'Meat and Poultry:kg': 0.15,
  'Meat and Poultry:pack': 0.15,
  'Meat and Poultry:pcs': 0.1,

  'Fish and Seafood:kg': 0.12,
  'Fish and Seafood:pack': 0.15,
  'Fish and Seafood:pcs': 0.1,

  'Meat Alternatives and Plant Proteins:kg': 0.1,
  'Meat Alternatives and Plant Proteins:pack': 0.15,
  'Meat Alternatives and Plant Proteins:pcs': 0.1,

  'Vegan:kg': 0.1,
  'Vegan:pack': 0.15,
  'Vegan:pcs': 0.15,

  'Eggs:pcs': 0.5,
  'Eggs:pack': 0.15,

  'Dairy:l': 0.3,
  'Dairy:pack': 0.2,
  'Dairy:pcs': 0.2,

  'Dairy Alternatives:l': 0.3,
  'Dairy Alternatives:pack': 0.2,

  'Cheese:kg': 0.05,
  'Cheese:pack': 0.15,
  'Cheese:pcs': 0.1,

  'Bread and Bakery:pcs': 0.2,
  'Bread and Bakery:pack': 0.2,

  'Grains and Pasta:kg': 0.08,
  'Grains and Pasta:pack': 0.15,
  'Grains and Pasta:pcs': 0.15,

  'Breakfast Staples:pack': 0.2,
  'Breakfast Staples:pcs': 0.15,

  'Legumes (dry and canned):pack': 0.15,
  'Legumes (dry and canned):pcs': 0.15,
  'Legumes (dry and canned):kg': 0.08,

  'Canned and Jarred Foods:pcs': 0.15,
  'Canned and Jarred Foods:pack': 0.15,

  'Sauces, Condiments, and Spreads:pcs': 0.1,
  'Sauces, Condiments, and Spreads:pack': 0.1,
  'Sauces, Condiments, and Spreads:l': 0.1,

  'Oils, Vinegars, and Dressings:l': 0.05,
  'Oils, Vinegars, and Dressings:pcs': 0.05,

  'Spices and Seasonings:pack': 0.05,
  'Spices and Seasonings:pcs': 0.05,

  'Baking Ingredients:kg': 0.05,
  'Baking Ingredients:pack': 0.1,

  'Snacks and Chips:pack': 0.3,
  'Snacks and Chips:pcs': 0.15,

  'Nuts, Seeds, and Dried Fruit:pack': 0.2,
  'Nuts, Seeds, and Dried Fruit:kg': 0.05,

  'Sweets and Desserts:pack': 0.2,
  'Sweets and Desserts:pcs': 0.15,

  'Frozen Foods:kg': 0.1,
  'Frozen Foods:l': 0.15,
  'Frozen Foods:pack': 0.15,
  'Frozen Foods:pcs': 0.1,

  'Ready-to-Eat and Prepared Foods:pack': 0.15,
  'Ready-to-Eat and Prepared Foods:pcs': 0.15,

  'Other:kg': 0.1,
  'Other:pack': 0.15,
  'Other:pcs': 0.1,
  'Other:set': 0.1,
};

const UNIT_DEFAULTS: Record<string, number> = {
  kg: 0.1,
  l: 0.3,
  pack: 0.2,
  pcs: 0.15,
  set: 0.1,
};

function getQuantityPerPoint(subcategory: string, unit: string): number {
  return (
    QUANTITY_PER_POINT[`${subcategory}:${unit}`] ?? UNIT_DEFAULTS[unit] ?? 0.15
  );
}

function enrichFile(filePath: string, label: string) {
  const data = JSON.parse(readFileSync(filePath, 'utf-8')) as BaseItem[];

  let enriched = 0;
  let skipped = 0;

  const result = data.map((item) => {
    if (item.category !== 'food') {
      skipped++;
      return item;
    }

    const subcategory = item.subcategory ?? 'Other';
    const quantityPerPoint = getQuantityPerPoint(subcategory, item.unit);

    enriched++;
    return { ...item, quantityPerPoint, isPersonal: false };
  });

  writeFileSync(filePath, JSON.stringify(result, null, 2) + '\n', 'utf-8');
  console.log(
    `${label}: ${enriched} food items enriched, ${skipped} equipment items skipped`
  );
}

function main() {
  enrichFile(join(ROOT, 'src/data/common-items.json'), 'EN');
  enrichFile(join(ROOT, 'src/data/common-items.he.json'), 'HE');
  enrichFile(join(ROOT, 'src/data/common-items.es.json'), 'ES');

  console.log(
    '\nDone. Run `npx prettier --write src/data/common-items*.json` to format.'
  );
}

main();
