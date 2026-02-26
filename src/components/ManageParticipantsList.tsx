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
