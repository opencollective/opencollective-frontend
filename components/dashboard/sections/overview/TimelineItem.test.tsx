import React from 'react';
import { render, screen } from '@testing-library/react';

import { withRequiredProviders } from '../../../../test/providers';

import TimelineItem from './TimelineItem';

describe('TimelineItem', () => {
  it('renders a fiscal host note activity with its note', () => {
    const activity = {
      id: 'activity-1',
      type: 'FISCAL_HOST_NOTE_SET',
      createdAt: new Date().toISOString(),
      data: { note: '<p>Watch out for this one</p>', noteType: 'WARNING' },
      individual: { id: 'individual-1', name: 'Alice Admin', slug: 'alice-admin' },
      fromAccount: { id: 'account-1', name: 'Bob Contributor', slug: 'bob-contributor' },
      account: { id: 'host-1', name: 'Fiscal Host', slug: 'fiscal-host' },
    } as unknown as React.ComponentProps<typeof TimelineItem>['activity'];

    render(withRequiredProviders(<TimelineItem activity={activity} />));

    expect(screen.getByRole('button', { name: 'Fiscal host warning' })).toBeInTheDocument();
    expect(screen.getByText('Fiscal host note')).toBeInTheDocument();
    expect(screen.getByText('Watch out for this one')).toBeInTheDocument();
    expect(document.body.textContent).toContain('Alice Admin');
    expect(document.body.textContent).toContain('added a fiscal host note on');
  });
});
