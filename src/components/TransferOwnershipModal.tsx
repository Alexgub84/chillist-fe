import { useTranslation } from 'react-i18next';
import Modal from './shared/Modal';

interface TransferOwnershipModalProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  participantName: string;
  isPending: boolean;
}

export default function TransferOwnershipModal({
  open,
  onClose,
  onConfirm,
  participantName,
  isPending,
}: TransferOwnershipModalProps) {
  const { t } = useTranslation();

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={t('participantDetails.addOwnerTitle')}
      testId="add-owner-dialog"
    >
      <div className="px-4 sm:px-6 pb-4 sm:pb-6 space-y-4">
        <p className="text-sm text-gray-600">
          {t('participantDetails.addOwnerMessage', {
            name: participantName,
          })}
        </p>
        <div className="flex gap-3">
          <button
            type="button"
            data-testid="transfer-ownership-confirm"
            disabled={isPending}
            onClick={onConfirm}
            className="flex-1 px-4 py-2 bg-amber-600 text-white font-semibold rounded-lg hover:bg-amber-700 active:bg-amber-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm"
          >
            {t('participantDetails.addOwnerConfirm')}
          </button>
          <button
            type="button"
            disabled={isPending}
            onClick={onClose}
            className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 font-semibold rounded-lg hover:bg-gray-50 active:bg-gray-100 disabled:opacity-50 transition-colors text-sm"
          >
            {t('participantDetails.addOwnerCancel')}
          </button>
        </div>
      </div>
    </Modal>
  );
}
