import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const mockUsePlans = vi.fn();

vi.mock('../../../src/hooks/usePlans', () => ({
  usePlans: () => mockUsePlans(),
}));

vi.mock('@tanstack/react-router', () => ({
  createLazyFileRoute: () => () => ({
    component: () => null,
  }),
  Link: ({ children, to }: { children: React.ReactNode; to: string }) => (
    <a href={to}>{children}</a>
  ),
}));

import { getApiErrorMessage } from '../../../src/core/error-utils';

function PlansTestComponent() {
  const { data: plans, isLoading, error, refetch } = mockUsePlans();

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-gray-600">Loading plans...</div>
      </div>
    );
  }

  if (error) {
    const friendlyError = getApiErrorMessage(error);
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-center max-w-md">
          <div className="text-red-600 font-semibold text-lg mb-2">
            {friendlyError.title}
          </div>
          <div className="text-gray-600 mb-4">{friendlyError.message}</div>
          {friendlyError.canRetry && (
            <button
              onClick={() => refetch()}
              className="px-4 py-2 bg-blue-600 text-white rounded-md"
            >
              Try Again
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div>
      {plans?.map((plan: { planId: string; title: string }) => (
        <div key={plan.planId}>{plan.title}</div>
      ))}
    </div>
  );
}

function renderWithProviders() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  });

  return render(
    <QueryClientProvider client={queryClient}>
      <PlansTestComponent />
    </QueryClientProvider>
  );
}

describe('Plans Route', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  describe('Success Scenarios', () => {
    it('displays loading state', () => {
      mockUsePlans.mockReturnValue({
        data: undefined,
        isLoading: true,
        error: null,
        refetch: vi.fn(),
      });

      renderWithProviders();

      expect(screen.getByText('Loading plans...')).toBeInTheDocument();
    });

    it('displays plans when API returns data successfully', () => {
      const mockPlans = [
        { planId: 'plan-1', title: 'Beach Trip' },
        { planId: 'plan-2', title: 'Mountain Hike' },
      ];

      mockUsePlans.mockReturnValue({
        data: mockPlans,
        isLoading: false,
        error: null,
        refetch: vi.fn(),
      });

      renderWithProviders();

      expect(screen.getByText('Beach Trip')).toBeInTheDocument();
      expect(screen.getByText('Mountain Hike')).toBeInTheDocument();
    });
  });

  describe('Error Scenarios', () => {
    it('displays user-friendly error message on network error', () => {
      mockUsePlans.mockReturnValue({
        data: undefined,
        isLoading: false,
        error: new Error('Network error: Unable to reach API'),
        refetch: vi.fn(),
      });

      renderWithProviders();

      expect(screen.getByText('Connection Problem')).toBeInTheDocument();
      expect(
        screen.getByText(/Unable to connect to the server/)
      ).toBeInTheDocument();
      expect(
        screen.getByRole('button', { name: 'Try Again' })
      ).toBeInTheDocument();
    });

    it('displays user-friendly error message on generic error', () => {
      mockUsePlans.mockReturnValue({
        data: undefined,
        isLoading: false,
        error: new Error('Something went wrong'),
        refetch: vi.fn(),
      });

      renderWithProviders();

      expect(screen.getByText('Something Went Wrong')).toBeInTheDocument();
      expect(
        screen.getByRole('button', { name: 'Try Again' })
      ).toBeInTheDocument();
    });

    it('displays error message when API returns HTML instead of JSON', () => {
      mockUsePlans.mockReturnValue({
        data: undefined,
        isLoading: false,
        error: new Error(
          'Invalid API response: Expected JSON from /plans but received text/html'
        ),
        refetch: vi.fn(),
      });

      renderWithProviders();

      expect(
        screen.getByText('Server Configuration Error')
      ).toBeInTheDocument();
      expect(
        screen.getByRole('button', { name: 'Try Again' })
      ).toBeInTheDocument();
    });

    it('calls refetch when user clicks Try Again', async () => {
      const refetchMock = vi.fn();

      mockUsePlans.mockReturnValue({
        data: undefined,
        isLoading: false,
        error: new Error('Network error: Unable to reach API'),
        refetch: refetchMock,
      });

      renderWithProviders();

      const retryButton = screen.getByRole('button', { name: 'Try Again' });
      await userEvent.click(retryButton);

      expect(refetchMock).toHaveBeenCalledTimes(1);
    });
  });
});
