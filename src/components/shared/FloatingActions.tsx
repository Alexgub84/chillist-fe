import { useState, useCallback, useEffect } from 'react';
import clsx from 'clsx';
import { useTranslation } from 'react-i18next';

interface FloatingActionsProps {
  onAddItem: () => void;
  onBulkAdd?: () => void;
  onAddExpense?: () => void;
}

interface SpeedDialAction {
  key: string;
  testId: string;
  label: string;
  icon: React.ReactNode;
  onClick: () => void;
}

const PlusIcon = (
  <path
    strokeLinecap="round"
    strokeLinejoin="round"
    strokeWidth={2.5}
    d="M12 4v16m8-8H4"
  />
);

const ClipboardIcon = (
  <path
    strokeLinecap="round"
    strokeLinejoin="round"
    strokeWidth={2}
    d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"
  />
);

const CurrencyIcon = (
  <path
    strokeLinecap="round"
    strokeLinejoin="round"
    strokeWidth={2}
    d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
  />
);

export default function FloatingActions({
  onAddItem,
  onBulkAdd,
  onAddExpense,
}: FloatingActionsProps) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);

  const hasMultipleActions = !!(onBulkAdd || onAddExpense);

  const handleMainClick = useCallback(() => {
    if (hasMultipleActions) {
      setOpen((prev) => !prev);
    } else {
      onAddItem();
    }
  }, [hasMultipleActions, onAddItem]);

  const handleAction = useCallback((callback: () => void) => {
    setOpen(false);
    callback();
  }, []);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open]);

  const actions: SpeedDialAction[] = [];

  actions.push({
    key: 'add-item',
    testId: 'add-item-fab',
    label: t('items.addItemLabel'),
    icon: PlusIcon,
    onClick: () => handleAction(onAddItem),
  });

  if (onBulkAdd) {
    actions.push({
      key: 'bulk-add',
      testId: 'bulk-add-fab',
      label: t('items.bulkAdd'),
      icon: ClipboardIcon,
      onClick: () => handleAction(onBulkAdd),
    });
  }

  if (onAddExpense) {
    actions.push({
      key: 'add-expense',
      testId: 'add-expense-fab',
      label: t('expenses.addExpense'),
      icon: CurrencyIcon,
      onClick: () => handleAction(onAddExpense),
    });
  }

  return (
    <div className="fixed inset-0 z-40 pointer-events-none">
      {open && (
        <div
          data-testid="speed-dial-backdrop"
          className="absolute inset-0 bg-black/20 pointer-events-auto"
          onClick={() => setOpen(false)}
        />
      )}

      <div className="absolute bottom-6 end-4 sm:end-6 flex flex-col-reverse items-end gap-3">
        <button
          type="button"
          data-testid="speed-dial-trigger"
          onClick={handleMainClick}
          className="pointer-events-auto flex items-center justify-center w-14 h-14 bg-green-600 text-white rounded-full shadow-lg hover:bg-green-700 active:bg-green-800 hover:shadow-xl transition-all cursor-pointer"
          aria-expanded={hasMultipleActions ? open : undefined}
          aria-label={t('items.addItemLabel')}
        >
          <svg
            className={clsx(
              'w-6 h-6 transition-transform duration-200',
              open && 'rotate-45'
            )}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2.5}
              d="M12 4v16m8-8H4"
            />
          </svg>
        </button>

        {hasMultipleActions &&
          open &&
          actions.map((action, index) => (
            <div
              key={action.key}
              className="flex items-center gap-2 pointer-events-auto animate-speed-dial-in"
              style={{ animationDelay: `${index * 50}ms` }}
            >
              <span className="rounded-lg bg-gray-800 px-2.5 py-1 text-xs font-medium text-white shadow-lg whitespace-nowrap">
                {action.label}
              </span>
              <button
                type="button"
                data-testid={action.testId}
                onClick={action.onClick}
                className="flex items-center justify-center w-10 h-10 rounded-full bg-white text-green-700 border border-green-300 shadow-md hover:bg-green-50 active:bg-green-100 transition-colors cursor-pointer"
                aria-label={action.label}
              >
                <svg
                  className="w-5 h-5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  aria-hidden="true"
                >
                  {action.icon}
                </svg>
              </button>
            </div>
          ))}
      </div>
    </div>
  );
}
