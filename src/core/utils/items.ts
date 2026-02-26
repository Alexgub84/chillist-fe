import { OTHER_SUBCATEGORY } from '../../data/subcategories';

export function groupBySubcategory<T extends { subcategory?: string | null }>(
  items: T[]
): Record<string, T[]> {
  return items.reduce(
    (acc, item) => {
      const sub = item.subcategory ?? OTHER_SUBCATEGORY;
      (acc[sub] ??= []).push(item);
      return acc;
    },
    {} as Record<string, T[]>
  );
}
