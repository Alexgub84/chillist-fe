import { beforeAll, describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import InlineSelect from '../../../../src/components/shared/InlineSelect';

beforeAll(() => {
  global.ResizeObserver = class {
    observe() {}
    unobserve() {}
    disconnect() {}
  };
});

const OPTIONS = [
  { value: 'a', label: 'Alpha' },
  { value: 'b', label: 'Bravo' },
  { value: 'c', label: 'Charlie' },
];

describe('InlineSelect', () => {
  it('renders the selected option label as the button text', () => {
    render(<InlineSelect value="b" onChange={vi.fn()} options={OPTIONS} />);

    expect(screen.getByRole('button', { name: /bravo/i })).toBeInTheDocument();
  });

  it('opens dropdown and shows all options on click', async () => {
    const user = userEvent.setup();
    render(<InlineSelect value="a" onChange={vi.fn()} options={OPTIONS} />);

    await user.click(screen.getByRole('button', { name: /alpha/i }));

    expect(screen.getByRole('option', { name: /alpha/i })).toBeInTheDocument();
    expect(screen.getByRole('option', { name: /bravo/i })).toBeInTheDocument();
    expect(
      screen.getByRole('option', { name: /charlie/i })
    ).toBeInTheDocument();
  });

  it('calls onChange with the selected value', async () => {
    const user = userEvent.setup();
    const handleChange = vi.fn();
    render(
      <InlineSelect value="a" onChange={handleChange} options={OPTIONS} />
    );

    await user.click(screen.getByRole('button', { name: /alpha/i }));
    await user.click(screen.getByRole('option', { name: /charlie/i }));

    expect(handleChange).toHaveBeenCalledWith('c');
  });

  it('does not open dropdown when disabled', async () => {
    const user = userEvent.setup();
    render(
      <InlineSelect value="a" onChange={vi.fn()} options={OPTIONS} disabled />
    );

    await user.click(screen.getByRole('button', { name: /alpha/i }));

    expect(screen.queryByRole('option')).not.toBeInTheDocument();
  });

  it('applies custom buttonClassName', () => {
    render(
      <InlineSelect
        value="a"
        onChange={vi.fn()}
        options={OPTIONS}
        buttonClassName="text-red-500"
      />
    );

    expect(screen.getByRole('button', { name: /alpha/i })).toHaveClass(
      'text-red-500'
    );
  });
});
