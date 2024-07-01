import type { ExpenseType } from './graphql/types/v2/graphql';
import { formatCurrency, formatValueAsCurrency } from './currency-utils';

const ML_SERVICE_URL = 'http://localhost:8000'; // TODO

type ExpenseCategoryPrediction = {
  code: string;
  name: string;
  confidence: number;
};

export const fetchExpenseCategoryPredictions = async ({
  hostSlug,
  accountSlug,
  type,
  description,
  items,
}: {
  hostSlug: string;
  accountSlug: string;
  type: ExpenseType;
  description: string;
  items: string;
}) => {
  const urlParams = new URLSearchParams();
  urlParams.append('host_slug', hostSlug);
  urlParams.append('collective_slug', accountSlug);
  urlParams.append('type', type);
  urlParams.append('description', description);
  urlParams.append('items', items);

  const response = await fetch(`${ML_SERVICE_URL}/models/expense-category?${urlParams}`);
  const data = await response.json();

  return data.predictions as ExpenseCategoryPrediction[];
};

const MOCK_RESULT = {
  '555': [
    {
      code: '7031',
      name: 'Expenses · Collective Ops',
      confidence: 0.8,
    },
  ],
  '563': [
    {
      code: '7031',
      name: 'Expenses · Collective Ops',
      confidence: 0.8,
    },
  ],
  '715': [
    {
      code: '7032',
      name: 'Expenses - Donations & Sponsorships',
      confidence: 1,
    },
  ],
  '716': [
    {
      code: '7032',
      name: 'Expenses - Donations & Sponsorships',
      confidence: 1,
    },
  ],
  '732': [
    {
      code: '7032',
      name: 'Expenses - Donations & Sponsorships',
      confidence: 1,
    },
  ],
  '733': [
    {
      code: '7032',
      name: 'Expenses - Donations & Sponsorships',
      confidence: 1,
    },
  ],
  '879': [
    {
      code: '7018',
      name: 'Consultants · Maintenance and Development',
      confidence: 1,
    },
  ],
  '1136': [
    {
      code: '7014',
      name: 'Consultants · Legal & Professional Services',
      confidence: 1,
    },
  ],
  '1151': [
    {
      code: '7018',
      name: 'Consultants · Maintenance and Development',
      confidence: 1,
    },
  ],
  '1478': [
    {
      code: '7018',
      name: 'Consultants · Maintenance and Development',
      confidence: 1,
    },
  ],
  '1605': [
    {
      code: '7018',
      name: 'Consultants · Maintenance and Development',
      confidence: 1,
    },
  ],
  '1617': [
    {
      code: '7031',
      name: 'Expenses · Collective Ops',
      confidence: 0.8,
    },
  ],
  '1731': [
    {
      code: '7014',
      name: 'Consultants · Legal & Professional Services',
      confidence: 1,
    },
  ],
  '2314': [
    {
      code: '7018',
      name: 'Consultants · Maintenance and Development',
      confidence: 1,
    },
  ],
  '2379': [
    {
      code: '7030',
      name: 'Expenses - Other',
      confidence: 0.5,
    },
  ],
  '2381': [
    {
      code: '7030',
      name: 'Expenses - Other',
      confidence: 0.5,
    },
  ],
  '2382': [
    {
      code: '7030',
      name: 'Expenses - Other',
      confidence: 0.5,
    },
  ],
  '2383': [
    {
      code: '7032',
      name: 'Expenses - Donations & Sponsorships',
      confidence: 1,
    },
  ],
  '2384': [
    {
      code: '7100',
      name: 'PAYROLL- Collectives',
      confidence: 1,
    },
  ],
  '2385': [
    {
      code: '7100',
      name: 'PAYROLL- Collectives',
      confidence: 1,
    },
  ],
};

export const fetchExpensesCategoriesLLMPredictions = async ({
  hostSlug,
  appliesTo,
  expenses,
}): Promise<Record<string, ExpenseCategoryPrediction[]>> => {
  const response = await fetch(`${ML_SERVICE_URL}/models/expense-category/llm`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      host_slug: hostSlug,
      applies_to: appliesTo,
      inputs: expenses.map(expense => ({
        id: expense.legacyId,
        description: expense.description,
        items: expense.items?.map(item => item.description).join(', '),
        amount: `${formatCurrency(expense.amount, expense.currency, { currencyDisplay: 'symbol' })}`,
      })),
    }),
  });

  return response.json();
};
