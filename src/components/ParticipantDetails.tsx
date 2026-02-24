import clsx from 'clsx';
import toast from 'react-hot-toast';
import { useTranslation } from 'react-i18next';
import type { Participant } from '../core/schemas/participant';
import { copyInviteLink, shareInviteLink } from '../core/invite';

function roleBadgeColor(role: Participant['role']) {
  if (role === 'owner') return 'bg-amber-100 text-amber-800';
  if (role === 'viewer') return 'bg-gray-100 text-gray-600';
  return 'bg-blue-100 text-blue-700';
}

function rsvpBadgeColor(status: Participant['rsvpStatus']) {
  if (status === 'confirmed') return 'bg-green-100 text-green-700';
  if (status === 'not_sure') return 'bg-yellow-100 text-yellow-700';
  return 'bg-gray-100 text-gray-500';
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
  planId: string;
  planTitle: string;
  isOwner?: boolean;
  onEditPreferences?: (participantId: string) => void;
}

export default function ParticipantDetails({
  participants,
  planId,
  planTitle,
  isOwner = false,
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
            planId={planId}
            planTitle={planTitle}
            isOwner={isOwner}
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
  planId,
  planTitle,
  isOwner,
  onEdit,
}: {
  participant: Participant;
  planId: string;
  planTitle: string;
  isOwner: boolean;
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

  async function handleCopy() {
    if (!p.inviteToken) return;
    const copied = await copyInviteLink(planId, p.inviteToken);
    if (copied) {
      toast.success(t('invite.copied'));
    }
  }

  async function handleShare() {
    if (!p.inviteToken) return;
    const result = await shareInviteLink(planId, p.inviteToken, planTitle);
    if (result === 'copied') {
      toast.success(t('invite.copied'));
    }
  }

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
            {isOwner && p.role !== 'owner' && (
              <span
                className={clsx(
                  'text-xs font-medium px-2 py-0.5 rounded-full shrink-0',
                  rsvpBadgeColor(p.rsvpStatus)
                )}
              >
                {t(`rsvpStatus.${p.rsvpStatus}`)}
              </span>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0 ms-2">
          {p.inviteToken && p.role !== 'owner' && (
            <>
              <button
                type="button"
                title={t('invite.copyLink')}
                onClick={handleCopy}
                className="p-1.5 text-gray-400 hover:text-blue-500 transition-colors rounded-md hover:bg-blue-50"
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
                    d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
                  />
                </svg>
              </button>
              <button
                type="button"
                title={t('invite.shareLink')}
                onClick={handleShare}
                className="p-1.5 text-gray-400 hover:text-blue-500 transition-colors rounded-md hover:bg-blue-50"
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
                    d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z"
                  />
                </svg>
              </button>
            </>
          )}
          {onEdit && (
            <button
              type="button"
              onClick={onEdit}
              className="text-blue-500 hover:text-blue-700 text-sm font-medium shrink-0"
            >
              {t('participantDetails.edit')}
            </button>
          )}
        </div>
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
