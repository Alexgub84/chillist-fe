import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import PlanForm from '../../../components/PlanForm';

vi.mock('uuid', () => ({
  v5: vi.fn(
    (name: string) => `uuid-${name.toLowerCase().replace(/\s+/g, '-')}`
  ),
}));

const getInputByLabel = (labelText: RegExp) => {
  const label = screen.getByText(labelText);
  const container = label.closest('div') || label.parentElement;
  return container?.querySelector('input, textarea, select') as HTMLElement;
};

describe('CreatePlan - PlanForm', () => {
  let handleSubmit: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    vi.clearAllMocks();
    handleSubmit = vi.fn();
  });

  const renderForm = (props?: { isSubmitting?: boolean }) => {
    return render(
      <PlanForm onSubmit={handleSubmit} isSubmitting={props?.isSubmitting} />
    );
  };

  async function fillOwnerFields(user: ReturnType<typeof userEvent.setup>) {
    await user.type(screen.getByPlaceholderText(/first name/i), 'Alice');
    await user.type(screen.getByPlaceholderText(/last name/i), 'Smith');
    await user.type(
      screen.getByPlaceholderText(/phone number/i),
      '+1234567890'
    );
  }

  describe('Validation errors for required fields', () => {
    it('should show error when title is missing', async () => {
      const user = userEvent.setup();
      renderForm();

      const submitButton = screen.getByRole('button', {
        name: /create plan/i,
      });
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/title is required/i)).toBeInTheDocument();
      });

      expect(handleSubmit).not.toHaveBeenCalled();
    });

    it('should show error when owner name is missing', async () => {
      const user = userEvent.setup();
      renderForm();

      const inputs = screen.getAllByRole('textbox');
      const titleInput = inputs[0];
      await user.type(titleInput, 'Test Plan');

      const submitButton = screen.getByRole('button', {
        name: /create plan/i,
      });
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/owner name is required/i)).toBeInTheDocument();
      });

      expect(handleSubmit).not.toHaveBeenCalled();
    });

    it('should show error when date is missing in one-day mode', async () => {
      const user = userEvent.setup();
      renderForm();

      await user.type(getInputByLabel(/title/i), 'Test Plan');
      await fillOwnerFields(user);

      const oneDayCheckbox = getInputByLabel(/one-day plan/i);
      await user.click(oneDayCheckbox);

      const submitButton = screen.getByRole('button', {
        name: /create plan/i,
      });
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/date is required/i)).toBeInTheDocument();
      });

      expect(handleSubmit).not.toHaveBeenCalled();
    });

    it('should show error when start date is missing in multi-day mode', async () => {
      const user = userEvent.setup();
      renderForm();

      await user.type(getInputByLabel(/title/i), 'Test Plan');
      await fillOwnerFields(user);

      const submitButton = screen.getByRole('button', {
        name: /create plan/i,
      });
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/start date is required/i)).toBeInTheDocument();
      });

      expect(handleSubmit).not.toHaveBeenCalled();
    });

    it('should show error when end date is missing in multi-day mode', async () => {
      const user = userEvent.setup();
      renderForm();

      await user.type(getInputByLabel(/title/i), 'Test Plan');
      await fillOwnerFields(user);

      const startDateInput = getInputByLabel(/start date/i);
      await user.type(startDateInput, '2025-12-20');

      const submitButton = screen.getByRole('button', {
        name: /create plan/i,
      });
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/end date is required/i)).toBeInTheDocument();
      });

      expect(handleSubmit).not.toHaveBeenCalled();
    });
  });

  describe('One-day toggle behavior', () => {
    it('should show single date fields when one-day is checked', async () => {
      const user = userEvent.setup();
      renderForm();

      const oneDayCheckbox = getInputByLabel(/one-day plan/i);
      await user.click(oneDayCheckbox);

      await waitFor(() => {
        expect(screen.getByText(/^date \*$/i)).toBeInTheDocument();
        expect(screen.getByText(/start time/i)).toBeInTheDocument();
        expect(screen.getByText(/end time/i)).toBeInTheDocument();
        expect(screen.queryByText(/start date \*/i)).not.toBeInTheDocument();
        expect(screen.queryByText(/end date \*/i)).not.toBeInTheDocument();
      });
    });

    it('should show multi-day date fields when one-day is unchecked', () => {
      renderForm();

      expect(screen.getByText(/start date \*/i)).toBeInTheDocument();
      expect(screen.getByText(/end date \*/i)).toBeInTheDocument();
      expect(screen.queryByText(/^date \*$/i)).not.toBeInTheDocument();
    });
  });

  describe('Successful submission - one-day mode', () => {
    it('should call onSubmit with correct payload for one-day plan', async () => {
      const user = userEvent.setup();
      renderForm();

      await user.type(getInputByLabel(/title/i), 'Picnic Day');
      await user.type(getInputByLabel(/description/i), 'A fun day out');
      await fillOwnerFields(user);

      await user.click(getInputByLabel(/one-day plan/i));

      await waitFor(() => {
        expect(screen.getByText(/^date \*$/i)).toBeInTheDocument();
      });

      await user.type(getInputByLabel(/^date \*$/i), '2025-12-20');
      await user.type(getInputByLabel(/start time/i), '10:00');
      await user.type(getInputByLabel(/end time/i), '16:00');

      await user.type(
        screen.getByPlaceholderText(/e\.g\. picnic, friends, summer/i),
        'outdoor,fun'
      );

      await user.click(screen.getByRole('button', { name: /create plan/i }));

      await waitFor(() => {
        expect(handleSubmit).toHaveBeenCalledTimes(1);
        expect(handleSubmit).toHaveBeenCalledWith(
          expect.objectContaining({
            title: 'Picnic Day',
            description: 'A fun day out',
            owner: {
              name: 'Alice',
              lastName: 'Smith',
              contactPhone: '+1234567890',
              contactEmail: undefined,
            },
            startDate: '2025-12-20T10:00:00Z',
            endDate: '2025-12-20T16:00:00Z',
            tags: ['outdoor', 'fun'],
          })
        );

        const payload = handleSubmit.mock.calls[0][0];
        const iso8601 = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z$/;
        expect(payload.startDate).toMatch(iso8601);
        expect(payload.endDate).toMatch(iso8601);
      });
    });
  });

  describe('Successful submission - multi-day mode', () => {
    it('should call onSubmit with correct payload for multi-day plan', async () => {
      const user = userEvent.setup();
      renderForm();

      await user.type(getInputByLabel(/title/i), 'Weekend Trip');
      await user.type(getInputByLabel(/description/i), 'Two day adventure');
      await user.selectOptions(getInputByLabel(/status/i), 'active');
      await fillOwnerFields(user);

      await user.type(getInputByLabel(/start date/i), '2025-12-20');
      await user.type(getInputByLabel(/start time/i), '09:00');
      await user.type(getInputByLabel(/end date/i), '2025-12-22');
      await user.type(getInputByLabel(/end time/i), '18:00');

      await user.type(
        screen.getByPlaceholderText(/e\.g\. picnic, friends, summer/i),
        'travel'
      );

      await user.click(screen.getByRole('button', { name: /create plan/i }));

      await waitFor(() => {
        expect(handleSubmit).toHaveBeenCalledTimes(1);
        expect(handleSubmit).toHaveBeenCalledWith(
          expect.objectContaining({
            title: 'Weekend Trip',
            description: 'Two day adventure',
            owner: {
              name: 'Alice',
              lastName: 'Smith',
              contactPhone: '+1234567890',
              contactEmail: undefined,
            },
            startDate: '2025-12-20T09:00:00Z',
            endDate: '2025-12-22T18:00:00Z',
            tags: ['travel'],
          })
        );

        const payload = handleSubmit.mock.calls[0][0];
        const iso8601 = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z$/;
        expect(payload.startDate).toMatch(iso8601);
        expect(payload.endDate).toMatch(iso8601);
      });
    });
  });

  describe('Participants', () => {
    it('should add and submit participants', async () => {
      const user = userEvent.setup();
      renderForm();

      await user.type(getInputByLabel(/title/i), 'Group Trip');
      await fillOwnerFields(user);
      await user.click(getInputByLabel(/one-day plan/i));

      await waitFor(() => {
        expect(screen.getByText(/^date \*$/i)).toBeInTheDocument();
      });
      await user.type(getInputByLabel(/^date \*$/i), '2025-12-20');

      const addButton = screen.getByText(/\+ add participant/i);
      await user.click(addButton);

      const firstNameInputs = screen.getAllByPlaceholderText(/first name \*/i);
      const lastNameInputs = screen.getAllByPlaceholderText(/last name \*/i);
      const phoneInputs = screen.getAllByPlaceholderText(/phone \*/i);

      await user.type(firstNameInputs[0], 'Bob');
      await user.type(lastNameInputs[0], 'Jones');
      await user.type(phoneInputs[0], '+9999999999');

      await user.click(screen.getByRole('button', { name: /create plan/i }));

      await waitFor(() => {
        expect(handleSubmit).toHaveBeenCalledTimes(1);
        const payload = handleSubmit.mock.calls[0][0];
        expect(payload.participants).toEqual([
          {
            name: 'Bob',
            lastName: 'Jones',
            contactPhone: '+9999999999',
            contactEmail: undefined,
          },
        ]);
      });
    });

    it('should remove a participant row', async () => {
      const user = userEvent.setup();
      renderForm();

      const addButton = screen.getByText(/\+ add participant/i);
      await user.click(addButton);
      await user.click(addButton);

      expect(screen.getAllByText(/participant \d/i)).toHaveLength(2);

      const removeButtons = screen.getAllByText(/remove/i);
      await user.click(removeButtons[0]);

      expect(screen.getAllByText(/participant \d/i)).toHaveLength(1);
    });
  });

  describe('Location handling', () => {
    it('should omit location from payload when no location fields are filled', async () => {
      const user = userEvent.setup();
      renderForm();

      await user.type(getInputByLabel(/title/i), 'No Location Plan');
      await fillOwnerFields(user);
      await user.click(getInputByLabel(/one-day plan/i));

      await waitFor(() => {
        expect(screen.getByText(/^date \*$/i)).toBeInTheDocument();
      });

      await user.type(getInputByLabel(/^date \*$/i), '2025-12-20');

      await user.click(screen.getByRole('button', { name: /create plan/i }));

      await waitFor(() => {
        expect(handleSubmit).toHaveBeenCalledTimes(1);
        const payload = handleSubmit.mock.calls[0][0];
        expect(payload.location).toBeUndefined();
      });
    });

    it('should include location with generated locationId when location name is provided', async () => {
      const user = userEvent.setup();
      renderForm();

      await user.type(getInputByLabel(/title/i), 'Park Hangout');
      await fillOwnerFields(user);
      await user.click(getInputByLabel(/one-day plan/i));

      await waitFor(() => {
        expect(screen.getByText(/^date \*$/i)).toBeInTheDocument();
      });

      await user.type(getInputByLabel(/^date \*$/i), '2025-12-20');

      await user.type(
        screen.getByPlaceholderText(/location name/i),
        'Central Park'
      );
      await user.type(screen.getByPlaceholderText(/^city$/i), 'New York');
      await user.type(screen.getByPlaceholderText(/^country$/i), 'US');

      await user.click(screen.getByRole('button', { name: /create plan/i }));

      await waitFor(() => {
        expect(handleSubmit).toHaveBeenCalledTimes(1);
        const payload = handleSubmit.mock.calls[0][0];
        expect(payload.location).toEqual(
          expect.objectContaining({
            locationId: 'uuid-central-park',
            name: 'Central Park',
            city: 'New York',
            country: 'US',
          })
        );
        expect(payload.location.locationId).toBeTruthy();
        expect(payload.location.name).toBeTruthy();
      });
    });

    it('should fall back to plan title for locationId and name when location name is empty but other fields are filled', async () => {
      const user = userEvent.setup();
      renderForm();

      await user.type(getInputByLabel(/title/i), 'Beach Trip');
      await fillOwnerFields(user);
      await user.click(getInputByLabel(/one-day plan/i));

      await waitFor(() => {
        expect(screen.getByText(/^date \*$/i)).toBeInTheDocument();
      });

      await user.type(getInputByLabel(/^date \*$/i), '2025-12-20');

      await user.type(screen.getByPlaceholderText(/^city$/i), 'Miami');

      await user.click(screen.getByRole('button', { name: /create plan/i }));

      await waitFor(() => {
        expect(handleSubmit).toHaveBeenCalledTimes(1);
        const payload = handleSubmit.mock.calls[0][0];
        expect(payload.location).toEqual(
          expect.objectContaining({
            locationId: 'uuid-beach-trip',
            name: 'Beach Trip',
            city: 'Miami',
          })
        );
      });
    });
  });

  describe('Owner fields in payload', () => {
    it('should include owner object with name, lastName, contactPhone', async () => {
      const user = userEvent.setup();
      renderForm();

      await user.type(getInputByLabel(/title/i), 'Test');
      await fillOwnerFields(user);
      await user.click(getInputByLabel(/one-day plan/i));

      await waitFor(() => {
        expect(screen.getByText(/^date \*$/i)).toBeInTheDocument();
      });

      await user.type(getInputByLabel(/^date \*$/i), '2025-12-20');

      await user.click(screen.getByRole('button', { name: /create plan/i }));

      await waitFor(() => {
        expect(handleSubmit).toHaveBeenCalledWith(
          expect.objectContaining({
            owner: expect.objectContaining({
              name: 'Alice',
              lastName: 'Smith',
              contactPhone: '+1234567890',
            }),
          })
        );
      });
    });
  });

  describe('Submit button state', () => {
    it('should show "Creating…" and disable button when isSubmitting is true', () => {
      renderForm({ isSubmitting: true });

      const submitButton = screen.getByRole('button', { name: /creating/i });
      expect(submitButton).toBeDisabled();
      expect(submitButton).toHaveTextContent('Creating…');
    });
  });
});
