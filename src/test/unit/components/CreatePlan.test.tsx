/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import PlanForm from '../../../components/PlanForm';
import * as apiModule from '../../../core/api';

// Mock the API module
vi.mock('../../../core/api', () => ({
  createPlan: vi.fn(),
}));

// Mock uuid v5
vi.mock('uuid', () => ({
  v5: vi.fn(
    (name: string) => `uuid-${name.toLowerCase().replace(/\s+/g, '-')}`
  ),
}));

describe('CreatePlan - PlanForm', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    vi.clearAllMocks();
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    });
  });

  const renderForm = () => {
    return render(
      <QueryClientProvider client={queryClient}>
        <PlanForm />
      </QueryClientProvider>
    );
  };

  // Helper to get input by label text (since form doesn't use htmlFor)
  const getInputByLabel = (labelText: RegExp) => {
    const label = screen.getByText(labelText);
    const container = label.closest('div') || label.parentElement;
    return container?.querySelector('input, textarea, select') as HTMLElement;
  };

  describe('Validation errors for required fields', () => {
    it('should show error when title is missing', async () => {
      const user = userEvent.setup();
      renderForm();

      const submitButton = screen.getByRole('button', { name: /create plan/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/title is required/i)).toBeInTheDocument();
      });
    });

    it('should show error when owner name is missing', async () => {
      const user = userEvent.setup();
      renderForm();

      const inputs = screen.getAllByRole('textbox');
      const titleInput = inputs[0]; // First textbox is title
      await user.type(titleInput, 'Test Plan');

      const submitButton = screen.getByRole('button', { name: /create plan/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/owner name is required/i)).toBeInTheDocument();
      });
    });

    it('should show error when date is missing in one-day mode', async () => {
      const user = userEvent.setup();
      renderForm();

      const inputs = screen.getAllByRole('textbox');
      const titleInput = inputs[0];
      await user.type(titleInput, 'Test Plan');

      const ownerInput = screen.getByPlaceholderText(/enter your full name/i);
      await user.type(ownerInput, 'John Doe');

      // Ensure one-day mode is checked
      const oneDayCheckbox = getInputByLabel(/one-day plan/i);
      await user.click(oneDayCheckbox);

      const submitButton = screen.getByRole('button', { name: /create plan/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/date is required/i)).toBeInTheDocument();
      });
    });

    it('should show error when start date is missing in multi-day mode', async () => {
      const user = userEvent.setup();
      renderForm();

      const inputs = screen.getAllByRole('textbox');
      const titleInput = inputs[0];
      await user.type(titleInput, 'Test Plan');

      const ownerInput = screen.getByPlaceholderText(/enter your full name/i);
      await user.type(ownerInput, 'John Doe');

      // Ensure one-day mode is NOT checked (default is multi-day)
      const submitButton = screen.getByRole('button', { name: /create plan/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/start date is required/i)).toBeInTheDocument();
      });
    });

    it('should show error when end date is missing in multi-day mode', async () => {
      const user = userEvent.setup();
      renderForm();

      const inputs = screen.getAllByRole('textbox');
      const titleInput = inputs[0];
      await user.type(titleInput, 'Test Plan');

      const ownerInput = screen.getByPlaceholderText(/enter your full name/i);
      await user.type(ownerInput, 'John Doe');

      // Form defaults to multi-day mode (oneDay=false), so multi-day fields should already be visible
      // Fill in start date but not end date
      const startDateInput = getInputByLabel(/start date/i);
      await user.type(startDateInput, '2025-12-20');

      const submitButton = screen.getByRole('button', { name: /create plan/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/end date is required/i)).toBeInTheDocument();
      });
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
    it('should submit valid one-day plan and call API with correct data', async () => {
      const user = userEvent.setup();
      const mockCreatePlan = vi.mocked(apiModule.createPlan);
      mockCreatePlan.mockResolvedValue({
        planId: 'plan-123',
        title: 'Picnic Day',
        description: 'A fun day out',
        status: 'draft',
        ownerParticipantId: 'uuid-alice',
        startDate: '2025-12-20T10:00:00Z',
        endDate: '2025-12-20T16:00:00Z',
        tags: ['outdoor', 'fun'],
        participantIds: ['uuid-alice', 'uuid-bob'],
        createdAt: '2025-12-12T00:00:00Z',
        updatedAt: '2025-12-12T00:00:00Z',
        visibility: 'public',
      });

      // Mock window.location.href assignment

      delete (window as any).location;

      window.location = { href: '' } as any;

      renderForm();

      // Fill required fields
      await user.type(getInputByLabel(/title/i), 'Picnic Day');
      await user.type(getInputByLabel(/description/i), 'A fun day out');
      await user.type(getInputByLabel(/owner name/i), 'Alice');

      // Select one-day mode
      await user.click(getInputByLabel(/one-day plan/i));

      await waitFor(() => {
        expect(screen.getByText(/^date \*$/i)).toBeInTheDocument();
      });

      // Fill one-day fields
      await user.type(getInputByLabel(/^date \*$/i), '2025-12-20');
      await user.type(getInputByLabel(/start time/i), '10:00');
      await user.type(getInputByLabel(/end time/i), '16:00');

      // Fill optional fields
      await user.type(
        screen.getByPlaceholderText(/e\.g\. picnic, friends, summer/i),
        'outdoor,fun'
      );
      await user.type(
        screen.getByPlaceholderText(/Alice, Bob, Charlie/i),
        'Alice, Bob'
      );

      // Submit
      await user.click(screen.getByRole('button', { name: /create plan/i }));

      await waitFor(() => {
        expect(mockCreatePlan).toHaveBeenCalledWith(
          expect.objectContaining({
            title: 'Picnic Day',
            description: 'A fun day out',
            status: 'draft',
            ownerParticipantId: 'uuid-alice',
            startDate: '2025-12-20T10:00:00Z',
            endDate: '2025-12-20T16:00:00Z',
            tags: ['outdoor', 'fun'],
            participantIds: ['uuid-alice', 'uuid-bob'],
          })
        );

        const payload = mockCreatePlan.mock.calls[0][0];
        const iso8601 = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z$/;
        expect(payload.startDate).toMatch(iso8601);
        expect(payload.endDate).toMatch(iso8601);
      });

      // Check redirect
      expect(window.location.href).toBe('/plan/plan-123');
    });
  });

  describe('Successful submission - multi-day mode', () => {
    it('should submit valid multi-day plan and call API with correct data', async () => {
      const user = userEvent.setup();
      const mockCreatePlan = vi.mocked(apiModule.createPlan);
      mockCreatePlan.mockResolvedValue({
        planId: 'plan-456',
        title: 'Weekend Trip',
        description: 'Two day adventure',
        status: 'active',
        ownerParticipantId: 'uuid-charlie',
        startDate: '2025-12-20T09:00:00Z',
        endDate: '2025-12-22T18:00:00Z',
        tags: ['travel'],
        participantIds: ['uuid-charlie', 'uuid-dave'],
        createdAt: '2025-12-12T00:00:00Z',
        updatedAt: '2025-12-12T00:00:00Z',
        visibility: 'public',
      });

      delete (window as any).location;
      window.location = { href: '' } as any;

      renderForm();

      // Fill required fields
      await user.type(getInputByLabel(/title/i), 'Weekend Trip');
      await user.type(getInputByLabel(/description/i), 'Two day adventure');
      await user.selectOptions(getInputByLabel(/status/i), 'active');
      await user.type(getInputByLabel(/owner name/i), 'Charlie');

      // Fill multi-day fields (default mode)
      await user.type(getInputByLabel(/start date/i), '2025-12-20');
      await user.type(getInputByLabel(/start time/i), '09:00');
      await user.type(getInputByLabel(/end date/i), '2025-12-22');
      await user.type(getInputByLabel(/end time/i), '18:00');

      // Fill optional fields
      await user.type(
        screen.getByPlaceholderText(/e\.g\. picnic, friends, summer/i),
        'travel'
      );
      await user.type(
        screen.getByPlaceholderText(/Alice, Bob, Charlie/i),
        'Charlie, Dave'
      );

      // Submit
      await user.click(screen.getByRole('button', { name: /create plan/i }));

      await waitFor(() => {
        expect(mockCreatePlan).toHaveBeenCalledWith(
          expect.objectContaining({
            title: 'Weekend Trip',
            description: 'Two day adventure',
            status: 'active',
            ownerParticipantId: 'uuid-charlie',
            startDate: '2025-12-20T09:00:00Z',
            endDate: '2025-12-22T18:00:00Z',
            tags: ['travel'],
            participantIds: ['uuid-charlie', 'uuid-dave'],
          })
        );

        const payload = mockCreatePlan.mock.calls[0][0];
        const iso8601 = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z$/;
        expect(payload.startDate).toMatch(iso8601);
        expect(payload.endDate).toMatch(iso8601);
      });

      expect(window.location.href).toBe('/plan/plan-456');
    });
  });

  describe('Location handling', () => {
    it('should omit location from payload when no location fields are filled', async () => {
      const user = userEvent.setup();
      const mockCreatePlan = vi.mocked(apiModule.createPlan);
      mockCreatePlan.mockResolvedValue({
        planId: 'plan-loc-1',
        title: 'No Location Plan',
        status: 'draft',
        ownerParticipantId: 'uuid-owner',
        startDate: '2025-12-20T00:00:00Z',
        createdAt: '2025-12-12T00:00:00Z',
        updatedAt: '2025-12-12T00:00:00Z',
        visibility: 'public',
      });

      delete (window as any).location;
      window.location = { href: '' } as any;

      renderForm();

      await user.type(getInputByLabel(/title/i), 'No Location Plan');
      await user.type(getInputByLabel(/owner name/i), 'Owner');
      await user.click(getInputByLabel(/one-day plan/i));

      await waitFor(() => {
        expect(screen.getByText(/^date \*$/i)).toBeInTheDocument();
      });

      await user.type(getInputByLabel(/^date \*$/i), '2025-12-20');

      await user.click(screen.getByRole('button', { name: /create plan/i }));

      await waitFor(() => {
        expect(mockCreatePlan).toHaveBeenCalledTimes(1);
        const payload = mockCreatePlan.mock.calls[0][0];
        expect(payload.location).toBeUndefined();
      });
    });

    it('should include location with generated locationId when location name is provided', async () => {
      const user = userEvent.setup();
      const mockCreatePlan = vi.mocked(apiModule.createPlan);
      mockCreatePlan.mockResolvedValue({
        planId: 'plan-loc-2',
        title: 'Park Hangout',
        status: 'draft',
        ownerParticipantId: 'uuid-owner',
        startDate: '2025-12-20T00:00:00Z',
        createdAt: '2025-12-12T00:00:00Z',
        updatedAt: '2025-12-12T00:00:00Z',
        visibility: 'public',
        location: {
          locationId: 'uuid-central-park',
          name: 'Central Park',
          city: 'New York',
          country: 'US',
        },
      });

      delete (window as any).location;
      window.location = { href: '' } as any;

      renderForm();

      await user.type(getInputByLabel(/title/i), 'Park Hangout');
      await user.type(getInputByLabel(/owner name/i), 'Owner');
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
        expect(mockCreatePlan).toHaveBeenCalledTimes(1);
        const payload = mockCreatePlan.mock.calls[0][0];
        expect(payload.location).toEqual(
          expect.objectContaining({
            locationId: 'uuid-central-park',
            name: 'Central Park',
            city: 'New York',
            country: 'US',
          })
        );
        expect(payload.location!.locationId).toBeTruthy();
        expect(payload.location!.name).toBeTruthy();
      });
    });

    it('should fall back to plan title for locationId and name when location name is empty but other fields are filled', async () => {
      const user = userEvent.setup();
      const mockCreatePlan = vi.mocked(apiModule.createPlan);
      mockCreatePlan.mockResolvedValue({
        planId: 'plan-loc-3',
        title: 'Beach Trip',
        status: 'draft',
        ownerParticipantId: 'uuid-owner',
        startDate: '2025-12-20T00:00:00Z',
        createdAt: '2025-12-12T00:00:00Z',
        updatedAt: '2025-12-12T00:00:00Z',
        visibility: 'public',
        location: {
          locationId: 'uuid-beach-trip',
          name: 'Beach Trip',
          city: 'Miami',
        },
      });

      delete (window as any).location;
      window.location = { href: '' } as any;

      renderForm();

      await user.type(getInputByLabel(/title/i), 'Beach Trip');
      await user.type(getInputByLabel(/owner name/i), 'Owner');
      await user.click(getInputByLabel(/one-day plan/i));

      await waitFor(() => {
        expect(screen.getByText(/^date \*$/i)).toBeInTheDocument();
      });

      await user.type(getInputByLabel(/^date \*$/i), '2025-12-20');

      await user.type(screen.getByPlaceholderText(/^city$/i), 'Miami');

      await user.click(screen.getByRole('button', { name: /create plan/i }));

      await waitFor(() => {
        expect(mockCreatePlan).toHaveBeenCalledTimes(1);
        const payload = mockCreatePlan.mock.calls[0][0];
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

  describe('ID generation from names', () => {
    it('should generate ownerParticipantId from owner name using uuid v5', async () => {
      const user = userEvent.setup();
      const mockCreatePlan = vi.mocked(apiModule.createPlan);
      mockCreatePlan.mockResolvedValue({
        planId: 'plan-789',
        title: 'Test',
        status: 'draft',
        ownerParticipantId: 'uuid-test-owner',
        startDate: '2025-12-20T00:00:00Z',
        createdAt: '2025-12-12T00:00:00Z',
        updatedAt: '2025-12-12T00:00:00Z',
        visibility: 'public',
      });

      delete (window as any).location;
      window.location = { href: '' } as any;

      renderForm();

      await user.type(getInputByLabel(/title/i), 'Test');
      await user.type(getInputByLabel(/owner name/i), 'Test Owner');
      await user.click(getInputByLabel(/one-day plan/i));

      await waitFor(() => {
        expect(screen.getByText(/^date \*$/i)).toBeInTheDocument();
      });

      await user.type(getInputByLabel(/^date \*$/i), '2025-12-20');

      await user.click(screen.getByRole('button', { name: /create plan/i }));

      await waitFor(() => {
        expect(mockCreatePlan).toHaveBeenCalledWith(
          expect.objectContaining({
            ownerParticipantId: 'uuid-test-owner',
          })
        );
      });
    });

    it('should generate participantIds from participant names using uuid v5', async () => {
      const user = userEvent.setup();
      const mockCreatePlan = vi.mocked(apiModule.createPlan);
      mockCreatePlan.mockResolvedValue({
        planId: 'plan-999',
        title: 'Test',
        status: 'draft',
        ownerParticipantId: 'uuid-owner',
        startDate: '2025-12-20T00:00:00Z',
        participantIds: ['uuid-anna', 'uuid-beth', 'uuid-carol'],
        createdAt: '2025-12-12T00:00:00Z',
        updatedAt: '2025-12-12T00:00:00Z',
        visibility: 'public',
      });

      delete (window as any).location;
      window.location = { href: '' } as any;

      renderForm();

      await user.type(getInputByLabel(/title/i), 'Test');
      await user.type(getInputByLabel(/owner name/i), 'Owner');
      await user.click(getInputByLabel(/one-day plan/i));

      await waitFor(() => {
        expect(screen.getByText(/^date \*$/i)).toBeInTheDocument();
      });

      await user.type(getInputByLabel(/^date \*$/i), '2025-12-20');
      await user.type(
        screen.getByPlaceholderText(/Alice, Bob, Charlie/i),
        'Anna, Beth, Carol'
      );

      await user.click(screen.getByRole('button', { name: /create plan/i }));

      await waitFor(() => {
        expect(mockCreatePlan).toHaveBeenCalledWith(
          expect.objectContaining({
            participantIds: ['uuid-anna', 'uuid-beth', 'uuid-carol'],
          })
        );
      });
    });
  });
});
