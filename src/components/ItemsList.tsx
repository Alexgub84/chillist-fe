import { useTranslation } from 'react-i18next';
import type { Item, ItemCategory, ItemPatch } from '../core/schemas/item';
import type { Participant } from '../core/schemas/participant';
import type { ListFilter } from '../core/schemas/plan-search';
import CategorySection from './CategorySection';

const CATEGORIES: ItemCategory[] = ['equipment', 'food'];

export interface ItemsListProps {
  items: Item[];
  participants: Participant[];
  currentParticipantId?: string;
  listFilter?: ListFilter | null;
  selfAssignParticipantId?: string;
  canEditItem?: (item: Item) => boolean;
  onEditItem?: (itemId: string) => void;
  onUpdateItem?: (itemId: string, updates: ItemPatch) => void;
  onBulkAssign?: (itemIds: string[], participantId: string) => void;
  groupBySubcategory?: boolean;
  onAddItems?: () => void;
}

export default function ItemsList({
  items,
  participants,
  currentParticipantId,
  listFilter,
  selfAssignParticipantId,
  canEditItem,
  onEditItem,
  onUpdateItem,
  onBulkAssign,
  groupBySubcategory = true,
  onAddItems,
}: ItemsListProps) {
  const { t } = useTranslation();

  if (items.length === 0 && onAddItems) {
    return (
      <div className="bg-white rounded-lg shadow-sm p-6 sm:p-8 text-center mb-4">
        <p className="text-gray-500 text-sm sm:text-base mb-4">
          {t('items.empty')}
        </p>
        <button
          type="button"
          data-testid="add-items-button"
          onClick={onAddItems}
          className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-lg hover:bg-green-700 transition-colors"
        >
          <svg
            className="w-4 h-4"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 4v16m8-8H4"
            />
          </svg>
          {t('items.bulkAddTitle')}
        </button>
      </div>
    );
  }

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
          currentParticipantId={currentParticipantId}
          listFilter={listFilter}
          selfAssignParticipantId={selfAssignParticipantId}
          canEditItem={canEditItem}
          onEditItem={onEditItem}
          onUpdateItem={onUpdateItem}
          onBulkAssign={onBulkAssign}
          restrictToUnassignedOnly={!!selfAssignParticipantId}
          groupBySubcategory={groupBySubcategory}
        />
      ))}
    </div>
  );
}
