import { useMemo } from 'react';
import clsx from 'clsx';
import type { Item, ItemPatch } from '../core/schemas/item';
import type { Participant } from '../core/schemas/participant';
import { STATUS_OPTIONS, UNIT_OPTIONS } from '../core/constants/item';
import InlineSelect from './shared/InlineSelect';
import InlineQuantityInput from './shared/InlineQuantityInput';

const STATUS_ACCENT: Record<string, string> = {
  pending: 'border-l-amber-400',
  purchased: 'border-l-blue-400',
  packed: 'border-l-green-400',
  canceled: 'border-l-gray-300',
};

interface ItemCardProps {
  item: Item;
  participants?: Participant[];
  onEdit?: () => void;
  onUpdate?: (updates: ItemPatch) => void;
}

export default function ItemCard({
  item,
  participants = [],
  onEdit,
  onUpdate,
}: ItemCardProps) {
  const statusOption = STATUS_OPTIONS.find((s) => s.value === item.status);
  const isCanceled = item.status === 'canceled';
  const isEquipment = item.category === 'equipment';

  const assignedParticipant = useMemo(
    () =>
      participants.find((p) => p.participantId === item.assignedParticipantId),
    [participants, item.assignedParticipantId]
  );

  const assignmentOptions = useMemo(() => {
    const opts = [{ value: '', label: 'Unassigned' }];
    for (const p of participants) {
      opts.push({
        value: p.participantId,
        label: `${p.name} ${p.lastName}`,
      });
    }
    return opts;
  }, [participants]);

  return (
    <div
      data-scroll-item-id={item.itemId}
      className={clsx(
        'border-l-4 px-4 sm:px-5 py-3 sm:py-4 transition-colors hover:bg-gray-50/80',
        STATUS_ACCENT[item.status] ?? 'border-l-gray-300'
      )}
    >
      <div className="flex items-center justify-between gap-3 mb-2">
        <span
          className={clsx(
            'text-sm sm:text-base font-semibold truncate',
            isCanceled ? 'text-gray-400 line-through' : 'text-gray-900'
          )}
        >
          {item.name}
        </span>

        <div className="flex items-center gap-2 shrink-0">
          {onUpdate ? (
            <InlineSelect
              value={item.status}
              onChange={(status) => onUpdate({ status })}
              options={STATUS_OPTIONS}
              buttonClassName={clsx(
                'inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium hover:opacity-80 transition-opacity',
                statusOption?.bg,
                statusOption?.text
              )}
              ariaLabel={`Change status for ${item.name}`}
            />
          ) : (
            <span
              className={clsx(
                'inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium',
                statusOption?.bg,
                statusOption?.text
              )}
            >
              {statusOption?.label ?? item.status}
            </span>
          )}

          {onEdit && (
            <button
              type="button"
              onClick={onEdit}
              className="inline-flex items-center justify-center w-8 h-8 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors cursor-pointer"
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
            </button>
          )}
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        {onUpdate ? (
          <span
            className={clsx(
              'inline-flex items-center gap-1 rounded-md px-2 py-0.5',
              isCanceled
                ? 'bg-gray-100 text-gray-400'
                : 'bg-gray-100 text-gray-700'
            )}
          >
            <InlineQuantityInput
              value={item.quantity}
              onChange={(quantity) => onUpdate({ quantity })}
              className="text-xs sm:text-sm font-medium"
            />
            <InlineSelect
              value={item.unit}
              onChange={(unit) => onUpdate({ unit })}
              options={UNIT_OPTIONS}
              disabled={isEquipment}
              buttonClassName={clsx(
                'text-xs sm:text-sm font-medium',
                !isEquipment && 'hover:bg-gray-200 rounded px-0.5'
              )}
              ariaLabel={`Change unit for ${item.name}`}
            />
          </span>
        ) : (
          <span
            className={clsx(
              'inline-flex items-center rounded-md px-2 py-0.5 text-xs sm:text-sm font-medium',
              isCanceled
                ? 'bg-gray-100 text-gray-400'
                : 'bg-gray-100 text-gray-700'
            )}
          >
            {item.quantity} {item.unit}
          </span>
        )}

        {item.notes && (
          <span className="inline-flex items-center rounded-md bg-gray-50 px-2 py-0.5 text-xs sm:text-sm text-gray-500 truncate max-w-[180px] sm:max-w-xs border border-gray-200">
            {item.notes}
          </span>
        )}

        {participants.length > 0 && (
          <>
            {onUpdate ? (
              <InlineSelect
                value={item.assignedParticipantId ?? ''}
                onChange={(participantId) =>
                  onUpdate({
                    assignedParticipantId: participantId || null,
                  })
                }
                options={assignmentOptions}
                buttonClassName={clsx(
                  'inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-xs sm:text-sm font-medium transition-colors',
                  item.assignedParticipantId
                    ? 'bg-indigo-50 text-indigo-700 border border-indigo-200'
                    : 'bg-gray-50 text-gray-400 border border-dashed border-gray-300 hover:border-gray-400'
                )}
                ariaLabel={`Assign ${item.name} to participant`}
              />
            ) : (
              <span
                className={clsx(
                  'inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-xs sm:text-sm font-medium',
                  assignedParticipant
                    ? 'bg-indigo-50 text-indigo-700 border border-indigo-200'
                    : 'bg-gray-50 text-gray-400 border border-dashed border-gray-300'
                )}
              >
                <svg
                  className="w-3 h-3"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  aria-hidden="true"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                  />
                </svg>
                {assignedParticipant
                  ? `${assignedParticipant.name} ${assignedParticipant.lastName}`
                  : 'Unassigned'}
              </span>
            )}
          </>
        )}
      </div>
    </div>
  );
}
