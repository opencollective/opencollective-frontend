import React from 'react';
import { render, screen } from '@testing-library/react';

import { HoverCard, HoverCardContent, HoverCardTrigger } from './HoverCard';

describe('HoverCard', () => {
  it('renders its content in a portal so it stacks above sibling overlays (drawers, files viewer)', () => {
    const { container } = render(
      <div className="relative z-3000" data-testid="stacking-context">
        <HoverCard open>
          <HoverCardTrigger>Trigger</HoverCardTrigger>
          <HoverCardContent>Card content</HoverCardContent>
        </HoverCard>
      </div>,
    );

    const content = screen.getByText('Card content');
    expect(content).toBeInTheDocument();
    expect(container.contains(content)).toBe(false);
  });
});
