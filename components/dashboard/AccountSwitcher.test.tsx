import '@testing-library/jest-dom';

jest.mock('../../lib/hooks/useLoggedInUser', () => ({
  __esModule: true,
  default: jest.fn(),
}));

jest.mock('@/lib/hooks/useIsMobile', () => ({
  useIsMobile: () => false,
}));

import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { IntlProvider } from 'react-intl';
import { ThemeProvider } from 'styled-components';

import useLoggedInUser from '../../lib/hooks/useLoggedInUser';
import theme from '../../lib/theme';

import { SidebarProvider } from '../ui/Sidebar';

import AccountSwitcher, { includeActiveAccountInGroups, isAccountInGroupedAccounts } from './AccountSwitcher';
import { DashboardContext } from './DashboardContext';

const personalCollective = {
  id: 99,
  slug: 'my-user',
  name: 'My User',
  type: 'USER',
  imageUrl: null,
};

const parentCollective = {
  id: 1,
  slug: 'parent-collective',
  name: 'Parent Collective',
  type: 'COLLECTIVE',
  isIncognito: false,
  isArchived: false,
  imageUrl: null,
  children: [],
};

const createdEvent = {
  id: 'event-1',
  legacyId: 2,
  slug: 'my-event',
  name: 'My Event',
  type: 'EVENT',
  imageUrl: null,
};

const getMockLoggedInUser = (memberOf = [{ id: 10, role: 'ADMIN', collective: parentCollective }]) => ({
  collective: personalCollective,
  memberOf,
  isRoot: false,
  isAdminOfCollective: () => true,
  isAccountantOnly: () => false,
  isCommunityManagerOnly: () => false,
});

const renderSwitcher = ({
  account = createdEvent,
  activeSlug = createdEvent.slug,
  memberOf,
}: {
  account?: any;
  activeSlug?: string;
  memberOf?: any;
} = {}) => {
  (useLoggedInUser as jest.Mock).mockReturnValue({ LoggedInUser: getMockLoggedInUser(memberOf) });
  const dashboardContext = { account, activeSlug } as unknown as React.ContextType<typeof DashboardContext>;

  return render(
    <IntlProvider locale="en">
      <ThemeProvider theme={theme}>
        <DashboardContext.Provider value={dashboardContext}>
          <SidebarProvider>
            <AccountSwitcher />
          </SidebarProvider>
        </DashboardContext.Provider>
      </ThemeProvider>
    </IntlProvider>,
  );
};

describe('isAccountInGroupedAccounts', () => {
  it('finds an account listed at the top level', () => {
    const grouped = { COLLECTIVE: [parentCollective], ORGANIZATION: [] };
    expect(isAccountInGroupedAccounts(grouped, parentCollective)).toBe(true);
  });

  it('finds an account listed as a child', () => {
    const grouped = { COLLECTIVE: [{ ...parentCollective, children: [createdEvent] }], ORGANIZATION: [] };
    expect(isAccountInGroupedAccounts(grouped, createdEvent)).toBe(true);
  });

  it('returns false for an account that is not listed', () => {
    const grouped = { COLLECTIVE: [parentCollective], ORGANIZATION: [] };
    expect(isAccountInGroupedAccounts(grouped, createdEvent)).toBe(false);
  });
});

describe('includeActiveAccountInGroups', () => {
  it('adds the active account to its type group when it is missing (e.g. inherited admins)', () => {
    const grouped = { COLLECTIVE: [parentCollective], ORGANIZATION: [] };
    const result = includeActiveAccountInGroups(grouped, createdEvent, personalCollective);
    expect(result.EVENT).toEqual([createdEvent]);
  });

  it('does not add an account that is already listed', () => {
    const grouped = { COLLECTIVE: [{ ...parentCollective, children: [createdEvent] }], ORGANIZATION: [] };
    const result = includeActiveAccountInGroups(grouped, createdEvent, personalCollective);
    expect(result).toBe(grouped);
  });

  it('does not add the logged in user collective (already shown separately)', () => {
    const grouped = { COLLECTIVE: [parentCollective], ORGANIZATION: [] };
    const result = includeActiveAccountInGroups(grouped, personalCollective, personalCollective);
    expect(result).toBe(grouped);
  });

  it('does not add the ROOT profile admin', () => {
    const grouped = { COLLECTIVE: [parentCollective], ORGANIZATION: [] };
    const result = includeActiveAccountInGroups(grouped, { slug: 'root-actions', type: 'ROOT' }, personalCollective);
    expect(result).toBe(grouped);
  });
});

describe('AccountSwitcher', () => {
  it('displays the active event from the dashboard context even when it is not a direct membership', async () => {
    // The parent is administered but does not (yet) list the event as a child, mirroring a freshly
    // created event that has not been refreshed in `memberOf` yet.
    renderSwitcher();

    expect(screen.getAllByText('My Event').length).toBeGreaterThan(0);

    await userEvent.click(screen.getByRole('button', { name: /my event/i }));

    expect(await screen.findByRole('link', { name: /my event/i })).toHaveAttribute('href', '/dashboard/my-event');
  });
});
