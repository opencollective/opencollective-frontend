import React from 'react';
import { isEmpty } from 'lodash';
import { FormattedMessage } from 'react-intl';

import type { TransactionsImportRow } from '../../../../lib/graphql/types/v2/schema';

import DateTime from '../../../DateTime';
import FormattedMoneyAmount from '../../../FormattedMoneyAmount';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '../../../ui/Accordion';

import { TransactionsImportRowDataLine } from './TransactionsImportRowDataLine';

export const TransactionsImportRowDetailsAccordion = ({
  transactionsImportRow,
  className,
}: {
  transactionsImportRow: TransactionsImportRow;
  className?: string;
}) => {
  return (
    <Accordion type="single" collapsible className={className}>
      <AccordionItem value="item-1">
        <AccordionTrigger>
          <div className="text-base font-medium text-slate-700">
            <FormattedMessage
              defaultMessage="Based on a {amount} {type, select, DEBIT {debit} other {credit}} from {date}"
              id="basedOnImportRow"
              values={{
                amount: (
                  <FormattedMoneyAmount
                    amount={Math.abs(transactionsImportRow.amount.valueInCents)}
                    currency={transactionsImportRow.amount.currency}
                  />
                ),
                type: transactionsImportRow.amount.valueInCents < 0 ? 'DEBIT' : 'CREDIT',
                date: <DateTime value={transactionsImportRow.date} />,
              }}
            />
          </div>
        </AccordionTrigger>
        <AccordionContent>
          <ul className="list-inside list-disc pl-1 text-xs">
            {Object.entries(transactionsImportRow.rawValue as Record<string, string>)
              .filter(entry => !isEmpty(entry[1]))
              .map(([key, value]) => (
                <TransactionsImportRowDataLine key={key} labelKey={key} value={value} />
              ))}
          </ul>
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  );
};
