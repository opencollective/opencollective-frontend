import type { ExpenseType } from './graphql/types/v2/graphql';

const ML_SERVICE_URL = process.env.ML_SERVICE_URL || 'http://localhost:8000';

export type ExpenseCategoryPrediction = {
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
