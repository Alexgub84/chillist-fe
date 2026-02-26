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
import BulkAssignButton from './BulkAssignButton';
import ItemCard from './ItemCard';
import SubcategorySection from './SubcategorySection';
import CollapsibleSection from './shared/CollapsibleSection';

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
  restrictToUnassignedOnly?: boolean;
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
  restrictToUnassignedOnly,
  groupBySubcategory: useSubcategoryGroups = false,
}: CategorySectionProps) {
  const { t } = useTranslation();
  const categoryLabel = t(`categories.${category}`);

  const subcategoryGroups = useSubcategoryGroups
    ? groupBySubcategory(items)
    : null;

  return (
    <CollapsibleSection
      title={
        <h3 className="text-base sm:text-lg font-semibold text-gray-800">
          {categoryLabel}
          {items.length > 0 && (
            <span className="ms-2 text-sm font-normal text-gray-500">
              ({items.length})
            </span>
          )}
        </h3>
      }
      wrapperClassName="bg-white rounded-lg shadow-sm overflow-hidden"
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
                    restrictToUnassignedOnly={restrictToUnassignedOnly}
                    selfParticipantId={selfAssignParticipantId}
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
            : (() => {
                if (onBulkAssign && participants.length > 0) {
                  return (
                    <>
                      <div className="px-4 sm:px-5 py-2 border-b border-gray-100">
                        <BulkAssignButton
                          items={items}
                          participants={participants}
                          onAssign={onBulkAssign}
                          restrictToUnassignedOnly={restrictToUnassignedOnly}
                          selfParticipantId={selfAssignParticipantId}
                        />
                      </div>
                      {items.map((item) => {
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
                              onEditItem
                                ? () => onEditItem(item.itemId)
                                : undefined
                            }
                            onUpdate={
                              onUpdateItem
                                ? (updates) =>
                                    onUpdateItem(item.itemId, updates)
                                : undefined
                            }
                          />
                        );
                      })}
                    </>
                  );
                }
                return items.map((item) => {
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
                });
              })()}
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
    </CollapsibleSection>
  );
}
