import {
  Disclosure,
  DisclosureButton,
  DisclosurePanel,
} from '@headlessui/react';
import type { Item, ItemCategory } from '../core/schemas/item';
import ItemCard from './ItemCard';

const CATEGORY_LABELS: Record<ItemCategory, string> = {
  equipment: 'Equipment',
  food: 'Food',
};

interface CategorySectionProps {
  category: ItemCategory;
  items: Item[];
}

export default function CategorySection({
  category,
  items,
}: CategorySectionProps) {
  const label = CATEGORY_LABELS[category];

  return (
    <Disclosure
      as="div"
      defaultOpen
      className="bg-white rounded-lg shadow-sm overflow-hidden"
    >
      <DisclosureButton className="group w-full px-4 sm:px-5 py-3 sm:py-4 flex items-center justify-between cursor-pointer hover:bg-gray-50 active:bg-gray-100 transition-colors">
        <h3 className="text-base sm:text-lg font-semibold text-gray-800">
          {label}
          {items.length > 0 && (
            <span className="ml-2 text-sm font-normal text-gray-500">
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
            {items.map((item) => (
              <ItemCard key={item.itemId} item={item} />
            ))}
          </div>
        ) : (
          <div className="border-t border-gray-200 px-4 sm:px-5 py-3 sm:py-4 text-center">
            <p className="text-sm sm:text-base text-gray-500">
              No {label.toLowerCase()} items
            </p>
          </div>
        )}
      </DisclosurePanel>
    </Disclosure>
  );
}
