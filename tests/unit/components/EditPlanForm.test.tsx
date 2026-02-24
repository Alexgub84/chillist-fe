import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import EditPlanForm from '../../../src/components/EditPlanForm';
import type { PlanWithDetails } from '../../../src/core/schemas/plan';

vi.mock('../../../src/contexts/useAuth', () => ({
  useAuth: () => ({
    session: null,
    user: { id: 'test-user' },
    loading: false,
    isAdmin: false,
    signOut: vi.fn(),
  }),
}));

vi.mock('uuid', () => ({
  v5: vi.fn(
    (name: string) => `uuid-${name.toLowerCase().replace(/\s+/g, '-')}`
  ),
}));

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
    participants: [
      {
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
        adultsCount: null,
        kidsCount: null,
        foodPreferences: null,
        allergies: null,
        notes: null,
        createdAt: '2026-01-01T00:00:00Z',
        updatedAt: '2026-01-01T00:00:00Z',
      },
    ],
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
    return render(
      <EditPlanForm
        plan={plan ?? buildTestPlan()}
        onSubmit={handleSubmit}
        onCancel={handleCancel}
        isSubmitting={isSubmitting}
      />
    );
  }

  it('pre-fills form fields from the plan', () => {
    renderForm();

    const titleInput = screen.getByPlaceholderText(/enter plan title/i);
    expect(titleInput).toHaveValue('Beach Trip');

    const descriptionInput = screen.getByPlaceholderText(
      /add details about your plan/i
    );
    expect(descriptionInput).toHaveValue('A fun day at the beach');

    const tagsInput = screen.getByPlaceholderText(/e\.g\. picnic/i);
    expect(tagsInput).toHaveValue('beach, summer');
  });

  it('pre-fills location fields from the plan', () => {
    renderForm();

    const locationName = screen.getByPlaceholderText(/location name/i);
    expect(locationName).toHaveValue('Bondi Beach');

    const cityInput = screen.getByPlaceholderText('City');
    expect(cityInput).toHaveValue('Sydney');

    const countryInput = screen.getByPlaceholderText('Country');
    expect(countryInput).toHaveValue('Australia');
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

    const submitButton = screen.getByRole('button', {
      name: /update plan/i,
    });
    await user.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(/title is required/i)).toBeInTheDocument();
    });
    expect(handleSubmit).not.toHaveBeenCalled();
  });

  it('calls onSubmit with PlanPatch payload on valid submission', async () => {
    const user = userEvent.setup();
    renderForm();

    const titleInput = screen.getByPlaceholderText(/enter plan title/i);
    await user.clear(titleInput);
    await user.type(titleInput, 'Updated Beach Trip');

    const submitButton = screen.getByRole('button', {
      name: /update plan/i,
    });
    await user.click(submitButton);

    await waitFor(() => {
      expect(handleSubmit).toHaveBeenCalledTimes(1);
    });

    const payload = handleSubmit.mock.calls[0][0];
    expect(payload.title).toBe('Updated Beach Trip');
    expect(payload.description).toBe('A fun day at the beach');
    expect(payload.status).toBe('active');
    expect(payload.visibility).toBe('private');
    expect(payload.tags).toEqual(['beach', 'summer']);
  });

  it('shows updating state on submit button', () => {
    renderForm(undefined, true);

    expect(screen.getByRole('button', { name: /updating/i })).toBeDisabled();
  });

  it('shows Update Plan on submit button when not submitting', () => {
    renderForm();

    expect(screen.getByRole('button', { name: /update plan/i })).toBeEnabled();
  });

  it('calls onCancel when cancel button is clicked', async () => {
    const user = userEvent.setup();
    renderForm();

    await user.click(screen.getByRole('button', { name: /cancel/i }));
    expect(handleCancel).toHaveBeenCalledTimes(1);
  });

  it('handles plan with no location', () => {
    const plan = buildTestPlan({ location: null });
    renderForm(plan);

    const locationName = screen.getByPlaceholderText(/location name/i);
    expect(locationName).toHaveValue('');
  });

  it('handles plan with no tags', () => {
    const plan = buildTestPlan({ tags: null });
    renderForm(plan);

    const tagsInput = screen.getByPlaceholderText(/e\.g\. picnic/i);
    expect(tagsInput).toHaveValue('');
  });

  it('handles plan with no dates', () => {
    const plan = buildTestPlan({ startDate: null, endDate: null });
    renderForm(plan);

    expect(screen.getByText(/start date/i)).toBeInTheDocument();
  });
});
