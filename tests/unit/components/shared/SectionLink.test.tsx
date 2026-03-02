import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import React from 'react';
import SectionLink from '../../../../src/components/shared/SectionLink';

vi.mock('@tanstack/react-router', () => ({
  Link: ({
    children,
    to,
    params,
    ...rest
  }: {
    children: React.ReactNode;
    to: string;
    params?: Record<string, string>;
    [k: string]: unknown;
  }) => {
    const href = params
      ? Object.entries(params).reduce(
          (path, [key, val]) => path.replace(`$${key}`, val),
          to
        )
      : to;
    return (
      <a href={href} data-testid={rest['data-testid'] as string}>
        {children}
      </a>
    );
  },
}));

describe('SectionLink', () => {
  it('renders title and subtitle', () => {
    render(
      <SectionLink
        to="/items/$planId"
        params={{ planId: 'plan-1' }}
        icon={<span>Icon</span>}
        title="Manage Items"
        subtitle="View and edit items"
        colorScheme="blue"
      />
    );

    expect(screen.getByText('Manage Items')).toBeInTheDocument();
    expect(screen.getByText('View and edit items')).toBeInTheDocument();
  });

  it('renders the icon', () => {
    render(
      <SectionLink
        to="/test"
        icon={<span data-testid="icon">Icon</span>}
        title="Title"
        subtitle="Sub"
        colorScheme="amber"
      />
    );

    expect(screen.getByTestId('icon')).toBeInTheDocument();
  });

  it('applies the testId prop', () => {
    render(
      <SectionLink
        to="/test"
        icon={<span>Icon</span>}
        title="Title"
        subtitle="Sub"
        colorScheme="blue"
        testId="section-link"
      />
    );

    expect(screen.getByTestId('section-link')).toBeInTheDocument();
  });

  it('renders a link with correct href from params', () => {
    render(
      <SectionLink
        to="/items/$planId"
        params={{ planId: 'abc-123' }}
        icon={<span>Icon</span>}
        title="Items"
        subtitle="Sub"
        colorScheme="amber"
        testId="items-link"
      />
    );

    const link = screen.getByTestId('items-link');
    expect(link).toHaveAttribute('href', '/items/abc-123');
  });

  it('renders a chevron icon', () => {
    const { container } = render(
      <SectionLink
        to="/test"
        icon={<span>Icon</span>}
        title="Title"
        subtitle="Sub"
        colorScheme="blue"
      />
    );

    const svg = container.querySelector('svg[aria-hidden="true"]');
    expect(svg).toBeInTheDocument();
  });
});
