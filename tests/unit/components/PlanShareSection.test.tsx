import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import PlanShareSection from '../../../src/components/PlanShareSection';

describe('PlanShareSection', () => {
  it('renders instruction text and buttons', () => {
    render(<PlanShareSection onCopy={vi.fn()} onShare={vi.fn()} />);

    expect(
      screen.getByText('Invite your friends and family')
    ).toBeInTheDocument();
    expect(screen.getByText('Share or copy the link')).toBeInTheDocument();
    expect(screen.getByTestId('plan-share-section')).toBeInTheDocument();
    expect(screen.getByTestId('copy-plan-url-button')).toBeInTheDocument();
    expect(screen.getByTestId('share-plan-url-button')).toBeInTheDocument();
  });

  it('calls onCopy when copy button is clicked', async () => {
    const onCopy = vi.fn();
    render(<PlanShareSection onCopy={onCopy} onShare={vi.fn()} />);

    await userEvent.click(screen.getByTestId('copy-plan-url-button'));

    expect(onCopy).toHaveBeenCalledTimes(1);
  });

  it('calls onShare when share button is clicked', async () => {
    const onShare = vi.fn();
    render(<PlanShareSection onCopy={vi.fn()} onShare={onShare} />);

    await userEvent.click(screen.getByTestId('share-plan-url-button'));

    expect(onShare).toHaveBeenCalledTimes(1);
  });
});
