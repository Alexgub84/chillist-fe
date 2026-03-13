import clsx from 'clsx';
import toast from 'react-hot-toast';
import { useTranslation } from 'react-i18next';
import type { Participant } from '../core/schemas/participant';
import { copyInviteLink, shareInviteLink } from '../core/invite';

function avatarBorderColor(role: Participant['role']) {
  if (role === 'viewer') return 'border-gray-300';
  return 'border-emerald-400';
}

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

function inviteStatusBadge(status: Participant['inviteStatus'] | undefined) {
  if (status === 'accepted') return 'bg-emerald-100 text-emerald-700';
  if (status === 'invited') return 'bg-green-500/15 text-green-700';
  return 'bg-gray-100 text-gray-500';
}

export interface ManageParticipantsListProps {
  participants: Participant[];
  planId: string;
  planTitle: string;
  isOwner?: boolean;
  onMakeOwner?: (participantId: string) => void;
}

export function ManageParticipantsList({
  participants,
  planId,
  planTitle,
  isOwner = false,
  onMakeOwner,
}: ManageParticipantsListProps) {
  const { t } = useTranslation();

  if (participants.length === 0) {
    return null;
  }

  return (
    <div className="space-y-2">
      {participants.map((p) => (
        <div
          key={p.participantId}
          className="flex items-center justify-between bg-gray-50 rounded-lg px-3 sm:px-4 py-2 sm:py-3"
        >
          <div className="flex items-center gap-3 min-w-0">
            <div
              className={clsx(
                'w-8 h-8 rounded-full border-2 bg-white flex items-center justify-center text-xs font-bold text-gray-600 shrink-0',
                avatarBorderColor(p.role)
              )}
            >
              {p.name.charAt(0)}
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <p className="text-sm sm:text-base font-medium text-gray-800 truncate">
                  {p.name} {p.lastName}
                </p>
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
                {isOwner && p.role !== 'owner' && p.inviteStatus && (
                  <span
                    data-testid={`invite-status-${p.participantId}`}
                    className={clsx(
                      'inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full shrink-0',
                      inviteStatusBadge(p.inviteStatus)
                    )}
                  >
                    <svg
                      className="w-3.5 h-3.5"
                      viewBox="0 0 24 24"
                      fill="currentColor"
                      aria-hidden="true"
                    >
                      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                    </svg>
                    {t(`inviteStatus.${p.inviteStatus}`)}
                  </span>
                )}
              </div>
              {p.contactPhone && (
                <p className="text-xs text-gray-500 truncate">
                  {p.contactPhone}
                </p>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            {p.inviteToken && p.role !== 'owner' && (
              <>
                <button
                  type="button"
                  title={t('invite.copyLink')}
                  onClick={async () => {
                    const copied = await copyInviteLink(planId, p.inviteToken!);
                    if (copied) {
                      toast.success(t('invite.copied'));
                    }
                  }}
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
                  onClick={async () => {
                    const result = await shareInviteLink(
                      planId,
                      p.inviteToken!,
                      planTitle
                    );
                    if (result === 'copied') {
                      toast.success(t('invite.copied'));
                    }
                  }}
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
            {isOwner && p.role !== 'owner' && onMakeOwner && (
              <button
                type="button"
                onClick={() => onMakeOwner(p.participantId)}
                data-testid="make-owner"
                className="text-amber-600 hover:text-amber-700 text-sm font-medium shrink-0"
              >
                {t('participantDetails.makeOwner')}
              </button>
            )}
            <span
              className={clsx(
                'text-xs font-medium px-2 py-0.5 rounded-full',
                roleBadgeColor(p.role)
              )}
            >
              {t(`roles.${p.role}`)}
            </span>
          </div>
        </div>
      ))}
    </div>
  );
}
