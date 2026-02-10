import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { v5 as uuidv5 } from 'uuid';

import {
  planCreateSchema,
  planStatusSchema,
  planVisibilitySchema,
  type PlanCreate,
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

const createPlanFormSchema = planCreateSchema
  .omit({
    tags: true,
    participantIds: true,
    startDate: true,
    endDate: true,
    ownerParticipantId: true,
    title: true,
    location: true,
    status: true,
    visibility: true,
  })
  .extend({
    title: z.string().min(1, 'Title is required'),
    status: planStatusSchema,
    visibility: planVisibilitySchema,
    tagsCsv: z.string().optional(),
    participantsCsv: z.string().optional(),
    ownerName: z.string().min(1, 'Owner name is required'),
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
  .refine(
    (data) => {
      // One-day mode: require singleDate
      return !data.oneDay || !!data.singleDate;
    },
    {
      message: 'Date is required',
      path: ['singleDate'],
    }
  )
  .refine(
    (data) => {
      // Multi-day mode: require startDateDate
      return data.oneDay || !!data.startDateDate;
    },
    {
      message: 'Start date is required',
      path: ['startDateDate'],
    }
  )
  .refine(
    (data) => {
      // Multi-day mode: require endDateDate
      return data.oneDay || !!data.endDateDate;
    },
    {
      message: 'End date is required',
      path: ['endDateDate'],
    }
  );

type FormValues = z.infer<typeof createPlanFormSchema>;

export type PlanFormPayload = PlanCreate;

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
    formState: { errors },
    watch,
  } = useForm<FormValues>({
    resolver: zodResolver(createPlanFormSchema),
    defaultValues: { status: 'draft', oneDay: false },
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
  const generateId = (name: string) => {
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
    const payload: PlanCreate = {
      title: values.title,
      description: values.description,
      status: values.status,
      visibility: values.visibility,
      ownerParticipantId: generateId(values.ownerName),
      startDate: values.oneDay
        ? makeDateTime(values.singleDate, values.singleStartTime)
        : makeDateTime(values.startDateDate, values.startDateTime),
      endDate: values.oneDay
        ? makeDateTime(values.singleDate, values.singleEndTime)
        : makeDateTime(values.endDateDate, values.endDateTime),
      tags: parseTags(values.tagsCsv),
      participantIds: parseTags(values.participantsCsv)?.map((n) =>
        generateId(n)
      ),
      location: hasLocationData(values.location)
        ? {
            ...values.location,
            locationId: generateId(values.location!.name || values.title),
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
        {/* Title */}
        <div>
          <FormLabel>Title *</FormLabel>
          <FormInput {...register('title')} placeholder="Enter plan title" />
          {errors.title && (
            <p className="text-sm text-red-600 mt-1">{errors.title.message}</p>
          )}
        </div>

        {/* Description */}
        <div>
          <FormLabel>Description</FormLabel>
          <FormTextarea
            {...register('description')}
            placeholder="Add details about your plan"
            rows={4}
          />
        </div>

        {/* Status and Visibility */}
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

        {/* Owner Name */}
        <div>
          <FormLabel>Owner Name *</FormLabel>
          <FormInput
            {...register('ownerName')}
            placeholder="Enter your full name"
          />
          {errors.ownerName && (
            <p className="text-sm text-red-600 mt-1">
              {errors.ownerName.message}
            </p>
          )}
        </div>

        {/* Location Section */}
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

        {/* Date Section */}
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

        {/* Tags */}
        <div>
          <FormLabel>Tags (comma separated)</FormLabel>
          <FormInput
            {...register('tagsCsv')}
            placeholder="e.g. picnic, friends, summer"
          />
        </div>

        {/* Participants */}
        <div>
          <FormLabel>Participants (comma separated names)</FormLabel>
          <FormInput
            {...register('participantsCsv')}
            placeholder="Alice, Bob, Charlie"
          />
        </div>

        {/* Submit Button */}
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
