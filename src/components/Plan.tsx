import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import clsx from 'clsx';
import { useTranslation } from 'react-i18next';
import type { PlanWithDetails } from '../core/schemas/plan';
import type {
  Participant,
  ParticipantCreate,
} from '../core/schemas/participant';
import { FormLabel } from './shared/FormLabel';
import { FormInput } from './shared/FormInput';
import Modal from './shared/Modal';
import LocationMap from './LocationMap';

function formatDateShort(iso: string): string {
  const d = new Date(iso);
  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year = d.getFullYear();
  return `${day}.${month}.${year}`;
}

function avatarBorderColor(role: Participant['role']) {
  if (role === 'viewer') return 'border-gray-300';
  return 'border-emerald-400';
}

function roleBadgeColor(role: Participant['role']) {
  if (role === 'owner') return 'bg-amber-100 text-amber-800';
  if (role === 'viewer') return 'bg-gray-100 text-gray-600';
  return 'bg-blue-100 text-blue-700';
}

const addParticipantSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  contactPhone: z.string().min(1, 'Phone is required'),
  contactEmail: z.string().optional(),
});

type AddParticipantFormValues = z.infer<typeof addParticipantSchema>;

function AddParticipantForm({
  onSubmit,
  onCancel,
  isSubmitting,
}: {
  onSubmit: (values: ParticipantCreate) => void | Promise<void>;
  onCancel: () => void;
  isSubmitting: boolean;
}) {
  const { t } = useTranslation();
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<AddParticipantFormValues>({
    resolver: zodResolver(addParticipantSchema),
    defaultValues: {
      name: '',
      lastName: '',
      contactPhone: '',
      contactEmail: '',
    },
  });

  async function handleFormSubmit(values: AddParticipantFormValues) {
    await onSubmit({
      name: values.name.trim(),
      lastName: values.lastName.trim(),
      contactPhone: values.contactPhone.trim(),
      contactEmail: values.contactEmail?.trim() || undefined,
    });
  }

  return (
    <form
      onSubmit={handleSubmit(handleFormSubmit)}
      className="bg-gray-50 rounded-lg p-3 sm:p-4 space-y-3"
    >
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <FormLabel>{t('addParticipant.firstName')}</FormLabel>
          <FormInput
            {...register('name')}
            placeholder={t('addParticipant.firstNamePlaceholder')}
            compact
          />
          {errors.name && (
            <p className="text-sm text-red-600 mt-1">{errors.name.message}</p>
          )}
        </div>
        <div>
          <FormLabel>{t('addParticipant.lastName')}</FormLabel>
          <FormInput
            {...register('lastName')}
            placeholder={t('addParticipant.lastNamePlaceholder')}
            compact
          />
          {errors.lastName && (
            <p className="text-sm text-red-600 mt-1">
              {errors.lastName.message}
            </p>
          )}
        </div>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <FormLabel>{t('addParticipant.phone')}</FormLabel>
          <FormInput
            {...register('contactPhone')}
            placeholder={t('addParticipant.phonePlaceholder')}
            compact
          />
          {errors.contactPhone && (
            <p className="text-sm text-red-600 mt-1">
              {errors.contactPhone.message}
            </p>
          )}
        </div>
        <div>
          <FormLabel>{t('addParticipant.email')}</FormLabel>
          <FormInput
            {...register('contactEmail')}
            placeholder={t('addParticipant.emailPlaceholder')}
            compact
          />
        </div>
      </div>
      <div className="flex gap-3 pt-1">
        <button
          type="submit"
          disabled={isSubmitting}
          className="flex-1 px-4 py-2 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 active:bg-blue-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm"
        >
          {isSubmitting
            ? t('addParticipant.submitting')
            : t('addParticipant.submit')}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 border border-gray-300 text-gray-700 font-semibold rounded-lg hover:bg-gray-50 active:bg-gray-100 transition-colors text-sm"
        >
          {t('addParticipant.cancel')}
        </button>
      </div>
    </form>
  );
}

interface PlanProps {
  plan: PlanWithDetails;
  onAddParticipant?: (participant: ParticipantCreate) => Promise<void>;
  isAddingParticipant?: boolean;
  isOwner?: boolean;
  onDelete?: () => void;
  isDeleting?: boolean;
}

export function Plan({
  plan,
  onAddParticipant,
  isAddingParticipant = false,
  isOwner = false,
  onDelete,
  isDeleting = false,
}: PlanProps) {
  const { t } = useTranslation();
  const [showManageModal, setShowManageModal] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const { title, description, startDate, endDate, participants, location } =
    plan;
  const owner = participants.find((p) => p.role === 'owner');

  async function handleAddParticipant(participant: ParticipantCreate) {
    if (!onAddParticipant) return;
    await onAddParticipant(participant);
    setShowAddForm(false);
  }

  return (
    <div className="w-full">
      <div className="bg-white rounded-xl shadow-sm p-4 sm:p-6 space-y-4 sm:space-y-5">
        <h1 className="text-xl sm:text-2xl font-bold text-gray-800 line-clamp-2">
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

        <div>
          <p className="text-xs font-medium text-blue-500 uppercase tracking-wider mb-2">
            {t('plan.participants')} ({participants.length})
          </p>
          <div className="flex items-center gap-2">
            <div className="flex -space-x-1 rtl:space-x-reverse">
              {participants.map((p) => (
                <div
                  key={p.participantId}
                  title={`${p.name} ${p.lastName}`}
                  className={clsx(
                    'w-9 h-9 rounded-full border-2 bg-white flex items-center justify-center text-xs font-bold text-gray-600',
                    avatarBorderColor(p.role)
                  )}
                >
                  {p.name.charAt(0)}
                </div>
              ))}
              {onAddParticipant && (
                <button
                  type="button"
                  onClick={() => {
                    setShowAddForm(true);
                    setShowManageModal(true);
                  }}
                  title={t('plan.addParticipant')}
                  className="w-9 h-9 rounded-full border-2 border-dashed border-gray-300 bg-white flex items-center justify-center text-gray-400 hover:border-blue-400 hover:text-blue-500 transition-colors"
                >
                  +
                </button>
              )}
            </div>
            <button
              type="button"
              onClick={() => setShowManageModal(true)}
              className="ms-2 px-4 py-1.5 border border-gray-300 text-gray-600 rounded-full text-sm font-medium hover:bg-gray-50 active:bg-gray-100 transition-colors"
            >
              {t('plan.manage')}
            </button>
          </div>
        </div>

        {isOwner && onDelete && (
          <div className="border-t border-gray-200 pt-4">
            <button
              type="button"
              onClick={() => setShowDeleteConfirm(true)}
              className="px-4 py-2 text-sm font-medium text-red-600 border border-red-200 rounded-lg hover:bg-red-50 active:bg-red-100 transition-colors"
            >
              {t('plan.delete')}
            </button>
          </div>
        )}
      </div>

      <Modal
        open={showManageModal}
        onClose={() => {
          setShowManageModal(false);
          setShowAddForm(false);
        }}
        title={t('plan.participants')}
      >
        <div className="px-4 sm:px-6 pb-4 sm:pb-6 space-y-3">
          {participants.length > 0 && (
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
                      <p className="text-sm sm:text-base font-medium text-gray-800 truncate">
                        {p.name} {p.lastName}
                      </p>
                      {p.contactPhone && (
                        <p className="text-xs text-gray-500 truncate">
                          {p.contactPhone}
                        </p>
                      )}
                    </div>
                  </div>
                  <span
                    className={clsx(
                      'text-xs font-medium px-2 py-0.5 rounded-full shrink-0',
                      roleBadgeColor(p.role)
                    )}
                  >
                    {t(`roles.${p.role}`)}
                  </span>
                </div>
              ))}
            </div>
          )}

          {participants.length === 0 && !showAddForm && (
            <p className="text-gray-500 text-sm">{t('plan.noParticipants')}</p>
          )}

          {onAddParticipant &&
            (showAddForm ? (
              <AddParticipantForm
                onSubmit={handleAddParticipant}
                onCancel={() => setShowAddForm(false)}
                isSubmitting={isAddingParticipant}
              />
            ) : (
              <button
                type="button"
                onClick={() => setShowAddForm(true)}
                className="w-full px-4 py-2 border-2 border-dashed border-gray-300 text-gray-600 rounded-lg hover:border-blue-400 hover:text-blue-600 transition-colors text-sm font-medium"
              >
                {t('plan.addParticipant')}
              </button>
            ))}
        </div>
      </Modal>

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
