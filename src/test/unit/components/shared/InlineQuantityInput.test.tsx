import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import InlineQuantityInput from '../../../../components/shared/InlineQuantityInput';

describe('InlineQuantityInput', () => {
  it('renders the value as a button in display mode', () => {
    render(<InlineQuantityInput value={5} onChange={vi.fn()} />);

    expect(screen.getByRole('button', { name: '5' })).toBeInTheDocument();
  });

  it('enters edit mode on click and shows an input', async () => {
    const user = userEvent.setup();
    render(<InlineQuantityInput value={3} onChange={vi.fn()} />);

    await user.click(screen.getByRole('button', { name: '3' }));

    expect(screen.getByRole('spinbutton')).toBeInTheDocument();
  });

  it('calls onChange with new value on blur', async () => {
    const user = userEvent.setup();
    const handleChange = vi.fn();
    render(<InlineQuantityInput value={2} onChange={handleChange} />);

    await user.click(screen.getByRole('button', { name: '2' }));

    const input = screen.getByRole('spinbutton');
    await user.clear(input);
    await user.type(input, '7');
    await user.tab();

    expect(handleChange).toHaveBeenCalledWith(7);
  });

  it('calls onChange on Enter key', async () => {
    const user = userEvent.setup();
    const handleChange = vi.fn();
    render(<InlineQuantityInput value={1} onChange={handleChange} />);

    await user.click(screen.getByRole('button', { name: '1' }));

    const input = screen.getByRole('spinbutton');
    await user.clear(input);
    await user.type(input, '10');
    await user.keyboard('{Enter}');

    expect(handleChange).toHaveBeenCalledWith(10);
  });

  it('reverts on Escape without calling onChange', async () => {
    const user = userEvent.setup();
    const handleChange = vi.fn();
    render(<InlineQuantityInput value={4} onChange={handleChange} />);

    await user.click(screen.getByRole('button', { name: '4' }));
    await user.keyboard('{Escape}');

    expect(handleChange).not.toHaveBeenCalled();
    expect(screen.getByRole('button', { name: '4' })).toBeInTheDocument();
  });

  it('does not call onChange when value is unchanged', async () => {
    const user = userEvent.setup();
    const handleChange = vi.fn();
    render(<InlineQuantityInput value={5} onChange={handleChange} />);

    await user.click(screen.getByRole('button', { name: '5' }));
    await user.tab();

    expect(handleChange).not.toHaveBeenCalled();
  });

  it('does not call onChange when value is below min', async () => {
    const user = userEvent.setup();
    const handleChange = vi.fn();
    render(<InlineQuantityInput value={2} onChange={handleChange} min={1} />);

    await user.click(screen.getByRole('button', { name: '2' }));

    const input = screen.getByRole('spinbutton');
    await user.clear(input);
    await user.type(input, '0');
    await user.tab();

    expect(handleChange).not.toHaveBeenCalled();
  });

  it('does not enter edit mode when disabled', async () => {
    const user = userEvent.setup();
    render(<InlineQuantityInput value={3} onChange={vi.fn()} disabled />);

    await user.click(screen.getByRole('button', { name: '3' }));

    expect(screen.queryByRole('spinbutton')).not.toBeInTheDocument();
  });
});
