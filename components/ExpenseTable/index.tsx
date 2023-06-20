import React from 'react';
import { DataTable } from '../ui/data-table';

import { columns, Expense } from './columns';
import { VisibilityState } from '@tanstack/react-table';

// async function getData(): Promise<Expense[]> {
//   // Fetch data from your API here.
//   return [
//     {
//       id: '728ed52f',
//       amount: 100,
//       status: 'pending',
//       email: 'm@example.com',
//     },
//     // ...
//   ];
// }

export default function ExpenseTable({ expenses, host, expandExpense, context, isLoading, loadingCount }) {
  // const data = await getData();
  const defaultColumnVisibility: VisibilityState = {
    payee: false,
  };

  if (context === 'individual-submitted') {
    defaultColumnVisibility.createdByAccount = false;
    defaultColumnVisibility.payee = false;
  } else if (context === 'received') {
    defaultColumnVisibility.account = false;
  } else if (context === 'submitted') {
    // do something
  }

  console.log({ context, defaultColumnVisibility });
  return (
    <DataTable
      columns={columns}
      data={expenses}
      meta={{ host, expandExpense }}
      defaultColumnVisibility={defaultColumnVisibility}
      loading={isLoading}
      loadingCount={loadingCount}
    />
  );
}
