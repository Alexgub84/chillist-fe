import type { Item, ItemCategory, ItemPatch } from '../core/schemas/item';
import type { Participant } from '../core/schemas/participant';
import type { ListFilter } from '../core/schemas/plan-search';
import CategorySection from './CategorySection';

const CATEGORIES: ItemCategory[] = ['equipment', 'food'];

export interface ItemsListProps {
  items: Item[];
  participants: Participant[];
  listFilter?: ListFilter | null;
  selfAssignParticipantId?: string;
  canEditItem?: (item: Item) => boolean;
  onEditItem?: (itemId: string) => void;
  onUpdateItem?: (itemId: string, updates: ItemPatch) => void;
  groupBySubcategory?: boolean;
}

export default function ItemsList({
  items,
  participants,
  listFilter,
  selfAssignParticipantId,
  canEditItem,
  onEditItem,
  onUpdateItem,
  groupBySubcategory = true,
}: ItemsListProps) {
  const itemsByCategory = CATEGORIES.map((category) => ({
    category,
    items: items.filter((item) => item.category === category),
  }));

  return (
    <div className="space-y-4 mb-4">
      {itemsByCategory.map(({ category, items: catItems }) => (
        <CategorySection
          key={category}
          category={category}
          items={catItems}
          participants={participants}
          listFilter={listFilter}
          selfAssignParticipantId={selfAssignParticipantId}
          canEditItem={canEditItem}
          onEditItem={onEditItem}
          onUpdateItem={onUpdateItem}
          groupBySubcategory={groupBySubcategory}
        />
      ))}
    </div>
  );
}
