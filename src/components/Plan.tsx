import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import type { PlanWithDetails } from '../core/schemas/plan';
import Modal from './shared/Modal';
import LocationMap from './LocationMap';

function formatDateShort(iso: string): string {
  const d = new Date(iso);
  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year = d.getFullYear();
  return `${day}.${month}.${year}`;
}

interface PlanProps {
  plan: PlanWithDetails;
  isOwner?: boolean;
  onEdit?: () => void;
  onDelete?: () => void;
  isDeleting?: boolean;
}

export function Plan({
  plan,
  isOwner = false,
  onEdit,
  onDelete,
  isDeleting = false,
}: PlanProps) {
  const { t } = useTranslation();
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const { title, description, startDate, endDate, participants, location } =
    plan;
  const owners = participants.filter((p) => p.role === 'owner');
  const owner = owners[0];

  return (
    <div className="w-full">
      <div className="space-y-4 sm:space-y-5">
        <h1
          data-testid="plan-details-title"
          className="text-xl sm:text-2xl font-bold text-gray-800 line-clamp-2"
        >
          {title}
        </h1>

        <div className="flex flex-col sm:flex-row sm:items-start gap-4 sm:gap-8">
          <div className="flex-1 min-w-0">
            <p className="text-xs font-medium text-blue-500 uppercase tracking-wider mb-1">
              {t('plan.description')}
            </p>
            <p className="text-sm sm:text-base text-gray-700 line-clamp-3">
              {description || t('plan.na')}
            </p>
          </div>

          {owner && (
            <div className="shrink-0">
              <p className="text-xs font-medium text-blue-500 uppercase tracking-wider mb-1">
                {t('plan.owner')}
              </p>
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full border-2 border-emerald-400 bg-white flex items-center justify-center text-xs font-bold text-gray-600 shrink-0">
                  {owner.name.charAt(0)}
                </div>
                <span className="text-sm sm:text-base font-medium text-gray-800">
                  {owner.name} {owner.lastName}
                </span>
              </div>
            </div>
          )}
        </div>

        <div className="flex gap-8 sm:gap-12">
          <div>
            <p className="text-xs font-medium text-blue-500 uppercase tracking-wider mb-1">
              {t('plan.start')}
            </p>
            <p className="text-sm sm:text-base font-semibold text-gray-800">
              {startDate ? formatDateShort(startDate) : t('plan.na')}
            </p>
          </div>
          <div>
            <p className="text-xs font-medium text-blue-500 uppercase tracking-wider mb-1">
              {t('plan.end')}
            </p>
            <p className="text-sm sm:text-base font-semibold text-gray-800">
              {endDate ? formatDateShort(endDate) : t('plan.na')}
            </p>
          </div>
        </div>

        {location && (
          <div>
            <p className="text-xs font-medium text-blue-500 uppercase tracking-wider mb-2">
              {t('plan.location')}
            </p>
            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
              {location.latitude != null && location.longitude != null && (
                <LocationMap
                  latitude={location.latitude}
                  longitude={location.longitude}
                />
              )}
              <div className="flex-1 min-w-0">
                <p className="text-sm sm:text-base font-semibold text-gray-800">
                  {location.name}
                </p>
                {(location.city || location.region || location.country) && (
                  <p className="text-xs text-gray-500 mt-0.5">
                    {[location.city, location.region, location.country]
                      .filter(Boolean)
                      .join(', ')}
                  </p>
                )}
              </div>
            </div>
          </div>
        )}

        {isOwner && (onEdit || onDelete) && (
          <div className="border-t border-gray-200 pt-4 flex gap-3">
            {onEdit && (
              <button
                type="button"
                data-testid="edit-plan-button"
                onClick={onEdit}
                className="px-4 py-2 text-sm font-medium text-blue-600 border border-blue-200 rounded-lg hover:bg-blue-50 active:bg-blue-100 transition-colors"
              >
                {t('plan.edit')}
              </button>
            )}
            {onDelete && (
              <button
                type="button"
                onClick={() => setShowDeleteConfirm(true)}
                className="px-4 py-2 text-sm font-medium text-red-600 border border-red-200 rounded-lg hover:bg-red-50 active:bg-red-100 transition-colors"
              >
                {t('plan.delete')}
              </button>
            )}
          </div>
        )}
      </div>

      <Modal
        open={showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(false)}
        title={t('plan.deleteConfirmTitle')}
      >
        <div className="px-4 sm:px-6 pb-4 sm:pb-6 space-y-4">
          <p className="text-sm text-gray-600">
            {t('plan.deleteConfirmMessage')}
          </p>
          <div className="flex gap-3">
            <button
              type="button"
              disabled={isDeleting}
              onClick={() => {
                onDelete?.();
              }}
              className="flex-1 px-4 py-2 bg-red-600 text-white font-semibold rounded-lg hover:bg-red-700 active:bg-red-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm"
            >
              {isDeleting ? t('plan.deleting') : t('plan.deleteConfirm')}
            </button>
            <button
              type="button"
              disabled={isDeleting}
              onClick={() => setShowDeleteConfirm(false)}
              className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 font-semibold rounded-lg hover:bg-gray-50 active:bg-gray-100 disabled:opacity-50 transition-colors text-sm"
            >
              {t('plan.deleteCancel')}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
