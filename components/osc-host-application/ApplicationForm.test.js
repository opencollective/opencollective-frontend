/**
 * Unit tests for ApplicationForm - existing legal entity (LLC/nonprofit) checkbox.
 *
 * Verifies the `applicationData.hasLegalEntity` field: the checkbox renders with
 * an always-visible awareness callout about expense restrictions and engaging us
 * before signing contracts / sending invoices, and the boolean flows into the
 * `applicationData` payload sent to `createCollective`.
 */

import '@testing-library/jest-dom';

import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';

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
jest.mock('../CollectiveTagsInput', () => () => <div data-testid="collective-tags-input-mock" />);
jest.mock('../onboarding-modal/OnboardingProfileCard', () => () => <div data-testid="profile-card-mock" />);

// ─── Imports (after mocks) ────────────────────────────────────────────────────

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
