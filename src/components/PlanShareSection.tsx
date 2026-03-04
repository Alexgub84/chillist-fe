import { useTranslation } from 'react-i18next';

interface PlanShareSectionProps {
  onCopy: () => void | Promise<void>;
  onShare: () => void | Promise<void>;
}

export default function PlanShareSection({
  onCopy,
  onShare,
}: PlanShareSectionProps) {
  const { t } = useTranslation();

  return (
    <div
      data-testid="plan-share-section"
      className="shrink-0 mt-2 rounded-xl border border-gray-200 bg-white p-4 sm:p-5 shadow-sm space-y-3"
    >
      <div>
        <p className="text-sm font-medium text-gray-800">
          {t('invite.inviteFriendInstruction')}
        </p>
        <p className="text-xs text-gray-500 mt-0.5">
          {t('invite.shareCopyInstruction')}
        </p>
      </div>
      <div className="flex items-center gap-3">
        <button
          type="button"
          data-testid="copy-plan-url-button"
          title={t('invite.copyLink')}
          onClick={onCopy}
          className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-600 hover:text-blue-600 transition-colors rounded-lg hover:bg-blue-50 border border-gray-200 hover:border-blue-200"
        >
          <svg
            className="w-4 h-4 shrink-0"
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
          <span>{t('invite.copyLink')}</span>
        </button>
        <button
          type="button"
          data-testid="share-plan-url-button"
          title={t('invite.shareLink')}
          onClick={onShare}
          className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-600 hover:text-blue-600 transition-colors rounded-lg hover:bg-blue-50 border border-gray-200 hover:border-blue-200"
        >
          <svg
            className="w-4 h-4 shrink-0"
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
          <span>{t('invite.shareLink')}</span>
        </button>
      </div>
    </div>
  );
}
