import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useTranslation } from 'react-i18next';
import type { Participant } from '../core/schemas/participant';
import { FormLabel } from './shared/FormLabel';
import { FormInput, FormSelect } from './shared/FormInput';

const expenseFormSchema = z.object({
  participantId: z.string().min(1),
  amount: z.coerce.number().positive(),
  description: z.string().optional(),
});

export type ExpenseFormValues = z.infer<typeof expenseFormSchema>;

interface ExpenseFormProps {
  defaultValues?: Partial<ExpenseFormValues>;
  participants: Participant[];
  isOwner: boolean;
  currentParticipantId?: string;
  onSubmit: (values: ExpenseFormValues) => void | Promise<void>;
  onCancel?: () => void;
  isSubmitting?: boolean;
  submitLabel?: string;
  currency?: string;
}

export default function ExpenseForm({
  defaultValues,
  participants,
  isOwner,
  currentParticipantId,
  onSubmit,
  onCancel,
  isSubmitting,
  submitLabel,
  currency,
}: ExpenseFormProps) {
  const { t } = useTranslation();

  const resolvedDefaults: ExpenseFormValues = {
    participantId:
      defaultValues?.participantId ??
      (isOwner ? '' : (currentParticipantId ?? '')),
    amount: defaultValues?.amount ?? ('' as unknown as number),
    description: defaultValues?.description ?? '',
  };

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ExpenseFormValues>({
    resolver: zodResolver(expenseFormSchema),
    defaultValues: resolvedDefaults,
  });

  const canSelectParticipant = isOwner;

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="p-4 sm:p-6 space-y-4">
      {canSelectParticipant ? (
        <div>
          <FormLabel>{t('expenses.participant')} *</FormLabel>
          <FormSelect
            id="participantId"
            {...register('participantId')}
            aria-invalid={!!errors.participantId}
          >
            <option value="">{t('expenses.selectParticipant')}</option>
            {participants.map((p) => (
              <option key={p.participantId} value={p.participantId}>
                {p.name} {p.lastName}
              </option>
            ))}
          </FormSelect>
          {errors.participantId && (
            <p className="text-red-500 text-sm mt-1">
              {errors.participantId.message}
            </p>
          )}
        </div>
      ) : (
        <input type="hidden" {...register('participantId')} />
      )}

      <div>
        <FormLabel>
          {t('expenses.amount')}
          {currency ? ` (${currency})` : ''} *
        </FormLabel>
        <FormInput
          id="amount"
          type="number"
          step="0.01"
          min="0.01"
          placeholder={t('expenses.amountPlaceholder')}
          {...register('amount')}
          aria-invalid={!!errors.amount}
        />
        {errors.amount && (
          <p className="text-red-500 text-sm mt-1">{errors.amount.message}</p>
        )}
      </div>

      <div>
        <FormLabel>{t('expenses.description')}</FormLabel>
        <FormInput
          id="description"
          placeholder={t('expenses.descriptionPlaceholder')}
          {...register('description')}
        />
      </div>

      <div className="flex justify-end gap-3 pt-2">
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
          >
            {t('expenses.cancel')}
          </button>
        )}
        <button
          type="submit"
          disabled={isSubmitting}
          data-testid="expense-form-submit"
          className="px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-lg hover:bg-green-700 disabled:opacity-50 transition-colors"
        >
          {isSubmitting
            ? t('expenses.saving')
            : (submitLabel ?? t('expenses.addExpense'))}
        </button>
      </div>
    </form>
  );
}
