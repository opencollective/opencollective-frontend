import '@testing-library/jest-dom';

import React from 'react';
import { ApolloClient, ApolloLink, ApolloProvider, InMemoryCache, Observable } from '@apollo/client';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { IntlProvider } from 'react-intl';

import MembersWithData from './MembersWithData';

jest.mock('./Member', () => ({
  __esModule: true,
  default: ({ member, viewMode }) => (
    <div data-testid="member" data-type={member.member.type} data-view={viewMode}>
      {member.member.slug}:{member.stats.totalDonations}
    </div>
  ),
}));

const makeNode = (i: number) => ({
  __typename: 'Member',
  id: `m${i}`,
  role: 'BACKER',
  createdAt: '2020-01-01T00:00:00.000Z',
  tier: null,
  totalDonations: { __typename: 'Amount', valueInCents: 100000 - i },
  account: {
    __typename: 'Individual',
    id: `a${i}`,
    type: 'INDIVIDUAL',
    name: `Member ${i}`,
    slug: `member-${i}`,
    description: null,
    imageUrl: null,
    backgroundImageUrl: null,
    isIncognito: false,
    company: null,
  },
});

const renderWithLink = (props: Partial<React.ComponentProps<typeof MembersWithData>>) => {
  const calls = [];
  const link = new ApolloLink(operation => {
    const { offset, limit } = operation.variables;
    calls.push(operation.variables);
    const nodes = Array.from({ length: Math.max(0, Math.min(limit, 15 - offset)) }, (_, i) => makeNode(offset + i));
    const data = {
      account: {
        __typename: 'Collective',
        id: 'c1',
        members: { __typename: 'MemberCollection', totalCount: 15, nodes },
      },
    };
    return Observable.of({ data });
  });
  const client = new ApolloClient({ link, cache: new InMemoryCache() });
  render(
    <IntlProvider locale="en">
      <ApolloProvider client={client}>
        <MembersWithData collective={{ slug: 'my-collective' }} {...props} />
      </ApolloProvider>
    </IntlProvider>,
  );
  return calls;
};

describe('MembersWithData', () => {
  it('queries v2 members with the mapped variables and maps INDIVIDUAL to USER', async () => {
    const calls = renderWithLink({ type: 'USER', memberRole: 'BACKER', orderBy: 'totalDonations', limit: 10 });
    await waitFor(() => expect(screen.getAllByTestId('member')).toHaveLength(10));
    expect(calls[0]).toEqual({
      collectiveSlug: 'my-collective',
      role: ['BACKER'],
      accountType: ['INDIVIDUAL'],
      orderByTotalContributed: 'DESC',
      limit: 10,
      offset: 0,
    });
    const first = screen.getAllByTestId('member')[0];
    expect(first).toHaveAttribute('data-type', 'USER');
    expect(first).toHaveAttribute('data-view', 'USER');
    expect(first).toHaveTextContent('member-0:100000');
  });

  it('splits a comma separated type list into account types', async () => {
    const calls = renderWithLink({ type: 'ORGANIZATION,COLLECTIVE', memberRole: 'BACKER', limit: 10 });
    await waitFor(() => expect(screen.getAllByTestId('member')).toHaveLength(10));
    expect(calls[0].accountType).toEqual(['ORGANIZATION', 'COLLECTIVE']);
    expect(calls[0].orderByTotalContributed).toBeUndefined();
  });

  it('appends the next page when loading more', async () => {
    const calls = renderWithLink({ type: 'USER', memberRole: 'BACKER', orderBy: 'totalDonations', limit: 10 });
    await waitFor(() => expect(screen.getAllByTestId('member')).toHaveLength(10));
    fireEvent.click(screen.getByText('load more'));
    await waitFor(() => expect(screen.getAllByTestId('member')).toHaveLength(15));
    expect(calls[1]).toMatchObject({ offset: 10, limit: 10, role: ['BACKER'], accountType: ['INDIVIDUAL'] });
    expect(screen.getAllByTestId('member').map(el => el.textContent.split(':')[0])).toEqual(
      Array.from({ length: 15 }, (_, i) => `member-${i}`),
    );
  });
});
