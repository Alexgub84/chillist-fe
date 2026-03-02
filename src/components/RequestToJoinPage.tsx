import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useTranslation } from 'react-i18next';
import { useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import clsx from 'clsx';
import { useAuth } from '../contexts/useAuth';
import { useLanguage } from '../contexts/useLanguage';
import { createJoinRequest } from '../core/api';
import { getApiErrorMessage } from '../core/error-utils';
import {
  splitFullName,
  parseExistingPhone,
  updateUserProfile,
} from '../core/profile-utils';
import { combinePhone } from '../data/country-codes';
import type { NotParticipantResponse } from '../core/schemas/plan';
import type { JoinRequest } from '../core/schemas/join-request';
import ProfileFields from './shared/ProfileFields';
import PreferencesFields from './shared/PreferencesFields';

function formatDateShort(iso: string): string {
  const d = new Date(iso);
  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year = d.getFullYear();
  return `${day}.${month}.${year}`;
}

function buildJoinRequestSchema(t: (key: string) => string) {
  return z.object({
    firstName: z.string().min(1, 'Name is required').max(255),
    lastName: z.string().min(1, 'Last name is required').max(255),
    phoneCountry: z.string().optional().or(z.literal('')),
    phone: z.string().min(1, 'Phone is required').max(50),
    email: z.string().optional().or(z.literal('')),
    adultsCount: z.coerce
      .number({ invalid_type_error: t('validation.adultsCountInvalid') })
      .int()
      .min(1, t('validation.adultsCountMin'))
      .optional(),
    kidsCount: z.coerce
      .number({ invalid_type_error: t('validation.kidsCountInvalid') })
      .int()
      .min(0, t('validation.kidsCountMin'))
      .optional(),
    foodPreferences: z.string().optional(),
    allergies: z.string().optional(),
    notes: z.string().optional(),
  });
}

type JoinRequestFormValues = z.infer<ReturnType<typeof buildJoinRequestSchema>>;

interface RequestToJoinPageProps {
  planId: string;
  response: NotParticipantResponse;
}

export default function RequestToJoinPage({
  planId,
  response,
}: RequestToJoinPageProps) {
  const { preview, joinRequest } = response;

  return (
    <div className="max-w-xl mx-auto px-4 py-6 space-y-6">
      <PlanPreviewCard preview={preview} />
      {joinRequest ? (
        <PendingRequestCard joinRequest={joinRequest} />
      ) : (
        <JoinRequestForm planId={planId} />
      )}
    </div>
  );
}

function PlanPreviewCard({
  preview,
}: {
  preview: NotParticipantResponse['preview'];
}) {
  const { t } = useTranslation();

  return (
    <div
      data-testid="plan-preview-card"
      className="bg-white rounded-xl border border-gray-200 p-5 space-y-3"
    >
      <h1 className="text-xl font-bold text-gray-800">{preview.title}</h1>
      {preview.description && (
        <p className="text-sm text-gray-600">{preview.description}</p>
      )}
      {(preview.startDate || preview.endDate) && (
        <div className="flex gap-8">
          {preview.startDate && (
            <div>
              <p className="text-xs font-medium text-blue-500 uppercase tracking-wider mb-0.5">
                {t('plan.start')}
              </p>
              <p className="text-sm font-semibold text-gray-800">
                {formatDateShort(preview.startDate)}
              </p>
            </div>
          )}
          {preview.endDate && (
            <div>
              <p className="text-xs font-medium text-blue-500 uppercase tracking-wider mb-0.5">
                {t('plan.end')}
              </p>
              <p className="text-sm font-semibold text-gray-800">
                {formatDateShort(preview.endDate)}
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function PendingRequestCard({ joinRequest }: { joinRequest: JoinRequest }) {
  const { t } = useTranslation();

  const statusLabel: Record<string, string> = {
    pending: t('joinRequest.pendingBadge'),
    approved: t('joinRequest.approvedBadge'),
    rejected: t('joinRequest.rejectedBadge'),
  };

  const statusColor: Record<string, string> = {
    pending: 'bg-yellow-100 text-yellow-800',
    approved: 'bg-green-100 text-green-800',
    rejected: 'bg-red-100 text-red-800',
  };

  return (
    <div
      data-testid="join-request-pending-card"
      className="bg-white rounded-xl border border-gray-200 p-5 space-y-3"
    >
      <div className="flex items-center justify-between">
        <h2 className="text-base font-semibold text-gray-800">
          {t('joinRequest.alreadySentTitle')}
        </h2>
        <span
          className={clsx(
            'px-2.5 py-0.5 rounded-full text-xs font-medium',
            statusColor[joinRequest.status] ?? 'bg-gray-100 text-gray-700'
          )}
        >
          {statusLabel[joinRequest.status] ?? joinRequest.status}
        </span>
      </div>
      <p className="text-sm text-gray-600">
        {t('joinRequest.alreadySentMessage')}
      </p>
    </div>
  );
}

function JoinRequestForm({ planId }: { planId: string }) {
  const { t } = useTranslation();
  const { language } = useLanguage();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const metadata = user?.user_metadata ?? {};
  const { first, last } = splitFullName(metadata.full_name as string);
  const existingPhone = parseExistingPhone(
    metadata.phone as string | undefined,
    language
  );
  const firstName = (metadata.first_name as string | undefined) ?? first;
  const lastName = (metadata.last_name as string | undefined) ?? last;

  const schema = buildJoinRequestSchema(t);
  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<JoinRequestFormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      firstName,
      lastName,
      phoneCountry: existingPhone.country,
      phone: existingPhone.local,
      email: user?.email ?? '',
      adultsCount: 1,
      kidsCount: undefined,
      foodPreferences: '',
      allergies: '',
      notes: '',
    },
  });

  async function onSubmit(values: JoinRequestFormValues) {
    setIsSubmitting(true);
    try {
      await createJoinRequest(planId, {
        name: values.firstName.trim(),
        lastName: values.lastName.trim(),
        contactPhone: combinePhone(values.phoneCountry, values.phone),
        contactEmail: values.email?.trim() || undefined,
        adultsCount: values.adultsCount,
        kidsCount: values.kidsCount,
        foodPreferences: values.foodPreferences?.trim() || undefined,
        allergies: values.allergies?.trim() || undefined,
        notes: values.notes?.trim() || undefined,
      });

      await updateUserProfile({
        firstName: values.firstName.trim(),
        lastName: values.lastName.trim(),
        phoneCountry: values.phoneCountry,
        phone: values.phone,
        currentEmail: user?.email,
        newEmail: values.email?.trim() || undefined,
      });

      toast.success(t('joinRequest.successTitle'));
      queryClient.invalidateQueries({ queryKey: ['plan', planId] });
    } catch (err) {
      console.error(
        `[RequestToJoinPage] createJoinRequest failed — planId="${planId}". Error: ${err instanceof Error ? err.message : String(err)}`
      );
      const { title, message } = getApiErrorMessage(
        err instanceof Error ? err : new Error(String(err))
      );
      toast.error(`${title}: ${message}`);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div
      data-testid="join-request-form"
      className="bg-white rounded-xl border border-gray-200 p-5"
    >
      <h2 className="text-base font-semibold text-gray-800 mb-1">
        {t('joinRequest.title')}
      </h2>
      <p className="text-sm text-gray-500 mb-5">{t('joinRequest.subtitle')}</p>

      <form
        onSubmit={handleSubmit(onSubmit)}
        data-testid="join-request-form-element"
        className="space-y-4"
      >
        <ProfileFields
          register={register}
          errors={errors}
          watch={watch}
          setValue={setValue}
          compact
        />

        <div className="border-t border-gray-100 pt-4 space-y-4">
          <PreferencesFields register={register} errors={errors} compact />
        </div>

        <button
          type="submit"
          data-testid="join-request-submit"
          disabled={isSubmitting}
          className="w-full py-2.5 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 active:bg-blue-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm"
        >
          {isSubmitting ? t('joinRequest.submitting') : t('joinRequest.submit')}
        </button>
      </form>
    </div>
  );
}
