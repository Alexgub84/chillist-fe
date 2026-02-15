import clsx from 'clsx';
import type { ListFilter } from '../core/schemas/plan-search';

interface ListTabOption {
  value: ListFilter | null;
  label: string;
  icon: React.ReactNode;
  activeBg: string;
  activeText: string;
  activeBorder: string;
}

const ShoppingCartIcon = () => (
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
      d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 100 4 2 2 0 000-4z"
    />
  </svg>
);

const BoxIcon = () => (
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
      d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
    />
  </svg>
);

const UserPlusIcon = () => (
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
      d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z"
    />
  </svg>
);

const ListIcon = () => (
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
      d="M4 6h16M4 10h16M4 14h16M4 18h16"
    />
  </svg>
);

const LIST_TABS: ListTabOption[] = [
  {
    value: null,
    label: 'All',
    icon: <ListIcon />,
    activeBg: 'bg-gray-800',
    activeText: 'text-white',
    activeBorder: 'border-gray-800',
  },
  {
    value: 'buying',
    label: 'Buying List',
    icon: <ShoppingCartIcon />,
    activeBg: 'bg-amber-50',
    activeText: 'text-amber-700',
    activeBorder: 'border-amber-300',
  },
  {
    value: 'packing',
    label: 'Packing List',
    icon: <BoxIcon />,
    activeBg: 'bg-blue-50',
    activeText: 'text-blue-700',
    activeBorder: 'border-blue-300',
  },
  {
    value: 'assigning',
    label: 'Assigning List',
    icon: <UserPlusIcon />,
    activeBg: 'bg-violet-50',
    activeText: 'text-violet-700',
    activeBorder: 'border-violet-300',
  },
];

interface ListTabsProps {
  selected: ListFilter | null;
  onChange: (filter: ListFilter | null) => void;
  counts: Record<ListFilter, number>;
  total: number;
}

export default function ListTabs({
  selected,
  onChange,
  counts,
  total,
}: ListTabsProps) {
  return (
    <div
      className="inline-flex rounded-xl border border-gray-200 bg-gray-50 p-1 gap-1"
      role="tablist"
      aria-label="Filter items by list"
    >
      {LIST_TABS.map((tab) => {
        const isActive = selected === tab.value;
        const count = tab.value === null ? total : counts[tab.value];

        return (
          <button
            key={tab.value ?? 'all'}
            type="button"
            role="tab"
            onClick={() => onChange(tab.value)}
            className={clsx(
              'inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-all cursor-pointer',
              isActive
                ? [
                    tab.activeBg,
                    tab.activeText,
                    'shadow-sm border',
                    tab.activeBorder,
                  ]
                : 'text-gray-500 hover:text-gray-700 hover:bg-white border border-transparent'
            )}
            aria-selected={isActive}
          >
            {tab.icon}
            <span className="hidden sm:inline">{tab.label}</span>
            <span
              className={clsx(
                'inline-flex items-center justify-center min-w-5 h-5 px-1.5 rounded-full text-xs font-semibold tabular-nums',
                isActive
                  ? 'bg-white/30 backdrop-blur-sm'
                  : 'bg-gray-200/70 text-gray-500'
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
