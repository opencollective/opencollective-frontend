import React from 'react';
import { CornerDownRight } from 'lucide-react';
import { defineMessage, useIntl } from 'react-intl';

import { TransactionKind } from '../../../../../lib/graphql/types/v2/graphql';

import FormattedMoneyAmount from '../../../../FormattedMoneyAmount';
import { InfoTooltipIcon } from '../../../../InfoTooltipIcon';

import { TransactionReportRowLabel } from './TransactionRowLabel';

const legacyColumnHelpMessage = defineMessage({
  defaultMessage:
    'This amount is included in the originating transactions above. As of {date} {kind, select, HOST_FEE_SHARE {Platform fees} PAYMENT_PROCESSOR_FEE {Payment processor fees} HOST_FEE {Host fees} TAX {Taxes} other {these}} are split into their own transaction kind.',
});

const legacyColumns = [
  {
    amountKey: 'platformFee',
    kind: TransactionKind.HOST_FEE_SHARE,
    migrationDate: '2021-06-01',
  },
  {
    amountKey: 'paymentProcessorFee',
    kind: TransactionKind.PAYMENT_PROCESSOR_FEE,
    migrationDate: '2024-01-01',
  },
  {
    amountKey: 'hostFee',
    kind: TransactionKind.HOST_FEE,
    migrationDate: '2021-06-01',
  },
  {
    amountKey: 'taxAmount',
    kind: TransactionKind.TAX,
    migrationDate: '2024-01-01',
  },
];

/**
 * This component renders the legacy columns as rows in the transaction report.
 */
export function LegacyColumnRows({ parentRow, currency, showCreditDebit }) {
  const intl = useIntl();
  const displayedLegacyColumns = legacyColumns
    .map(col => ({
      ...col,
      amount: parentRow[col.amountKey],
    }))
    .filter(lc => lc.amount !== 0);
  return (
    <React.Fragment>
      {displayedLegacyColumns.map(legacyColumn => {
        const creditAmount = legacyColumn.amount > 0 ? legacyColumn.amount : 0;
        const debitAmount = legacyColumn.amount < 0 ? legacyColumn.amount : 0;
        return (
          <tr
            key={`legacy-${legacyColumn.amountKey}`}
            className="group  text-sm hover:bg-muted has-[[data-state=open]]:bg-muted"
          >
            <td className="flex min-h-8 items-center gap-1 py-1 pl-8 text-left text-muted-foreground sm:pl-12">
              <CornerDownRight size={14} className="inline-block shrink-0" />
              <TransactionReportRowLabel filter={{ kind: legacyColumn.kind, isRefund: parentRow.filter.isRefund }} />
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
                  amount={legacyColumn.amount}
                  currency={currency}
                  showCurrencyCode={false}
                />
              </td>
            )}

            <td className="pr-2 text-right sm:pr-3">
              <InfoTooltipIcon
                className="inline-block text-slate-400 group-hover:text-muted-foreground"
                contentClassname="space-y-2"
                side="bottom"
              >
                {intl.formatMessage(legacyColumnHelpMessage, {
                  date: legacyColumn.migrationDate,
                  kind: legacyColumn.kind,
                })}
              </InfoTooltipIcon>
            </td>
          </tr>
        );
      })}
    </React.Fragment>
  );
}
