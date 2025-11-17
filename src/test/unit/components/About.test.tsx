import { render } from '@testing-library/react';
import { expect, test } from 'vitest';
import { About } from '../../../routes/about.lazy.jsx';

test('renders About component', async () => {
  const { getByText } = render(<About />);
  expect(getByText('About Us')).toBeInTheDocument();
  expect(getByText('Welcome to Chillist!')).toBeInTheDocument();
});
