import { describe, it, expect, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import PreferencesForm from '../../../src/components/PreferencesForm';

describe('PreferencesForm', () => {
  it('renders all form fields', () => {
    render(<PreferencesForm onSubmit={vi.fn()} isSubmitting={false} />);

    expect(screen.getByText('Adults')).toBeInTheDocument();
    expect(screen.getByText('Kids')).toBeInTheDocument();
    expect(screen.getByText('Food preferences')).toBeInTheDocument();
    expect(screen.getByText('Allergies')).toBeInTheDocument();
    expect(screen.getByText('Notes')).toBeInTheDocument();
  });

  it('renders submit button with correct label', () => {
    render(<PreferencesForm onSubmit={vi.fn()} isSubmitting={false} />);

    expect(
      screen.getByRole('button', { name: 'Save Preferences' })
    ).toBeInTheDocument();
  });

  it('shows saving label when submitting', () => {
    render(<PreferencesForm onSubmit={vi.fn()} isSubmitting={true} />);

    expect(screen.getByRole('button', { name: /Saving/ })).toBeInTheDocument();
  });

  it('renders skip button when onSkip is provided', () => {
    render(
      <PreferencesForm
        onSubmit={vi.fn()}
        isSubmitting={false}
        onSkip={vi.fn()}
      />
    );

    expect(
      screen.getByRole('button', { name: 'Skip for now' })
    ).toBeInTheDocument();
  });

  it('does not render skip button when onSkip is not provided', () => {
    render(<PreferencesForm onSubmit={vi.fn()} isSubmitting={false} />);

    expect(
      screen.queryByRole('button', { name: 'Skip for now' })
    ).not.toBeInTheDocument();
  });

  it('renders cancel button when onCancel is provided', () => {
    render(
      <PreferencesForm
        onSubmit={vi.fn()}
        isSubmitting={false}
        onCancel={vi.fn()}
      />
    );

    expect(screen.getByRole('button', { name: 'Cancel' })).toBeInTheDocument();
  });

  it('calls onSkip when skip button is clicked', async () => {
    const user = userEvent.setup();
    const onSkip = vi.fn();
    render(
      <PreferencesForm
        onSubmit={vi.fn()}
        isSubmitting={false}
        onSkip={onSkip}
      />
    );

    await user.click(screen.getByRole('button', { name: 'Skip for now' }));

    expect(onSkip).toHaveBeenCalledTimes(1);
  });

  it('calls onCancel when cancel button is clicked', async () => {
    const user = userEvent.setup();
    const onCancel = vi.fn();
    render(
      <PreferencesForm
        onSubmit={vi.fn()}
        isSubmitting={false}
        onCancel={onCancel}
      />
    );

    await user.click(screen.getByRole('button', { name: 'Cancel' }));

    expect(onCancel).toHaveBeenCalledTimes(1);
  });

  it('calls onSubmit with form values on valid submission', async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();
    render(<PreferencesForm onSubmit={onSubmit} isSubmitting={false} />);

    const [adultsInput, kidsInput] = screen.getAllByPlaceholderText('0');
    void kidsInput;
    const foodInput = screen.getByPlaceholderText(
      'e.g. vegetarian, no shellfish'
    );
    const allergiesInput = screen.getByPlaceholderText(
      'e.g. nuts, gluten, dairy'
    );

    await user.clear(adultsInput);
    await user.type(adultsInput, '2');
    await user.type(foodInput, 'vegetarian');
    await user.type(allergiesInput, 'nuts');

    await user.click(screen.getByRole('button', { name: 'Save Preferences' }));

    await waitFor(() => {
      expect(onSubmit).toHaveBeenCalledTimes(1);
    });

    expect(onSubmit).toHaveBeenCalledWith(
      expect.objectContaining({
        adultsCount: 2,
        foodPreferences: 'vegetarian',
        allergies: 'nuts',
      }),
      expect.anything()
    );
  });

  it('pre-fills default values when provided', () => {
    render(
      <PreferencesForm
        onSubmit={vi.fn()}
        isSubmitting={false}
        defaultValues={{
          adultsCount: 3,
          kidsCount: 1,
          foodPreferences: 'vegan',
          allergies: 'gluten',
          notes: 'bring extra blankets',
        }}
      />
    );

    expect(screen.getByDisplayValue('3')).toBeInTheDocument();
    expect(screen.getByDisplayValue('1')).toBeInTheDocument();
    expect(screen.getByDisplayValue('vegan')).toBeInTheDocument();
    expect(screen.getByDisplayValue('gluten')).toBeInTheDocument();
    expect(
      screen.getByDisplayValue('bring extra blankets')
    ).toBeInTheDocument();
  });

  it('submits empty form without errors', async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();
    render(<PreferencesForm onSubmit={onSubmit} isSubmitting={false} />);

    await user.click(screen.getByRole('button', { name: 'Save Preferences' }));

    await waitFor(() => {
      expect(onSubmit).toHaveBeenCalledTimes(1);
    });
  });
});
