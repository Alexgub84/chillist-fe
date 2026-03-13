import { useState, useCallback, useEffect } from 'react';
import clsx from 'clsx';
import { useTranslation } from 'react-i18next';

interface FloatingActionsProps {
  onAddItem: () => void;
  onBulkAdd?: () => void;
  onAddExpense?: () => void;
  onSendList?: () => void;
  sendListLabel?: string;
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

const WhatsAppIcon = (
  <path
    fill="currentColor"
    stroke="none"
    d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"
  />
);

export default function FloatingActions({
  onAddItem,
  onBulkAdd,
  onAddExpense,
  onSendList,
  sendListLabel,
}: FloatingActionsProps) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);

  const hasMultipleActions = !!(onBulkAdd || onAddExpense || onSendList);

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

  if (onSendList) {
    actions.push({
      key: 'send-list',
      testId: 'send-list-fab',
      label: sendListLabel || t('sendList.button'),
      icon: WhatsAppIcon,
      onClick: () => handleAction(onSendList),
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
