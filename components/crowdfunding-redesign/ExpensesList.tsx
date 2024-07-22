import React from 'react';
import { FormattedMessage, useIntl } from 'react-intl';

import { i18nExpenseStatus } from '../../lib/i18n/expense';

import { AccountHoverCard } from '../AccountHoverCard';
import Avatar from '../Avatar';
import { EmptyResults } from '../dashboard/EmptyResults';
import { Pagination } from '../dashboard/filters/Pagination';
import DateTime from '../DateTime';
import FormattedMoneyAmount from '../FormattedMoneyAmount';
import Link from '../Link';
import LinkCollective from '../LinkCollective';
import { Badge } from '../ui/Badge';

import { triggerPrototypeToast } from './helpers';

export default function ExpensesList({ account }) {
  const intl = useIntl();
  return (
    <div className="relative mx-auto flex max-w-screen-md flex-col gap-8 px-6 py-12">
      {account.expenses.totalCount > 0 ? (
        <div className="space-y-6">
          <div className="flex flex-col divide-y rounded-lg border bg-background">
            {account.expenses.nodes.map(expense => {
              return (
                <div key={expense.id} className="flex justify-between gap-4 px-4 py-3">
                  <div className="flex items-center gap-4">
                    <div className="flex-shrink-0">
                      <Avatar className="" collective={expense.payee} />
                    </div>
                    <div className="space-y-0.5">
                      <Link
                        href="#"
                        onClick={e => {
                          e.preventDefault();
                          triggerPrototypeToast();
                        }}
                        className="text-sm font-semibold hover:underline"
                      >
                        {expense.description}
                      </Link>
                      <div className="text-xs">
                        <FormattedMessage
                          defaultMessage="from {payee} to {account}"
                          id="B5z1AU"
                          values={{
                            payee: (
                              <AccountHoverCard
                                account={expense.payee}
                                trigger={
                                  <span>
                                    <LinkCollective
                                      noTitle
                                      className="text-primary hover:underline"
                                      collective={expense.payee}
                                    />
                                  </span>
                                }
                              />
                            ),
                            account: (
                              <AccountHoverCard
                                account={expense.account}
                                trigger={
                                  <span>
                                    <LinkCollective
                                      noTitle
                                      className="text-primary hover:underline"
                                      collective={expense.account}
                                    />
                                  </span>
                                }
                              />
                            ),
                          }}
                        />

                        {' • '}
                        <DateTime value={expense.createdAt} />
                      </div>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-0.5">
                    <div className="font-semibold">
                      <FormattedMoneyAmount
                        amount={expense.amountV2.valueInCents}
                        currency={expense.amountV2.currency}
                        showCurrencyCode={false}
                        amountStyles={{ letterSpacing: 0 }}
                      />
                    </div>
                    <Badge size="sm" type="success">
                      {i18nExpenseStatus(intl, expense.status)}
                    </Badge>
                  </div>
                </div>
              );
            })}
          </div>
          <Pagination
            total={account.expenses.totalCount}
            queryFilter={{
              // Mocked queryFilter object for prototype
              values: { limit: 20, offset: 0 },
              defaultSchemaValues: { limit: 20 },
              setFilter: triggerPrototypeToast,
            }}
          />
        </div>
      ) : (
        <div className="col-span-12">
          <EmptyResults entityType="EXPENSES" hasFilters={false} onResetFilters={triggerPrototypeToast} />
        </div>
      )}
    </div>
  );
}
