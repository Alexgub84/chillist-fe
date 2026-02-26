import type { Item, ItemPatch } from '../core/schemas/item';
import type { Participant } from '../core/schemas/participant';
import type { ListFilter } from '../core/schemas/plan-search';
import ItemCard from './ItemCard';

export interface ItemListRendererProps {
  items: Item[];
  participants: Participant[];
  listFilter?: ListFilter | null;
  selfAssignParticipantId?: string;
  canEditItem?: (item: Item) => boolean;
  onEditItem?: (itemId: string) => void;
  onUpdateItem?: (itemId: string, updates: ItemPatch) => void;
}

export function renderItemCards({
  items,
  participants,
  listFilter,
  selfAssignParticipantId,
  canEditItem,
  onEditItem,
  onUpdateItem,
}: ItemListRendererProps) {
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
        onEdit={onEditItem ? () => onEditItem(item.itemId) : undefined}
        onUpdate={
          onUpdateItem
            ? (updates) => onUpdateItem(item.itemId, updates)
            : undefined
        }
      />
    );
  });
}
