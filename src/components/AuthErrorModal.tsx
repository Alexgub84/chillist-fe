import { useTranslation } from 'react-i18next';
import { useNavigate } from '@tanstack/react-router';
import Modal from './shared/Modal';

interface AuthErrorModalProps {
  open: boolean;
  onDismiss: () => void;
}

export default function AuthErrorModal({
  open,
  onDismiss,
}: AuthErrorModalProps) {
  const { t } = useTranslation();
  const navigate = useNavigate();

  function handleSignIn() {
    onDismiss();
    navigate({ to: '/sign-in' });
  }

  return (
    <Modal open={open} onClose={onDismiss} title={t('auth.sessionExpired')}>
      <div className="px-4 sm:px-6 pb-4 sm:pb-6">
        <p className="text-gray-600 mb-6">{t('auth.sessionExpiredMessage')}</p>
        <div className="flex flex-col-reverse sm:flex-row gap-3 sm:justify-end">
          <button
            type="button"
            onClick={onDismiss}
            className="w-full sm:w-auto px-4 py-2.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            {t('auth.dismiss')}
          </button>
          <button
            type="button"
            onClick={handleSignIn}
            className="w-full sm:w-auto px-4 py-2.5 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors"
          >
            {t('auth.signIn')}
          </button>
        </div>
      </div>
    </Modal>
  );
}
