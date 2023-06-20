import React from 'react';
import { ColumnDef } from '@tanstack/react-table';
import dayjs from 'dayjs';
import { ArrowUpDown, MessageSquare, MoreHorizontal, Paperclip, Table2 } from 'lucide-react';

import expenseStatus from '../../lib/constants/expense-status';

import AmountWithExchangeRateInfo from '../AmountWithExchangeRateInfo';
import Avatar from '../Avatar';
import { ExpenseStatus } from '../expenses/NewExpenseDrawer';
import FormattedMoneyAmount from '../FormattedMoneyAmount';
import { DropdownMenu, DropdownMenuItem, DropdownMenuItems, DropdownMenuTrigger } from '../ui/dropdown';
import { Tooltip, TooltipContent, TooltipTrigger } from '../ui/tooltip';

import ProcessExpenseButtons from './ProcessExpenseButtons';

export type Expense = {
  id: string;
  legacyId?: number;
  comments?: {
    totalCount: number;
  };
  type: string;
  description: string;
  status: string;
  createdAt: string;
  tags?: string[];
  amount: number;
  amountInAccountCurrency: object;
  currency: string;
  permissions?: Record<string, unknown>;
  items?: Record<string, unknown>[];
  requiredLegalDocuments?: string[];
  attachedFiles?: Record<string, unknown>[];
  payee: {
    id: string | number;
    type: string;
    slug: string;
    imageUrl: string;
    isAdmin?: boolean;
  };
  payoutMethod?: {
    type: string;
  };
  createdByAccount: {
    id: string;
    type: string;
    slug: string;
    name: string;
  };
  account?: {
    slug: string;
    currency?: string;
    stats?: {
      balanceWithBlockedFunds: number | { valueInCents: number };
    };
  };
};

export const columns: ColumnDef<Expense>[] = [
  {
    accessorKey: 'description',
    header: 'Title',
    cell: ({ cell, row, table }) => {
      const description = cell.getValue();
      const expense = row.original;
      const id = row.original.legacyId;
      return (
        <button
          // @ts-ignore
          onClick={() => table.options.meta.expandExpense(expense)}
          className="group/cell max-w-[360px] whitespace-nowrap w-full cursor-pointer items-center gap-1 overflow-hidden pl-4 px-2 py-4 text-left font-medium text-slate-900"
        >
          <span className="truncate group-hover/cell:underline">{description}</span>{' '}
          <span className="flex-shrink-0 text-slate-400">#{id}</span>
        </button>
      );
    },
  },
  {
    accessorKey: 'account',
    header: 'Collective',
    cell: ({ cell }) => {
      const account = cell.getValue();
      return (
        <div className="flex items-center gap-2 truncate px-2 py-4  text-slate-500 max-w-[160px]">
          {/* @ts-ignore */}
          <Avatar collective={account} radius={20} /> <span className="truncate">{account?.name}</span>
        </div>
      );
    },
  },
  {
    accessorKey: 'createdByAccount',
    header: 'Submitted by',
    cell: ({ cell }) => {
      const account = cell.getValue();
      return (
        <div className="flex items-center gap-2 truncate px-2 py-4  text-slate-500 max-w-[160px]">
          {/* @ts-ignore */}
          <Avatar collective={account} radius={20} /> <span className="truncate">{account?.name}</span>
        </div>
      );
    },
  },
  {
    accessorKey: 'payee',
    header: 'Payee',
    cell: ({ cell }) => {
      const account = cell.getValue();
      return (
        <div className="flex items-center gap-2 truncate px-2 py-4  text-slate-500">
          {/* @ts-ignore */}
          <Avatar collective={account} radius={20} /> <span>{account?.name}</span>
        </div>
      );
    },
  },
  // {
  //   accessorKey: 'createdAt',
  //   header: ({ column }) => {
  //     return (
  //       <button
  //         className="flex items-center whitespace-nowrap  text-slate-500"
  //         onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
  //       >
  //         <span>Created at</span>
  //         <ArrowUpDown className="ml-2 h-4 w-4" />
  //       </button>
  //     );
  //   },
  //   cell: ({ cell }) => {
  //     const createdAt = cell.getValue();
  //     return (
  //       <div className="whitespace-nowrap px-2 py-4 text-slate-500">
  //         {/* @ts-ignore */}
  //         <span>{dayjs(createdAt).format('MMM D, YYYY')}</span>
  //       </div>
  //     );
  //   },
  // },

  {
    accessorKey: 'comments.totalCount',
    header: '',
    cell: ({ cell }) => {
      const totalCount = cell.getValue();
      //   const comments = row.getValue('comments');

      return (
        <div className="px-2 py-4">
          {Number(totalCount) ? (
            <div className="flex flex-shrink-0 items-center gap-1 text-sm font-medium text-gray-500">
              <MessageSquare className="h-4 w-4 flex-shrink-0 " />
              <span className="leading-5">{totalCount}</span>
            </div>
          ) : null}
        </div>
      );
    },
  },
  {
    accessorKey: 'attachedFiles',
    header: '',
    cell: ({ cell }) => {
      const attachedFiles = cell.getValue();
      //   const comments = row.getValue('comments');
      // @ts-ignore
      const totalCount = attachedFiles?.length;
      return (
        <div className="px-2 py-4">
          {Number(totalCount) ? (
            <div className="flex flex-shrink-0 items-center gap-1 text-sm font-medium text-gray-500">
              <Paperclip className="h-4 w-4 flex-shrink-0 " />
              <span className="leading-5">{totalCount}</span>
            </div>
          ) : null}
        </div>
      );
    },
  },

  //   {
  //     accessorKey: 'securityChecks',
  //     header: 'Checks',
  //     cell: ({ cell }) => {
  //       const securityChecks = cell.getValue();

  //       return (
  //         <div className="flex flex-wrap gap-1">
  //           <SecurityChecksIndicator securityChecks={securityChecks} />
  //         </div>
  //       );
  //     },
  //   },
  //   {
  //     accessorKey: 'payoutMethod.type',
  //     header: 'Payout method',
  //     cell: ({ cell }) => {
  //       const type = cell.getValue();

  //       return (
  //         <div className="flex flex-wrap gap-1">
  //           <PayoutMethodTypeWithIcon type={type} iconSize="14px" fontSize="11px" fontWeight="normal" color="black.600" />
  //         </div>
  //       );
  //     },
  //   },

  {
    accessorKey: 'amount',
    header: 'Amount',
    cell: ({ row, cell, column }) => {
      const amount = cell.getValue();
      const currency = row.original.currency;
      const amountInAccountCurrency = row.original.amountInAccountCurrency;
      // @ts-ignore
      const isMultiCurrency = amountInAccountCurrency && amountInAccountCurrency?.currency !== currency;
      return (
        <div className="flex flex-auto flex-col justify-end whitespace-nowrap px-2 py-4">
          <div className="leading-6 text-slate-900">
            {/* @ts-ignore */}
            <FormattedMoneyAmount amount={amount} currency={currency} precision={2} />
          </div>
          {false && isMultiCurrency && (
            <div className="mt-1 text-xs leading-5 text-slate-500">
              {/* @ts-ignore */}
              <AmountWithExchangeRateInfo showTooltip={false} amount={amountInAccountCurrency} />
            </div>
          )}
        </div>
      );
    },
  },
  {
    accessorKey: 'status',
    header: 'Status',
    cell: ({ cell }) => {
      const status = cell.getValue();
      return (
        <div className="flex items-center max-w-[160px] truncate whitespace-nowrap">
          <ExpenseStatus size={'small'} status={status} />
        </div>
      );
    },
  },
  {
    id: 'actions',
    header: ({ table }) => {
      return (
        <div className="flex justify-end">
          <DropdownMenu>
            <Tooltip>
              <TooltipTrigger>
                <DropdownMenuTrigger>
                  <button className="rounded p-1 transition-colors hover:bg-slate-100 hover:text-slate-900">
                    <Table2 className="h-4 w-4" />
                  </button>
                </DropdownMenuTrigger>
              </TooltipTrigger>
              <TooltipContent>Choose columns</TooltipContent>
            </Tooltip>

            <DropdownMenuItems align="right">
              {table
                .getAllColumns()
                .filter(column => column.getCanHide())
                .map(column => {
                  return (
                    <DropdownMenuItem
                      key={column.id}
                      className="capitalize"
                      // checked={column.getIsVisible()}
                      onClick={value => {
                        const columnVisible = column.getIsVisible();
                        column.toggleVisibility(!columnVisible);
                      }}
                    >
                      {column.id} {column.getIsVisible() ? '✅' : '❌'}
                    </DropdownMenuItem>
                  );
                })}
            </DropdownMenuItems>
          </DropdownMenu>
        </div>
      );
    },
    cell: ({ row, table }) => {
      // @ts-ignore
      const host = table.options.meta.host;
      const expense = row.original;

      // @ts-ignore
      const isExpensePaidOrRejected = [expenseStatus.REJECTED, expenseStatus.PAID].includes(expense?.status);
      const showProcessButtons = expense?.permissions && !isExpensePaidOrRejected;
      // const shouldDisplayStatusTagActions =
      //   (isExpensePaidOrRejected || expense?.status === expenseStatus.APPROVED) &&
      //   (hasProcessButtons(expense.permissions) || expense.permissions.canMarkAsIncomplete);

      return (
        <div className="relative m-4 flex items-center justify-center">
          <div className=" absolute right-0 flex h-6 items-center divide-x divide-transparent rounded-md border border-transparent bg-transparent transition-all group-hover:divide-slate-200 group-hover:border-slate-200 group-hover:bg-white group-hover:shadow-sm">
            {/* <Tooltip>
              <TooltipTrigger>
                <button className="flex h-6 w-8 items-center justify-center rounded-l-md p-0 text-slate-500 opacity-0 transition-all hover:shadow-md group-hover:opacity-100">
                  <span className="sr-only">Open menu</span>
                  <Paperclip className="h-4 w-4" />
                </button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Approve</p>
              </TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger>
                <button className="flex h-6 w-8 items-center justify-center p-0 text-slate-500 opacity-0 transition-all hover:shadow-md group-hover:opacity-100">
                  <span className="sr-only">Open menu</span>
                  <Check className="h-4 w-4" />
                </button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Reject</p>
              </TooltipContent>
            </Tooltip> */}
            {showProcessButtons && (
              <ProcessExpenseButtons
                expense={expense}
                permissions={expense.permissions}
                collective={expense.account}
                host={host}
                displaySecurityChecks={false}
              />
            )}

            <DropdownMenu>
              <DropdownMenuTrigger>
                <button className="flex h-6 w-8 items-center justify-center rounded-r-md p-0 text-slate-500 transition-all hover:shadow-md">
                  <span className="sr-only">Open menu</span>
                  <MoreHorizontal className="h-4 w-4" />
                </button>
              </DropdownMenuTrigger>

              <DropdownMenuItems align="right">
                <DropdownMenuItem>Go to pay</DropdownMenuItem>

                <DropdownMenuItem onClick={() => {}}>Mark as incomplete</DropdownMenuItem>
                {/* <DropdownMenuSeparator /> */}
                {/* <DropdownMenuItem>Go to pay</DropdownMenuItem> */}
                {/* <DropdownMenuItem>View payment details</DropdownMenuItem> */}
              </DropdownMenuItems>
            </DropdownMenu>
          </div>
          <div className="w-8"></div>
        </div>
      );
    },
  },
];
