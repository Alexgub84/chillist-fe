import { describe, it, expect, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useForm, FormProvider } from 'react-hook-form';
import PreferencesFields, {
  type PreferencesFieldValues,
} from '../../../../src/components/shared/PreferencesFields';

function TestWrapper({
  defaultValues,
  onSubmit,
}: {
  defaultValues?: Partial<PreferencesFieldValues>;
  onSubmit: (v: PreferencesFieldValues) => void;
}) {
  const methods = useForm<PreferencesFieldValues>({
    defaultValues: {
      adultsCount: defaultValues?.adultsCount ?? 1,
      kidsCount: defaultValues?.kidsCount ?? undefined,
      foodPreferences: defaultValues?.foodPreferences ?? '',
      allergies: defaultValues?.allergies ?? '',
      notes: defaultValues?.notes ?? '',
    },
  });

  return (
    <FormProvider {...methods}>
      <form onSubmit={methods.handleSubmit(onSubmit)}>
        <PreferencesFields
          register={methods.register}
          errors={methods.formState.errors}
          compact
        />
        <button type="submit">Save</button>
      </form>
    </FormProvider>
  );
}

describe('PreferencesFields', () => {
  it('renders all five preference fields', () => {
    render(<TestWrapper onSubmit={vi.fn()} />);

    expect(screen.getByText('Adults (including you)')).toBeInTheDocument();
    expect(screen.getByText('Kids')).toBeInTheDocument();
    expect(screen.getByText('Food preferences')).toBeInTheDocument();
    expect(screen.getByText('Allergies')).toBeInTheDocument();
    expect(screen.getByText('Notes')).toBeInTheDocument();
  });

  it('renders placeholders for text fields', () => {
    render(<TestWrapper onSubmit={vi.fn()} />);

    expect(
      screen.getByPlaceholderText('e.g. vegetarian, no shellfish')
    ).toBeInTheDocument();
    expect(
      screen.getByPlaceholderText('e.g. nuts, gluten, dairy')
    ).toBeInTheDocument();
    expect(
      screen.getByPlaceholderText('Anything else the group should know')
    ).toBeInTheDocument();
  });

  it('pre-fills default values', () => {
    render(
      <TestWrapper
        onSubmit={vi.fn()}
        defaultValues={{
          adultsCount: 3,
          kidsCount: 2,
          foodPreferences: 'vegan',
          allergies: 'peanuts',
          notes: 'early arrival',
        }}
      />
    );

    expect(screen.getByDisplayValue('3')).toBeInTheDocument();
    expect(screen.getByDisplayValue('2')).toBeInTheDocument();
    expect(screen.getByDisplayValue('vegan')).toBeInTheDocument();
    expect(screen.getByDisplayValue('peanuts')).toBeInTheDocument();
    expect(screen.getByDisplayValue('early arrival')).toBeInTheDocument();
  });

  it('submits entered values through parent form', async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();
    render(<TestWrapper onSubmit={onSubmit} />);

    const foodInput = screen.getByPlaceholderText(
      'e.g. vegetarian, no shellfish'
    );
    await user.type(foodInput, 'vegetarian');
    await user.click(screen.getByRole('button', { name: 'Save' }));

    await waitFor(() => {
      expect(onSubmit).toHaveBeenCalledTimes(1);
    });

    expect(onSubmit).toHaveBeenCalledWith(
      expect.objectContaining({ foodPreferences: 'vegetarian' }),
      expect.anything()
    );
  });

  it('renders foodPreferences and allergies as textareas', () => {
    const { container } = render(<TestWrapper onSubmit={vi.fn()} />);

    const textareas = container.querySelectorAll('textarea');
    expect(textareas).toHaveLength(3);
  });
});
