import { useTranslation } from 'react-i18next';
import type { Item } from '../core/schemas/item';
import type { Participant } from '../core/schemas/participant';
import { renderItemCards, type ItemListRendererProps } from './renderItemCards';
import BulkAssignButton from './BulkAssignButton';
import CollapsibleSection from './shared/CollapsibleSection';

export interface SubcategorySectionProps {
  subcategory: string;
  items: Item[];
  participants: Participant[];
  onBulkAssign?: (itemIds: string[], participantId: string) => void;
  restrictToUnassignedOnly?: boolean;
  selfParticipantId?: string;
  cardProps: Omit<ItemListRendererProps, 'items'>;
}

export default function SubcategorySection({
  subcategory,
  items,
  participants,
  onBulkAssign,
  restrictToUnassignedOnly,
  selfParticipantId,
  cardProps,
}: SubcategorySectionProps) {
  const { t } = useTranslation();
  const displayName = t(`subcategories.${subcategory}`, subcategory);

  return (
    <CollapsibleSection
      title={
        <h4 className="text-sm font-medium text-gray-600">
          {displayName}
          <span className="ms-2 text-gray-400">({items.length})</span>
        </h4>
      }
      buttonAs="div"
      buttonClassName="group w-full px-4 sm:px-5 py-2 bg-gray-50 flex items-center justify-between cursor-pointer hover:bg-gray-100 transition-colors"
      panelClassName="origin-top transition duration-150 ease-out data-closed:-translate-y-4 data-closed:opacity-0"
      chevronClassName="w-4 h-4 text-gray-400 transition-transform group-data-open:rotate-180"
    >
      <div className="divide-y divide-gray-200">
        {onBulkAssign && participants.length > 0 && (
          <div className="px-4 sm:px-5 py-2 border-b border-gray-100">
            <BulkAssignButton
              items={items}
              participants={participants}
              onAssign={onBulkAssign}
              restrictToUnassignedOnly={restrictToUnassignedOnly}
              selfParticipantId={selfParticipantId}
            />
          </div>
        )}
        {renderItemCards({ items, ...cardProps })}
      </div>
    </CollapsibleSection>
  );
}
