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
    <div className="max-w-xl mx-auto mt-8">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <div>
          <label className="block text-sm font-medium">Title</label>
          <input
            {...register('title')}
            className="mt-1 block w-full rounded border px-3 py-2"
          />
          {errors.title && (
            <p className="text-sm text-red-600">{errors.title.message}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium">Description</label>
          <textarea
            {...register('description')}
            className="mt-1 block w-full rounded border px-3 py-2"
            rows={4}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium">Status</label>
            <select
              {...register('status')}
              className="mt-1 block w-full rounded border px-3 py-2"
            >
              <option value="draft">Draft</option>
              <option value="active">Active</option>
              <option value="archived">Archived</option>
            </select>
            {errors.status && (
              <p className="text-sm text-red-600">{errors.status.message}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium">Visibility</label>
            <select
              {...register('visibility')}
              className="mt-1 block w-full rounded border px-3 py-2"
            >
              <option value="public">Public</option>
              <option value="unlisted">Unlisted</option>
              <option value="private">Private</option>
            </select>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium">Owner name</label>
          <input
            {...register('ownerName')}
            className="mt-1 block w-full rounded border px-3 py-2"
            placeholder="Owner full name"
          />
          {errors.ownerName && (
            <p className="text-sm text-red-600">{errors.ownerName.message}</p>
          )}
        </div>

        <fieldset className="border p-3 rounded">
          <legend className="text-sm font-medium mb-2">
            Location (optional)
          </legend>
          <div>
            <label className="block text-sm">Name</label>
            <input
              {...register('location.name' as const)}
              className="mt-1 block w-full rounded border px-3 py-2"
            />
          </div>
          <div className="grid grid-cols-2 gap-2 mt-2">
            <div>
              <label className="block text-sm">City</label>
              <input
                {...register('location.city' as const)}
                className="mt-1 block w-full rounded border px-3 py-2"
              />
            </div>
            <div>
              <label className="block text-sm">Country</label>
              <input
                {...register('location.country' as const)}
                className="mt-1 block w-full rounded border px-3 py-2"
              />
            </div>
          </div>
          <div className="mt-2">
            <label className="block text-sm">Region</label>
            <input
              {...register('location.region' as const)}
              className="mt-1 block w-full rounded border px-3 py-2"
            />
          </div>
        </fieldset>

        <div className="grid grid-cols-1 gap-4">
          <div className="flex items-center gap-2">
            <input type="checkbox" {...register('oneDay')} id="oneDay" />
            <label htmlFor="oneDay" className="text-sm">
              One-day plan
            </label>
          </div>

          {oneDay ? (
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="block text-sm">Date</label>
                <input
                  type="date"
                  {...register('singleDate')}
                  className="mt-1 block w-full rounded border px-3 py-2"
                />
                {errors.singleDate && (
                  <p className="text-sm text-red-600">
                    {errors.singleDate.message}
                  </p>
                )}
              </div>
              <div>
                <label className="block text-sm">Start time</label>
                <input
                  type="time"
                  {...register('singleStartTime')}
                  className="mt-1 block w-full rounded border px-3 py-2"
                />
              </div>
              <div>
                <label className="block text-sm">End time</label>
                <input
                  type="time"
                  {...register('singleEndTime')}
                  className="mt-1 block w-full rounded border px-3 py-2"
                />
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-4 gap-4">
              <div>
                <label className="block text-sm">Start date</label>
                <input
                  type="date"
                  {...register('startDateDate')}
                  className="mt-1 block w-full rounded border px-3 py-2"
                />
                {errors.startDateDate && (
                  <p className="text-sm text-red-600">
                    {errors.startDateDate.message}
                  </p>
                )}
              </div>
              <div>
                <label className="block text-sm">Start time</label>
                <input
                  type="time"
                  {...register('startDateTime')}
                  className="mt-1 block w-full rounded border px-3 py-2"
                />
              </div>
              <div>
                <label className="block text-sm">End date</label>
                <input
                  type="date"
                  {...register('endDateDate')}
                  className="mt-1 block w-full rounded border px-3 py-2"
                />
                {errors.endDateDate && (
                  <p className="text-sm text-red-600">
                    {errors.endDateDate.message}
                  </p>
                )}
              </div>
              <div>
                <label className="block text-sm">End time</label>
                <input
                  type="time"
                  {...register('endDateTime')}
                  className="mt-1 block w-full rounded border px-3 py-2"
                />
              </div>
            </div>
          )}
        </div>

        <div>
          <label className="block text-sm">Tags (comma separated)</label>
          <input
            {...register('tagsCsv')}
            className="mt-1 block w-full rounded border px-3 py-2"
            placeholder="e.g. picnic,friends,summer"
          />
        </div>

        <div>
          <label className="block text-sm">
            Participants (comma separated names)
          </label>
          <input
            {...register('participantsCsv')}
            className="mt-1 block w-full rounded border px-3 py-2"
            placeholder="Alice, Bob, Charlie"
          />
        </div>

        <div>
          <button
            type="submit"
            disabled={isSubmitting}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition"
          >
            {isSubmitting ? 'Creating…' : 'Create Plan'}
          </button>
        </div>
      </form>
    </div>
  );
}
