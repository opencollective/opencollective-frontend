import React from 'react';

import ExpenseBudgetItem from '../../components/budget/ExpenseBudgetItem';

import { openSourceHost } from '../mocks/collectives';
import { listItemExpense } from '../mocks/expenses-v2';

const meta = {
  title: 'expenses/ExpenseBudgetItem',
  component: ExpenseBudgetItem,
  args: {
    expense: listItemExpense,
    host: openSourceHost,
    view: 'admin',
    showAmountSign: true,
    showProcessActions: true,
    suggestedTags: ['suggested-tag'],
  },
  parameters: {
    design: {
      type: 'figma',
      url: 'https://www.figma.com/file/KinuveYf4WUlRIXzMTnmIsmO/%5BOC-Design%5D-Lab-%F0%9F%A7%AA?type=design&node-id=20102-89475&t=QBAQoPTR78mPGHKc-0',
    },
  },
};
export default meta;

export const Default = {
  render: args => {
    return <ExpenseBudgetItem {...args} />;
  },
};

export const MultiCurrency = {
  ...Default,
  args: {
    expense: {
      ...listItemExpense,
      amountInAccountCurrency: {
        currency: 'BRL',
        valueInCents: 10000,
      },
    },
  },
};
