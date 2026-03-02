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
  combinePhone,
  detectCountryFromPhone,
  getDefaultCountryByLanguage,
} from '../data/country-codes';
import type { NotParticipantResponse } from '../core/schemas/plan';
import type { JoinRequest } from '../core/schemas/join-request';
import { FormLabel } from './shared/FormLabel';
import { FormInput, FormTextarea } from './shared/FormInput';
import { PhoneInput } from './PhoneInput';

const labelClass = 'block text-sm font-semibold text-gray-700 mb-1';

function formatDateShort(iso: string): string {
  const d = new Date(iso);
  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year = d.getFullYear();
  return `${day}.${month}.${year}`;
}

function parsePhone(
  rawPhone: string | undefined,
  lang: string
): { country: string; local: string } {
  if (!rawPhone)
    return { country: getDefaultCountryByLanguage(lang), local: '' };
  const detected = detectCountryFromPhone(rawPhone);
  if (detected)
    return { country: detected.countryCode, local: detected.localNumber };
  return { country: getDefaultCountryByLanguage(lang), local: rawPhone };
}

const joinRequestFormSchema = z.object({
  name: z.string().min(1, 'Name is required').max(255),
  lastName: z.string().min(1, 'Last name is required').max(255),
  phoneCountry: z.string().optional().or(z.literal('')),
  contactPhone: z.string().min(1, 'Phone is required').max(50),
  contactEmail: z.string().optional().or(z.literal('')),
  adultsCount: z.coerce.number().int().min(1).optional(),
  kidsCount: z.coerce.number().int().min(0).optional(),
  foodPreferences: z.string().optional().or(z.literal('')),
  allergies: z.string().optional().or(z.literal('')),
  notes: z.string().optional().or(z.literal('')),
});

type JoinRequestFormValues = z.infer<typeof joinRequestFormSchema>;

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
  const rawPhone = parsePhone(metadata.phone as string | undefined, language);
  const firstName =
    (metadata.first_name as string | undefined) ??
    (metadata.full_name as string | undefined)?.trim().split(/\s+/)[0] ??
    '';
  const lastName =
    (metadata.last_name as string | undefined) ??
    (metadata.full_name as string | undefined)
      ?.trim()
      .split(/\s+/)
      .slice(1)
      .join(' ') ??
    '';

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<JoinRequestFormValues>({
    resolver: zodResolver(joinRequestFormSchema),
    defaultValues: {
      name: firstName,
      lastName: lastName,
      phoneCountry: rawPhone.country,
      contactPhone: rawPhone.local,
      contactEmail: user?.email ?? '',
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
        name: values.name.trim(),
        lastName: values.lastName.trim(),
        contactPhone: combinePhone(values.phoneCountry, values.contactPhone),
        contactEmail: values.contactEmail?.trim() || undefined,
        adultsCount: values.adultsCount,
        kidsCount: values.kidsCount,
        foodPreferences: values.foodPreferences?.trim() || undefined,
        allergies: values.allergies?.trim() || undefined,
        notes: values.notes?.trim() || undefined,
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
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label htmlFor="jr-name" className={labelClass}>
              {t('addParticipant.firstName')}
            </label>
            <FormInput
              id="jr-name"
              compact
              autoComplete="given-name"
              {...register('name')}
            />
            {errors.name && (
              <p className="mt-1 text-xs text-red-600">{errors.name.message}</p>
            )}
          </div>
          <div>
            <label htmlFor="jr-lastName" className={labelClass}>
              {t('addParticipant.lastName')}
            </label>
            <FormInput
              id="jr-lastName"
              compact
              autoComplete="family-name"
              {...register('lastName')}
            />
            {errors.lastName && (
              <p className="mt-1 text-xs text-red-600">
                {errors.lastName.message}
              </p>
            )}
          </div>
        </div>

        <div>
          <FormLabel>{t('addParticipant.phone')}</FormLabel>
          <PhoneInput
            countryProps={register('phoneCountry')}
            phoneProps={register('contactPhone')}
            countrySelectAriaLabel={t('profile.phoneCountry')}
            phoneCountryDefaultLabel={t('profile.phoneCountryDefault')}
            phonePlaceholder={t('addParticipant.phonePlaceholder')}
            compact
            error={errors.contactPhone?.message}
          />
        </div>

        <div>
          <label htmlFor="jr-email" className={labelClass}>
            {t('addParticipant.email')}
          </label>
          <FormInput
            id="jr-email"
            type="email"
            compact
            autoComplete="email"
            {...register('contactEmail')}
          />
        </div>

        <div className="border-t border-gray-100 pt-4 grid grid-cols-2 gap-4">
          <div>
            <label htmlFor="jr-adults" className={labelClass}>
              {t('preferences.adultsCount')}
            </label>
            <FormInput
              id="jr-adults"
              type="number"
              compact
              min={1}
              {...register('adultsCount')}
            />
            {errors.adultsCount && (
              <p className="mt-1 text-xs text-red-600">
                {errors.adultsCount.message}
              </p>
            )}
          </div>
          <div>
            <label htmlFor="jr-kids" className={labelClass}>
              {t('preferences.kidsCount')}
            </label>
            <FormInput
              id="jr-kids"
              type="number"
              compact
              min={0}
              {...register('kidsCount')}
            />
          </div>
        </div>

        <div>
          <label htmlFor="jr-food" className={labelClass}>
            {t('preferences.foodPreferences')}
          </label>
          <FormInput
            id="jr-food"
            compact
            {...register('foodPreferences')}
            placeholder={t('preferences.foodPreferencesPlaceholder')}
          />
        </div>

        <div>
          <label htmlFor="jr-allergies" className={labelClass}>
            {t('preferences.allergies')}
          </label>
          <FormInput
            id="jr-allergies"
            compact
            {...register('allergies')}
            placeholder={t('preferences.allergiesPlaceholder')}
          />
        </div>

        <div>
          <label htmlFor="jr-notes" className={labelClass}>
            {t('preferences.notes')}
          </label>
          <FormTextarea
            id="jr-notes"
            rows={3}
            {...register('notes')}
            placeholder={t('preferences.notesPlaceholder')}
          />
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
