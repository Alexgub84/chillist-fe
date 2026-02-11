import clsx from 'clsx';
import type { Item } from '../core/schemas/item';

const STATUS_CONFIG: Record<
  Item['status'],
  { label: string; bg: string; text: string }
> = {
  pending: { label: 'Pending', bg: 'bg-yellow-100', text: 'text-yellow-800' },
  purchased: {
    label: 'Purchased',
    bg: 'bg-blue-100',
    text: 'text-blue-800',
  },
  packed: { label: 'Packed', bg: 'bg-green-100', text: 'text-green-800' },
  canceled: { label: 'Canceled', bg: 'bg-gray-100', text: 'text-gray-500' },
};

interface ItemCardProps {
  item: Item;
  onEdit?: () => void;
}

export default function ItemCard({ item, onEdit }: ItemCardProps) {
  const status = STATUS_CONFIG[item.status];
  const isCanceled = item.status === 'canceled';

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
            <span
              className={clsx(
                'text-xs sm:text-sm',
                isCanceled ? 'text-gray-400' : 'text-gray-600'
              )}
            >
              {item.quantity} {item.unit}
            </span>
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

        <span
          className={clsx(
            'shrink-0 inline-flex items-center px-2 sm:px-2.5 py-0.5 rounded-full text-xs font-medium',
            status.bg,
            status.text
          )}
        >
          {status.label}
        </span>
      </div>
    </div>
  );
}
