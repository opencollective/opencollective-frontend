import React from 'react';
import { MoreVertical } from 'lucide-react';
import { FormattedMessage, useIntl } from 'react-intl';

import dayjs from '../../../../../lib/dayjs';
import { i18nReportSection } from '../../../../../lib/i18n/reports';

import FormattedMoneyAmount from '../../../../FormattedMoneyAmount';
import { Button } from '../../../../ui/Button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '../../../../ui/DropdownMenu';

import { DefinitionTooltip } from './DefinitionTooltip';
import { LegacyColumnRows } from './LegacyColumnRows';
import { TransactionReportRowLabel } from './TransactionRowLabel';

export function ReportContent({
  report,
  variables,
  showCreditDebit,
  currency,
  viewTransactions,
  openExportTransactionsModal,
}) {
  const intl = useIntl();

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 px-0">
        {report.sections?.length === 0 && (
          <p className="p-4 text-center text-muted-foreground">
            <FormattedMessage defaultMessage="No transactions this period" id="7Dxdw8" />
          </p>
        )}
        {report.sections?.map(section => (
          <table key={section.label} className="border-none">
            <thead className="relative border-b">
              <tr>
                <th className="py-1 pl-6 text-left text-lg font-semibold sm:pl-10">
                  {i18nReportSection(intl, section.label)}
                </th>
                {showCreditDebit ? (
                  <React.Fragment>
                    <th className="w-40  text-right text-sm font-medium text-muted-foreground">
                      <FormattedMessage id="Expense.Type.Debit" defaultMessage="Debit" />
                    </th>
                    <th className="w-40 text-right text-sm font-medium text-muted-foreground">
                      <FormattedMessage id="Transaction.Type.Credit" defaultMessage="Credit" />
                    </th>
                  </React.Fragment>
                ) : (
                  <th></th>
                )}
                <th className="w-6 sm:w-10"></th>
              </tr>
            </thead>
            <tbody>
              {section.rows.map(row => {
                const creditAmount = row.groups.reduce(
                  (acc, t) => (t.type === 'CREDIT' ? acc + t.amount.valueInCents : acc),
                  0,
                );
                const debitAmount = row.groups.reduce(
                  (acc, t) => (t.type === 'DEBIT' ? acc + t.amount.valueInCents : acc),
                  0,
                );

                return (
                  <React.Fragment key={JSON.stringify(row.filter)}>
                    <tr className="group text-sm hover:bg-muted has-[[data-state=open]]:bg-muted ">
                      <td className="flex min-h-8 flex-1 items-center gap-1 overflow-hidden truncate text-wrap py-1 pl-6 text-left sm:pl-10">
                        <span className="underline-offset-2 transition-colors hover:decoration-slate-400">
                          {row.label || <TransactionReportRowLabel filter={row.filter} />}
                        </span>
                      </td>
                      {showCreditDebit ? (
                        <React.Fragment>
                          <td className="text-right font-medium">
                            {debitAmount !== 0 && (
                              <FormattedMoneyAmount
                                amountStyles={{ letterSpacing: 0 }}
                                amount={Math.abs(debitAmount)}
                                currency={currency}
                                showCurrencyCode={false}
                              />
                            )}
                          </td>
                          <td className="text-right font-medium">
                            {creditAmount !== 0 && (
                              <FormattedMoneyAmount
                                amountStyles={{ letterSpacing: 0 }}
                                amount={Math.abs(creditAmount)}
                                currency={currency}
                                showCurrencyCode={false}
                              />
                            )}
                          </td>
                        </React.Fragment>
                      ) : (
                        <td className="text-right font-medium">
                          <FormattedMoneyAmount
                            amountStyles={{ letterSpacing: 0 }}
                            amount={row.amount}
                            currency={currency}
                            showCurrencyCode={false}
                          />
                        </td>
                      )}

                      <td className="pr-1 text-right sm:pr-2">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon-xs"
                              className="relative size-6 text-slate-400 transition-colors group-hover:border group-hover:bg-background group-hover:text-muted-foreground data-[state=open]:border data-[state=open]:bg-background"
                            >
                              <MoreVertical size={16} />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => viewTransactions(row.filter)}>
                              <FormattedMessage defaultMessage="View transactions" id="DfQJQ6" />
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => openExportTransactionsModal(row.filter)}>
                              <FormattedMessage defaultMessage="Export transactions" id="T72ceA" />
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </td>
                    </tr>
                    <LegacyColumnRows parentRow={row} currency={currency} showCreditDebit={showCreditDebit} />
                  </React.Fragment>
                );
              })}
              <tr className="border-t text-right text-base  font-medium">
                <td className="min-h-8"></td>
                {showCreditDebit ? (
                  <React.Fragment>
                    <td className="py-1">
                      {section.total < 0 && (
                        <FormattedMoneyAmount
                          amount={Math.abs(section.total)}
                          currency={currency}
                          showCurrencyCode={false}
                          amountStyles={{ letterSpacing: 0 }}
                        />
                      )}
                    </td>
                    <td className="py-1">
                      {section.total > 0 && (
                        <FormattedMoneyAmount
                          amount={Math.abs(section.total)}
                          currency={currency}
                          showCurrencyCode={false}
                          amountStyles={{ letterSpacing: 0 }}
                        />
                      )}
                    </td>
                  </React.Fragment>
                ) : (
                  <td className="py-1">
                    <FormattedMoneyAmount
                      amount={section.total}
                      currency={currency}
                      showCurrencyCode={false}
                      amountStyles={{ letterSpacing: 0 }}
                    />
                  </td>
                )}
              </tr>
            </tbody>
          </table>
        ))}
      </div>
      <div className="mx-4 space-y-3 bg-muted p-6 sm:rounded-xl">
        <div className="flex justify-between text-base font-medium">
          <div>
            <FormattedMessage
              defaultMessage="Starting balance {date}"
              id="u3wVzh"
              values={{
                date: (
                  <DefinitionTooltip
                    definition={
                      <FormattedMessage defaultMessage="This report is currently only available in UTC" id="/lQgi5" />
                    }
                  >
                    {dayjs(variables.dateFrom).utc().format('D MMM, YYYY')} (UTC)
                  </DefinitionTooltip>
                ),
              }}
            />
          </div>

          <FormattedMoneyAmount
            amountStyles={{ letterSpacing: 0 }}
            amount={report.startingBalance?.valueInCents}
            currency={currency}
            showCurrencyCode={false}
          />
        </div>
        <div className="flex justify-between text-base font-medium">
          <div>
            <FormattedMessage defaultMessage="Net change" id="StHpyn" />
          </div>

          <FormattedMoneyAmount
            amountStyles={{ letterSpacing: 0 }}
            amount={report.totalChange?.valueInCents}
            currency={currency}
            showCurrencyCode={false}
          />
        </div>
        <div className="flex justify-between text-base font-medium">
          <div>
            <FormattedMessage
              defaultMessage="Ending balance {date}"
              id="lVdOyh"
              values={{
                date: (
                  <DefinitionTooltip
                    definition={
                      <FormattedMessage defaultMessage="This report is currently only available in UTC" id="/lQgi5" />
                    }
                  >
                    {dayjs(variables.dateTo).utc().format('D MMM, YYYY')} (UTC)
                  </DefinitionTooltip>
                ),
              }}
            />
          </div>

          <FormattedMoneyAmount
            amountStyles={{ letterSpacing: 0 }}
            amount={report.endingBalance?.valueInCents}
            currency={currency}
            showCurrencyCode={false}
          />
        </div>
      </div>
    </div>
  );
}
