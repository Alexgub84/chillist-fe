import clsx from 'clsx';
import type { ItemStatus } from '../core/schemas/item';

const STATUS_OPTIONS: {
  value: ItemStatus | null;
  label: string;
  activeBg: string;
  activeText: string;
}[] = [
  {
    value: null,
    label: 'All',
    activeBg: 'bg-gray-800',
    activeText: 'text-white',
  },
  {
    value: 'pending',
    label: 'Pending',
    activeBg: 'bg-yellow-100',
    activeText: 'text-yellow-800',
  },
  {
    value: 'purchased',
    label: 'Purchased',
    activeBg: 'bg-blue-100',
    activeText: 'text-blue-800',
  },
  {
    value: 'packed',
    label: 'Packed',
    activeBg: 'bg-green-100',
    activeText: 'text-green-800',
  },
  {
    value: 'canceled',
    label: 'Canceled',
    activeBg: 'bg-gray-200',
    activeText: 'text-gray-600',
  },
];

interface StatusFilterProps {
  selected: ItemStatus | null;
  onChange: (status: ItemStatus | null) => void;
  counts: Record<ItemStatus, number>;
  total: number;
}

export default function StatusFilter({
  selected,
  onChange,
  counts,
  total,
}: StatusFilterProps) {
  return (
    <div
      className="flex flex-wrap gap-2"
      role="group"
      aria-label="Filter by status"
    >
      {STATUS_OPTIONS.map((option) => {
        const isActive = selected === option.value;
        const count = option.value === null ? total : counts[option.value];

        return (
          <button
            key={option.value ?? 'all'}
            type="button"
            onClick={() => onChange(option.value)}
            className={clsx(
              'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium transition-colors cursor-pointer',
              isActive
                ? [option.activeBg, option.activeText]
                : 'bg-white text-gray-600 border border-gray-300 hover:bg-gray-50 active:bg-gray-100'
            )}
            aria-pressed={isActive}
          >
            {option.label}
            <span
              className={clsx(
                'text-xs tabular-nums',
                isActive ? 'opacity-75' : 'text-gray-400'
              )}
            >
              {count}
            </span>
          </button>
        );
      })}
    </div>
  );
}
