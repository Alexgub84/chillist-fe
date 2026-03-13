import clsx from 'clsx';
import toast from 'react-hot-toast';
import { useTranslation } from 'react-i18next';
import type { Participant } from '../core/schemas/participant';
import { copyInviteLink, shareInviteLink } from '../core/invite';
import CollapsibleSection from './shared/CollapsibleSection';

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
  currentParticipantId?: string;
  onEditPreferences?: (participantId: string) => void;
  onMakeOwner?: (participantId: string) => void;
  onSendList?: (participantId: string) => void;
  onSendListAll?: () => void;
  onSendListToMe?: () => void;
  isSendingList?: boolean;
}

export default function ParticipantDetails({
  participants,
  planId,
  planTitle,
  isOwner = false,
  currentParticipantId,
  onEditPreferences,
  onMakeOwner,
  onSendList,
  onSendListAll,
  onSendListToMe,
  isSendingList = false,
}: ParticipantDetailsProps) {
  const { t } = useTranslation();
  const keepOpenForE2E = import.meta.env.VITE_E2E === 'true';

  if (participants.length === 0) return null;

  return (
    <CollapsibleSection
      title={
        <h2 className="text-lg sm:text-xl font-semibold text-gray-800">
          {t('participantDetails.title')}
          <span className="ms-2 text-sm font-normal text-gray-500">
            ({participants.length})
          </span>
        </h2>
      }
      wrapperClassName="bg-white rounded-lg shadow-sm overflow-hidden"
      forceOpen={keepOpenForE2E}
      panelContentClassName="border-t border-gray-200 p-4 sm:p-5 space-y-3"
    >
      {onSendListAll && (
        <div className="flex justify-end mb-1">
          <button
            type="button"
            data-testid="send-list-all-btn"
            onClick={onSendListAll}
            disabled={isSendingList}
            className="inline-flex items-center gap-1.5 text-sm font-medium text-green-700 hover:text-green-800 disabled:opacity-50"
          >
            <WhatsAppIconSmall />
            {isSendingList ? t('sendList.sending') : t('sendList.sendToAll')}
          </button>
        </div>
      )}
      {participants.map((p) => {
        const canEdit = isOwner || p.participantId === currentParticipantId;
        const isMe = p.participantId === currentParticipantId;
        return (
          <ParticipantCard
            key={p.participantId}
            participant={p}
            planId={planId}
            planTitle={planTitle}
            isOwner={isOwner}
            onEdit={
              canEdit && onEditPreferences
                ? () => onEditPreferences(p.participantId)
                : undefined
            }
            onMakeOwner={
              isOwner && p.role !== 'owner' && onMakeOwner
                ? () => onMakeOwner(p.participantId)
                : undefined
            }
            onSendList={
              isOwner && onSendList && p.role !== 'owner'
                ? () => onSendList(p.participantId)
                : undefined
            }
            onSendListToMe={
              !isOwner && isMe && onSendListToMe ? onSendListToMe : undefined
            }
            isSendingList={isSendingList}
          />
        );
      })}
    </CollapsibleSection>
  );
}

function WhatsAppIconSmall({ className = 'w-4 h-4' }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden="true"
    >
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
    </svg>
  );
}

function ParticipantCard({
  participant: p,
  planId,
  planTitle,
  isOwner,
  onEdit,
  onMakeOwner,
  onSendList,
  onSendListToMe,
  isSendingList,
}: {
  participant: Participant;
  planId: string;
  planTitle: string;
  isOwner: boolean;
  onEdit?: () => void;
  onMakeOwner?: () => void;
  onSendList?: () => void;
  onSendListToMe?: () => void;
  isSendingList?: boolean;
}) {
  const { t } = useTranslation();
  const filled = hasPreferences(p);

  const peopleParts: string[] = [];
  if (p.adultsCount != null && p.adultsCount > 0) {
    const key =
      p.adultsCount === 1
        ? 'participantDetails.adult'
        : 'participantDetails.adults';
    peopleParts.push(t(key, { count: p.adultsCount }));
  }
  if (p.kidsCount != null && p.kidsCount > 0) {
    const key =
      p.kidsCount === 1 ? 'participantDetails.kid' : 'participantDetails.kids';
    peopleParts.push(t(key, { count: p.kidsCount }));
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

  const hasActions =
    (p.inviteToken && p.role !== 'owner') || onEdit || onMakeOwner;
  const showWhatsApp = onSendList || onSendListToMe;

  return (
    <div className="bg-white rounded-lg shadow-sm p-4 sm:p-5">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-3">
        <div className="flex items-center gap-3 min-w-0">
          <div
            className={clsx(
              'w-9 h-9 rounded-full border-2 bg-white flex items-center justify-center text-xs font-bold text-gray-600 shrink-0',
              avatarBorderColor(p.role)
            )}
          >
            {p.name.charAt(0)}
          </div>
          <div className="flex flex-col min-w-0">
            <span className="text-sm sm:text-base font-medium text-gray-800 wrap-break-word">
              {p.name} {p.lastName}
            </span>
            <div className="flex items-center gap-2 mt-0.5">
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
              {isOwner && p.role !== 'owner' && p.inviteStatus && (
                <span
                  data-testid={`invite-status-${p.participantId}`}
                  className={clsx(
                    'inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full shrink-0',
                    inviteStatusBadge(p.inviteStatus)
                  )}
                >
                  <WhatsAppIconSmall className="w-3.5 h-3.5" />
                  {t(`inviteStatus.${p.inviteStatus}`)}
                </span>
              )}
            </div>
          </div>
        </div>
        {hasActions && (
          <div className="flex items-center gap-2 ps-12 sm:ps-0 sm:ms-2 shrink-0">
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
                {(onEdit || onMakeOwner) && (
                  <span className="w-px h-4 bg-gray-200" aria-hidden="true" />
                )}
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
            {onEdit && onMakeOwner && (
              <span className="w-px h-4 bg-gray-200" aria-hidden="true" />
            )}
            {onMakeOwner && (
              <button
                type="button"
                onClick={onMakeOwner}
                data-testid="make-owner"
                className="text-amber-600 hover:text-amber-700 text-sm font-medium shrink-0"
              >
                {t('participantDetails.makeOwner')}
              </button>
            )}
          </div>
        )}
      </div>

      {showWhatsApp && (
        <div className="flex justify-end mt-2">
          <button
            type="button"
            data-testid={
              onSendList ? `send-list-${p.participantId}` : 'send-list-to-me'
            }
            onClick={onSendList || onSendListToMe}
            disabled={isSendingList}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-white bg-green-600 rounded-lg hover:bg-green-700 active:bg-green-800 disabled:opacity-50 transition-colors"
          >
            <WhatsAppIconSmall className="w-4 h-4" />
            {isSendingList
              ? t('sendList.sending')
              : onSendListToMe
                ? t('sendList.sendToMe')
                : t('sendList.sendTo')}
          </button>
        </div>
      )}

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
