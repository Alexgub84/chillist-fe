import {
  Disclosure,
  DisclosureButton,
  DisclosurePanel,
} from '@headlessui/react';
import { useTranslation } from 'react-i18next';
import type { Item, ItemCategory, ItemPatch } from '../core/schemas/item';
import type { Participant } from '../core/schemas/participant';
import type { ListFilter } from '../core/schemas/plan-search';
import {
  EQUIPMENT_SUBCATEGORIES,
  FOOD_SUBCATEGORIES,
  OTHER_SUBCATEGORY,
} from '../data/subcategories';
import { groupBySubcategory } from '../core/utils/items';
import ItemCard from './ItemCard';
import SubcategorySection from './SubcategorySection';

interface CategorySectionProps {
  category: ItemCategory;
  items: Item[];
  participants?: Participant[];
  listFilter?: ListFilter | null;
  selfAssignParticipantId?: string;
  canEditItem?: (item: Item) => boolean;
  onEditItem?: (itemId: string) => void;
  onUpdateItem?: (itemId: string, updates: ItemPatch) => void;
  onBulkAssign?: (itemIds: string[], participantId: string) => void;
  groupBySubcategory?: boolean;
}

const CATEGORY_TAXONOMY = {
  equipment: EQUIPMENT_SUBCATEGORIES,
  food: FOOD_SUBCATEGORIES,
} as const;

function orderedSubcategoryEntries(
  groups: Record<string, Item[]>,
  category: ItemCategory
): [string, Item[]][] {
  const taxonomy = CATEGORY_TAXONOMY[category];
  const ordered: [string, Item[]][] = [];
  for (const sub of taxonomy) {
    const items = groups[sub];
    if (items && items.length > 0) {
      ordered.push([sub, items]);
    }
  }
  if (groups[OTHER_SUBCATEGORY]?.length) {
    ordered.push([OTHER_SUBCATEGORY, groups[OTHER_SUBCATEGORY]]);
  }
  const seen = new Set(ordered.map(([s]) => s));
  for (const [sub, items] of Object.entries(groups)) {
    if (!seen.has(sub) && items.length > 0) {
      ordered.push([sub, items]);
    }
  }
  return ordered;
}

export default function CategorySection({
  category,
  items,
  participants = [],
  listFilter,
  selfAssignParticipantId,
  canEditItem,
  onEditItem,
  onUpdateItem,
  onBulkAssign,
  groupBySubcategory: useSubcategoryGroups = false,
}: CategorySectionProps) {
  const { t } = useTranslation();
  const categoryLabel = t(`categories.${category}`);

  const subcategoryGroups = useSubcategoryGroups
    ? groupBySubcategory(items)
    : null;

  return (
    <Disclosure
      as="div"
      defaultOpen
      className="bg-white rounded-lg shadow-sm overflow-hidden"
    >
      <DisclosureButton className="group w-full px-4 sm:px-5 py-3 sm:py-4 flex items-center justify-between cursor-pointer hover:bg-gray-50 active:bg-gray-100 transition-colors">
        <h3 className="text-base sm:text-lg font-semibold text-gray-800">
          {categoryLabel}
          {items.length > 0 && (
            <span className="ms-2 text-sm font-normal text-gray-500">
              ({items.length})
            </span>
          )}
        </h3>
        <svg
          className="w-5 h-5 text-gray-500 transition-transform group-data-open:rotate-180"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          aria-hidden="true"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M19 9l-7 7-7-7"
          />
        </svg>
      </DisclosureButton>
      <DisclosurePanel
        transition
        className="origin-top transition duration-200 ease-out data-closed:-translate-y-6 data-closed:opacity-0"
      >
        {items.length > 0 ? (
          <div className="border-t border-gray-200 divide-y divide-gray-200">
            {subcategoryGroups && Object.keys(subcategoryGroups).length > 0
              ? orderedSubcategoryEntries(subcategoryGroups, category).map(
                  ([subcategory, subItems]) => (
                    <SubcategorySection
                      key={subcategory}
                      subcategory={subcategory}
                      items={subItems}
                      participants={participants}
                      onBulkAssign={onBulkAssign}
                      cardProps={{
                        participants,
                        listFilter,
                        selfAssignParticipantId,
                        canEditItem,
                        onEditItem,
                        onUpdateItem,
                      }}
                    />
                  )
                )
              : items.map((item) => {
                  const editable = canEditItem ? canEditItem(item) : true;
                  return (
                    <ItemCard
                      key={item.itemId}
                      item={item}
                      participants={participants}
                      listFilter={listFilter}
                      selfAssignParticipantId={selfAssignParticipantId}
                      canEdit={editable}
                      onEdit={
                        onEditItem ? () => onEditItem(item.itemId) : undefined
                      }
                      onUpdate={
                        onUpdateItem
                          ? (updates) => onUpdateItem(item.itemId, updates)
                          : undefined
                      }
                    />
                  );
                })}
          </div>
        ) : (
          <div className="border-t border-gray-200 px-4 sm:px-5 py-3 sm:py-4 text-center">
            <p className="text-sm sm:text-base text-gray-500">
              {t('categories.noItems', {
                category: categoryLabel.toLowerCase(),
              })}
            </p>
          </div>
        )}
      </DisclosurePanel>
    </Disclosure>
  );
}
