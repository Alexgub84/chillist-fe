import React from 'react';
import { describe, it, expect, vi, beforeEach, beforeAll } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { NotParticipantResponse } from '../../src/core/schemas/plan';
import type { JoinRequest } from '../../src/core/schemas/join-request';

beforeAll(() => {
  if (typeof globalThis.ResizeObserver === 'undefined') {
    globalThis.ResizeObserver = class {
      observe() {}
      unobserve() {}
      disconnect() {}
    } as unknown as typeof ResizeObserver;
  }
});

vi.mock('../../src/contexts/useAuth');
import { useAuth } from '../../src/contexts/useAuth';
const mockUseAuth = vi.mocked(useAuth);

const mockCreateJoinRequest = vi.fn();
vi.mock('../../src/core/api', () => ({
  createJoinRequest: (...args: unknown[]) => mockCreateJoinRequest(...args),
}));

import RequestToJoinPage from '../../src/components/RequestToJoinPage';

function makeQueryClient() {
  return new QueryClient({ defaultOptions: { queries: { retry: false } } });
}

function renderWithProviders(ui: React.ReactElement) {
  const client = makeQueryClient();
  return render(
    <QueryClientProvider client={client}>{ui}</QueryClientProvider>
  );
}

const basePreview: NotParticipantResponse['preview'] = {
  title: 'Summer BBQ 2026',
  description: 'Annual neighborhood cookout',
  startDate: '2026-07-15T12:00:00.000Z',
  endDate: '2026-07-15T20:00:00.000Z',
};

const pendingJoinRequest: JoinRequest = {
  requestId: 'jr-1',
  planId: 'plan-1',
  supabaseUserId: 'user-1',
  name: 'John',
  lastName: 'Doe',
  contactPhone: '+972501234567',
  status: 'pending',
  createdAt: '2026-03-01T10:00:00Z',
  updatedAt: '2026-03-01T10:00:00Z',
};

function mockAuthenticatedUser(overrides: Record<string, unknown> = {}) {
  mockUseAuth.mockReturnValue({
    session: {} as never,
    user: {
      id: 'user-1',
      email: 'john@example.com',
      user_metadata: {
        first_name: 'John',
        last_name: 'Doe',
        phone: '+972501234567',
        ...overrides,
      },
    } as never,
    loading: false,
    isAdmin: false,
    signOut: vi.fn(),
  });
}

describe('RequestToJoinPage — Integration', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockCreateJoinRequest.mockResolvedValue(pendingJoinRequest);
    mockAuthenticatedUser();
  });

  describe('plan preview card', () => {
    it('renders plan title, description, and dates from the preview', () => {
      renderWithProviders(
        <RequestToJoinPage
          planId="plan-1"
          response={{
            status: 'not_participant',
            preview: basePreview,
            joinRequest: null,
          }}
        />
      );

      expect(screen.getByTestId('plan-preview-card')).toBeInTheDocument();
      expect(screen.getByText('Summer BBQ 2026')).toBeInTheDocument();
      expect(
        screen.getByText('Annual neighborhood cookout')
      ).toBeInTheDocument();
      const dates = screen.getAllByText('15.07.2026');
      expect(dates.length).toBeGreaterThanOrEqual(1);
    });

    it('hides description when null', () => {
      renderWithProviders(
        <RequestToJoinPage
          planId="plan-1"
          response={{
            status: 'not_participant',
            preview: { ...basePreview, description: null },
            joinRequest: null,
          }}
        />
      );

      expect(screen.getByText('Summer BBQ 2026')).toBeInTheDocument();
      expect(
        screen.queryByText('Annual neighborhood cookout')
      ).not.toBeInTheDocument();
    });
  });

  describe('pending request card', () => {
    it('shows pending request card instead of form when joinRequest exists', () => {
      renderWithProviders(
        <RequestToJoinPage
          planId="plan-1"
          response={{
            status: 'not_participant',
            preview: basePreview,
            joinRequest: pendingJoinRequest,
          }}
        />
      );

      expect(
        screen.getByTestId('join-request-pending-card')
      ).toBeInTheDocument();
      expect(screen.getByText('Request already sent')).toBeInTheDocument();
      expect(screen.getByText('Pending approval')).toBeInTheDocument();
      expect(screen.queryByTestId('join-request-form')).not.toBeInTheDocument();
    });

    it('shows rejected badge for rejected request', () => {
      renderWithProviders(
        <RequestToJoinPage
          planId="plan-1"
          response={{
            status: 'not_participant',
            preview: basePreview,
            joinRequest: { ...pendingJoinRequest, status: 'rejected' },
          }}
        />
      );

      expect(screen.getByText('Rejected')).toBeInTheDocument();
    });
  });

  describe('join request form (PreferencesFields + PhoneInput integration)', () => {
    it('renders form with pre-filled user data', () => {
      renderWithProviders(
        <RequestToJoinPage
          planId="plan-1"
          response={{
            status: 'not_participant',
            preview: basePreview,
            joinRequest: null,
          }}
        />
      );

      expect(screen.getByTestId('join-request-form')).toBeInTheDocument();
      expect(screen.getByDisplayValue('John')).toBeInTheDocument();
      expect(screen.getByDisplayValue('Doe')).toBeInTheDocument();
      expect(screen.getByDisplayValue('john@example.com')).toBeInTheDocument();
    });

    it('renders PreferencesFields inside the form (adults, kids, food, allergies, notes)', () => {
      renderWithProviders(
        <RequestToJoinPage
          planId="plan-1"
          response={{
            status: 'not_participant',
            preview: basePreview,
            joinRequest: null,
          }}
        />
      );

      expect(screen.getByText('Adults (including you)')).toBeInTheDocument();
      expect(screen.getByText('Kids')).toBeInTheDocument();
      expect(screen.getByText('Food preferences')).toBeInTheDocument();
      expect(screen.getByText('Allergies')).toBeInTheDocument();
      expect(screen.getByText('Notes')).toBeInTheDocument();
    });

    it('renders PhoneInput combobox with pre-selected country', () => {
      renderWithProviders(
        <RequestToJoinPage
          planId="plan-1"
          response={{
            status: 'not_participant',
            preview: basePreview,
            joinRequest: null,
          }}
        />
      );

      const countryInput = screen.getByLabelText(/country/i);
      expect(countryInput).toHaveValue('🇮🇱 +972');
    });

    it('submits the form with all fields and calls createJoinRequest', async () => {
      const user = userEvent.setup();
      renderWithProviders(
        <RequestToJoinPage
          planId="plan-1"
          response={{
            status: 'not_participant',
            preview: basePreview,
            joinRequest: null,
          }}
        />
      );

      const foodInput = screen.getByPlaceholderText(
        'e.g. vegetarian, no shellfish'
      );
      await user.type(foodInput, 'vegetarian');

      const allergiesInput = screen.getByPlaceholderText(
        'e.g. nuts, gluten, dairy'
      );
      await user.type(allergiesInput, 'peanuts');

      const submitBtn = screen.getByTestId('join-request-submit');
      await user.click(submitBtn);

      await waitFor(() => {
        expect(mockCreateJoinRequest).toHaveBeenCalledTimes(1);
      });

      expect(mockCreateJoinRequest).toHaveBeenCalledWith(
        'plan-1',
        expect.objectContaining({
          name: 'John',
          lastName: 'Doe',
          contactPhone: expect.stringContaining('501234567'),
          foodPreferences: 'vegetarian',
          allergies: 'peanuts',
        })
      );
    });

    it('shows validation error when required field (name) is cleared', async () => {
      const user = userEvent.setup();
      renderWithProviders(
        <RequestToJoinPage
          planId="plan-1"
          response={{
            status: 'not_participant',
            preview: basePreview,
            joinRequest: null,
          }}
        />
      );

      const nameInput = screen.getByDisplayValue('John');
      await user.clear(nameInput);

      const submitBtn = screen.getByTestId('join-request-submit');
      await user.click(submitBtn);

      await waitFor(() => {
        expect(screen.getByText('Name is required')).toBeInTheDocument();
      });

      expect(mockCreateJoinRequest).not.toHaveBeenCalled();
    });

    it('handles API error gracefully with toast', async () => {
      mockCreateJoinRequest.mockRejectedValue(new Error('Network failure'));
      const user = userEvent.setup();

      renderWithProviders(
        <RequestToJoinPage
          planId="plan-1"
          response={{
            status: 'not_participant',
            preview: basePreview,
            joinRequest: null,
          }}
        />
      );

      const submitBtn = screen.getByTestId('join-request-submit');
      await user.click(submitBtn);

      await waitFor(() => {
        expect(mockCreateJoinRequest).toHaveBeenCalledTimes(1);
      });
    });
  });

  describe('full page flow: preview + form', () => {
    it('shows both the preview card and the form simultaneously', () => {
      renderWithProviders(
        <RequestToJoinPage
          planId="plan-1"
          response={{
            status: 'not_participant',
            preview: basePreview,
            joinRequest: null,
          }}
        />
      );

      expect(screen.getByTestId('plan-preview-card')).toBeInTheDocument();
      expect(screen.getByTestId('join-request-form')).toBeInTheDocument();
    });

    it('shows preview card and pending card when joinRequest is present', () => {
      renderWithProviders(
        <RequestToJoinPage
          planId="plan-1"
          response={{
            status: 'not_participant',
            preview: basePreview,
            joinRequest: pendingJoinRequest,
          }}
        />
      );

      expect(screen.getByTestId('plan-preview-card')).toBeInTheDocument();
      expect(
        screen.getByTestId('join-request-pending-card')
      ).toBeInTheDocument();
      expect(screen.queryByTestId('join-request-form')).not.toBeInTheDocument();
    });
  });
});
