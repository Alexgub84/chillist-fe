import { useForm, useFieldArray } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { v5 as uuidv5 } from 'uuid';

import {
  planStatusSchema,
  planVisibilitySchema,
  type PlanCreateWithOwner,
} from '../core/schemas/plan';
import { FormLabel } from './shared/FormLabel';
import { FormInput, FormTextarea, FormSelect } from './shared/FormInput';

const locationFormSchema = z
  .object({
    name: z.string().optional(),
    city: z.string().optional(),
    country: z.string().optional(),
    region: z.string().optional(),
  })
  .optional();

const participantRowSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  contactPhone: z.string().min(1, 'Phone is required'),
  contactEmail: z.string().optional(),
});

const createPlanFormSchema = z
  .object({
    title: z.string().min(1, 'Title is required'),
    description: z.string().optional(),
    status: planStatusSchema,
    visibility: planVisibilitySchema,
    ownerName: z.string().min(1, 'Owner name is required'),
    ownerLastName: z.string().min(1, 'Owner last name is required'),
    ownerPhone: z.string().min(1, 'Owner phone is required'),
    ownerEmail: z.string().optional(),
    tagsCsv: z.string().optional(),
    participants: z.array(participantRowSchema).optional(),
    oneDay: z.boolean().optional(),
    singleDate: z
      .string()
      .min(1, 'Date is required')
      .optional()
      .or(z.literal('')),
    singleStartTime: z.string().optional(),
    singleEndTime: z.string().optional(),
    startDateDate: z
      .string()
      .min(1, 'Start date is required')
      .optional()
      .or(z.literal('')),
    startDateTime: z.string().optional(),
    endDateDate: z.string().optional(),
    endDateTime: z.string().optional(),
    location: locationFormSchema,
  })
  .refine((data) => !data.oneDay || !!data.singleDate, {
    message: 'Date is required',
    path: ['singleDate'],
  })
  .refine((data) => data.oneDay || !!data.startDateDate, {
    message: 'Start date is required',
    path: ['startDateDate'],
  })
  .refine((data) => data.oneDay || !!data.endDateDate, {
    message: 'End date is required',
    path: ['endDateDate'],
  });

type FormValues = z.infer<typeof createPlanFormSchema>;

export type PlanFormPayload = PlanCreateWithOwner;

interface PlanFormProps {
  onSubmit: (payload: PlanFormPayload) => void | Promise<void>;
  isSubmitting?: boolean;
}

export default function PlanForm({
  onSubmit,
  isSubmitting = false,
}: PlanFormProps) {
  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
    watch,
  } = useForm<FormValues>({
    resolver: zodResolver(createPlanFormSchema),
    defaultValues: {
      status: 'draft',
      visibility: 'private',
      oneDay: false,
      participants: [],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'participants',
  });

  const oneDay = watch('oneDay');

  const parseTags = (csv?: string) =>
    csv
      ? csv
          .split(',')
          .map((t) => t.trim())
          .filter(Boolean)
      : undefined;

  const makeDateTime = (date?: string, time?: string) => {
    if (!date) return undefined;
    const hhmm = time || '00:00';
    return `${date}T${hhmm}:00Z`;
  };

  const UUID_NAMESPACE = '6ba7b810-9dad-11d1-80b4-00c04fd430c8';
  const generateLocationId = (name: string) => {
    return uuidv5(name, UUID_NAMESPACE);
  };

  const hasLocationData = (loc?: {
    name?: string;
    city?: string;
    country?: string;
    region?: string;
  }) => {
    if (!loc) return false;
    return [loc.name, loc.city, loc.country, loc.region].some(
      (v) => v && v.trim().length > 0
    );
  };

  async function handleFormSubmit(values: FormValues): Promise<void> {
    const participants = (values.participants ?? [])
      .filter(
        (p) => p.name.trim() || p.lastName.trim() || p.contactPhone.trim()
      )
      .map((p) => ({
        name: p.name.trim(),
        lastName: p.lastName.trim(),
        contactPhone: p.contactPhone.trim(),
        contactEmail: p.contactEmail?.trim() || undefined,
      }));

    const payload: PlanCreateWithOwner = {
      title: values.title,
      description: values.description || undefined,
      visibility: values.visibility,
      owner: {
        name: values.ownerName.trim(),
        lastName: values.ownerLastName.trim(),
        contactPhone: values.ownerPhone.trim(),
        contactEmail: values.ownerEmail?.trim() || undefined,
      },
      participants: participants.length > 0 ? participants : undefined,
      startDate: values.oneDay
        ? makeDateTime(values.singleDate, values.singleStartTime)
        : makeDateTime(values.startDateDate, values.startDateTime),
      endDate: values.oneDay
        ? makeDateTime(values.singleDate, values.singleEndTime)
        : makeDateTime(values.endDateDate, values.endDateTime),
      tags: parseTags(values.tagsCsv),
      location: hasLocationData(values.location)
        ? {
            ...values.location,
            locationId: generateLocationId(
              values.location!.name || values.title
            ),
            name: values.location!.name || values.title,
          }
        : undefined,
    };

    await onSubmit(payload);
  }

  return (
    <div className="w-full">
      <form
        onSubmit={handleSubmit(handleFormSubmit)}
        className="bg-white rounded-lg shadow-sm p-4 sm:p-6 lg:p-8 space-y-6"
      >
        <div>
          <FormLabel>Title *</FormLabel>
          <FormInput {...register('title')} placeholder="Enter plan title" />
          {errors.title && (
            <p className="text-sm text-red-600 mt-1">{errors.title.message}</p>
          )}
        </div>

        <div>
          <FormLabel>Description</FormLabel>
          <FormTextarea
            {...register('description')}
            placeholder="Add details about your plan"
            rows={4}
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
          <div>
            <FormLabel>Status</FormLabel>
            <FormSelect {...register('status')}>
              <option value="draft">Draft</option>
              <option value="active">Active</option>
              <option value="archived">Archived</option>
            </FormSelect>
            {errors.status && (
              <p className="text-sm text-red-600 mt-1">
                {errors.status.message}
              </p>
            )}
          </div>

          <div>
            <FormLabel>Visibility</FormLabel>
            <FormSelect {...register('visibility')}>
              <option value="public">Public</option>
              <option value="unlisted">Unlisted</option>
              <option value="private">Private</option>
            </FormSelect>
          </div>
        </div>

        <fieldset className="border border-gray-200 rounded-lg p-4 sm:p-5">
          <legend className="text-sm font-semibold text-gray-700 px-2 mb-3">
            Owner (you) *
          </legend>
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <FormLabel>First Name *</FormLabel>
                <FormInput
                  {...register('ownerName')}
                  placeholder="First name"
                  compact
                />
                {errors.ownerName && (
                  <p className="text-sm text-red-600 mt-1">
                    {errors.ownerName.message}
                  </p>
                )}
              </div>
              <div>
                <FormLabel>Last Name *</FormLabel>
                <FormInput
                  {...register('ownerLastName')}
                  placeholder="Last name"
                  compact
                />
                {errors.ownerLastName && (
                  <p className="text-sm text-red-600 mt-1">
                    {errors.ownerLastName.message}
                  </p>
                )}
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <FormLabel>Phone *</FormLabel>
                <FormInput
                  {...register('ownerPhone')}
                  placeholder="Phone number"
                  compact
                />
                {errors.ownerPhone && (
                  <p className="text-sm text-red-600 mt-1">
                    {errors.ownerPhone.message}
                  </p>
                )}
              </div>
              <div>
                <FormLabel>Email</FormLabel>
                <FormInput
                  {...register('ownerEmail')}
                  placeholder="Email (optional)"
                  compact
                />
              </div>
            </div>
          </div>
        </fieldset>

        <fieldset className="border border-gray-200 rounded-lg p-4 sm:p-5">
          <legend className="text-sm font-semibold text-gray-700 px-2 mb-3">
            Participants (optional)
          </legend>
          <div className="space-y-4">
            {fields.map((field, index) => (
              <div
                key={field.id}
                className="bg-gray-50 rounded-lg p-3 sm:p-4 space-y-3"
              >
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-600">
                    Participant {index + 1}
                  </span>
                  <button
                    type="button"
                    onClick={() => remove(index)}
                    className="text-sm text-red-500 hover:text-red-700 transition-colors"
                  >
                    Remove
                  </button>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <FormInput
                      {...register(`participants.${index}.name`)}
                      placeholder="First name *"
                      compact
                    />
                    {errors.participants?.[index]?.name && (
                      <p className="text-sm text-red-600 mt-1">
                        {errors.participants[index].name.message}
                      </p>
                    )}
                  </div>
                  <div>
                    <FormInput
                      {...register(`participants.${index}.lastName`)}
                      placeholder="Last name *"
                      compact
                    />
                    {errors.participants?.[index]?.lastName && (
                      <p className="text-sm text-red-600 mt-1">
                        {errors.participants[index].lastName.message}
                      </p>
                    )}
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <FormInput
                      {...register(`participants.${index}.contactPhone`)}
                      placeholder="Phone *"
                      compact
                    />
                    {errors.participants?.[index]?.contactPhone && (
                      <p className="text-sm text-red-600 mt-1">
                        {errors.participants[index].contactPhone.message}
                      </p>
                    )}
                  </div>
                  <div>
                    <FormInput
                      {...register(`participants.${index}.contactEmail`)}
                      placeholder="Email (optional)"
                      compact
                    />
                  </div>
                </div>
              </div>
            ))}
            <button
              type="button"
              onClick={() =>
                append({
                  name: '',
                  lastName: '',
                  contactPhone: '',
                  contactEmail: '',
                })
              }
              className="w-full px-4 py-2 border-2 border-dashed border-gray-300 text-gray-600 rounded-lg hover:border-blue-400 hover:text-blue-600 transition-colors text-sm font-medium"
            >
              + Add Participant
            </button>
          </div>
        </fieldset>

        <fieldset className="border border-gray-200 rounded-lg p-4 sm:p-5">
          <legend className="text-sm font-semibold text-gray-700 px-2 mb-3">
            Location (optional)
          </legend>
          <div className="space-y-4">
            <div>
              <FormLabel>Name</FormLabel>
              <FormInput
                {...register('location.name' as const)}
                placeholder="Location name"
                compact
              />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <FormLabel>City</FormLabel>
                <FormInput
                  {...register('location.city' as const)}
                  placeholder="City"
                  compact
                />
              </div>
              <div>
                <FormLabel>Country</FormLabel>
                <FormInput
                  {...register('location.country' as const)}
                  placeholder="Country"
                  compact
                />
              </div>
            </div>
            <div>
              <FormLabel>Region</FormLabel>
              <FormInput
                {...register('location.region' as const)}
                placeholder="Region/Province"
                compact
              />
            </div>
          </div>
        </fieldset>

        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <input
              type="checkbox"
              {...register('oneDay')}
              id="oneDay"
              className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500 cursor-pointer"
            />
            <label
              htmlFor="oneDay"
              className="text-sm font-medium text-gray-700 cursor-pointer"
            >
              One-day plan
            </label>
          </div>

          {oneDay ? (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 bg-blue-50 p-4 rounded-lg">
              <div>
                <FormLabel>Date *</FormLabel>
                <FormInput type="date" {...register('singleDate')} compact />
                {errors.singleDate && (
                  <p className="text-sm text-red-600 mt-1">
                    {errors.singleDate.message}
                  </p>
                )}
              </div>
              <div>
                <FormLabel>Start time</FormLabel>
                <FormInput
                  type="time"
                  {...register('singleStartTime')}
                  compact
                />
              </div>
              <div>
                <FormLabel>End time</FormLabel>
                <FormInput type="time" {...register('singleEndTime')} compact />
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 bg-blue-50 p-4 rounded-lg">
              <div>
                <FormLabel>Start date *</FormLabel>
                <FormInput type="date" {...register('startDateDate')} compact />
                {errors.startDateDate && (
                  <p className="text-sm text-red-600 mt-1">
                    {errors.startDateDate.message}
                  </p>
                )}
              </div>
              <div>
                <FormLabel>Start time</FormLabel>
                <FormInput type="time" {...register('startDateTime')} compact />
              </div>
              <div>
                <FormLabel>End date *</FormLabel>
                <FormInput type="date" {...register('endDateDate')} compact />
                {errors.endDateDate && (
                  <p className="text-sm text-red-600 mt-1">
                    {errors.endDateDate.message}
                  </p>
                )}
              </div>
              <div>
                <FormLabel>End time</FormLabel>
                <FormInput type="time" {...register('endDateTime')} compact />
              </div>
            </div>
          )}
        </div>

        <div>
          <FormLabel>Tags (comma separated)</FormLabel>
          <FormInput
            {...register('tagsCsv')}
            placeholder="e.g. picnic, friends, summer"
          />
        </div>

        <div className="pt-4 sm:pt-6">
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full px-4 py-3 bg-blue-600 text-white text-base sm:text-lg font-semibold rounded-lg hover:bg-blue-700 active:bg-blue-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-sm hover:shadow-md"
          >
            {isSubmitting ? 'Creating…' : 'Create Plan'}
          </button>
        </div>
      </form>
    </div>
  );
}
