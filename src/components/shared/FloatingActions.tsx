import clsx from 'clsx';
import { useTranslation } from 'react-i18next';

interface FloatingActionsProps {
  onAddItem: () => void;
  onBulkAdd?: () => void;
  onAddExpense?: () => void;
}

export default function FloatingActions({
  onAddItem,
  onBulkAdd,
  onAddExpense,
}: FloatingActionsProps) {
  const { t } = useTranslation();
  return (
    <div className="fixed bottom-6 inset-x-0 z-40 max-w-4xl mx-auto px-3 sm:px-0 pointer-events-none">
      <div className="flex items-center justify-end gap-2">
        {onAddExpense && (
          <button
            type="button"
            data-testid="add-expense-fab"
            onClick={onAddExpense}
            className="pointer-events-auto flex items-center gap-2 bg-white text-green-700 border border-green-300 rounded-full shadow-lg hover:bg-green-50 active:bg-green-100 hover:shadow-xl transition-colors cursor-pointer px-4 py-3"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <span className="text-sm font-semibold">
              {t('expenses.addExpense')}
            </span>
          </button>
        )}
        {onBulkAdd && (
          <button
            type="button"
            data-testid="bulk-add-fab"
            onClick={onBulkAdd}
            className="pointer-events-auto flex items-center gap-2 bg-white text-green-700 border border-green-300 rounded-full shadow-lg hover:bg-green-50 active:bg-green-100 hover:shadow-xl transition-colors cursor-pointer px-4 py-3"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"
              />
            </svg>
            <span className="text-sm font-semibold">{t('items.bulkAdd')}</span>
          </button>
        )}
        <button
          type="button"
          data-testid="add-item-fab"
          onClick={onAddItem}
          className={clsx(
            'pointer-events-auto flex items-center gap-2 bg-green-600 text-white rounded-full shadow-lg hover:bg-green-700 active:bg-green-800 hover:shadow-xl transition-colors cursor-pointer px-4 py-3',
            !onBulkAdd && 'ms-auto'
          )}
        >
          <svg
            className="w-5 h-5"
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
          <span className="text-sm font-semibold">
            {t('items.addItemLabel')}
          </span>
        </button>
      </div>
    </div>
  );
}
