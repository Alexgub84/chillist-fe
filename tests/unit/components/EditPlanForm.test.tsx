import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import EditPlanForm from '../../../src/components/EditPlanForm';
import type { EditPlanSubmitPayload } from '../../../src/components/EditPlanForm';
import type { PlanWithDetails } from '../../../src/core/schemas/plan';
import type { Participant } from '../../../src/core/schemas/participant';

vi.mock('uuid', () => ({
  v5: vi.fn(
    (name: string) => `uuid-${name.toLowerCase().replace(/\s+/g, '-')}`
  ),
}));

const ownerParticipant: Participant = {
  participantId: 'p-1',
  planId: 'plan-1',
  userId: 'user-1',
  name: 'Alice',
  lastName: 'Owner',
  contactPhone: '555-0001',
  displayName: null,
  role: 'owner',
  avatarUrl: null,
  contactEmail: null,
  inviteToken: null,
  rsvpStatus: 'confirmed',
  lastActivityAt: null,
  adultsCount: 2,
  kidsCount: 1,
  foodPreferences: 'vegetarian',
  allergies: 'nuts',
  notes: 'no spicy food',
  createdAt: '2026-01-01T00:00:00Z',
  updatedAt: '2026-01-01T00:00:00Z',
};

function buildTestPlan(overrides?: Partial<PlanWithDetails>): PlanWithDetails {
  return {
    planId: 'plan-1',
    title: 'Beach Trip',
    description: 'A fun day at the beach',
    status: 'active',
    visibility: 'private',
    ownerParticipantId: 'p-1',
    startDate: '2026-07-10T09:00:00Z',
    endDate: '2026-07-12T18:00:00Z',
    tags: ['beach', 'summer'],
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: '2026-01-01T00:00:00Z',
    location: {
      locationId: 'loc-1',
      name: 'Bondi Beach',
      city: 'Sydney',
      country: 'Australia',
      region: 'NSW',
      latitude: -33.89,
      longitude: 151.27,
    },
    items: [],
    participants: [ownerParticipant],
    ...overrides,
  };
}

describe('EditPlanForm', () => {
  let handleSubmit: ReturnType<typeof vi.fn>;
  let handleCancel: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    vi.clearAllMocks();
    handleSubmit = vi.fn();
    handleCancel = vi.fn();
  });

  function renderForm(plan?: PlanWithDetails, isSubmitting = false) {
    const p = plan ?? buildTestPlan();
    return render(
      <EditPlanForm
        plan={p}
        ownerParticipant={
          p.participants.find((pt) => pt.role === 'owner') ?? null
        }
        onSubmit={handleSubmit}
        onCancel={handleCancel}
        isSubmitting={isSubmitting}
      />
    );
  }

  describe('Step 1 — Plan Details', () => {
    it('pre-fills form fields from the plan', () => {
      renderForm();

      expect(screen.getByTestId('edit-wizard-step1')).toBeInTheDocument();
      expect(screen.getByPlaceholderText(/enter plan title/i)).toHaveValue(
        'Beach Trip'
      );
      expect(
        screen.getByPlaceholderText(/add details about your plan/i)
      ).toHaveValue('A fun day at the beach');
      expect(screen.getByPlaceholderText(/e\.g\. picnic/i)).toHaveValue(
        'beach, summer'
      );
    });

    it('pre-fills location name from the plan', () => {
      renderForm();

      const locationInput = screen.getByPlaceholderText(/search for a place/i);
      expect(locationInput).toHaveValue('Bondi Beach');
    });

    it('shows multi-day date fields when start and end dates differ', () => {
      renderForm();

      expect(screen.getByText(/start date/i)).toBeInTheDocument();
      expect(screen.getByText(/end date/i)).toBeInTheDocument();
    });

    it('shows one-day date fields when start and end dates are the same', () => {
      const plan = buildTestPlan({
        startDate: '2026-07-10T09:00:00Z',
        endDate: '2026-07-10T18:00:00Z',
      });
      renderForm(plan);

      expect(screen.getByRole('checkbox', { name: /one-day/i })).toBeChecked();
    });

    it('shows validation error when title is cleared', async () => {
      const user = userEvent.setup();
      renderForm();

      const titleInput = screen.getByPlaceholderText(/enter plan title/i);
      await user.clear(titleInput);

      await user.click(screen.getByRole('button', { name: /next/i }));

      await waitFor(() => {
        expect(screen.getByText(/title is required/i)).toBeInTheDocument();
      });
    });

    it('handles plan with no location', () => {
      const plan = buildTestPlan({ location: null });
      renderForm(plan);

      const locationInput = screen.getByPlaceholderText(/search for a place/i);
      expect(locationInput).toHaveValue('');
    });

    it('handles plan with no tags', () => {
      const plan = buildTestPlan({ tags: null });
      renderForm(plan);

      expect(screen.getByPlaceholderText(/e\.g\. picnic/i)).toHaveValue('');
    });

    it('handles plan with no dates', () => {
      const plan = buildTestPlan({ startDate: null, endDate: null });
      renderForm(plan);

      expect(screen.getByText(/start date/i)).toBeInTheDocument();
    });

    it('calls onCancel when cancel button is clicked', async () => {
      const user = userEvent.setup();
      renderForm();

      await user.click(screen.getByRole('button', { name: /cancel/i }));
      expect(handleCancel).toHaveBeenCalledTimes(1);
    });
  });

  describe('Step navigation', () => {
    it('navigates to step 2 when Next is clicked with valid data', async () => {
      const user = userEvent.setup();
      renderForm();

      await user.click(screen.getByRole('button', { name: /next/i }));

      await waitFor(() => {
        expect(screen.getByTestId('edit-wizard-step2')).toBeInTheDocument();
      });
    });

    it('navigates back to step 1 when Back is clicked on step 2', async () => {
      const user = userEvent.setup();
      renderForm();

      await user.click(screen.getByRole('button', { name: /next/i }));
      await waitFor(() => {
        expect(screen.getByTestId('edit-wizard-step2')).toBeInTheDocument();
      });

      await user.click(screen.getByRole('button', { name: /back/i }));
      await waitFor(() => {
        expect(screen.getByTestId('edit-wizard-step1')).toBeInTheDocument();
      });
    });
  });

  describe('Step 2 — Owner Preferences', () => {
    async function goToStep2() {
      const user = userEvent.setup();
      renderForm();
      await user.click(screen.getByRole('button', { name: /next/i }));
      await waitFor(() => {
        expect(screen.getByTestId('edit-wizard-step2')).toBeInTheDocument();
      });
      return user;
    }

    it('pre-fills owner preferences from the owner participant', async () => {
      await goToStep2();

      expect(screen.getByText(/your group/i)).toBeInTheDocument();
      expect(screen.getByText(/other participants/i)).toBeInTheDocument();
    });

    it('shows both owner preferences and estimation sections', async () => {
      await goToStep2();

      expect(screen.getByText(/your group/i)).toBeInTheDocument();
      expect(screen.getByText(/other participants/i)).toBeInTheDocument();
      expect(screen.getByText(/estimated adults/i)).toBeInTheDocument();
      expect(screen.getByText(/estimated kids/i)).toBeInTheDocument();
    });
  });

  describe('Full submission flow', () => {
    it('calls onSubmit with plan patch and owner preferences', async () => {
      const user = userEvent.setup();
      renderForm();

      const titleInput = screen.getByPlaceholderText(/enter plan title/i);
      await user.clear(titleInput);
      await user.type(titleInput, 'Updated Beach Trip');

      await user.click(screen.getByRole('button', { name: /next/i }));

      await waitFor(() => {
        expect(screen.getByTestId('edit-wizard-step2')).toBeInTheDocument();
      });

      await user.click(screen.getByRole('button', { name: /update plan/i }));

      await waitFor(() => {
        expect(handleSubmit).toHaveBeenCalledTimes(1);
      });

      const payload: EditPlanSubmitPayload = handleSubmit.mock.calls[0][0];
      expect(payload.planPatch.title).toBe('Updated Beach Trip');
      expect(payload.planPatch.description).toBe('A fun day at the beach');
      expect(payload.planPatch.status).toBe('active');
      expect(payload.planPatch.tags).toEqual(['beach', 'summer']);
      expect(payload.ownerPreferences.adultsCount).toBe(2);
      expect(payload.ownerPreferences.kidsCount).toBe(1);
      expect(payload.ownerPreferences.foodPreferences).toBe('vegetarian');
      expect(payload.ownerPreferences.allergies).toBe('nuts');
      expect(payload.ownerPreferences.notes).toBe('no spicy food');
    });

    it('shows updating state on submit button', async () => {
      const user = userEvent.setup();
      const plan = buildTestPlan();
      render(
        <EditPlanForm
          plan={plan}
          ownerParticipant={ownerParticipant}
          onSubmit={handleSubmit}
          onCancel={handleCancel}
          isSubmitting
        />
      );

      await user.click(screen.getByRole('button', { name: /next/i }));

      await waitFor(() => {
        expect(
          screen.getByRole('button', { name: /updating/i })
        ).toBeDisabled();
      });
    });
  });
});
