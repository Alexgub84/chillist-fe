import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { v5 as uuidv5 } from 'uuid';

import { createPlan as apiCreatePlan } from '../core/api';
import { planSchema } from '../core/schemas/plan';

// Derive a payload schema from the canonical planSchema by omitting server-generated
// fields (planId, createdAt, updatedAt). This keeps validation consistent.
const planCreatePayloadSchema = planSchema.omit({
  planId: true,
  createdAt: true,
  updatedAt: true,
});

// Strongly-typed payload derived from the payload schema so we don't use `unknown`.
type PlanCreatePayload = z.infer<typeof planCreatePayloadSchema>;

// For the form we prefer CSV strings for arrays, so derive a form schema from the
// payload schema but replace `tags` and `participantIds` with `tagsCsv` and
// `participantsCsv` string fields.
const createPlanFormSchema = planCreatePayloadSchema
  .omit({
    tags: true,
    participantIds: true,
    startDate: true,
    endDate: true,
    ownerParticipantId: true,
    title: true,
  })
  .extend({
    // Required fields with custom messages
    title: z.string().min(1, 'Title is required'),
    // CSV helpers
    tagsCsv: z.string().optional(),
    participantsCsv: z.string().optional(),
    // Owner name (text input since there's no auth)
    ownerName: z.string().min(1, 'Owner name is required'),
    // One-day vs range
    oneDay: z.boolean().optional(),
    // Single-day fields
    singleDate: z
      .string()
      .min(1, 'Date is required')
      .optional()
      .or(z.literal('')),
    singleStartTime: z.string().optional(),
    singleEndTime: z.string().optional(),
    // Multi-day fields (separate date & time parts)
    startDateDate: z
      .string()
      .min(1, 'Start date is required')
      .optional()
      .or(z.literal('')),
    startDateTime: z.string().optional(),
    endDateDate: z.string().optional(),
    endDateTime: z.string().optional(),
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

export default function PlanForm() {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
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
    const hhmm = time ?? '00:00';
    return `${date}T${hhmm}:00`;
  };

  const UUID_NAMESPACE = '6ba7b810-9dad-11d1-80b4-00c04fd430c8';
  const generateId = (name: string) => {
    return uuidv5(name, UUID_NAMESPACE);
  };

  async function onSubmit(values: FormValues): Promise<void> {
    console.log('Submitting plan form with values:', values);
    const payload: PlanCreatePayload = {
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
      location: values.location ?? undefined,
    };

    try {
      // Validate/normalize payload against the payload schema before sending
      const validated = planCreatePayloadSchema.parse(payload);
      const created = await apiCreatePlan(validated);
      if (created?.planId) {
        window.location.href = `/plan/${created.planId}`;
      } else {
        window.location.href = '/plans';
      }
    } catch (err) {
      // Keep error handling simple here; callers may choose to wrap or mock.
      alert('Failed to create plan:' + err);
    }
  }

  return (
    <div className="w-full">
      <form
        onSubmit={handleSubmit(onSubmit)}
        className="bg-white rounded-lg shadow-sm p-4 sm:p-6 lg:p-8 space-y-6"
      >
        {/* Title */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Title *
          </label>
          <input
            {...register('title')}
            placeholder="Enter plan title"
            className="w-full px-3 sm:px-4 py-2 sm:py-3 text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
          />
          {errors.title && (
            <p className="text-sm text-red-600 mt-1">{errors.title.message}</p>
          )}
        </div>

        {/* Description */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Description
          </label>
          <textarea
            {...register('description')}
            placeholder="Add details about your plan"
            rows={4}
            className="w-full px-3 sm:px-4 py-2 sm:py-3 text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition resize-none"
          />
        </div>

        {/* Status and Visibility */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Status
            </label>
            <select
              {...register('status')}
              className="w-full px-3 sm:px-4 py-2 sm:py-3 text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition bg-white"
            >
              <option value="draft">Draft</option>
              <option value="active">Active</option>
              <option value="archived">Archived</option>
            </select>
            {errors.status && (
              <p className="text-sm text-red-600 mt-1">
                {errors.status.message}
              </p>
            )}
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Visibility
            </label>
            <select
              {...register('visibility')}
              className="w-full px-3 sm:px-4 py-2 sm:py-3 text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition bg-white"
            >
              <option value="public">Public</option>
              <option value="unlisted">Unlisted</option>
              <option value="private">Private</option>
            </select>
          </div>
        </div>

        {/* Owner Name */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Owner Name *
          </label>
          <input
            {...register('ownerName')}
            placeholder="Enter your full name"
            className="w-full px-3 sm:px-4 py-2 sm:py-3 text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
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
              <label className="block text-sm font-medium text-gray-600 mb-2">
                Name
              </label>
              <input
                {...register('location.name' as const)}
                placeholder="Location name"
                className="w-full px-3 sm:px-4 py-2 text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
              />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-2">
                  City
                </label>
                <input
                  {...register('location.city' as const)}
                  placeholder="City"
                  className="w-full px-3 sm:px-4 py-2 text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-2">
                  Country
                </label>
                <input
                  {...register('location.country' as const)}
                  placeholder="Country"
                  className="w-full px-3 sm:px-4 py-2 text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-2">
                Region
              </label>
              <input
                {...register('location.region' as const)}
                placeholder="Region/Province"
                className="w-full px-3 sm:px-4 py-2 text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
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
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Date *
                </label>
                <input
                  type="date"
                  {...register('singleDate')}
                  className="w-full px-3 sm:px-4 py-2 text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                />
                {errors.singleDate && (
                  <p className="text-sm text-red-600 mt-1">
                    {errors.singleDate.message}
                  </p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Start time
                </label>
                <input
                  type="time"
                  {...register('singleStartTime')}
                  className="w-full px-3 sm:px-4 py-2 text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  End time
                </label>
                <input
                  type="time"
                  {...register('singleEndTime')}
                  className="w-full px-3 sm:px-4 py-2 text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                />
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 bg-blue-50 p-4 rounded-lg">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Start date *
                </label>
                <input
                  type="date"
                  {...register('startDateDate')}
                  className="w-full px-3 sm:px-4 py-2 text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                />
                {errors.startDateDate && (
                  <p className="text-sm text-red-600 mt-1">
                    {errors.startDateDate.message}
                  </p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Start time
                </label>
                <input
                  type="time"
                  {...register('startDateTime')}
                  className="w-full px-3 sm:px-4 py-2 text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  End date *
                </label>
                <input
                  type="date"
                  {...register('endDateDate')}
                  className="w-full px-3 sm:px-4 py-2 text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                />
                {errors.endDateDate && (
                  <p className="text-sm text-red-600 mt-1">
                    {errors.endDateDate.message}
                  </p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  End time
                </label>
                <input
                  type="time"
                  {...register('endDateTime')}
                  className="w-full px-3 sm:px-4 py-2 text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                />
              </div>
            </div>
          )}
        </div>

        {/* Tags */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Tags (comma separated)
          </label>
          <input
            {...register('tagsCsv')}
            placeholder="e.g. picnic, friends, summer"
            className="w-full px-3 sm:px-4 py-2 sm:py-3 text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
          />
        </div>

        {/* Participants */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Participants (comma separated names)
          </label>
          <input
            {...register('participantsCsv')}
            placeholder="Alice, Bob, Charlie"
            className="w-full px-3 sm:px-4 py-2 sm:py-3 text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
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
