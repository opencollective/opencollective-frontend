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
import { act, fireEvent, render, screen, waitFor, within } from '@testing-library/react';

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

jest.mock('../../lib/ecosystems', () => ({
  ...jest.requireActual('../../lib/ecosystems'),
  fetchEcosystemsRepositoryInfo: jest.fn(),
}));

// ─── Imports (after mocks) ────────────────────────────────────────────────────

import { fetchEcosystemsRepositoryInfo } from '../../lib/ecosystems';

const mockFetchEcosystemsRepositoryInfo = fetchEcosystemsRepositoryInfo as jest.Mock;

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

  it('calls onBack to reset the form values before navigating back', () => {
    const backSpy = jest.spyOn(window.history, 'back').mockImplementation(() => {});
    const onBack = jest.fn();
    renderForm({ onBack });

    fireEvent.click(screen.getByRole('button', { name: /^back$/i }));

    expect(onBack).toHaveBeenCalledTimes(1);
    backSpy.mockRestore();
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

const RECENT_PUSHED_AT = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();

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
    topics: ['opencollective', 'react'],
    archived: false,
    created_at: '2016-12-12T04:36:39.000Z',
    pushed_at: RECENT_PUSHED_AT,
    commit_stats: { total_commits: 120, total_committers: 8, last_synced_commit: 'abc123' },
  },
  contributors: { total_committers: 8 },
  issues: { issues_count: 3 },
  owner: { login: 'foo', kind: 'organization' },
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
    mockFetchEcosystemsRepositoryInfo.mockResolvedValue(ECOSYSTEMS_REPO_ENTRY);
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

  it('shows a loading state in the repository URL field and blocks submission while the lookup is pending', async () => {
    renderForm();
    fillRequiredFields();

    changeRepositoryUrl('https://github.com/foo/bar');

    // The lookup is pending (debounce + request): the field shows a spinner and the form cannot be submitted
    const loadingIndicator = () => document.querySelector<HTMLElement>('[data-cy="ccf-form-repository-url-loading"]');
    const submitButton = () => screen.getByRole('button', { name: /submit application/i });
    expect(loadingIndicator()).toBeInTheDocument();
    expect(submitButton()).toBeDisabled();

    // Let Formik's async submission run while the lookup is still pending
    submitForm();
    await act(async () => {});
    expect(mockMutate).not.toHaveBeenCalled();

    await flushRepositoryInfoDebounce();

    // Once the lookup settled, the field is no longer loading and the form can be submitted
    expect(loadingIndicator()).not.toBeInTheDocument();
    expect(submitButton()).toBeEnabled();

    submitForm();
    await waitFor(() => expect(mockMutate).toHaveBeenCalledTimes(1));
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
      topics: ['opencollective', 'react'],
      ownerKind: 'organization',
      archived: false,
      createdAt: '2016-12-12T04:36:39.000Z',
      lastCommitAt: RECENT_PUSHED_AT,
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

  it('omits the snapshot when the repository info could not be fetched', async () => {
    const consoleError = jest.spyOn(console, 'error').mockImplementation(() => {});
    try {
      mockFetchEcosystemsRepositoryInfo.mockRejectedValue(new Error('failed to fetch'));
      renderForm();
      fillRequiredFields();
      changeRepositoryUrl('https://github.com/foo/bar');
      await flushRepositoryInfoDebounce();

      submitForm();
      await waitFor(() => expect(mockMutate).toHaveBeenCalledTimes(1));

      const { applicationData } = mockMutate.mock.calls[0][0].variables;
      expect(applicationData.ecosystemsRepositoryInfo).toBeUndefined();
    } finally {
      consoleError.mockRestore();
    }
  });
});

// ─── Automatic field population from the repository info ──────────────────────

describe('ApplicationForm - automatic field population from the repository info', () => {
  const initialValuesWith = applicationData => ({
    ...initialValues,
    applicationData: { ...initialValues.applicationData, ...applicationData },
  });

  const typeManualTag = tag => {
    const tagsInput = screen.getByLabelText(/tags/i);
    fireEvent.change(tagsInput, { target: { value: tag } });
    fireEvent.keyDown(tagsInput, { key: 'Enter' });
  };

  const submitAndReadVariables = async () => {
    submitForm();
    await waitFor(() => expect(mockMutate).toHaveBeenCalledTimes(1));
    return mockMutate.mock.calls[0][0].variables;
  };

  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
    mockMutate.mockResolvedValue({ data: { createCollective: null } });
    mockFetchEcosystemsRepositoryInfo.mockResolvedValue(ECOSYSTEMS_REPO_ENTRY);
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('populates the license and the tags from the repository info', async () => {
    renderForm();
    fillRequiredFields();
    changeRepositoryUrl('https://github.com/foo/bar');
    await flushRepositoryInfoDebounce();

    const { applicationData, collective } = await submitAndReadVariables();
    expect(applicationData.licenseSpdxId).toBe('MIT');
    expect(collective.tags).toEqual(['opencollective', 'react']);
  });

  it('merges the repository topics into the existing tags', async () => {
    renderForm({ initialValues: initialValuesWith({ licenseSpdxId: 'Apache-2.0' }) });
    fillRequiredFields();
    typeManualTag('manual-tag');

    changeRepositoryUrl('https://github.com/foo/bar');
    await flushRepositoryInfoDebounce();

    const { applicationData, collective } = await submitAndReadVariables();
    // The license is always derived from the repository, the tags are merged with the existing ones
    expect(applicationData.licenseSpdxId).toBe('MIT');
    expect(collective.tags).toEqual(['manual-tag', 'opencollective', 'react']);
  });

  it('replaces the tags when fetching information for a different repository', async () => {
    mockFetchEcosystemsRepositoryInfo.mockImplementation((url: string) =>
      Promise.resolve({
        ...ECOSYSTEMS_REPO_ENTRY,
        repository: {
          ...ECOSYSTEMS_REPO_ENTRY.repository,
          topics: url.includes('repo-b') ? ['topic-b'] : ['topic-a'],
        },
      }),
    );

    renderForm();
    fillRequiredFields();

    changeRepositoryUrl('https://github.com/foo/repo-a');
    await flushRepositoryInfoDebounce();
    changeRepositoryUrl('https://github.com/foo/repo-b');
    await flushRepositoryInfoDebounce();

    const { collective } = await submitAndReadVariables();
    expect(collective.tags).toEqual(['topic-b']);
  });

  it('keeps the existing tags when the fetched repository has no license nor topics', async () => {
    mockFetchEcosystemsRepositoryInfo.mockResolvedValue({
      ...ECOSYSTEMS_REPO_ENTRY,
      repository: { ...ECOSYSTEMS_REPO_ENTRY.repository, license: null, topics: [] },
    });
    renderForm({ initialValues: initialValuesWith({ licenseSpdxId: 'Apache-2.0' }) });
    fillRequiredFields();
    typeManualTag('manual-tag');

    changeRepositoryUrl('https://github.com/foo/bar');
    await flushRepositoryInfoDebounce();

    const { applicationData, collective } = await submitAndReadVariables();
    expect(applicationData.licenseSpdxId).toBeNull();
    expect(collective.tags).toEqual(['manual-tag']);
  });

  it('does not match a repository license that is not a known SPDX id', async () => {
    mockFetchEcosystemsRepositoryInfo.mockResolvedValue({
      ...ECOSYSTEMS_REPO_ENTRY,
      repository: { ...ECOSYSTEMS_REPO_ENTRY.repository, license: 'some-custom-license' },
    });
    renderForm();
    fillRequiredFields();

    changeRepositoryUrl('https://github.com/foo/bar');
    await flushRepositoryInfoDebounce();

    const { applicationData, collective } = await submitAndReadVariables();
    expect(applicationData.licenseSpdxId).toBeNull();
    expect(collective.tags).toEqual(['opencollective', 'react']);
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

// ─── Application rules ───────────────────────────────────────────────────────

const weakRepositoryEntry = (overrides = {}) => ({
  ...ECOSYSTEMS_REPO_ENTRY,
  packages: [],
  repository: {
    ...ECOSYSTEMS_REPO_ENTRY.repository,
    commit_stats: { total_commits: 3, total_committers: 1, last_synced_commit: 'abc123' },
    forks_count: 0,
  },
  contributors: { ...ECOSYSTEMS_REPO_ENTRY.contributors, total_committers: 1 },
  ...overrides,
});

const rulesPanel = () => document.querySelector<HTMLElement>('[data-cy="ccf-form-rules"]') as HTMLElement;
const fieldRules = (field: string) =>
  document.querySelector<HTMLElement>(`[data-cy="ccf-form-rules-${field}"]`) as HTMLElement;
const submitButton = () => screen.getByRole('button', { name: /submit application/i });

describe('ApplicationForm - application rules', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockMutate.mockResolvedValue({ data: { createCollective: null } });
    mockFetchEcosystemsRepositoryInfo.mockResolvedValue(ECOSYSTEMS_REPO_ENTRY);
  });

  it('shows warnings next to the fields they relate to, without blocking the submission', async () => {
    renderForm();
    fillRequiredFields();

    // Warnings are anchored to their field, and the submission panel only carries errors
    expect(within(fieldRules('team')).getByText(/at least one more admin/i)).toBeInTheDocument();
    expect(within(fieldRules('message')).getByText(/tell us more about your project/i)).toBeInTheDocument();
    expect(rulesPanel()).toBeNull();
    expect(submitButton()).toBeEnabled();

    submitForm();
    await waitFor(() => expect(mockMutate).toHaveBeenCalledTimes(1));
  });

  it('does not block when the repository cannot be found', async () => {
    jest.useFakeTimers();
    try {
      mockFetchEcosystemsRepositoryInfo.mockResolvedValue({ ...ECOSYSTEMS_REPO_ENTRY, repository: null });
      renderForm();
      fillRequiredFields();
      changeRepositoryUrl('https://github.com/foo/bar');
      await flushRepositoryInfoDebounce();

      // A repository we cannot find is a warning next to its field, never a blocker
      expect(within(fieldRules('repositoryUrl')).getByText(/couldn't find this repository/i)).toBeInTheDocument();
      expect(rulesPanel()).toBeNull();
      expect(submitButton()).toBeEnabled();

      submitForm();
      await waitFor(() => expect(mockMutate).toHaveBeenCalledTimes(1));
    } finally {
      jest.useRealTimers();
    }
  });

  it('blocks the submission on a hard error', async () => {
    jest.useFakeTimers();
    try {
      mockFetchEcosystemsRepositoryInfo.mockResolvedValue(
        weakRepositoryEntry({ owner: { login: 'foo', kind: 'user' } }),
      );
      renderForm();
      fillRequiredFields();
      changeRepositoryUrl('https://github.com/foo/bar');
      await flushRepositoryInfoDebounce();

      // Weak project on a personal account: combined hard error
      expect(within(rulesPanel()).getByText(/not able to accept your project at this time/i)).toBeInTheDocument();
      expect(submitButton()).toBeDisabled();

      submitForm();
      await waitFor(() => expect(mockMutate).not.toHaveBeenCalled());
    } finally {
      jest.useRealTimers();
    }
  });

  it('blocks a project with an error (no manual-review bypass)', async () => {
    jest.useFakeTimers();
    try {
      mockFetchEcosystemsRepositoryInfo.mockResolvedValue(
        weakRepositoryEntry({ owner: { login: 'foo', kind: 'organization' } }),
      );
      renderForm();
      fillRequiredFields();
      changeRepositoryUrl('https://github.com/foo/bar');
      await flushRepositoryInfoDebounce();

      // The no-community error blocks the submission, with no escape hatch to bypass it
      expect(within(rulesPanel()).getByText(/platforms like Ko-Fi, Patreon/i)).toBeInTheDocument();
      expect(submitButton()).toBeDisabled();
      expect(within(rulesPanel()).queryByRole('checkbox')).not.toBeInTheDocument();

      submitForm();
      await waitFor(() => expect(mockMutate).not.toHaveBeenCalled());
    } finally {
      jest.useRealTimers();
    }
  });

  it('omits errors when the host disabled blocking', async () => {
    jest.useFakeTimers();
    try {
      mockFetchEcosystemsRepositoryInfo.mockResolvedValue(
        weakRepositoryEntry({ owner: { login: 'foo', kind: 'organization' } }),
      );
      renderForm({ host: { settings: { hostApplication: { blockOnErrors: false } } } });
      fillRequiredFields();
      changeRepositoryUrl('https://github.com/foo/bar');
      await flushRepositoryInfoDebounce();

      // The no-community error is not shown at all: the applicant can submit
      expect(fieldRules('repositoryUrl')).toBeNull();
      expect(rulesPanel()).toBeNull();
      expect(submitButton()).toBeEnabled();

      submitForm();
      await waitFor(() => expect(mockMutate).toHaveBeenCalledTimes(1));
    } finally {
      jest.useRealTimers();
    }
  });

  it('scrolls to the top when rule errors are displayed', async () => {
    const scrollTo = jest.spyOn(window, 'scrollTo').mockImplementation(() => {});
    jest.useFakeTimers();
    try {
      mockFetchEcosystemsRepositoryInfo.mockResolvedValue(
        weakRepositoryEntry({ owner: { login: 'foo', kind: 'organization' } }),
      );
      renderForm();
      fillRequiredFields();
      changeRepositoryUrl('https://github.com/foo/bar');
      await flushRepositoryInfoDebounce();

      expect(rulesPanel()).toBeInTheDocument();
      expect(scrollTo).toHaveBeenCalledWith(0, 0);
    } finally {
      jest.useRealTimers();
      scrollTo.mockRestore();
    }
  });

  it('shows the empty-application error on the message field instead of the error panel', () => {
    renderForm();
    fillRequiredFields();

    // Clearing the description leaves a short message: the application has no usable text
    fireEvent.change(screen.getByLabelText(/what does your collective do/i), { target: { value: '' } });

    expect(screen.getByText(/don't have enough information/i)).toBeInTheDocument();
    expect(rulesPanel()).toBeNull();
    expect(submitButton()).toBeDisabled();
  });

  it('does not scroll to the top while typing the application message', () => {
    const scrollTo = jest.spyOn(window, 'scrollTo').mockImplementation(() => {});
    try {
      renderForm();
      fillRequiredFields();

      // Field-anchored errors never reach the panel, so typing cannot trigger the panel scroll
      expect(rulesPanel()).toBeNull();
      expect(scrollTo).not.toHaveBeenCalled();
    } finally {
      scrollTo.mockRestore();
    }
  });

  it('scrolls to the top when clicking the blocked submit button', async () => {
    const scrollTo = jest.spyOn(window, 'scrollTo').mockImplementation(() => {});
    jest.useFakeTimers();
    try {
      mockFetchEcosystemsRepositoryInfo.mockResolvedValue(
        weakRepositoryEntry({ owner: { login: 'foo', kind: 'organization' } }),
      );
      renderForm();
      fillRequiredFields();
      changeRepositoryUrl('https://github.com/foo/bar');
      await flushRepositoryInfoDebounce();

      // The button is disabled while blocked, so the click lands on its wrapper
      scrollTo.mockClear();
      fireEvent.click(document.querySelector('[data-cy="ccf-form-submit-wrapper"]'));
      expect(scrollTo).toHaveBeenCalledWith(0, 0);
    } finally {
      jest.useRealTimers();
      scrollTo.mockRestore();
    }
  });

  it('scrolls to the message field when it carries the only blocking error', () => {
    const scrollTo = jest.spyOn(window, 'scrollTo').mockImplementation(() => {});
    try {
      renderForm();
      fillRequiredFields();
      fireEvent.change(screen.getByLabelText(/what does your collective do/i), { target: { value: '' } });

      const message = screen.getByLabelText(/tell us a little about your project/i);
      const scrollIntoView = jest.fn();
      message.scrollIntoView = scrollIntoView;

      fireEvent.click(document.querySelector('[data-cy="ccf-form-submit-wrapper"]'));

      expect(scrollIntoView).toHaveBeenCalledWith({ behavior: 'smooth', block: 'center' });
      expect(scrollTo).not.toHaveBeenCalled();
    } finally {
      scrollTo.mockRestore();
    }
  });

  it('scrolls to the confirmation note when a warning requires confirmation', () => {
    const scrollTo = jest.spyOn(window, 'scrollTo').mockImplementation(() => {});
    try {
      renderForm();
      fillRequiredFields();
      fireEvent.change(screen.getByLabelText(/collective name/i), { target: { value: 'Prysm - M3U IPTV player' } });

      const confirmation = fieldRules('message');
      const scrollIntoView = jest.fn();
      confirmation.scrollIntoView = scrollIntoView;

      fireEvent.click(document.querySelector('[data-cy="ccf-form-submit-wrapper"]'));

      expect(scrollIntoView).toHaveBeenCalledWith({ behavior: 'smooth', block: 'center' });
      expect(scrollTo).not.toHaveBeenCalled();
    } finally {
      scrollTo.mockRestore();
    }
  });

  it('does not scroll when only the repository lookup blocks the submission', () => {
    const scrollTo = jest.spyOn(window, 'scrollTo').mockImplementation(() => {});
    jest.useFakeTimers();
    try {
      renderForm();
      fillRequiredFields();
      changeRepositoryUrl('https://github.com/foo/bar'); // Lookup pending

      fireEvent.click(document.querySelector('[data-cy="ccf-form-submit-wrapper"]'));

      expect(scrollTo).not.toHaveBeenCalled();
    } finally {
      jest.useRealTimers();
      scrollTo.mockRestore();
    }
  });

  it('requires the copyright confirmation for copyright-sensitive projects', async () => {
    renderForm();
    fillRequiredFields();
    fireEvent.change(screen.getByLabelText(/collective name/i), { target: { value: 'Prysm - M3U IPTV player' } });

    // The warning and its confirmation sit next to the application message
    const messageRules = fieldRules('message');
    expect(within(messageRules).getByText(/I confirm that this project/i)).toBeInTheDocument();
    expect(submitButton()).toBeDisabled();

    fireEvent.click(within(messageRules).getByRole('checkbox', { name: /I confirm that this project/i }));
    expect(submitButton()).toBeEnabled();

    submitForm();
    await waitFor(() => expect(mockMutate).toHaveBeenCalledTimes(1));
    const { applicationData } = mockMutate.mock.calls[0][0].variables;
    expect(applicationData.ruleConfirmations).toEqual(['copyright']);
  });

  it('mitigates the no-community error when a second admin is invited and the message is substantial', async () => {
    jest.useFakeTimers();
    try {
      mockFetchEcosystemsRepositoryInfo.mockResolvedValue(
        weakRepositoryEntry({ owner: { login: 'foo', kind: 'organization' } }),
      );
      renderForm({
        initialValues: {
          ...initialValues,
          inviteMembers: [
            {
              role: 'ADMIN',
              memberAccount: { id: 'a1', name: 'Amazing New User', slug: 'amazing-new-user', type: 'USER' },
            },
          ],
        },
      });
      fillRequiredFields();
      fireEvent.change(screen.getByLabelText(/tell us a little about your project/i), {
        target: { value: 'x'.repeat(250) },
      });
      changeRepositoryUrl('https://github.com/foo/bar');
      await flushRepositoryInfoDebounce();

      // Downgraded to a warning next to the repository URL: submission is not blocked
      expect(within(fieldRules('repositoryUrl')).getByText(/platforms like Ko-Fi, Patreon/i)).toBeInTheDocument();
      expect(submitButton()).toBeEnabled();

      submitForm();
      await waitFor(() => expect(mockMutate).toHaveBeenCalledTimes(1));
    } finally {
      jest.useRealTimers();
    }
  });
});

// ─── Your Team ───────────────────────────────────────────────────────────────

describe('ApplicationForm - Your Team', () => {
  const invitedAdmin = {
    role: 'ADMIN',
    memberAccount: { id: 'a1', name: 'Amazing New User', slug: 'amazing-new-user', type: 'USER' },
  };
  const initialValuesWithInvites = { ...initialValues, inviteMembers: [invitedAdmin] };

  beforeEach(() => {
    jest.clearAllMocks();
    mockMutate.mockResolvedValue({ data: { createCollective: null } });
  });

  it('lists the current user and the invited admins as badges', async () => {
    renderForm({ initialValues: initialValuesWithInvites });
    fillRequiredFields();

    const team = document.querySelector<HTMLElement>('[data-cy="profile-card"]') as HTMLElement;
    expect(team.querySelectorAll('[data-cy="admin-badge"]')).toHaveLength(2);
    expect(within(team).getByText('Thomas Anderson')).toBeInTheDocument();
    expect(within(team).getByText('Amazing New User')).toBeInTheDocument();
    // Only invited admins can be removed
    expect(within(team).queryByRole('button', { name: /remove thomas anderson/i })).not.toBeInTheDocument();
    expect(within(team).getByRole('button', { name: /remove amazing new user/i })).toBeInTheDocument();
  });

  it('removes an invited admin from its badge', async () => {
    renderForm({ initialValues: initialValuesWithInvites });
    fillRequiredFields();

    fireEvent.click(screen.getByRole('button', { name: /remove amazing new user/i }));

    const team = document.querySelector<HTMLElement>('[data-cy="profile-card"]') as HTMLElement;
    expect(within(team).queryByText('Amazing New User')).not.toBeInTheDocument();

    submitForm();
    await waitFor(() => expect(mockMutate).toHaveBeenCalledTimes(1));
    expect(mockMutate.mock.calls[0][0].variables.inviteMembers).toEqual([]);
  });
});

// ─── GitHub verified repository ───────────────────────────────────────────────

describe('ApplicationForm - GitHub verified repository', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockMutate.mockResolvedValue({ data: { createCollective: null } });
  });

  const lockedInitialValues = {
    ...initialValues,
    applicationData: {
      ...initialValues.applicationData,
      typeOfProject: 'CODE',
      repositoryUrl: 'https://github.com/foo/bar',
      useGithubValidation: true,
    },
  };

  it('locks the repository URL when it was picked with GitHub', () => {
    renderForm({ initialValues: lockedInitialValues });

    expect(screen.getByLabelText(/repository url/i)).toBeDisabled();
    expect(screen.getByText(/verified with github and can't be changed/i)).toBeInTheDocument();
  });

  it('keeps the repository URL editable without the GitHub validation flag', () => {
    renderForm({
      initialValues: {
        ...lockedInitialValues,
        applicationData: { ...lockedInitialValues.applicationData, useGithubValidation: false },
      },
    });

    expect(screen.getByLabelText(/repository url/i)).not.toBeDisabled();
  });
});

// ─── Suggested admins from repository committers ─────────────────────────────

describe('ApplicationForm - suggested admins', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockMutate.mockResolvedValue({ data: { createCollective: null } });
    mockFetchEcosystemsRepositoryInfo.mockResolvedValue({
      ...ECOSYSTEMS_REPO_ENTRY,
      contributors: {
        ...ECOSYSTEMS_REPO_ENTRY.contributors,
        past_year_committers: [
          { name: 'Jane Doe', email: 'jane@example.com', login: 'jane', count: 12 },
          { name: 'No Email', email: null, login: 'no-email', count: 3 },
          { name: 'Bad Email', email: 'not-an-email', login: 'bad', count: 1 },
          { name: 'Local Dev', email: 'dev@build.local', login: 'local', count: 2 },
          { name: 'Thomas Anderson', email: 'tanderson@example.com', login: 'neo', count: 5 },
        ],
      },
    });
  });

  it('suggests committers with a valid email and invites them by email in one click', async () => {
    jest.useFakeTimers();
    try {
      renderForm();
      fillRequiredFields();
      changeRepositoryUrl('https://github.com/foo/bar');
      await flushRepositoryInfoDebounce();

      const suggestions = document.querySelector<HTMLElement>('[data-cy="suggested-admins"]') as HTMLElement;
      expect(suggestions).toBeInTheDocument();
      expect(within(suggestions).getByText('Jane Doe')).toBeInTheDocument();
      expect(within(suggestions).getByText('(jane@example.com)')).toBeInTheDocument();
      expect(within(suggestions).queryByText('No Email')).not.toBeInTheDocument();
      expect(within(suggestions).queryByText('Bad Email')).not.toBeInTheDocument();
      expect(within(suggestions).queryByText('Local Dev')).not.toBeInTheDocument();
      expect(within(suggestions).queryByText('Thomas Anderson')).not.toBeInTheDocument();

      fireEvent.click(within(suggestions).getByRole('button', { name: /jane doe/i }));

      const team = document.querySelector<HTMLElement>('[data-cy="profile-card"]') as HTMLElement;
      expect(within(team).getByText('Jane Doe')).toBeInTheDocument();
      expect(within(team).getByText('(jane@example.com)')).toBeInTheDocument();
      expect(within(suggestions).queryByText('Jane Doe')).not.toBeInTheDocument();

      submitForm();
      await waitFor(() => expect(mockMutate).toHaveBeenCalledTimes(1));
      expect(mockMutate.mock.calls[0][0].variables.inviteMembers).toEqual([
        { role: 'ADMIN', memberInfo: { name: 'Jane Doe', email: 'jane@example.com' } },
      ]);
    } finally {
      jest.useRealTimers();
    }
  });
});

// ─── Rule notes used as the field hint ────────────────────────────────────────

describe('ApplicationForm - rule notes as the field hint', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockMutate.mockResolvedValue({ data: { createCollective: null } });
    mockFetchEcosystemsRepositoryInfo.mockResolvedValue(ECOSYSTEMS_REPO_ENTRY);
  });

  it('falls back to the default hint while no rule applies to the repository URL', () => {
    renderForm();

    expect(screen.getByText(/can be github, gitlab or any url/i)).toBeInTheDocument();
    expect(fieldRules('repositoryUrl')).toBeNull();
  });

  it('replaces the default hint with the rule notes once a rule applies', async () => {
    jest.useFakeTimers();
    try {
      mockFetchEcosystemsRepositoryInfo.mockResolvedValue({ ...ECOSYSTEMS_REPO_ENTRY, repository: null });
      renderForm();
      fillRequiredFields();
      changeRepositoryUrl('https://github.com/foo/bar');
      await flushRepositoryInfoDebounce();

      // The rule note is used as the hint, and the default hint is gone (never both)
      expect(within(fieldRules('repositoryUrl')).getByText(/couldn't find this repository/i)).toBeInTheDocument();
      expect(screen.queryByText(/can be github, gitlab or any url/i)).not.toBeInTheDocument();
    } finally {
      jest.useRealTimers();
    }
  });

  it('shows the small-community warning as a hint on the message field', async () => {
    jest.useFakeTimers();
    try {
      mockFetchEcosystemsRepositoryInfo.mockResolvedValue({
        ...ECOSYSTEMS_REPO_ENTRY,
        packages: [],
        repository: {
          ...ECOSYSTEMS_REPO_ENTRY.repository,
          commit_stats: { total_commits: 5, total_committers: 3, last_synced_commit: 'abc123' },
          forks_count: 3,
        },
      });
      renderForm();
      fillRequiredFields();
      changeRepositoryUrl('https://github.com/foo/bar');
      await flushRepositoryInfoDebounce();

      // "Tell us about your contributors and users..." is shown on the message field, not the repository URL
      expect(within(fieldRules('message')).getByText(/tell us about your contributors and users/i)).toBeInTheDocument();
      expect(fieldRules('repositoryUrl')).toBeNull();
    } finally {
      jest.useRealTimers();
    }
  });

  it('shows the early-stage warning as a hint on the message field', async () => {
    jest.useFakeTimers();
    try {
      mockFetchEcosystemsRepositoryInfo.mockResolvedValue({
        ...ECOSYSTEMS_REPO_ENTRY,
        packages: [],
        repository: {
          ...ECOSYSTEMS_REPO_ENTRY.repository,
          created_at: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
          commit_stats: { total_commits: 5, total_committers: 3, last_synced_commit: 'abc123' },
          forks_count: 3,
        },
      });
      renderForm();
      fillRequiredFields();
      changeRepositoryUrl('https://github.com/foo/bar');
      await flushRepositoryInfoDebounce();

      // "…tell us about your community and your plans…" is shown on the message field, not the repository URL
      expect(within(fieldRules('message')).getByText(/appears to be in earlier stages/i)).toBeInTheDocument();
      expect(fieldRules('repositoryUrl')).toBeNull();
    } finally {
      jest.useRealTimers();
    }
  });

  it('shows the personal-account-convert warning without a confirmation checkbox', async () => {
    jest.useFakeTimers();
    try {
      mockFetchEcosystemsRepositoryInfo.mockResolvedValue({
        ...ECOSYSTEMS_REPO_ENTRY,
        packages: [],
        owner: { login: 'foo', kind: 'user' },
        repository: {
          ...ECOSYSTEMS_REPO_ENTRY.repository,
          commit_stats: { total_commits: 5, total_committers: 10, last_synced_commit: 'abc123' },
          forks_count: 50,
        },
      });
      renderForm();
      fillRequiredFields();
      changeRepositoryUrl('https://github.com/foo/bar');
      await flushRepositoryInfoDebounce();

      // Strong project on a personal account: the note is a plain warning, with no "I'm willing to convert" checkbox
      const repositoryNotes = fieldRules('repositoryUrl');
      expect(within(repositoryNotes).getByText(/hosted under a personal account/i)).toBeInTheDocument();
      expect(within(repositoryNotes).queryByRole('checkbox')).not.toBeInTheDocument();
    } finally {
      jest.useRealTimers();
    }
  });
});
