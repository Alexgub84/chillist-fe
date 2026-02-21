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

function formatDateTime(iso: string): { date: string; time: string } {
  const d = new Date(iso);
  const date = d.toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
  const time = d.toLocaleTimeString(undefined, {
    hour: '2-digit',
    minute: '2-digit',
  });
  return { date, time };
}

function DetailRow({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1">
      <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">
        {label}
      </p>
      <div className="text-sm sm:text-base text-gray-700">{children}</div>
    </div>
  );
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
}

export function Plan({
  plan,
  onAddParticipant,
  isAddingParticipant = false,
}: PlanProps) {
  const { t } = useTranslation();
  const [showForm, setShowForm] = useState(false);

  const {
    title,
    description,
    status,
    visibility,
    startDate,
    endDate,
    location,
    participants,
  } = plan;

  const start = startDate ? formatDateTime(startDate) : null;
  const end = endDate ? formatDateTime(endDate) : null;

  const owner = participants.find((p) => p.role === 'owner');

  async function handleAddParticipant(participant: ParticipantCreate) {
    if (!onAddParticipant) return;
    await onAddParticipant(participant);
    setShowForm(false);
  }

  return (
    <div className="w-full">
      <div className="bg-white rounded-lg shadow-sm">
        <div className="px-3 sm:px-6 lg:px-8 py-3 sm:py-6 border-b border-gray-200">
          <h1 className="text-xl sm:text-3xl lg:text-4xl font-bold text-gray-800 mb-2 line-clamp-2">
            {title}
          </h1>
          {description && (
            <p className="text-gray-600 text-sm sm:text-base lg:text-lg mt-2 line-clamp-3">
              {description}
            </p>
          )}
        </div>

        <div className="px-3 sm:px-6 lg:px-8 py-3 sm:py-6">
          <h2 className="text-base sm:text-lg lg:text-xl font-semibold text-gray-700 mb-4">
            {t('plan.details')}
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 lg:gap-6">
            <DetailRow label={t('plan.status')}>
              <span className="font-medium">{t(`planStatus.${status}`)}</span>
            </DetailRow>

            <DetailRow label={t('plan.visibility')}>
              <span className="font-medium">
                {visibility ? t(`planVisibility.${visibility}`) : t('plan.na')}
              </span>
            </DetailRow>

            {owner && (
              <DetailRow label={t('plan.owner')}>
                <span className="font-medium">
                  {owner.name} {owner.lastName}
                </span>
              </DetailRow>
            )}

            <DetailRow label={t('plan.start')}>
              {start ? (
                <span>
                  {start.date}{' '}
                  <span className="text-gray-500">{start.time}</span>
                </span>
              ) : (
                t('plan.na')
              )}
            </DetailRow>

            <DetailRow label={t('plan.end')}>
              {end ? (
                <span>
                  {end.date} <span className="text-gray-500">{end.time}</span>
                </span>
              ) : (
                t('plan.na')
              )}
            </DetailRow>

            {location && (
              <DetailRow label={t('plan.location')}>
                <span className="font-medium">{location.name}</span>
                {(location.city || location.country) && (
                  <span className="text-gray-500 ms-1">
                    —{' '}
                    {[location.city, location.region, location.country]
                      .filter(Boolean)
                      .join(', ')}
                  </span>
                )}
              </DetailRow>
            )}
          </div>
        </div>

        <div className="px-3 sm:px-6 lg:px-8 py-3 sm:py-6 border-t border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base sm:text-lg lg:text-xl font-semibold text-gray-700">
              {t('plan.participants')}
              <span className="ms-2 text-sm font-normal text-gray-500">
                ({participants.length})
              </span>
            </h2>
          </div>

          {participants.length > 0 && (
            <div className="space-y-2 mb-4">
              {participants.map((p) => (
                <div
                  key={p.participantId}
                  className="flex items-center justify-between bg-gray-50 rounded-lg px-3 sm:px-4 py-2 sm:py-3"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-8 h-8 rounded-full bg-gray-300 flex items-center justify-center text-xs font-bold text-gray-600 shrink-0">
                      {p.name.charAt(0)}
                      {p.lastName.charAt(0)}
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

          {participants.length === 0 && !showForm && (
            <p className="text-gray-500 text-sm mb-4">
              {t('plan.noParticipants')}
            </p>
          )}

          {onAddParticipant &&
            (showForm ? (
              <AddParticipantForm
                onSubmit={handleAddParticipant}
                onCancel={() => setShowForm(false)}
                isSubmitting={isAddingParticipant}
              />
            ) : (
              <button
                type="button"
                onClick={() => setShowForm(true)}
                className="w-full px-4 py-2 border-2 border-dashed border-gray-300 text-gray-600 rounded-lg hover:border-blue-400 hover:text-blue-600 transition-colors text-sm font-medium"
              >
                {t('plan.addParticipant')}
              </button>
            ))}
        </div>
      </div>
    </div>
  );
}
