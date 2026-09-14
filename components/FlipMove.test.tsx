import '@testing-library/jest-dom';

import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';

import FlipMove from './FlipMove';

function renderFlip(ui: React.ReactNode) {
  return render(ui, { reactStrictMode: true });
}

describe('FlipMove', () => {
  it('renders keyed children', () => {
    renderFlip(
      <FlipMove enterAnimation="fade" leaveAnimation="fade">
        <div key="a">Alpha</div>
        <div key="b">Beta</div>
      </FlipMove>,
    );

    expect(screen.getByText('Alpha')).toBeInTheDocument();
    expect(screen.getByText('Beta')).toBeInTheDocument();
  });

  it('removes children immediately when animations are disabled', () => {
    const { rerender } = renderFlip(
      <FlipMove enterAnimation="fade" leaveAnimation="fade" disableAllAnimations>
        <div key="a">Alpha</div>
        <div key="b">Beta</div>
      </FlipMove>,
    );

    rerender(
      <FlipMove enterAnimation="fade" leaveAnimation="fade" disableAllAnimations>
        <div key="a">Alpha</div>
      </FlipMove>,
    );

    expect(screen.getByText('Alpha')).toBeInTheDocument();
    expect(screen.queryByText('Beta')).not.toBeInTheDocument();
  });

  it('keeps leaving children until the fade animation finishes', async () => {
    const { rerender } = renderFlip(
      <FlipMove enterAnimation="fade" leaveAnimation="fade" duration={30}>
        <div key="a">Alpha</div>
        <div key="b">Beta</div>
      </FlipMove>,
    );

    rerender(
      <FlipMove enterAnimation="fade" leaveAnimation="fade" duration={30}>
        <div key="a">Alpha</div>
      </FlipMove>,
    );

    expect(screen.getByText('Beta')).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.queryByText('Beta')).not.toBeInTheDocument();
    });
    expect(screen.getByText('Alpha')).toBeInTheDocument();
  });

  it('keeps all items after a reorder', () => {
    const { rerender } = renderFlip(
      <FlipMove enterAnimation="fade" leaveAnimation="fade">
        <div key="a">Alpha</div>
        <div key="b">Beta</div>
        <div key="c">Gamma</div>
      </FlipMove>,
    );

    rerender(
      <FlipMove enterAnimation="fade" leaveAnimation="fade">
        <div key="c">Gamma</div>
        <div key="a">Alpha</div>
        <div key="b">Beta</div>
      </FlipMove>,
    );

    expect(screen.getByText('Alpha')).toBeInTheDocument();
    expect(screen.getByText('Beta')).toBeInTheDocument();
    expect(screen.getByText('Gamma')).toBeInTheDocument();
  });

  it('renders a newly added child', () => {
    const { rerender } = renderFlip(
      <FlipMove enterAnimation="fade" leaveAnimation="fade">
        <div key="a">Alpha</div>
      </FlipMove>,
    );

    rerender(
      <FlipMove enterAnimation="fade" leaveAnimation="fade">
        <div key="a">Alpha</div>
        <div key="b">Beta</div>
      </FlipMove>,
    );

    expect(screen.getByText('Alpha')).toBeInTheDocument();
    expect(screen.getByText('Beta')).toBeInTheDocument();
  });
});
