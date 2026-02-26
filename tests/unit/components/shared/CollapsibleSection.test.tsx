import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import CollapsibleSection from '../../../../src/components/shared/CollapsibleSection';

describe('CollapsibleSection', () => {
  it('renders title and children', () => {
    render(
      <CollapsibleSection title="Test Section">
        <p>Panel content</p>
      </CollapsibleSection>
    );

    expect(screen.getByText('Test Section')).toBeInTheDocument();
    expect(screen.getByText('Panel content')).toBeInTheDocument();
  });

  it('renders custom title element', () => {
    render(
      <CollapsibleSection
        title={<h2 className="custom">Custom Title</h2>}
      >
        <p>Content</p>
      </CollapsibleSection>
    );

    const heading = screen.getByRole('heading', { name: /custom title/i });
    expect(heading).toHaveClass('custom');
  });

  it('applies wrapperClassName to outer container', () => {
    const { container } = render(
      <CollapsibleSection
        title="Section"
        wrapperClassName="bg-white rounded-lg"
      >
        <p>Content</p>
      </CollapsibleSection>
    );

    const wrapper = container.firstElementChild;
    expect(wrapper).toHaveClass('bg-white', 'rounded-lg');
  });

  it('renders with buttonAs div without error', async () => {
    render(
      <CollapsibleSection
        title="Section"
        buttonAs="div"
      >
        <p>Content</p>
      </CollapsibleSection>
    );

    expect(screen.getByText('Section')).toBeInTheDocument();
    expect(screen.getByText('Content')).toBeInTheDocument();
  });
});
