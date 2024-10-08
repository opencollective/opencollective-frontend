import React from 'react';
import { FormattedMessage, useIntl } from 'react-intl';

import { TransactionTypes } from '../../lib/constants/transactions';
import { i18nTransactionKind } from '../../lib/i18n/transaction';

import Avatar from '../Avatar';
import { Pagination } from '../dashboard/filters/Pagination';
import DateTime from '../DateTime';
import FormattedMoneyAmount from '../FormattedMoneyAmount';
import Link from '../Link';
import LinkCollective from '../LinkCollective';
import StyledLink from '../StyledLink';
import TransactionSign from '../TransactionSign';

import { triggerPrototypeToast } from './helpers';

export function ContributionsList({ account }) {
  const intl = useIntl();
  return (
    <div className="relative mx-auto max-w-screen-md space-y-6 px-6 py-12">
      <div className="flex flex-col divide-y rounded-lg border bg-background">
        {account.contributionTransactions.nodes.map(transaction => {
          return (
            <div key={transaction.id} className="flex flex-col gap-4 p-4">
              <div className="flex justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div className="flex-shrink-0">
                    <Avatar className="" collective={transaction.fromAccount} />
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
                      {transaction.description}
                    </Link>
                    <div className="text-xs">
                      {i18nTransactionKind(intl, transaction.kind)}
                      &nbsp;
                      {
                        <React.Fragment>
                          <FormattedMessage
                            id="Transaction.from"
                            defaultMessage="from {name}"
                            values={{
                              name: (
                                <StyledLink as={LinkCollective} withHoverCard collective={transaction.fromAccount} />
                              ),
                            }}
                          />
                          &nbsp;
                        </React.Fragment>
                      }
                      {
                        <FormattedMessage
                          id="Transaction.to"
                          defaultMessage="to {name}"
                          values={{
                            name: <StyledLink as={LinkCollective} withHoverCard collective={transaction.toAccount} />,
                          }}
                        />
                      }
                      {` • `}
                      <DateTime value={transaction.createdAt} data-cy="transaction-date" />
                    </div>
                  </div>
                </div>
                <div className="flex">
                  <TransactionSign isCredit={transaction.type === TransactionTypes.CREDIT} />
                  <span className="align-bottom text-base font-semibold">
                    <FormattedMoneyAmount
                      amount={transaction.amount.valueInCents}
                      currency={transaction.amount.currency}
                      showCurrencyCode={false}
                    />
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
      <Pagination
        total={account.contributionTransactions.totalCount}
        queryFilter={{
          // Mocked queryFilter object for prototype
          values: { limit: 20, offset: 0 },
          defaultSchemaValues: { limit: 20 },
          setFilter: triggerPrototypeToast,
        }}
      />
    </div>
  );
}
