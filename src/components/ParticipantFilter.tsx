import clsx from 'clsx';
import { useTranslation } from 'react-i18next';
import type { Participant } from '../core/schemas/participant';

interface ParticipantFilterProps {
  participants: Participant[];
  selected: string | null;
  onChange: (participantId: string | null) => void;
  counts: Record<string, number>;
  total: number;
}

export default function ParticipantFilter({
  participants,
  selected,
  onChange,
  counts,
  total,
}: ParticipantFilterProps) {
  const { t } = useTranslation();
  return (
    <div
      className="flex flex-wrap gap-2"
      role="group"
      aria-label="Filter by participant"
    >
      <button
        type="button"
        onClick={() => onChange(null)}
        className={clsx(
          'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium transition-colors cursor-pointer',
          selected === null
            ? 'bg-gray-800 text-white'
            : 'bg-white text-gray-600 border border-gray-300 hover:bg-gray-50 active:bg-gray-100'
        )}
        aria-pressed={selected === null}
      >
        {t('filters.all')}
        <span
          className={clsx(
            'text-xs tabular-nums',
            selected === null ? 'opacity-75' : 'text-gray-400'
          )}
        >
          {total}
        </span>
      </button>

      <button
        type="button"
        onClick={() => onChange('unassigned')}
        className={clsx(
          'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium transition-colors cursor-pointer',
          selected === 'unassigned'
            ? 'bg-gray-200 text-gray-700'
            : 'bg-white text-gray-600 border border-gray-300 hover:bg-gray-50 active:bg-gray-100'
        )}
        aria-pressed={selected === 'unassigned'}
      >
        {t('items.unassigned')}
        <span
          className={clsx(
            'text-xs tabular-nums',
            selected === 'unassigned' ? 'opacity-75' : 'text-gray-400'
          )}
        >
          {counts['unassigned'] ?? 0}
        </span>
      </button>

      {participants.map((p) => {
        const isActive = selected === p.participantId;
        const count = counts[p.participantId] ?? 0;

        return (
          <button
            key={p.participantId}
            type="button"
            onClick={() => onChange(p.participantId)}
            className={clsx(
              'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium transition-colors cursor-pointer',
              isActive
                ? 'bg-indigo-100 text-indigo-800'
                : 'bg-white text-gray-600 border border-gray-300 hover:bg-gray-50 active:bg-gray-100'
            )}
            aria-pressed={isActive}
          >
            {p.name} {p.lastName}
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
