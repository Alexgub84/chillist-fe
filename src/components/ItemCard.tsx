import { useMemo, useState } from 'react';
import clsx from 'clsx';
import { useTranslation } from 'react-i18next';
import type { ItemPatch } from '../core/schemas/item';
import type { Participant } from '../core/schemas/participant';
import type { ListFilter } from '../core/schemas/plan-search';
import { STATUS_OPTIONS, UNIT_OPTIONS } from '../core/constants/item';
import {
  ALL_PARTICIPANTS_VALUE,
  buildParticipantOptions,
} from '../core/utils-plan-items';
import type { DisplayItem } from '../core/utils-plan-items';
import InlineSelect from './shared/InlineSelect';
import InlineQuantityInput from './shared/InlineQuantityInput';

const STATUS_ACCENT: Record<string, string> = {
  pending: 'border-l-amber-400',
  purchased: 'border-l-blue-400',
  packed: 'border-l-green-400',
  canceled: 'border-l-gray-300',
};

interface QuickActionConfig {
  targetStatus: 'purchased' | 'packed';
  accentColor: string;
}

const QUICK_ACTIONS: Record<string, QuickActionConfig> = {
  buying: {
    targetStatus: 'purchased',
    accentColor: 'accent-blue-500',
  },
  packing: {
    targetStatus: 'packed',
    accentColor: 'accent-green-500',
  },
};

interface ItemCardProps {
  item: DisplayItem;
  participants?: Participant[];
  listFilter?: ListFilter | null;
  selfAssignParticipantId?: string;
  canEdit?: boolean;
  onEdit?: () => void;
  onUpdate?: (updates: ItemPatch) => void;
}

export default function ItemCard({
  item,
  participants = [],
  listFilter,
  selfAssignParticipantId,
  canEdit = true,
  onEdit,
  onUpdate,
}: ItemCardProps) {
  const { t } = useTranslation();
  const isEditable = canEdit && !!onUpdate;

  const resolvedStatusOptions = useMemo(
    () => STATUS_OPTIONS.map((s) => ({ ...s, label: t(s.labelKey) })),
    [t]
  );
  const resolvedUnitOptions = useMemo(
    () => UNIT_OPTIONS.map((u) => ({ ...u, label: t(u.labelKey) })),
    [t]
  );

  const statusOption = resolvedStatusOptions.find(
    (s) => s.value === item.status
  );
  const isCanceled = item.status === 'canceled';
  const isEquipment = item.category === 'equipment';
  const quickAction =
    listFilter && listFilter in QUICK_ACTIONS
      ? QUICK_ACTIONS[listFilter]
      : null;
  const [isChecking, setIsChecking] = useState(false);

  const assignedParticipant = useMemo(
    () =>
      participants.find((p) => p.participantId === item.assignedParticipantId),
    [participants, item.assignedParticipantId]
  );

  const assignmentOptions = useMemo(
    () =>
      buildParticipantOptions(
        participants,
        {
          unassigned: t('items.unassigned'),
          allParticipants: t('items.allParticipants'),
        },
        { includeUnassigned: true, includeAll: true }
      ),
    [participants, t]
  );

  function handleCheck() {
    if (!onUpdate || !quickAction || isChecking) return;
    setIsChecking(true);
    setTimeout(() => {
      onUpdate({ status: quickAction.targetStatus });
    }, 300);
  }

  const isAssignedToMe =
    !!selfAssignParticipantId &&
    item.assignedParticipantId === selfAssignParticipantId;

  function renderSelfAssign() {
    if (!onUpdate || !selfAssignParticipantId) return null;

    if (isAssignedToMe) {
      return (
        <span className="inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-xs sm:text-sm font-medium bg-indigo-50 text-indigo-700 border border-indigo-200">
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
          {t('items.assignedToMe')}
          <button
            type="button"
            onClick={() => onUpdate({ assignedParticipantId: null })}
            className="ms-0.5 text-indigo-400 hover:text-indigo-700 transition-colors"
            aria-label={t('items.unassignItem', { name: item.name })}
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
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </span>
      );
    }

    if (item.assignedParticipantId && assignedParticipant) {
      return (
        <span className="inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-xs sm:text-sm font-medium bg-gray-100 text-gray-500 border border-gray-200">
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
          {assignedParticipant.name} {assignedParticipant.lastName}
        </span>
      );
    }

    return (
      <button
        type="button"
        onClick={() =>
          onUpdate({ assignedParticipantId: selfAssignParticipantId })
        }
        className="inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-xs sm:text-sm font-medium bg-blue-50 text-blue-600 border border-dashed border-blue-300 hover:bg-blue-100 hover:border-blue-400 transition-colors cursor-pointer"
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
            d="M12 4v16m8-8H4"
          />
        </svg>
        {t('items.assignToMe')}
      </button>
    );
  }

  if (quickAction && isEditable) {
    return (
      <label
        data-testid={`item-card-${item.itemId}`}
        data-scroll-item-id={item.itemId}
        className={clsx(
          'border-l-4 px-4 sm:px-5 py-3 sm:py-4 flex items-center gap-3 cursor-pointer transition-all duration-300 hover:bg-gray-50/80 select-none',
          STATUS_ACCENT[item.status] ?? 'border-l-gray-300',
          isChecking && 'opacity-40'
        )}
      >
        <input
          type="checkbox"
          checked={isChecking}
          onChange={handleCheck}
          className={clsx(
            'h-5 w-5 shrink-0 rounded cursor-pointer',
            quickAction.accentColor
          )}
        />

        <div className="flex-1 min-w-0">
          <span
            className={clsx(
              'text-sm sm:text-base font-semibold transition-all duration-300',
              isChecking ? 'line-through text-gray-400' : 'text-gray-900'
            )}
          >
            {item.name}
          </span>

          <div className="flex flex-wrap items-center gap-2 mt-1">
            <span className="inline-flex items-center rounded-md px-2 py-0.5 text-xs sm:text-sm font-medium bg-gray-100 text-gray-600">
              {item.quantity} {t(`units.${item.unit}`)}
            </span>

            {item.notes && (
              <span className="inline-flex items-center rounded-md bg-gray-50 px-2 py-0.5 text-xs sm:text-sm text-gray-500 truncate max-w-[180px] sm:max-w-xs border border-gray-200">
                {item.notes}
              </span>
            )}

            {item.isAllParticipants ? (
              <span className="inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-xs sm:text-sm font-medium bg-purple-50 text-purple-700 border border-purple-200">
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
                    d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                  />
                </svg>
                {t('items.allParticipants')}
              </span>
            ) : isAssignedToMe ? (
              <span className="inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-xs sm:text-sm font-medium bg-indigo-50 text-indigo-700 border border-indigo-200">
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
                {t('items.assignedToMe')}
              </span>
            ) : (
              assignedParticipant && (
                <span className="inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-xs sm:text-sm font-medium bg-indigo-50 text-indigo-700 border border-indigo-200">
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
                  {assignedParticipant.name} {assignedParticipant.lastName}
                </span>
              )
            )}
          </div>
        </div>
      </label>
    );
  }

  return (
    <div
      data-testid={`item-card-${item.itemId}`}
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
          {isEditable ? (
            <InlineSelect
              value={item.status}
              onChange={(status) => onUpdate!({ status })}
              options={resolvedStatusOptions}
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
              {statusOption?.label ?? t(`itemStatus.${item.status}`)}
            </span>
          )}

          {isEditable && onEdit && (
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

          {isEditable && !isCanceled && (
            <button
              type="button"
              onClick={() => onUpdate!({ status: 'canceled' })}
              className="inline-flex items-center justify-center w-8 h-8 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
              aria-label={`Cancel ${item.name}`}
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
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          )}
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        {isEditable ? (
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
              onChange={(quantity) => onUpdate!({ quantity })}
              className="text-xs sm:text-sm font-medium"
            />
            <InlineSelect
              value={item.unit}
              onChange={(unit) => onUpdate!({ unit })}
              options={resolvedUnitOptions}
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
            {item.quantity} {t(`units.${item.unit}`)}
          </span>
        )}

        {item.notes && (
          <span className="inline-flex items-center rounded-md bg-gray-50 px-2 py-0.5 text-xs sm:text-sm text-gray-500 truncate max-w-[180px] sm:max-w-xs border border-gray-200">
            {item.notes}
          </span>
        )}

        {selfAssignParticipantId && onUpdate
          ? renderSelfAssign()
          : participants.length > 0 && (
              <>
                {isEditable ? (
                  <InlineSelect
                    value={
                      item.isAllParticipants
                        ? ALL_PARTICIPANTS_VALUE
                        : (item.assignedParticipantId ?? '')
                    }
                    onChange={(value) => {
                      if (value === ALL_PARTICIPANTS_VALUE) {
                        onUpdate!({ assignedToAll: true });
                      } else if (item.isAllParticipants) {
                        onUpdate!({
                          assignedToAll: false,
                          assignedParticipantId: value || null,
                        });
                      } else {
                        onUpdate!({
                          assignedParticipantId: value || null,
                        });
                      }
                    }}
                    options={assignmentOptions}
                    buttonClassName={clsx(
                      'inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-xs sm:text-sm font-medium transition-colors',
                      item.isAllParticipants
                        ? 'bg-purple-50 text-purple-700 border border-purple-200'
                        : item.assignedParticipantId
                          ? 'bg-indigo-50 text-indigo-700 border border-indigo-200'
                          : 'bg-gray-50 text-gray-400 border border-dashed border-gray-300 hover:border-gray-400'
                    )}
                    ariaLabel={`Assign ${item.name} to participant`}
                  />
                ) : (
                  <span
                    className={clsx(
                      'inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-xs sm:text-sm font-medium',
                      item.isAllParticipants
                        ? 'bg-purple-50 text-purple-700 border border-purple-200'
                        : assignedParticipant
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
                        d={
                          item.isAllParticipants
                            ? 'M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z'
                            : 'M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z'
                        }
                      />
                    </svg>
                    {item.isAllParticipants
                      ? t('items.allParticipants')
                      : assignedParticipant
                        ? `${assignedParticipant.name} ${assignedParticipant.lastName}`
                        : t('items.unassigned')}
                  </span>
                )}
              </>
            )}
      </div>
    </div>
  );
}
