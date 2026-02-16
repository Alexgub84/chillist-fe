import React from 'react';
import { render, screen } from '@testing-library/react';
import { vi, describe, it, expect } from 'vitest';

// Partially mock the router so we only replace `Link` while keeping other exports
vi.mock('@tanstack/react-router', async (importOriginal) => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const actual = (await importOriginal()) as Record<string, any>;
  return {
    ...actual,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    Link: (props: Record<string, any>) => {
      const { to, children, ...rest } = props;
      return React.createElement(
        'a',
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        { href: typeof to === 'string' ? to : '#', ...(rest as any) },
        children
      );
    },
  };
});

import NotFound from '../../../src/routes/not-found.lazy.jsx';
import ErrorPage from '../../../src/routes/ErrorPage.jsx';

describe('Error and NotFound UIs', () => {
  it('renders NotFound component with 404 heading', () => {
    render(<NotFound />);

    expect(screen.getByText(/404 — Page Not Found/i)).toBeInTheDocument();
    expect(
      screen.getByText(/We couldn't find the page you were looking for./i)
    ).toBeInTheDocument();
  });

  it('shows ErrorPage UI when a child component throws', () => {
    // Component that throws during render
    const Bomb = () => {
      throw new Error('Test crash');
    };

    // Minimal Error Boundary to catch render errors and display the ErrorPage
    class TestErrorBoundary extends React.Component {
      state = { error: null };

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      componentDidCatch(error: any) {
        this.setState({ error });
      }

      render() {
        if (this.state.error) {
          return <ErrorPage error={this.state.error} />;
        }
        // @ts-expect-error children
        return this.props.children;
      }
    }

    render(
      <TestErrorBoundary>
        <Bomb />
      </TestErrorBoundary>
    );

    expect(screen.getByText(/Something went wrong/i)).toBeInTheDocument();
    expect(screen.getByText(/Test crash/i)).toBeInTheDocument();
  });
});
