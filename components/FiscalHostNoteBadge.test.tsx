import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { withRequiredProviders } from '../test/providers';

import Avatar from './Avatar';
import { FiscalHostNoteBadge, FiscalHostNoteBlock } from './FiscalHostNoteBadge';

const renderBadge = (note: React.ComponentProps<typeof FiscalHostNoteBadge>['note']) =>
  render(withRequiredProviders(<FiscalHostNoteBadge note={note} />));

describe('FiscalHostNoteBadge', () => {
  it('renders nothing without a note', () => {
    const { container } = renderBadge(null);
    expect(container).toBeEmptyDOMElement();
    const { container: emptyNoteContainer } = renderBadge({ type: 'WARNING', note: '' });
    expect(emptyNoteContainer).toBeEmptyDOMElement();
  });

  it('renders a warning badge', () => {
    renderBadge({ type: 'WARNING', note: '<p>Watch out</p>' });
    expect(screen.getByRole('button', { name: 'Fiscal host warning' })).toBeInTheDocument();
  });

  it('renders an info badge', () => {
    renderBadge({ type: 'INFO', note: '<p>Some context</p>' });
    expect(screen.getByRole('button', { name: 'Fiscal host note' })).toBeInTheDocument();
  });

  it('shows the note and its attribution on hover', async () => {
    renderBadge({
      type: 'WARNING',
      note: '<p>Watch out for this one</p>',
      updatedAt: '2026-10-30T12:00:00.000Z',
      updatedBy: { name: 'Alice Admin' },
    });

    await userEvent.hover(screen.getByRole('button', { name: 'Fiscal host warning' }));

    expect(await screen.findByText('Watch out for this one')).toBeInTheDocument();
    expect(screen.getByText('Updated by Alice Admin')).toBeInTheDocument();
  });
});

describe('FiscalHostNoteBlock', () => {
  it('renders the type, note and attribution', () => {
    render(
      withRequiredProviders(
        <FiscalHostNoteBlock
          note={{
            type: 'WARNING',
            note: '<p>Watch out for this one</p>',
            updatedAt: '2026-10-30T12:00:00.000Z',
            updatedBy: { name: 'Alice Admin' },
          }}
        />,
      ),
    );

    expect(screen.getByText('Fiscal host warning')).toBeInTheDocument();
    expect(screen.getByText('Watch out for this one')).toBeInTheDocument();
    expect(screen.getByText('Updated by Alice Admin')).toBeInTheDocument();
  });
});

describe('Avatar flags', () => {
  it('adds a red circle alert to a warning avatar and shows its note on hover', async () => {
    const { container } = render(
      withRequiredProviders(
        <Avatar
          size={24}
          collective={{
            type: 'USER',
            name: 'Alice',
            slug: 'alice',
            fiscalHostNote: { type: 'WARNING', note: '<p>Watch out</p>' },
          }}
        />,
      ),
    );

    expect(container.querySelector('svg.text-red-500')).toBeInTheDocument();

    await userEvent.hover(container.firstElementChild);
    expect(await screen.findByText('Watch out')).toBeInTheDocument();
  });

  it('uses a blue circle alert for info flags', () => {
    const { container } = render(
      withRequiredProviders(
        <Avatar
          size={24}
          collective={{
            type: 'USER',
            name: 'Alice',
            slug: 'alice',
            fiscalHostNote: { type: 'INFO', note: '<p>Some context</p>' },
          }}
        />,
      ),
    );

    expect(container.querySelector('svg.text-blue-500')).toBeInTheDocument();
  });

  it('uses a green check for positive flags', () => {
    const { container } = render(
      withRequiredProviders(
        <Avatar
          size={24}
          collective={{
            type: 'USER',
            name: 'Alice',
            slug: 'alice',
            fiscalHostNote: { type: 'POSITIVE', note: '<p>Great contributor</p>' },
          }}
        />,
      ),
    );

    expect(container.querySelector('svg.text-green-500')).toBeInTheDocument();
  });

  it('uses a plain colour dot instead of an icon on small avatars', () => {
    const { container } = render(
      withRequiredProviders(
        <Avatar
          size={20}
          collective={{
            type: 'USER',
            name: 'Alice',
            slug: 'alice',
            fiscalHostNote: { type: 'WARNING', note: '<p>Watch out</p>' },
          }}
        />,
      ),
    );

    const dot = container.querySelector('.bg-red-500');
    expect(dot).toBeInTheDocument();
    expect(dot).toHaveStyle({ width: '4px', height: '4px' });
    expect(container.querySelector('svg')).toBeNull();
  });

  it('keeps the level colour on small avatar dots', () => {
    const { container } = render(
      withRequiredProviders(
        <Avatar
          size={16}
          collective={{
            type: 'USER',
            name: 'Alice',
            slug: 'alice',
            fiscalHostNote: { type: 'POSITIVE', note: '<p>Great contributor</p>' },
          }}
        />,
      ),
    );

    expect(container.querySelector('.bg-green-500')).toBeInTheDocument();
    expect(container.querySelector('svg')).toBeNull();
  });

  it('renders a plain avatar without a note', () => {
    const { container } = render(
      withRequiredProviders(<Avatar size={24} collective={{ type: 'USER', name: 'Alice', slug: 'alice' }} />),
    );

    expect(container.querySelector('svg.text-red-500')).toBeNull();
    expect(container.querySelector('svg.text-blue-500')).toBeNull();
    expect(container.querySelector('button')).toBeNull();
  });
});
