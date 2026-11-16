import '@testing-library/jest-dom';

import React from 'react';
import { render, screen } from '@testing-library/react';

import { PAYEE_SLUG_INVITE, PAYEE_SLUG_INVITE_EXISTING_USER } from '../../expenses/lib/constants';
import { withRequiredProviders } from '../../../test/providers';

import { collective, host, individual, organization, vendor } from '../testing/expense-form-fixtures';

import { ExpenseSubmissionNotices } from './ExpenseSubmissionNotices';

type NoticeForm = React.ComponentProps<typeof ExpenseSubmissionNotices>['form'];

const makeForm = ({
  options = {},
  values = {},
  startOptions = {},
  ...state
}: {
  options?: Record<string, unknown>;
  values?: Record<string, unknown>;
  startOptions?: Record<string, unknown>;
  initialLoading?: boolean;
  isLoadingOptions?: boolean;
} = {}): NoticeForm =>
  ({
    initialLoading: false,
    isLoadingOptions: false,
    options: {
      account: collective(),
      host: host({ termsUrl: 'https://host.example/terms' }),
      payee: individual(),
      loggedInAccount: individual(),
      payoutProfiles: [individual()],
      isAdminOfPayee: true,
      ...options,
    },
    values: { payeeSlug: 'jane', newPayoutMethod: {}, ...values },
    startOptions,
    ...state,
  }) as unknown as NoticeForm;

const renderNotices = (form = makeForm()) => render(withRequiredProviders(<ExpenseSubmissionNotices form={form} />));

describe('ExpenseSubmissionNotices', () => {
  it('names the paying host, links its terms and discloses access to future email/address updates', () => {
    renderNotices();

    const terms = screen.getByRole('link', { name: 'terms of service' });
    expect(terms).toHaveAttribute('href', 'https://host.example/terms');
    expect(terms).toHaveAttribute('target', '_blank');
    expect(terms).toHaveAttribute('rel', 'noopener noreferrer');
    expect(terms.closest('p')).toHaveTextContent('By submitting this expense, you agree');
    expect(terms.closest('p')).toHaveTextContent('Host One');

    const privacy = screen.getByText(/After payment, the administrators/);
    expect(privacy).toHaveTextContent('Host One');
    expect(privacy).toHaveTextContent("recipient's current email and private address");
    expect(privacy).toHaveTextContent('including future updates');
    expect(privacy).toHaveTextContent('even if the Collective leaves or changes fiscal host');
  });

  it('discloses expense legal name and address access for an organization without implying ongoing profile access', () => {
    renderNotices(
      makeForm({
        options: { payee: organization({ name: 'Payee Foundation' }), payoutProfiles: [organization()] },
        values: { payeeSlug: 'org' },
      }),
    );
    expect(
      screen.getByText(/can access the recipient's legal name and the address submitted with this expense/),
    ).toBeInTheDocument();
    expect(screen.getByText(/may remain part of the expense record/)).toBeInTheDocument();
    expect(screen.queryByText(/After payment/)).not.toBeInTheDocument();
    expect(screen.queryByText(/future updates/)).not.toBeInTheDocument();
  });

  it('keeps the data-sharing notice when the host has not configured terms', () => {
    renderNotices(makeForm({ options: { host: host({ termsUrl: null }) } }));
    expect(screen.queryByRole('link', { name: 'terms of service' })).not.toBeInTheDocument();
    expect(screen.queryByText(/By submitting this expense, you agree/)).not.toBeInTheDocument();
    expect(screen.getByText(/After payment, the administrators/)).toBeInTheDocument();
  });

  it.each(['javascript:alert(1)', 'data:text/html,terms', '/relative-terms'])(
    'does not turn an unsafe or non-absolute terms URL into an agreement: %s',
    termsUrl => {
      renderNotices(makeForm({ options: { host: host({ termsUrl }) } }));
      expect(screen.queryByRole('link', { name: 'terms of service' })).not.toBeInTheDocument();
      expect(screen.getByText(/After payment, the administrators/)).toBeInTheDocument();
    },
  );

  it('updates the named host and terms when the paying account changes', () => {
    const view = renderNotices();
    view.rerender(
      withRequiredProviders(
        <ExpenseSubmissionNotices
          form={makeForm({
            options: { host: host({ name: 'Another Host', termsUrl: 'https://other.example/terms' }) },
          })}
        />,
      ),
    );
    expect(screen.getByRole('link', { name: 'terms of service' })).toHaveAttribute(
      'href',
      'https://other.example/terms',
    );
    expect(screen.getByText(/After payment, the administrators/)).toHaveTextContent('Another Host');
    expect(screen.queryByText(/Host One/)).not.toBeInTheDocument();
  });

  it.each([
    { options: { host: null } },
    { options: { account: null } },
    { options: { hasInvalidAccount: true } },
    { initialLoading: true },
    { isLoadingOptions: true },
  ])('does not show agreement or sharing claims before valid account data is ready: %j', overrides => {
    const { container } = renderNotices(makeForm(overrides));
    expect(container).toBeEmptyDOMElement();
  });

  it.each([PAYEE_SLUG_INVITE, PAYEE_SLUG_INVITE_EXISTING_USER])(
    'does not imply the inviter is accepting terms for the recipient: %s',
    payeeSlug => {
      const { container } = renderNotices(makeForm({ values: { payeeSlug } }));
      expect(container).toBeEmptyDOMElement();
    },
  );

  it('does not show recipient consent when an existing account will receive an invitation', () => {
    const { container } = renderNotices(makeForm({ options: { isAdminOfPayee: false, payoutProfiles: [] } }));
    expect(container).toBeEmptyDOMElement();
  });

  it('shows notices to the invited individual completing an existing draft', () => {
    renderNotices(
      makeForm({
        options: { expense: { id: 'expense', status: 'DRAFT' } },
      }),
    );
    expect(screen.getByRole('link', { name: 'terms of service' })).toBeInTheDocument();
    expect(screen.getByText(/After payment, the administrators/)).toBeInTheDocument();
  });

  it('shows notices to an anonymous individual completing an invitation', () => {
    renderNotices(
      makeForm({
        options: {
          expense: { id: 'expense', status: 'DRAFT' },
          payee: null,
          loggedInAccount: null,
          isAdminOfPayee: false,
        },
        values: { payeeSlug: PAYEE_SLUG_INVITE, inviteeAccountType: 'INDIVIDUAL' },
      }),
    );
    expect(screen.getByRole('link', { name: 'terms of service' })).toBeInTheDocument();
    expect(screen.getByText(/After payment, the administrators/)).toBeInTheDocument();
  });

  it('does not show recipient agreement when the inviter only edits the draft', () => {
    const { container } = renderNotices(
      makeForm({
        options: {
          expense: { id: 'expense', status: 'DRAFT' },
          isAdminOfPayee: false,
          isAdminOfPayeeHost: false,
        },
      }),
    );
    expect(container).toBeEmptyDOMElement();
  });

  it('does not treat a cross-host inviter saving their draft as the recipient accepting terms', () => {
    const { container } = renderNotices(
      makeForm({
        options: {
          expense: { id: 'expense', status: 'DRAFT', createdByAccount: { id: 'jane-id' } },
          isAdminOfPayee: false,
          isAdminOfPayeeHost: true,
        },
      }),
    );
    expect(container).toBeEmptyDOMElement();
  });

  it('does not introduce a new agreement when editing an already-submitted expense', () => {
    const { container } = renderNotices(makeForm({ options: { expense: { id: 'expense', status: 'PAID' } } }));
    expect(container).toBeEmptyDOMElement();
  });

  it('shows notices when duplicating an expense as a new submission', () => {
    renderNotices(
      makeForm({
        options: { expense: { id: 'expense', status: 'PAID' } },
        startOptions: { duplicateExpense: true },
      }),
    );
    expect(screen.getByRole('link', { name: 'terms of service' })).toBeInTheDocument();
    expect(screen.getByText(/After payment, the administrators/)).toBeInTheDocument();
  });

  it.each([organization(), collective({ slug: 'payee' }), vendor()])(
    'describes expense-specific details but does not promise ongoing personal email/address access for a non-individual recipient: $type',
    payee => {
      renderNotices(
        makeForm({
          options: { payee, payoutProfiles: [payee] },
          values: { payeeSlug: payee.slug },
        }),
      );
      expect(screen.getByRole('link', { name: 'terms of service' })).toBeInTheDocument();
      expect(
        screen.getByText(/can access the recipient's legal name and the address submitted with this expense/),
      ).toBeInTheDocument();
      expect(screen.queryByText(/After payment, the administrators/)).not.toBeInTheDocument();
    },
  );
});
