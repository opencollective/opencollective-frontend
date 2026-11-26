import '@testing-library/jest-dom';

import React from 'react';
import { render, screen } from '@testing-library/react';

import { withRequiredProviders } from '../test/providers';

import Member from './Member';

const collective = { id: 1, slug: 'my-collective', name: 'My Collective', currency: 'USD' };

const renderMember = member =>
  render(
    withRequiredProviders(
      <Member
        member={{ role: 'BACKER', createdAt: '2020-01-01', member }}
        collective={collective}
        viewMode="ORGANIZATION"
      />,
    ),
  );

describe('Member', () => {
  it('links an organization card to its profile', () => {
    renderMember({ id: 2, type: 'ORGANIZATION', slug: 'acme', name: 'Acme' });
    expect(screen.getByRole('link')).toHaveAttribute('href', '/acme');
  });

  it('does not link an anonymous member, even in the organization view', () => {
    const { container } = renderMember({ id: 'incognito-m1', type: 'USER', name: 'Incognito', isIncognito: true });
    expect(screen.queryByRole('link')).not.toBeInTheDocument();
    expect(container.querySelector('.viewMode-USER')).toBeInTheDocument();
  });
});
