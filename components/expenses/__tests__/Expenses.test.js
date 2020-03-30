import React from 'react';
import { mount } from 'enzyme';

import Expenses from '../Expenses';
import { withRequiredProviders } from '../../../test/providers';

describe('Expenses component', () => {
  const host = {
    slug: 'opensource',
    currency: 'USD',
    paymentMethods: [
      {
        service: 'paypal',
        name: 'paypal@host.com',
      },
    ],
  };
  const collective = {
    slug: 'test',
    id: 1,
    name: 'webpack',
    currency: 'USD',
    stats: { balance: 10000 },
  };

  const fromCollective = {
    id: 2,
    type: 'USER',
    slug: 'user1',
    name: 'User 1',
  };

  const expenseConsts = {
    currency: 'USD',
    status: 'APPROVED',
    payoutMethod: 'paypal',
    incurredAt: '2017-11-05',
    updatedAt: '2017-11-05',
    category: 'Travel',
    collective,
    fromCollective,
    user: {
      paypalEmail: 'oc-test@opencollective.com',
    },
  };

  const expenses = [
    Object.assign({}, { ...expenseConsts }, { id: 1, amount: 1000 }),
    Object.assign({}, { ...expenseConsts }, { id: 2, amount: 1000 }),
  ];

  const loggedInUser = {
    isRoot: () => true,
    canPayExpense: () => true,
    canApproveExpense: () => true,
    canEditCollective: () => true,
    canEditExpense: () => true,
    collective: {
      id: 3,
      slug: 'hostuser',
    },
  };

  const component = mount(
    withRequiredProviders(
      <Expenses
        expenses={expenses}
        host={host}
        editable={true}
        LoggedInUser={loggedInUser}
        payExpense={() => setTimeout(() => Promise.resolve(), 2000)}
      />,
    ),
  );

  describe('Paying expenses', () => {
    it('disables all buttons while one expense is being paid', done => {
      // make sure there are two pay buttons on the page
      expect(component.find('[data-cy="pay-expense-btn"]')).not.toBeFalsy();
      expect(component.find('[data-cy="mark-expense-as-paid-btn"]')).not.toBeFalsy();

      // make sure none are disabled
      expect(component.find('[data-cy="expense-actions"] button[disabled]').lenght).toEqual(undefined);

      // click on the first one
      component.find('[data-cy="expense-actions"] button').first().simulate('click');

      // expect two disabled buttons again
      expect(component.find('[data-cy="expense-actions"] button[disabled]').length).toEqual(4);

      // after timeout, make sure there is only button and it's not disabled.
      setTimeout(() => {
        expect(component.find('[data-cy="expense-actions"] button').length).toEqual(1);
        expect(component.find('[data-cy="expense-actions"] button[disabled]').length).toEqual(undefined);
      }, 2000);
      done();
    });
  });
});
