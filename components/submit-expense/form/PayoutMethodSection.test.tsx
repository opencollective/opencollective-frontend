import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { useFormikContext } from 'formik';
import { get } from 'lodash-es';

import { withRequiredProviders } from '../../../test/providers';

import { PayoutMethodFormContent, PayoutMethodRadioGroupItem } from './PayoutMethodSection';

// Stand-in for the real payout method form: shows the host it gets and binds one input to the field it edits
jest.mock('../../expenses/PayoutMethodForm', () => {
  const MockPayoutMethodForm = ({ fieldsPrefix, host }) => {
    const { values, setFieldValue } = useFormikContext<Record<string, unknown>>();
    const name = `${fieldsPrefix}.data.accountHolderName`;
    return (
      <div>
        <span data-testid="payout-method-form-host">{host ? host.slug : 'NONE'}</span>
        <input
          data-testid="account-holder-name"
          value={(get(values, name) as string) || ''}
          onChange={e => setFieldValue(name, e.target.value)}
        />
      </div>
    );
  };
  return { __esModule: true, default: MockPayoutMethodForm, validatePayoutMethod: () => ({}) };
});
jest.mock('../PayoutMethodDetails', () => ({ PayoutMethodDetailsContainer: () => null }));
jest.mock('../../ModalContext', () => ({ useModal: () => ({ showConfirmationModal: jest.fn() }) }));
jest.mock('@/lib/hooks/useLoggedInUser', () => ({
  __esModule: true,
  default: () => ({ LoggedInUser: { isAdminOfCollective: () => true } }),
}));

const payee = { id: 'user-1', slug: 'jane', name: 'Jane', legalName: 'Jane', type: 'INDIVIDUAL' };

const buildPayoutMethod = (accountHolderName: string) => ({
  id: 'pm-1',
  type: 'BANK_ACCOUNT',
  name: 'Bank',
  isSaved: true,
  canBeEdited: true,
  canBeDeleted: true,
  data: { currency: 'EUR', accountHolderName, type: 'iban', details: { IBAN: 'X' } },
});

const buildActions = () => ({
  savePayoutMethod: jest.fn().mockResolvedValue('pm-2'),
  selectConnectedPayoutMethod: jest.fn(),
  removePayoutMethod: jest.fn(),
  updateLegalName: jest.fn(),
});

const Card = ({ subContent, children }) => (
  <div>
    {children}
    {subContent}
  </div>
);

describe('PayoutMethodFormContent', () => {
  it('passes the expense host to the form that edits a payout method', () => {
    const host = { id: 'host-1', slug: 'host-with-wise', name: 'Host', transferwise: { availableCurrencies: [] } };
    const props = {
      setFieldTouched: jest.fn(),
      setFieldValue: jest.fn(),
      initialLoading: false,
      actions: buildActions(),
      isSubmitting: false,
      payeeSlug: 'jane',
      payoutMethodId: 'pm-1',
      expenseTypeOption: 'INVOICE',
      account: { id: 'col-1', slug: 'col', host },
      host,
      payee,
      payoutMethods: [buildPayoutMethod('Jane')],
      newPayoutMethodTypes: [],
      recentlySubmittedExpenses: null,
      isAdminOfPayee: true,
      isAdminOfPayeeHost: false,
      loggedInAccount: payee,
      expense: null,
      isPaypalConnectEnabled: false,
    } as unknown as React.ComponentProps<typeof PayoutMethodFormContent>;

    render(withRequiredProviders(<PayoutMethodFormContent {...props} />));
    fireEvent.click(screen.getByTitle('Edit payout method'));
    expect(screen.getByTestId('payout-method-form-host')).toHaveTextContent('host-with-wise');
  });
});

describe('PayoutMethodRadioGroupItem', () => {
  const renderItem = (payoutMethod, actions) =>
    withRequiredProviders(
      <PayoutMethodRadioGroupItem
        {...({
          payoutMethod,
          payee,
          payeeSlug: 'jane',
          isChecked: true,
          isEditable: true,
          actions,
          Component: Card,
        } as unknown as React.ComponentProps<typeof PayoutMethodRadioGroupItem>)}
      />,
    );

  it('discards the edits on Cancel', () => {
    render(renderItem(buildPayoutMethod('Alice'), buildActions()));
    fireEvent.click(screen.getByTitle('Edit payout method'));
    fireEvent.change(screen.getByTestId('account-holder-name'), { target: { value: 'Mallory' } });
    fireEvent.click(screen.getByText('Cancel'));
    fireEvent.click(screen.getByTitle('Edit payout method'));
    expect(screen.getByTestId('account-holder-name')).toHaveValue('Alice');
  });

  it('starts editing from the latest payout method data', async () => {
    const actions = buildActions();
    const { rerender } = render(renderItem(buildPayoutMethod('Alice'), actions));
    rerender(renderItem(buildPayoutMethod('Bob'), actions));
    fireEvent.click(screen.getByTitle('Edit payout method'));
    expect(screen.getByTestId('account-holder-name')).toHaveValue('Bob');
    fireEvent.click(screen.getByText('Save'));
    await waitFor(() => expect(actions.savePayoutMethod).toHaveBeenCalled());
    expect(actions.savePayoutMethod.mock.calls[0][0].data.accountHolderName).toBe('Bob');
  });
});
