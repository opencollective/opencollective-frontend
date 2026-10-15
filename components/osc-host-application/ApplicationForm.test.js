/**
 * Unit tests for ApplicationForm - existing legal entity (LLC/nonprofit) checkbox.
 *
 * Verifies the `applicationData.hasLegalEntity` field: the checkbox renders with
 * an always-visible awareness callout about expense restrictions and engaging us
 * before signing contracts / sending invoices, and the boolean flows into the
 * `applicationData` payload sent to `createCollective`.
 */

/* eslint-disable camelcase -- ecosyste.ms API fields are snake_case */

import '@testing-library/jest-dom';

import React from 'react';
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';

import { withRequiredProviders } from '../../test/providers';

// ─── Mocks ───────────────────────────────────────────────────────────────────

const mockMutate = jest.fn();
const mockRouterPush = jest.fn();

jest.mock('next/router', () => {
  const actual = jest.requireActual('next/router');
  return {
    ...actual,
    withRouter: Component => props => <Component {...props} router={{ push: mockRouterPush }} />,
  };
});

jest.mock('@apollo/client', () => {
  const actual = jest.requireActual('@apollo/client');
  return {
    ...actual,
    useMutation: () => [mockMutate, { loading: false, error: undefined }],
  };
});

jest.mock('../collectives/HomeNextIllustration', () => () => <img alt="mock" />);
jest.mock('../CollectivePickerAsync', () => () => <div data-testid="collective-picker-mock" />);
jest.mock('../onboarding-modal/OnboardingProfileCard', () => () => <div data-testid="profile-card-mock" />);

jest.mock('../../lib/ecosystems', () => ({
  ...jest.requireActual('../../lib/ecosystems'),
  fetchEcosystemsRepositoryInfo: jest.fn(),
}));

// ─── Imports (after mocks) ────────────────────────────────────────────────────

import { fetchEcosystemsRepositoryInfo } from '../../lib/ecosystems';

import ApplicationForm from './ApplicationForm';

// ─── Helpers ─────────────────────────────────────────────────────────────────

const initialValues = {
  user: {
    name: '',
    email: '',
  },
  collective: {
    name: '',
    slug: '',
    description: '',
    tags: [],
  },
  applicationData: {
    typeOfProject: null,
    repositoryUrl: '',
    licenseSpdxId: null,
    extraLicenseInfo: '',
    amountOfMembers: '',
    linksToPreviousEvents: '',
    hasLegalEntity: false,
  },
  termsOfServiceOC: false,
  inviteMembers: [],
};

const renderForm = (props = {}) =>
  render(
    withRequiredProviders(
      <ApplicationForm
        initialValues={initialValues}
        setInitialValues={jest.fn()}
        loadingLoggedInUser={false}
        LoggedInUser={null}
        collective={null}
        host={null}
        loadingCollective={false}
        canApplyWithCollective={false}
        refetchLoggedInUser={jest.fn()}
        popularTags={[]}
        {...props}
      />,
    ),
  );

const fillRequiredFields = () => {
  fireEvent.change(screen.getByLabelText(/your name/i), { target: { value: 'Thomas Anderson' } });
  fireEvent.change(screen.getByLabelText(/your email address/i), { target: { value: 'tanderson@example.com' } });
  fireEvent.change(screen.getByLabelText(/collective name/i), { target: { value: 'Agora Collective' } });
  fireEvent.change(screen.getByLabelText(/set your profile url/i), { target: { value: 'agora' } });
  fireEvent.change(screen.getByLabelText(/what does your collective do/i), { target: { value: 'We do things' } });
  fireEvent.click(screen.getByRole('radio', { name: /my project is primarily concerned/i }));
  fireEvent.change(screen.getByLabelText(/tell us a little about your project/i), { target: { value: 'Hello' } });
  // ui/Checkbox + wrapping label (modern design system)
  fireEvent.click(screen.getByRole('checkbox', { name: /i agree with the terms of service/i }));
};

const submitForm = () => fireEvent.submit(document.querySelector('form[data-cy="ccf-form"]'));

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('ApplicationForm - applicationData.hasLegalEntity', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockMutate.mockResolvedValue({ data: { createCollective: null } });
  });

  it('renders the checkbox unchecked and always shows the awareness text', () => {
    renderForm();

    expect(screen.getByRole('checkbox', { name: /existing legal entity/i })).not.toBeChecked();
    expect(screen.getByText(/before signing contracts or sending invoices/i)).toBeInTheDocument();
    expect(screen.getByText(/before signing contracts or sending invoices/i)).toBeVisible();
  });

  it('renders the navigation buttons and inline links', () => {
    renderForm();

    expect(screen.getByRole('button', { name: /back/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /submit application/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /visit our docs/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /terms of service/i })).toBeInTheDocument();
  });

  it('toggles the code section with the expand button', () => {
    renderForm();

    fireEvent.click(screen.getAllByRole('button', { name: /expand/i })[0]);
    expect(screen.getByRole('button', { name: /show less/i })).toBeInTheDocument();
  });

  it('submits applicationData.hasLegalEntity as true when checked', async () => {
    renderForm();
    fillRequiredFields();

    fireEvent.click(screen.getByRole('checkbox', { name: /existing legal entity/i }));
    expect(screen.getByRole('checkbox', { name: /existing legal entity/i })).toBeChecked();

    submitForm();

    await waitFor(() => expect(mockMutate).toHaveBeenCalledTimes(1));
    const { applicationData } = mockMutate.mock.calls[0][0].variables;
    expect(applicationData.hasLegalEntity).toBe(true);
  });

  it('submits applicationData.hasLegalEntity as false when left unchecked', async () => {
    renderForm();
    fillRequiredFields();

    submitForm();

    await waitFor(() => expect(mockMutate).toHaveBeenCalledTimes(1));
    const { applicationData } = mockMutate.mock.calls[0][0].variables;
    expect(applicationData.hasLegalEntity).toBe(false);
    expect(screen.getByRole('checkbox', { name: /existing legal entity/i })).not.toBeChecked();
  });
});

// ─── ecosyste.ms repository info ──────────────────────────────────────────────

const ECOSYSTEMS_REPO_ENTRY = {
  packages: [
    {
      name: 'my-package',
      ecosystem: 'npm',
      maintainers: [{ login: 'betree', name: null }],
      dependent_packages_count: 4,
      dependent_repos_count: 12,
      first_release_published_at: '2020-01-01T00:00:00.000Z',
      latest_release_published_at: '2026-01-01T00:00:00.000Z',
    },
  ],
  repository: {
    full_name: 'foo/bar',
    owner: 'foo',
    description: 'A test repository',
    stargazers_count: 42,
    forks_count: 7,
    fork: false,
    license: 'mit',
    archived: true,
    created_at: '2016-12-12T04:36:39.000Z',
    pushed_at: '2026-10-11T11:24:07.000Z',
    commit_stats: { total_commits: 120, total_committers: 8, last_synced_commit: 'abc123' },
  },
  contributors: { total_committers: 8 },
  issues: { issues_count: 3 },
  owner: { login: 'foo' },
};

const REPOSITORY_INFO_DEBOUNCE_MS = 800; // Must match ApplicationForm.js

const changeRepositoryUrl = url =>
  fireEvent.change(screen.getByLabelText(/repository url/i), { target: { value: url } });

const flushRepositoryInfoDebounce = async () => {
  await act(async () => {
    jest.advanceTimersByTime(REPOSITORY_INFO_DEBOUNCE_MS);
  });
  // Flush the fetch promise chain and the effects that expose the result to the form
  await act(async () => {});
};

describe('ApplicationForm - ecosyste.ms repository info', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
    mockMutate.mockResolvedValue({ data: { createCollective: null } });
    fetchEcosystemsRepositoryInfo.mockResolvedValue(ECOSYSTEMS_REPO_ENTRY);
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('fetches the repository info when the repository URL value changes', async () => {
    renderForm();

    changeRepositoryUrl('https://github.com/foo/bar');
    await flushRepositoryInfoDebounce();

    expect(fetchEcosystemsRepositoryInfo).toHaveBeenCalledWith('https://github.com/foo/bar');
  });

  it('does not fetch for empty or invalid URLs', async () => {
    renderForm();

    changeRepositoryUrl('not-a-url');
    await flushRepositoryInfoDebounce();
    changeRepositoryUrl('');
    await flushRepositoryInfoDebounce();

    expect(fetchEcosystemsRepositoryInfo).not.toHaveBeenCalled();
  });

  it('stores a compact ecosyste.ms snapshot in applicationData on submit', async () => {
    renderForm();
    fillRequiredFields();
    changeRepositoryUrl('https://github.com/foo/bar');
    await flushRepositoryInfoDebounce();

    submitForm();
    await waitFor(() => expect(mockMutate).toHaveBeenCalledTimes(1));

    const { applicationData } = mockMutate.mock.calls[0][0].variables;
    expect(applicationData.ecosystemsRepositoryInfo).toEqual({
      fullName: 'foo/bar',
      owner: 'foo',
      description: 'A test repository',
      stars: 42,
      forks: 7,
      isFork: false,
      license: 'mit',
      archived: true,
      createdAt: '2016-12-12T04:36:39.000Z',
      lastCommitAt: '2026-10-11T11:24:07.000Z',
      lastCommitSha: 'abc123',
      commitStats: { totalCommits: 120, totalCommitters: 8 },
      packages: [
        {
          name: 'my-package',
          ecosystem: 'npm',
          maintainers: [{ login: 'betree', name: null }],
          dependentPackagesCount: 4,
          dependentReposCount: 12,
          firstReleasePublishedAt: '2020-01-01T00:00:00.000Z',
          latestReleasePublishedAt: '2026-01-01T00:00:00.000Z',
        },
      ],
    });
  });

  it('omits the snapshot when the repository info was not fetched', async () => {
    renderForm();
    fillRequiredFields();
    changeRepositoryUrl('https://github.com/foo/bar');

    submitForm();
    await waitFor(() => expect(mockMutate).toHaveBeenCalledTimes(1));

    const { applicationData } = mockMutate.mock.calls[0][0].variables;
    expect(applicationData.ecosystemsRepositoryInfo).toBeUndefined();
  });
});

// ─── Tags field ───────────────────────────────────────────────────────────────

describe('ApplicationForm - collective.tags field', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockMutate.mockResolvedValue({ data: { createCollective: null } });
  });

  it('collects typed and suggested tags into collective.tags', async () => {
    renderForm({ popularTags: ['opensource', 'community'] });
    fillRequiredFields();

    const tagsInput = screen.getByLabelText(/tags/i);
    fireEvent.change(tagsInput, { target: { value: 'fintech' } });
    fireEvent.keyDown(tagsInput, { key: 'Enter' });
    fireEvent.click(screen.getByRole('button', { name: 'opensource' }));

    submitForm();
    await waitFor(() => expect(mockMutate).toHaveBeenCalledTimes(1));
    expect(mockMutate.mock.calls[0][0].variables.collective.tags).toEqual(['fintech', 'opensource']);
  });

  it('updates collective.tags when a tag is removed', async () => {
    renderForm({ popularTags: ['opensource'] });
    fillRequiredFields();

    fireEvent.click(screen.getByRole('button', { name: 'opensource' }));
    fireEvent.click(screen.getByRole('button', { name: 'Remove opensource' }));

    submitForm();
    await waitFor(() => expect(mockMutate).toHaveBeenCalledTimes(1));
    expect(mockMutate.mock.calls[0][0].variables.collective.tags).toEqual([]);
  });
});
