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
      url: 'https://www.figma.com/file/ZQBMWhnGGtRWeIZknFW1eP/%5BOC-Design%5D-Production-Ready-%E2%9C%85?type=design&node-id=20530-95717&t=GtndoZH2SYmLFcvS-11',
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
