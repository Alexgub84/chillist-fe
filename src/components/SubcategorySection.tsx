import {
  Disclosure,
  DisclosureButton,
  DisclosurePanel,
} from '@headlessui/react';
import type { Item } from '../core/schemas/item';
import type { Participant } from '../core/schemas/participant';
import { renderItemCards, type ItemListRendererProps } from './renderItemCards';
import BulkAssignButton from './BulkAssignButton';

export interface SubcategorySectionProps {
  subcategory: string;
  items: Item[];
  participants: Participant[];
  onBulkAssign?: (itemIds: string[], participantId: string) => void;
  cardProps: Omit<ItemListRendererProps, 'items'>;
}

export default function SubcategorySection({
  subcategory,
  items,
  participants,
  onBulkAssign,
  cardProps,
}: SubcategorySectionProps) {
  return (
    <Disclosure as="div" defaultOpen>
      <DisclosureButton
        as="div"
        className="group w-full px-4 sm:px-5 py-2 bg-gray-50 flex items-center justify-between cursor-pointer hover:bg-gray-100 transition-colors"
      >
        <h4 className="text-sm font-medium text-gray-600">
          {subcategory}
          <span className="ms-2 text-gray-400">({items.length})</span>
        </h4>
        <svg
          className="w-4 h-4 text-gray-400 transition-transform group-data-open:rotate-180"
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
        className="origin-top transition duration-150 ease-out data-closed:-translate-y-4 data-closed:opacity-0"
      >
        <div className="divide-y divide-gray-200">
          {onBulkAssign && participants.length > 0 && (
            <div className="px-4 sm:px-5 py-2 border-b border-gray-100">
              <BulkAssignButton
                items={items}
                participants={participants}
                onAssign={onBulkAssign}
              />
            </div>
          )}
          {renderItemCards({ items, ...cardProps })}
        </div>
      </DisclosurePanel>
    </Disclosure>
  );
}
