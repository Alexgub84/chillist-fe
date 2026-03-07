import { readFileSync, writeFileSync } from 'fs';
import { resolve } from 'path';

const PERSONAL_SUBCATEGORIES = new Set([
  'Comfort and Climate Control',
  'Hygiene and Bathroom Supplies',
]);

const PERSONAL_ITEMS = new Set([
  'Water Bottle',
  'Hydration Pack',
  'Water Bladder',
  'Thermos',
  'Headlamp',
  'Flashlight',
  'Backpack',
  'Daypack',
  'Towels',
  'Book',
  'Journal',
  'Pen',
  'Camera',
  'Tripod',
  'Kids Water Bottle',
  'Kids Backpack',
  'Kids Bike Helmet',
  'Kids Binoculars',
  'Kids Books',
  'Kids Headphones',
  'Kids Sunscreen',
  'Bike Helmet',
]);

const SHARED_OVERRIDES = new Set([
  'Toilet Paper',
  'Dish Soap',
  'Hand Sanitizer',
  'Wet Wipes',
  'Sponge',
  'Biodegradable Soap',
  'Wash Basin',
  'Camping Shower',
  'Tissues',
  'Aloe Vera Gel',
  'Folding Chair',
  'Hammock',
]);

interface Item {
  id: string;
  name: string;
  category: string;
  subcategory?: string;
  isPersonal?: boolean;
  [key: string]: unknown;
}

function isPersonalItem(item: Item): boolean {
  if (item.category !== 'equipment') return item.isPersonal ?? false;
  if (SHARED_OVERRIDES.has(item.name)) return false;
  if (PERSONAL_ITEMS.has(item.name)) return true;
  if (item.subcategory && PERSONAL_SUBCATEGORIES.has(item.subcategory))
    return true;
  return false;
}

const FILES = [
  'common-items.json',
  'common-items.he.json',
  'common-items.es.json',
];
const DATA_DIR = resolve(import.meta.dirname, '..', 'src', 'data');

for (const file of FILES) {
  const filePath = resolve(DATA_DIR, file);
  const items: Item[] = JSON.parse(readFileSync(filePath, 'utf-8'));

  let personalCount = 0;
  for (const item of items) {
    if (item.category === 'equipment') {
      item.isPersonal = isPersonalItem(item);
      if (item.isPersonal) personalCount++;
    }
  }

  writeFileSync(filePath, JSON.stringify(items, null, 2) + '\n');
  console.log(`${file}: marked ${personalCount} equipment items as personal`);
}
