import clsx from 'clsx';
import { useTranslation } from 'react-i18next';
import type { Participant } from '../core/schemas/participant';

function roleBadgeColor(role: Participant['role']) {
  if (role === 'owner') return 'bg-amber-100 text-amber-800';
  if (role === 'viewer') return 'bg-gray-100 text-gray-600';
  return 'bg-blue-100 text-blue-700';
}

function avatarBorderColor(role: Participant['role']) {
  if (role === 'viewer') return 'border-gray-300';
  return 'border-emerald-400';
}

function hasPreferences(p: Participant): boolean {
  return !!(
    p.adultsCount ||
    p.kidsCount ||
    p.foodPreferences ||
    p.allergies ||
    p.notes
  );
}

interface ParticipantDetailsProps {
  participants: Participant[];
  onEditPreferences?: (participantId: string) => void;
}

export default function ParticipantDetails({
  participants,
  onEditPreferences,
}: ParticipantDetailsProps) {
  const { t } = useTranslation();

  if (participants.length === 0) return null;

  return (
    <div>
      <h2 className="text-lg sm:text-xl font-semibold text-gray-800 mb-3 sm:mb-4">
        {t('participantDetails.title')}
        <span className="ms-2 text-sm font-normal text-gray-500">
          ({participants.length})
        </span>
      </h2>
      <div className="space-y-3">
        {participants.map((p) => (
          <ParticipantCard
            key={p.participantId}
            participant={p}
            onEdit={
              onEditPreferences
                ? () => onEditPreferences(p.participantId)
                : undefined
            }
          />
        ))}
      </div>
    </div>
  );
}

function ParticipantCard({
  participant: p,
  onEdit,
}: {
  participant: Participant;
  onEdit?: () => void;
}) {
  const { t } = useTranslation();
  const filled = hasPreferences(p);

  const peopleParts: string[] = [];
  if (p.adultsCount != null && p.adultsCount > 0) {
    peopleParts.push(t('participantDetails.adults', { count: p.adultsCount }));
  }
  if (p.kidsCount != null && p.kidsCount > 0) {
    peopleParts.push(t('participantDetails.kids', { count: p.kidsCount }));
  }

  const foodParts: string[] = [];
  if (p.foodPreferences) foodParts.push(p.foodPreferences);
  if (p.allergies) foodParts.push(p.allergies);

  return (
    <div className="bg-white rounded-lg shadow-sm p-4 sm:p-5">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-3 min-w-0">
          <div
            className={clsx(
              'w-9 h-9 rounded-full border-2 bg-white flex items-center justify-center text-xs font-bold text-gray-600 shrink-0',
              avatarBorderColor(p.role)
            )}
          >
            {p.name.charAt(0)}
          </div>
          <div className="flex items-center gap-2 min-w-0">
            <span className="text-sm sm:text-base font-medium text-gray-800 truncate">
              {p.name} {p.lastName}
            </span>
            <span
              className={clsx(
                'text-xs font-medium px-2 py-0.5 rounded-full shrink-0',
                roleBadgeColor(p.role)
              )}
            >
              {t(`roles.${p.role}`)}
            </span>
          </div>
        </div>
        {onEdit && (
          <button
            type="button"
            onClick={onEdit}
            className="text-blue-500 hover:text-blue-700 text-sm font-medium shrink-0 ms-2"
          >
            {t('participantDetails.edit')}
          </button>
        )}
      </div>

      {!filled && (
        <p className="text-sm text-gray-400 italic">
          {t('participantDetails.notFilled')}
        </p>
      )}

      {filled && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 sm:gap-4">
          {peopleParts.length > 0 && (
            <div>
              <p className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-0.5">
                {t('participantDetails.people')}
              </p>
              <p className="text-sm text-gray-700">{peopleParts.join(', ')}</p>
            </div>
          )}
          {foodParts.length > 0 && (
            <div>
              <p className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-0.5">
                {t('participantDetails.food')}
              </p>
              <p className="text-sm text-gray-700">{foodParts.join(' · ')}</p>
            </div>
          )}
          {p.notes && (
            <div>
              <p className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-0.5">
                {t('participantDetails.notes')}
              </p>
              <p className="text-sm text-gray-700">{p.notes}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
