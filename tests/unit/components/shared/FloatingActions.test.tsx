import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import FloatingActions from '../../../../src/components/shared/FloatingActions';

describe('FloatingActions', () => {
  it('renders Add Item button', () => {
    render(<FloatingActions onAddItem={vi.fn()} />);

    expect(screen.getByTestId('add-item-fab')).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: /Add Item/i })
    ).toBeInTheDocument();
  });

  it('calls onAddItem when Add Item is clicked', async () => {
    const onAddItem = vi.fn();
    render(<FloatingActions onAddItem={onAddItem} />);

    await userEvent.click(screen.getByTestId('add-item-fab'));

    expect(onAddItem).toHaveBeenCalledTimes(1);
  });

  it('renders Bulk Add button when onBulkAdd is provided', () => {
    render(<FloatingActions onAddItem={vi.fn()} onBulkAdd={vi.fn()} />);

    expect(screen.getByTestId('bulk-add-fab')).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: /Add Multiple/i })
    ).toBeInTheDocument();
  });

  it('does not render Bulk Add button when onBulkAdd is omitted', () => {
    render(<FloatingActions onAddItem={vi.fn()} />);

    expect(screen.queryByTestId('bulk-add-fab')).not.toBeInTheDocument();
  });

  it('calls onBulkAdd when Add Multiple is clicked', async () => {
    const onBulkAdd = vi.fn();
    render(<FloatingActions onAddItem={vi.fn()} onBulkAdd={onBulkAdd} />);

    await userEvent.click(screen.getByTestId('bulk-add-fab'));

    expect(onBulkAdd).toHaveBeenCalledTimes(1);
  });

  it('renders with fixed positioning wrapper', () => {
    const { container } = render(<FloatingActions onAddItem={vi.fn()} />);

    const wrapper = container.querySelector('.fixed.bottom-6');
    expect(wrapper).toBeInTheDocument();
    expect(wrapper).toContainElement(screen.getByTestId('add-item-fab'));
  });
});
