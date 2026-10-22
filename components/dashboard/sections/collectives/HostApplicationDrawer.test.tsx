import '@testing-library/jest-dom';

import React from 'react';
import { useMutation, useQuery } from '@apollo/client';
import { fireEvent, render, screen, within } from '@testing-library/react';
import { IntlProvider } from 'react-intl';

import type { EcosystemsRepositorySnapshot } from '../../../../lib/ecosystems';
import { HostApplicationStatus } from '../../../../lib/graphql/types/v2/graphql';

import { TooltipProvider } from '../../../ui/Tooltip';

import { EcosystemsRepositoryInfo, HostApplicationCustomData } from './hostApplicationCustomData';
import HostApplicationDrawer from './HostApplicationDrawer';

jest.mock('@apollo/client', () => ({
  ...jest.requireActual('@apollo/client'),
  useQuery: jest.fn(),
  useMutation: jest.fn(),
}));

jest.mock('../../../../lib/hooks/useLoggedInUser', () => ({
  __esModule: true,
  default: () => ({
    LoggedInUser: {
      isAdminOfCollective: () => true,
      isHostAdmin: () => true,
    },
  }),
}));

jest.mock('../../../Avatar', () => ({
  __esModule: true,
  default: () => <div data-testid="avatar" />,
}));

jest.mock('../../../LinkCollective', () => ({
  __esModule: true,
  default: ({ collective, children }) => <a href={`/${collective.slug}`}>{children}</a>,
}));

jest.mock('../../../AccountHoverCard', () => ({
  ...jest.requireActual('../../../AccountHoverCard'),
  AccountHoverCard: ({ trigger }) => trigger,
}));

jest.mock('../../../conversations/Thread', () => ({
  __esModule: true,
  default: () => <div data-testid="thread" />,
}));

jest.mock('./AcceptRejectButtons', () => ({
  __esModule: true,
  default: () => <div data-testid="accept-reject-buttons" />,
}));

const renderWithIntl = ui => render(<IntlProvider locale="en">{ui}</IntlProvider>);

const ECOSYSTEMS_SNAPSHOT: EcosystemsRepositorySnapshot = {
  fullName: 'foo/bar',
  owner: 'foo',
  description: 'Scanning APK files for URIs, endpoints &amp; secrets.',
  stars: 1234,
  forks: 12,
  isFork: true,
  license: 'mit',
  topics: [],
  ownerKind: 'organization',
  archived: false,
  createdAt: '2020-01-01T00:00:00.000Z',
  lastCommitAt: '2026-01-01T00:00:00.000Z',
  lastCommitSha: 'abcdef0123456789',
  commitStats: { totalCommits: 150, totalCommitters: 7, botCommitters: 2 },
  packages: [
    {
      name: 'bar',
      ecosystem: 'npm',
      maintainers: [],
      dependentPackagesCount: 3,
      dependentReposCount: 5,
      firstReleasePublishedAt: null,
      latestReleasePublishedAt: null,
    },
  ],
};

const baseCustomData = {
  typeOfProject: 'CODE',
  repositoryUrl: 'https://github.com/foo/bar',
  licenseSpdxId: 'MIT',
  amountOfMembers: '12',
  hasLegalEntity: true,
  ruleConfirmations: ['copyright'],
  ecosystemsRepositoryInfo: ECOSYSTEMS_SNAPSHOT,
  validatedRepositoryInfo: {
    allValidationsPassed: false,
    fields: {
      licenseSpdxId: { value: 'MIT', isValid: true },
      lastCommitDate: { value: '2026-01-01T00:00:00.000Z', isValid: true },
      isOwnedByOrg: { value: true, isValid: true },
      isFork: { value: true, isValid: false },
      collaboratorsCount: { value: 7, isValid: true },
      starsCount: { value: 1234, isValid: true },
      isAdmin: { value: true, isValid: true },
    },
  },
  useGithubValidation: true,
  migration: 'legacy-migration',
  previousEvents: 'https://meetup.com/foo',
  customUnknownField: 'kept as a fallback',
};

const baseApplication = {
  id: 'app_1',
  publicId: 'happ_123',
  message: 'Please host us',
  customData: baseCustomData,
  status: HostApplicationStatus.PENDING,
  createdAt: '2026-01-01T00:00:00.000Z',
  comments: { totalCount: 0 },
  host: {
    id: 'host_1',
    legacyId: 1,
    name: 'Open Source Collective',
    slug: 'opensource',
    website: null,
    description: null,
    type: 'COLLECTIVE',
    imageUrl: null,
    createdAt: '2018-01-01T00:00:00.000Z',
    platformSubscription: null,
    policies: {
      id: 'policy_1',
      COLLECTIVE_MINIMUM_ADMINS: { numberOfAdmins: 1 },
    },
  },
  account: {
    id: 'acc_1',
    legacyId: 2,
    name: 'Test Collective',
    slug: 'test-collective',
    website: null,
    description: 'A collective description',
    type: 'COLLECTIVE',
    imageUrl: null,
    createdAt: '2026-01-01T00:00:00.000Z',
    isActive: false,
    approvedAt: null,
    isApproved: false,
    host: null,
    memberInvitations: [],
    admins: {
      totalCount: 1,
      nodes: [
        { id: 'member_1', account: { id: 'user_1', type: 'USER', slug: 'alice', name: 'Alice', imageUrl: null } },
      ],
    },
  },
  threadComments: { totalCount: 0, offset: 0, limit: 100, nodes: [] },
};

const renderDrawer = (application = baseApplication, { open = true } = {}) => {
  (useQuery as jest.Mock).mockReturnValue({
    data: { hostApplication: application },
    loading: false,
    error: null,
    refetch: jest.fn(),
  });
  (useMutation as jest.Mock).mockReturnValue([jest.fn(), { loading: false }]);

  return render(
    <IntlProvider locale="en">
      <TooltipProvider delayDuration={0}>
        <HostApplicationDrawer open={open} onClose={jest.fn()} applicationId="app_1" />
      </TooltipProvider>
    </IntlProvider>,
  );
};

describe('HostApplicationCustomData', () => {
  it('renders the ordered fields with their dedicated renderers', () => {
    renderWithIntl(<HostApplicationCustomData customData={baseCustomData} />);

    expect(screen.getByText('Type of project')).toBeInTheDocument();
    expect(screen.getByText('Code')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /github\.com\/foo\/bar/ })).toHaveAttribute(
      'href',
      'https://github.com/foo/bar',
    );
    expect(screen.getByText('MIT License')).toBeInTheDocument();
    expect(screen.getByText('12')).toBeInTheDocument();
    expect(screen.getByText('Copyright / binding agreement')).toBeInTheDocument();

    const labels = screen.getAllByRole('term').map(label => label.textContent);
    expect(labels[0]).toBe('Type of project');
    expect(labels[labels.length - 1]).toBe('Custom unknown field');
  });

  it('hides the fields rendered in their own sections', () => {
    renderWithIntl(<HostApplicationCustomData customData={baseCustomData} />);

    expect(screen.queryByText('validatedRepositoryInfo')).not.toBeInTheDocument();
    expect(screen.queryByText('ecosystemsRepositoryInfo')).not.toBeInTheDocument();
    expect(screen.queryByText('useGithubValidation')).not.toBeInTheDocument();
    expect(screen.queryByText('migration')).not.toBeInTheDocument();
  });

  it('falls back to a readable label and a JSON block for unknown object values', () => {
    renderWithIntl(<HostApplicationCustomData customData={{ someNestedObject: { answer: 42 } }} />);

    expect(screen.getByText('Some nested object')).toBeInTheDocument();
    expect(screen.getByText(/"answer": 42/)).toBeInTheDocument();
  });

  it('ignores empty values and renders nothing when there is nothing to show', () => {
    const { container } = renderWithIntl(
      <HostApplicationCustomData customData={{ extraLicenseInfo: '', nested: null, tags: [] }} />,
    );

    expect(container).toBeEmptyDOMElement();
  });

  it('renders legacy numeric amounts as USD cents', () => {
    renderWithIntl(<HostApplicationCustomData customData={{ totalAmountRaised: 150000 }} />);

    expect(screen.getByText(/1,500/)).toBeInTheDocument();
  });
});

describe('EcosystemsRepositoryInfo', () => {
  it('renders the core repository parameters', () => {
    renderWithIntl(
      <EcosystemsRepositoryInfo repository={ECOSYSTEMS_SNAPSHOT} repositoryUrl="https://github.com/foo/bar" />,
    );

    expect(screen.getByRole('link', { name: /foo\/bar/ })).toHaveAttribute('href', 'https://github.com/foo/bar');
    expect(screen.getByText('Organization account')).toBeInTheDocument();
    expect(screen.getByText('1,234')).toBeInTheDocument();
    expect(screen.getByText('12')).toBeInTheDocument();
    expect(screen.getByText('MIT License')).toBeInTheDocument();
    expect(screen.getByText('150')).toBeInTheDocument();
    expect(screen.getByText('7 human contributors, 2 bot contributors')).toBeInTheDocument();
    const lastCommitRow = screen.getByText('Last commit').closest('div');
    expect(within(lastCommitRow).getByText(/\(.+ ago\)/)).toBeInTheDocument();
    expect(screen.getByText('Scanning APK files for URIs, endpoints & secrets.')).toBeInTheDocument();
    expect(screen.getByText('Fork')).toBeInTheDocument();
    expect(screen.getByText('bar')).toBeInTheDocument();
  });

  it('renders nothing when the snapshot has no data', () => {
    const { container } = renderWithIntl(<EcosystemsRepositoryInfo repository={{} as EcosystemsRepositorySnapshot} />);

    expect(container).toBeEmptyDOMElement();
  });
});

describe('HostApplicationDrawer', () => {
  it('renders the drawer header, facts, expanded sections and footer actions', () => {
    renderDrawer();

    expect(document.querySelector('[data-cy="host-application-drawer"]')).toBeInTheDocument();
    expect(document.querySelector('[data-cy="host-application-header-test-collective"]')).toBeInTheDocument();
    expect(screen.getByText('Host application')).toBeInTheDocument();
    expect(screen.getByText('Pending')).toBeInTheDocument();
    expect(screen.getByText('#happ_123')).toBeInTheDocument();
    expect(screen.getByText('A collective description')).toBeInTheDocument();
    expect(screen.getByText('Please host us')).toBeInTheDocument();
    expect(screen.getByText('Existing legal entity')).toBeInTheDocument();
    expect(screen.getByText('Repository information')).toBeInTheDocument();
    expect(screen.getByText('Validated repository information')).toBeInTheDocument();
    expect(screen.getByTestId('accept-reject-buttons')).toBeInTheDocument();
    expect(screen.getByTestId('thread')).toBeInTheDocument();
  });

  it('renders the received date and description in the application details section', () => {
    renderDrawer();

    const applicationDetails = screen.getByText('Application details').closest('section');
    expect(applicationDetails).toBeInTheDocument();
    expect(within(applicationDetails).getByText('Received in')).toBeInTheDocument();
    expect(within(applicationDetails).getByText(/\d{1,2}:\d{2}/)).toBeInTheDocument();
    expect(within(applicationDetails).getByText('Admins')).toBeInTheDocument();
    expect(within(applicationDetails).getByTestId('avatar')).toBeInTheDocument();
    expect(screen.queryByText('Account')).not.toBeInTheDocument();
    expect(within(applicationDetails).getByText('Description')).toBeInTheDocument();
    expect(within(applicationDetails).getByText('A collective description')).toBeInTheDocument();
    // The description is no longer a separate accordion
    expect(within(applicationDetails).getAllByText('Description')).toHaveLength(1);
  });

  it('collapses the application request section', () => {
    renderDrawer();

    const trigger = screen.getByRole('button', { name: 'Application Request' });
    expect(trigger).toHaveAttribute('aria-expanded', 'true');
    fireEvent.click(trigger);
    expect(trigger).toHaveAttribute('aria-expanded', 'false');
  });

  it('does not flag the legal entity when the applicant has none', () => {
    renderDrawer({ ...baseApplication, customData: { ...baseCustomData, hasLegalEntity: false } });

    expect(screen.queryByText('Existing legal entity')).not.toBeInTheDocument();
  });

  it('hides the approve/reject footer for a non-pending application', () => {
    renderDrawer({ ...baseApplication, status: HostApplicationStatus.APPROVED });

    expect(screen.getByText('Approved')).toBeInTheDocument();
    expect(screen.queryByTestId('accept-reject-buttons')).not.toBeInTheDocument();
  });

  it('keeps the legacy close-drawer hook used by Cypress', () => {
    renderDrawer();

    expect(document.querySelector('[data-cy="close-drawer"]')).toBeInTheDocument();
  });
});
