import { readFileSync, writeFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import {
  EQUIPMENT_SUBCATEGORIES,
  FOOD_SUBCATEGORIES,
  OTHER_SUBCATEGORY,
} from '../src/data/subcategories.ts';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');

type CommonItem = {
  id: string;
  name: string;
  category: 'food' | 'equipment';
  unit: string;
  aliases: string[];
  tags: string[];
};

const EQUIPMENT_TAG_MAP: Record<string, string> = {
  'first-aid': 'First Aid and Safety',
  kids: 'Kids and Baby Gear',
  baby: 'Kids and Baby Gear',
  pets: 'Pet Gear',
  sleep: 'Comfort and Climate Control',
  cooking: 'Cooking and Heating Equipment',
  shelter: 'Venue Setup and Layout',
  lighting: 'Lighting and Visibility',
  water: 'Drink and Beverage Equipment',
  hygiene: 'Hygiene and Bathroom Supplies',
  power: 'Power and Charging',
  tools: 'Tools and Quick Repairs',
  games: 'Games and Activities',
  storage: 'Food Storage and Cooling',
  clothing: 'Comfort and Climate Control',
  winter: 'Comfort and Climate Control',
  beach: 'Games and Activities',
  car: 'Transport and Carry',
  navigation: 'Documentation and Access',
};

const FOOD_TAG_MAP: Record<string, string> = {
  fruit: 'Fresh Fruit',
  vegetables: 'Fresh Vegetables',
  condiments: 'Sauces, Condiments, and Spreads',
  drink: 'Beverages (non-alcoholic)',
  snack: 'Snacks and Chips',
  breakfast: 'Breakfast Staples',
  pantry: 'Grains and Pasta',
  frozen: 'Frozen Foods',
  protein: 'Meat and Poultry',
};

const EQUIPMENT_NAME_PATTERNS: Array<{ pattern: RegExp; subcategory: string }> =
  [
    {
      pattern: /\b(tent|canopy|tarps?|pop-up|awning|screen)\b/i,
      subcategory: 'Venue Setup and Layout',
    },
    {
      pattern: /\b(stove|grill|burner|campfire|cooking)\b/i,
      subcategory: 'Cooking and Heating Equipment',
    },
    {
      pattern: /\b(pot|pan|skillet|frying|dutch oven|wok)\b/i,
      subcategory: 'Cookware and Bakeware',
    },
    {
      pattern: /\b(knife|cutting board|peeler|grater|opener)\b/i,
      subcategory: 'Food Preparation Tools',
    },
    {
      pattern: /\b(plate|cup|bowl|utensil|fork|spoon|tableware)\b/i,
      subcategory: 'Serving and Tableware',
    },
    {
      pattern: /\b(cooler|ice pack|thermos|water bottle)\b/i,
      subcategory: 'Drink and Beverage Equipment',
    },
    {
      pattern: /\b(food storage|container|ziploc)\b/i,
      subcategory: 'Food Storage and Cooling',
    },
    {
      pattern: /\b(dish soap|sponge|towel|cleaning)\b/i,
      subcategory: 'Cleaning and Dishwashing',
    },
    {
      pattern: /\b(trash|garbage|recycling|bag)\b/i,
      subcategory: 'Waste and Recycling',
    },
    {
      pattern: /\b(battery|charger|power bank|solar)\b/i,
      subcategory: 'Power and Charging',
    },
    {
      pattern: /\b(flashlight|lantern|headlamp|light)\b/i,
      subcategory: 'Lighting and Visibility',
    },
    {
      pattern: /\b(sleeping bag|mattress|pillow|blanket|chair)\b/i,
      subcategory: 'Comfort and Climate Control',
    },
    { pattern: /\b(speaker|music|radio)\b/i, subcategory: 'Music and Media' },
    {
      pattern: /\b(game|ball|frisbee|cards|puzzle)\b/i,
      subcategory: 'Games and Activities',
    },
    {
      pattern: /\b(baby|infant|stroller|crib)\b/i,
      subcategory: 'Kids and Baby Gear',
    },
    { pattern: /\b(pet|dog|cat)\b/i, subcategory: 'Pet Gear' },
    {
      pattern: /\b(soap|shampoo|toothbrush|toilet|towel|hygiene)\b/i,
      subcategory: 'Hygiene and Bathroom Supplies',
    },
    {
      pattern: /\b(first aid|medication|bandage|antiseptic)\b/i,
      subcategory: 'First Aid and Safety',
    },
    {
      pattern: /\b(car|backpack|duffel|luggage|transport)\b/i,
      subcategory: 'Transport and Carry',
    },
    {
      pattern: /\b(map|compass|gps|documentation)\b/i,
      subcategory: 'Documentation and Access',
    },
    {
      pattern: /\b(axe|multi-tool|repair|tape|rope)\b/i,
      subcategory: 'Tools and Quick Repairs',
    },
    {
      pattern: /\b(foil|paper plate|plastic cup|disposable)\b/i,
      subcategory: 'Serving and Tableware',
    },
  ];

const FOOD_NAME_PATTERNS: Array<{ pattern: RegExp; subcategory: string }> = [
  {
    pattern:
      /\b(tomato|cucumber|pepper|carrot|onion|garlic|potato|broccoli|zucchini|squash|avocado|lettuce|spinach|kale|celery)\b/i,
    subcategory: 'Fresh Vegetables',
  },
  {
    pattern:
      /\b(apple|banana|orange|lemon|lime|berry|melon|grape|peach|mango|kiwi|pineapple|pear)\b/i,
    subcategory: 'Fresh Fruit',
  },
  {
    pattern: /\b(herb|basil|parsley|cilantro|mint|rosemary|thyme)\b/i,
    subcategory: 'Fresh Herbs',
  },
  {
    pattern: /\b(lettuce|spinach|arugula|kale|salad|green)\b/i,
    subcategory: 'Leafy Greens and Salads',
  },
  {
    pattern: /\b(onion|garlic|ginger)\b/i,
    subcategory: 'Aromatics (onion, garlic, ginger)',
  },
  {
    pattern: /\b(chicken|beef|pork|lamb|bacon|sausage|turkey|meat|poultry)\b/i,
    subcategory: 'Meat and Poultry',
  },
  {
    pattern: /\b(fish|salmon|tuna|shrimp|crab|lobster|seafood)\b/i,
    subcategory: 'Fish and Seafood',
  },
  {
    pattern: /\b(tofu|tempeh|seitan|plant protein|beyond|impossible)\b/i,
    subcategory: 'Meat Alternatives and Plant Proteins',
  },
  { pattern: /\b(egg)\b/i, subcategory: 'Eggs' },
  { pattern: /\b(milk|cream|yogurt|butter)\b/i, subcategory: 'Dairy' },
  {
    pattern: /\b(almond milk|oat milk|coconut milk|dairy alternative)\b/i,
    subcategory: 'Dairy Alternatives',
  },
  { pattern: /\b(cheese)\b/i, subcategory: 'Cheese' },
  {
    pattern: /\b(bread|bagel|tortilla|pita|bakery)\b/i,
    subcategory: 'Bread and Bakery',
  },
  {
    pattern: /\b(rice|pasta|noodle|quinoa|couscous|grain)\b/i,
    subcategory: 'Grains and Pasta',
  },
  {
    pattern: /\b(cereal|oatmeal|pancake|waffle|breakfast)\b/i,
    subcategory: 'Breakfast Staples',
  },
  {
    pattern: /\b(bean|lentil|chickpea|legume|canned)\b/i,
    subcategory: 'Legumes (dry and canned)',
  },
  {
    pattern: /\b(sauce|ketchup|mustard|mayo|salsa|condiment|spread)\b/i,
    subcategory: 'Sauces, Condiments, and Spreads',
  },
  {
    pattern: /\b(oil|vinegar|dressing)\b/i,
    subcategory: 'Oils, Vinegars, and Dressings',
  },
  {
    pattern: /\b(salt|pepper|spice|seasoning)\b/i,
    subcategory: 'Spices and Seasonings',
  },
  {
    pattern: /\b(flour|sugar|baking|yeast)\b/i,
    subcategory: 'Baking Ingredients',
  },
  {
    pattern: /\b(chip|cracker|popcorn|pretzel)\b/i,
    subcategory: 'Snacks and Chips',
  },
  {
    pattern: /\b(nut|seed|almond|walnut|raisin|dried fruit)\b/i,
    subcategory: 'Nuts, Seeds, and Dried Fruit',
  },
  {
    pattern: /\b(chocolate|candy|cookie|cake|dessert|sweet)\b/i,
    subcategory: 'Sweets and Desserts',
  },
  { pattern: /\b(frozen)\b/i, subcategory: 'Frozen Foods' },
  {
    pattern: /\b(beer|wine|alcohol|liquor|cocktail)\b/i,
    subcategory: 'Alcohol and Mixers',
  },
  {
    pattern: /\b(coffee|tea|cocoa|hot drink)\b/i,
    subcategory: 'Hot Drinks (coffee, tea, cocoa)',
  },
  { pattern: /\b(water|ice)\b/i, subcategory: 'Water and Ice' },
  {
    pattern: /\b(juice|soda|sparkling|beverage)\b/i,
    subcategory: 'Beverages (non-alcoholic)',
  },
];

function resolveEquipmentSubcategory(item: CommonItem): string {
  const tags = item.tags || [];
  for (const tag of tags) {
    const mapped = EQUIPMENT_TAG_MAP[tag];
    if (mapped) return mapped;
  }
  const name = item.name.toLowerCase();
  for (const { pattern, subcategory } of EQUIPMENT_NAME_PATTERNS) {
    if (pattern.test(name)) return subcategory;
  }
  return OTHER_SUBCATEGORY;
}

function resolveFoodSubcategory(item: CommonItem): string {
  const tags = item.tags || [];
  for (const tag of tags) {
    const mapped = FOOD_TAG_MAP[tag];
    if (mapped) return mapped;
  }
  const name = item.name.toLowerCase();
  for (const { pattern, subcategory } of FOOD_NAME_PATTERNS) {
    if (pattern.test(name)) return subcategory;
  }
  if (tags.includes('protein')) {
    if (/\b(fish|salmon|tuna|shrimp)\b/i.test(name)) return 'Fish and Seafood';
    if (/\b(tofu|tempeh)\b/i.test(name))
      return 'Meat Alternatives and Plant Proteins';
    return 'Meat and Poultry';
  }
  if (tags.includes('drink')) {
    if (/\b(coffee|tea)\b/i.test(name))
      return 'Hot Drinks (coffee, tea, cocoa)';
    if (/\b(beer|wine|alcohol)\b/i.test(name)) return 'Alcohol and Mixers';
    return 'Beverages (non-alcoholic)';
  }
  return OTHER_SUBCATEGORY;
}

function enrichItem(item: CommonItem): CommonItem & { subcategory: string } {
  const subcategory =
    item.category === 'equipment'
      ? resolveEquipmentSubcategory(item)
      : resolveFoodSubcategory(item);
  return { ...item, subcategory };
}

type HeItem = { name: string; category: 'food' | 'equipment'; unit: string };

const HE_EQUIPMENT_PATTERNS: Array<{ pattern: RegExp; subcategory: string }> = [
  {
    pattern: /אוהל|ברזנט|סוכך|מקלט|יריעת|חוסם רוח|שמשייה|שמיכת פיקניק/i,
    subcategory: 'Venue Setup and Layout',
  },
  {
    pattern: /קרש חיתוך|סכין מטבח|פותחן|מלקחיים|מצקת|כף טיגון/i,
    subcategory: 'Food Preparation Tools',
  },
  {
    pattern: /כירת|גריל|פחם|עצי הסקה|מצת|בלון גז|תנור חימום/i,
    subcategory: 'Cooking and Heating Equipment',
  },
  {
    pattern: /סיר|מחבת|קומקום|רשת גריל|שיפודים|כפות הגשה/i,
    subcategory: 'Cookware and Bakeware',
  },
  {
    pattern:
      /צלחות|כוסות|סכו״ם|מפיות|נייר אלומיניום|צלחות נייר|כוסות פלסטיק|מפה/i,
    subcategory: 'Serving and Tableware',
  },
  {
    pattern:
      /צידנית|תרמוס|בקבוק מים|מסנן מים|טבליות טיהור|שלוקר|תיק צידנית|קרחוניות|מיכל מים/i,
    subcategory: 'Drink and Beverage Equipment',
  },
  {
    pattern: /קופסאות אחסון|שק אחסון|שק יבש/i,
    subcategory: 'Food Storage and Cooling',
  },
  {
    pattern: /סבון כלים|ספוג|קערת שטיפה|דלי|חבל כביסה|אטבי/i,
    subcategory: 'Cleaning and Dishwashing',
  },
  { pattern: /שקיות אשפה|מגבות נייר/i, subcategory: 'Waste and Recycling' },
  {
    pattern: /מטען|סוללות|גנרטור|מטען סולארי|כבל טעינה|כבל מאריך/i,
    subcategory: 'Power and Charging',
  },
  {
    pattern: /פנס|שרשרת אורות|מקלות זוהר|מנורת/i,
    subcategory: 'Lighting and Visibility',
  },
  {
    pattern: /שק שינה|מזרן|כרית|שמיכת|ערסל|מחממי ידיים|פונצ׳ו|מאוורר/i,
    subcategory: 'Comfort and Climate Control',
  },
  {
    pattern: /רמקול|מצלמה|טאבלט|נגן DVD|אוזניות/i,
    subcategory: 'Music and Media',
  },
  {
    pattern: /משחק|קלפי|כדור|פריזבי|חכת דיג|עפיפון|מצופים|בריכה/i,
    subcategory: 'Games and Activities',
  },
  {
    pattern: /תינוק|תינוקות|ילדים|פעוטות|עגלה|מנשא|חיתול|מוצץ|בקבוקי|צעצוע/i,
    subcategory: 'Kids and Baby Gear',
  },
  {
    pattern: /כלב|חיות מחמד|חתול|רתמת|קולר|כלוב נשיאה/i,
    subcategory: 'Pet Gear',
  },
  {
    pattern:
      /מקלחת|סבון|מגבת|נייר טואלט|מגבוני|ג׳ל חיטוי|מברשת שיניים|משחת שיניים|דאודורנט|שמפו|תחבושות היגייניות/i,
    subcategory: 'Hygiene and Bathroom Supplies',
  },
  {
    pattern:
      /עזרה ראשונה|מדחום|תחבושת|פלסטר|אקמול|אספירין|משחה|ג׳ל לכוויות|איבופרופן/i,
    subcategory: 'First Aid and Safety',
  },
  {
    pattern:
      /תרמיל|אופניים|קסדה|קיאק|משוט|אפוד הצלה|ארגז גג|מנשא|רצועת גרירה|מטען לרכב|כבלי הנעה/i,
    subcategory: 'Transport and Carry',
  },
  {
    pattern:
      /מצפן|מפה|משקפת|מדריך|יומן|דרכון|תעודת|כרטיס|מזומן|רישיון|אישור|הדפסות/i,
    subcategory: 'Documentation and Access',
  },
  {
    pattern:
      /גרזן|אולר|כלי רב שימושי|פטיש|מסור|ערכת תפירה|טלאי|סרט תיקון|דבק|חבל|טבעות|אזיקון/i,
    subcategory: 'Tools and Quick Repairs',
  },
  {
    pattern:
      /כובע|נעל|מעיל|בגד|כפפות|גרב|צעיף|תחתונים תרמיים|בגד ים|משקפי שמש/i,
    subcategory: 'Comfort and Climate Control',
  },
];

const HE_FOOD_PATTERNS: Array<{ pattern: RegExp; subcategory: string }> = [
  {
    pattern:
      /עגבני|מלפפון|גזר|בצל|תפוח אדמה|פלפל|פטריות|חסה|קישוא|ברוקולי|חציל|סלק|כרוב|בטטה|אספרגוס|אפונה|סלרי|שום|ג׳ינג׳ר|חלפיניו|צנונית|דלעת|ארטישוק|שומר|ניילון נצמד|נייר אפייה/i,
    subcategory: 'Fresh Vegetables',
  },
  {
    pattern:
      /תפוח|בננה|תפוז|ענבים|תות|אבטיח|אפרסק|אגס|אננס|מנגו|אוכמניות|פטל|דובדבנים|לימון|ליים|אבוקדו/i,
    subcategory: 'Fresh Fruit',
  },
  {
    pattern: /עשבי תיבול|תערובת קולסלו|תערובת סלט/i,
    subcategory: 'Leafy Greens and Salads',
  },
  {
    pattern: /בצל|שום|ג׳ינג׳ר/i,
    subcategory: 'Aromatics (onion, garlic, ginger)',
  },
  {
    pattern: /עוף|בשר|סטייק|נקניק|בייקון|קציצות|צלעות|חזיר|כבש|הודו/i,
    subcategory: 'Meat and Poultry',
  },
  { pattern: /דג|סלמון|טונה|שרימפס|פילה/i, subcategory: 'Fish and Seafood' },
  {
    pattern: /טופו|טמפה|סייטן|ביונד מיט|פלאפל|אדממה/i,
    subcategory: 'Meat Alternatives and Plant Proteins',
  },
  { pattern: /ביצים/i, subcategory: 'Eggs' },
  {
    pattern: /חלב|חמאה|יוגורט|קרמר|גבינת שמנת|שמנת קוקוס/i,
    subcategory: 'Dairy',
  },
  {
    pattern:
      /חלב שיבולת|חלב שקדים|חלב סויה|חלב קוקוס|חלב אורז|חמאה טבעונית|מיונז טבעוני|יוגורט טבעוני/i,
    subcategory: 'Dairy Alternatives',
  },
  {
    pattern: /גבינה|טחינה|חמאת בוטנים|חמאת שקדים|חמאת קשיו/i,
    subcategory: 'Cheese',
  },
  {
    pattern: /לחם|לחמני|טורטיה|פיתה|בייגל|קרואסון|מאפין|פריכיות/i,
    subcategory: 'Bread and Bakery',
  },
  {
    pattern: /אורז|פסטה|קוסקוס|קינואה|בורגול|כוסמת|אטריות/i,
    subcategory: 'Grains and Pasta',
  },
  {
    pattern: /דגני בוקר|שיבולת שועל|פנקייק|וופל|תערובת פנקייק/i,
    subcategory: 'Breakfast Staples',
  },
  {
    pattern: /חומוס|שעועית|עדשים|אפונה|מרק בקופסה|בשר מיובש/i,
    subcategory: 'Legumes (dry and canned)',
  },
  {
    pattern: /בקופסה|בקופסאות|בצנצנת|נודלס מהיר/i,
    subcategory: 'Canned and Jarred Foods',
  },
  {
    pattern:
      /קטשופ|חרדל|רוטב|סלסה|גוואקמולי|מיונז|חמוצים|ריבה|נוטלה|משחת מיסו|קימצ׳י/i,
    subcategory: 'Sauces, Condiments, and Spreads',
  },
  {
    pattern: /שמן|חומץ|רוטב סלט|דבש|סירופ|סילאן|טמרי/i,
    subcategory: 'Oils, Vinegars, and Dressings',
  },
  {
    pattern:
      /מלח|פלפל|פפריקה|כמון|קינמון|תיבול|אבקת שום|אבקת בצל|אבקת צ׳ילי|כורכום|מאצ׳ה/i,
    subcategory: 'Spices and Seasonings',
  },
  {
    pattern: /קמח|סוכר|תערובת עוגה|תערובת שיבולת|תערובת שוקו/i,
    subcategory: 'Baking Ingredients',
  },
  {
    pattern: /צ׳יפס|קרקר|פופקורן|בייגלה|חטיף|חטיפי אנרגיה|גרנולה|אצות/i,
    subcategory: 'Snacks and Chips',
  },
  {
    pattern:
      /שקדים|אגוזים|בוטנים|קשיו|גרעינים|צימוקים|תמרים|פירות יבשים|גוג׳י|ספירולינה/i,
    subcategory: 'Nuts, Seeds, and Dried Fruit',
  },
  {
    pattern: /שוקולד|מרשמלו|עוגיות|גלידה|בראוניז|פאי|ממתק|דבש/i,
    subcategory: 'Sweets and Desserts',
  },
  { pattern: /קפוא|קפואה|קפואים|מיובש בהקפאה/i, subcategory: 'Frozen Foods' },
  {
    pattern: /מים|קרח|מיץ|סיידר|לימונדה|תה קר|משקה|קומבוצ׳ה/i,
    subcategory: 'Beverages (non-alcoholic)',
  },
  {
    pattern: /בירה|יין|מיקסר לקוקטיילים|משקאות חריפים/i,
    subcategory: 'Alcohol and Mixers',
  },
  {
    pattern: /קפה|תה|תערובת שוקו|פילטרים לקפה|מאצ׳ה|תה צמחים|תה ירוק/i,
    subcategory: 'Hot Drinks (coffee, tea, cocoa)',
  },
];

function resolveHeEquipmentSubcategory(item: HeItem): string {
  for (const { pattern, subcategory } of HE_EQUIPMENT_PATTERNS) {
    if (pattern.test(item.name)) return subcategory;
  }
  return OTHER_SUBCATEGORY;
}

function resolveHeFoodSubcategory(item: HeItem): string {
  for (const { pattern, subcategory } of HE_FOOD_PATTERNS) {
    if (pattern.test(item.name)) return subcategory;
  }
  return OTHER_SUBCATEGORY;
}

function enrichHeItem(item: HeItem): HeItem & { subcategory: string } {
  const subcategory =
    item.category === 'equipment'
      ? resolveHeEquipmentSubcategory(item)
      : resolveHeFoodSubcategory(item);
  return { ...item, subcategory };
}

function main() {
  const enPath = join(ROOT, 'src/data/common-items.json');
  const enData = JSON.parse(readFileSync(enPath, 'utf-8')) as CommonItem[];
  const enEnriched = enData.map(enrichItem);

  const enInvalid = enEnriched.filter((i) => {
    const valid =
      i.category === 'equipment'
        ? (EQUIPMENT_SUBCATEGORIES as readonly string[]).includes(
            i.subcategory
          ) || i.subcategory === OTHER_SUBCATEGORY
        : (FOOD_SUBCATEGORIES as readonly string[]).includes(i.subcategory) ||
          i.subcategory === OTHER_SUBCATEGORY;
    return !valid;
  });
  if (enInvalid.length > 0) {
    console.error(
      'EN items with invalid subcategory:',
      enInvalid.map((i) => ({ id: i.id, subcategory: i.subcategory }))
    );
    process.exit(1);
  }

  writeFileSync(enPath, JSON.stringify(enEnriched, null, 2) + '\n', 'utf-8');
  console.log(`Enriched EN: ${enEnriched.length} items`);

  const enOther = enEnriched.filter(
    (i) => i.subcategory === OTHER_SUBCATEGORY
  ).length;
  if (enOther > 0) console.log(`  ${enOther} in Other`);

  const hePath = join(ROOT, 'src/data/common-items.he.json');
  const heData = JSON.parse(readFileSync(hePath, 'utf-8')) as HeItem[];
  const heEnriched = heData.map(enrichHeItem);

  writeFileSync(hePath, JSON.stringify(heEnriched, null, 2) + '\n', 'utf-8');
  console.log(`Enriched HE: ${heEnriched.length} items`);

  const heOther = heEnriched.filter(
    (i) => i.subcategory === OTHER_SUBCATEGORY
  ).length;
  if (heOther > 0) console.log(`  ${heOther} in Other`);
}

main();
