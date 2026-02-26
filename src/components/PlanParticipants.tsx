import clsx from 'clsx';
import { useTranslation } from 'react-i18next';
import type { Participant } from '../core/schemas/participant';
import { avatarBorderColor } from './participant-utils';

interface PlanParticipantsProps {
  participants: Participant[];
  isOwner?: boolean;
  onManageClick: () => void;
  onAddClick?: () => void;
}

export function PlanParticipants({
  participants,
  isOwner = false,
  onManageClick,
  onAddClick,
}: PlanParticipantsProps) {
  const { t } = useTranslation();

  return (
    <div>
      <p className="text-xs font-medium text-blue-500 uppercase tracking-wider mb-2">
        {t('plan.participants')} ({participants.length})
      </p>
      <div className="flex items-center gap-2">
        <div className="flex -space-x-1 rtl:space-x-reverse">
          {participants.map((p) => (
            <div
              key={p.participantId}
              title={`${p.name} ${p.lastName}`}
              className={clsx(
                'w-9 h-9 rounded-full border-2 bg-white flex items-center justify-center text-xs font-bold text-gray-600',
                avatarBorderColor(p.role)
              )}
            >
              {p.name.charAt(0)}
            </div>
          ))}
          {onAddClick && (
            <button
              type="button"
              onClick={onAddClick}
              title={t('plan.addParticipant')}
              className="w-9 h-9 rounded-full border-2 border-dashed border-gray-300 bg-white flex items-center justify-center text-gray-400 hover:border-blue-400 hover:text-blue-500 transition-colors"
            >
              +
            </button>
          )}
        </div>
        {isOwner && (
          <button
            type="button"
            onClick={onManageClick}
            className="ms-2 px-4 py-1.5 border border-gray-300 text-gray-600 rounded-full text-sm font-medium hover:bg-gray-50 active:bg-gray-100 transition-colors"
          >
            {t('plan.manage')}
          </button>
        )}
      </div>
    </div>
  );
}
