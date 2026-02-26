import { useTranslation } from 'react-i18next';
import Modal from './shared/Modal';

interface BulkAssignDialogProps {
  open: boolean;
  onClose: () => void;
  participantName: string;
  conflictCount: number;
  totalCount: number;
  onAssignAll: () => void;
  onOnlyUnassigned: () => void;
}

export default function BulkAssignDialog({
  open,
  onClose,
  participantName,
  conflictCount,
  totalCount,
  onAssignAll,
  onOnlyUnassigned,
}: BulkAssignDialogProps) {
  const { t } = useTranslation();

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={t('items.bulkAssignConflictTitle')}
    >
      <div className="px-4 sm:px-6 pb-4 sm:pb-6">
        <p className="text-sm text-gray-600 mb-6">
          {t('items.bulkAssignConflictMessage', {
            conflictCount,
            totalCount,
            name: participantName,
          })}
        </p>

        <div className="flex flex-col gap-2 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={onClose}
            className="w-full sm:w-auto px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            {t('items.cancel')}
          </button>
          <button
            type="button"
            onClick={() => {
              onOnlyUnassigned();
              onClose();
            }}
            className="w-full sm:w-auto px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-lg hover:bg-gray-200 transition-colors"
          >
            {t('items.bulkAssignOnlyUnassigned')}
          </button>
          <button
            type="button"
            onClick={() => {
              onAssignAll();
              onClose();
            }}
            className="w-full sm:w-auto px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors"
          >
            {t('items.bulkAssignAll')}
          </button>
        </div>
      </div>
    </Modal>
  );
}
