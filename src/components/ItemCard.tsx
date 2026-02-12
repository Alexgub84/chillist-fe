import clsx from 'clsx';
import type { Item, ItemPatch } from '../core/schemas/item';
import { STATUS_OPTIONS, UNIT_OPTIONS } from '../core/constants/item';
import InlineSelect from './shared/InlineSelect';
import InlineQuantityInput from './shared/InlineQuantityInput';

interface ItemCardProps {
  item: Item;
  onEdit?: () => void;
  onUpdate?: (updates: ItemPatch) => void;
}

export default function ItemCard({ item, onEdit, onUpdate }: ItemCardProps) {
  const statusOption = STATUS_OPTIONS.find((s) => s.value === item.status);
  const isCanceled = item.status === 'canceled';
  const isEquipment = item.category === 'equipment';

  return (
    <div className="px-3 sm:px-5 py-3 sm:py-4">
      <div className="flex items-center justify-between gap-3">
        <div className="flex-1 min-w-0">
          <span
            className={clsx(
              'text-sm sm:text-base font-medium',
              isCanceled ? 'text-gray-400 line-through' : 'text-gray-800'
            )}
          >
            {item.name}
          </span>

          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1">
            {onUpdate ? (
              <span className="inline-flex items-center gap-x-1">
                <InlineQuantityInput
                  value={item.quantity}
                  onChange={(quantity) => onUpdate({ quantity })}
                  className={clsx(
                    'text-xs sm:text-sm',
                    isCanceled ? 'text-gray-400' : 'text-gray-600'
                  )}
                />
                <InlineSelect
                  value={item.unit}
                  onChange={(unit) => onUpdate({ unit })}
                  options={UNIT_OPTIONS}
                  disabled={isEquipment}
                  buttonClassName={clsx(
                    'text-xs sm:text-sm',
                    isCanceled ? 'text-gray-400' : 'text-gray-600',
                    !isEquipment && 'hover:bg-gray-100 px-1'
                  )}
                  ariaLabel={`Change unit for ${item.name}`}
                />
              </span>
            ) : (
              <span
                className={clsx(
                  'text-xs sm:text-sm',
                  isCanceled ? 'text-gray-400' : 'text-gray-600'
                )}
              >
                {item.quantity} {item.unit}
              </span>
            )}
            {item.notes && (
              <span className="text-xs sm:text-sm text-gray-400 truncate max-w-[200px] sm:max-w-xs">
                {item.notes}
              </span>
            )}
          </div>
        </div>

        {onEdit && (
          <button
            type="button"
            onClick={onEdit}
            className="shrink-0 inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-blue-600 bg-blue-50 rounded-lg border border-blue-200 hover:bg-blue-100 hover:text-blue-700 active:bg-blue-200 transition-colors cursor-pointer"
            aria-label={`Edit ${item.name}`}
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
                d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"
              />
            </svg>
            Edit
          </button>
        )}

        {onUpdate ? (
          <InlineSelect
            value={item.status}
            onChange={(status) => onUpdate({ status })}
            options={STATUS_OPTIONS}
            buttonClassName={clsx(
              'shrink-0 inline-flex items-center px-2 sm:px-2.5 py-0.5 rounded-full text-xs font-medium hover:opacity-80',
              statusOption?.bg,
              statusOption?.text
            )}
            ariaLabel={`Change status for ${item.name}`}
          />
        ) : (
          <span
            className={clsx(
              'shrink-0 inline-flex items-center px-2 sm:px-2.5 py-0.5 rounded-full text-xs font-medium',
              statusOption?.bg,
              statusOption?.text
            )}
          >
            {statusOption?.label ?? item.status}
          </span>
        )}
      </div>
    </div>
  );
}
