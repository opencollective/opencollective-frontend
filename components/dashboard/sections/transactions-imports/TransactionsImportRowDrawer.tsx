import React from 'react';
import { isEmpty, startCase } from 'lodash';
import type { ComponentProps } from 'react';
import { FormattedMessage } from 'react-intl';

import type { GetActions } from '../../../../lib/actions/types';
import type { TransactionsImportRow } from '../../../../lib/graphql/types/v2/graphql';

import DateTime from '../../../DateTime';
import DrawerHeader from '../../../DrawerHeader';
import FormattedMoneyAmount from '../../../FormattedMoneyAmount';
import StyledLink from '../../../StyledLink';
import { DataList, DataListItem, DataListItemLabel, DataListItemValue } from '../../../ui/DataList';
import { Sheet, SheetBody, SheetContent } from '../../../ui/Sheet';

import { TransactionsImportRowStatus } from './TransactionsImportRowStatus';

export const TransactionsImportRowDrawer = ({
  getActions,
  row,
  rowIndex,
  ...props
}: {
  row: TransactionsImportRow;
  getActions: GetActions<TransactionsImportRow>;
  rowIndex: number;
} & ComponentProps<typeof Sheet>) => {
  const dropdownTriggerRef = React.useRef();
  return (
    <Sheet {...props}>
      <SheetContent>
        {row && (
          <React.Fragment>
            <DrawerHeader
              actions={getActions(row, dropdownTriggerRef)}
              entityName={<FormattedMessage defaultMessage="Transaction import row" id="qqPBY/" />}
              forceMoreActions
              entityLabel={
                <div className="text-2xl">
                  <span className={'font-bold text-foreground'}>
                    <FormattedMoneyAmount
                      amount={row.amount.valueInCents}
                      currency={row.amount.currency}
                      precision={2}
                      amountStyles={{ letterSpacing: 0 }}
                      showCurrencyCode={false}
                    />
                  </span>
                  &nbsp;
                  <span className="text-muted-foreground">{row.amount.currency}</span>
                </div>
              }
              dropdownTriggerRef={dropdownTriggerRef}
              entityIdentifier={
                <FormattedMessage defaultMessage="No. {number}" id="rowNumber" values={{ number: rowIndex + 1 }} />
              }
            />
            <SheetBody>
              <DataList>
                <DataListItem>
                  <DataListItemLabel>
                    <FormattedMessage id="Fields.status" defaultMessage="Status" />
                  </DataListItemLabel>
                  <DataListItemValue>
                    <TransactionsImportRowStatus row={row} />
                  </DataListItemValue>
                </DataListItem>
                <DataListItem>
                  <DataListItemLabel>
                    <FormattedMessage id="expense.incurredAt" defaultMessage="Date" />
                  </DataListItemLabel>
                  <DataListItemValue>
                    <DateTime dateStyle="medium" timeStyle="short" value={row.date} />
                  </DataListItemValue>
                </DataListItem>
                <DataListItem>
                  <DataListItemLabel>
                    <FormattedMessage id="Fields.amount" defaultMessage="Amount" />
                  </DataListItemLabel>
                  <DataListItemValue>
                    <FormattedMoneyAmount
                      amount={row.amount.valueInCents}
                      currency={row.amount.currency}
                      amountStyles={null}
                    />
                  </DataListItemValue>
                </DataListItem>
                <DataListItem>
                  <DataListItemLabel>
                    <FormattedMessage id="Fields.description" defaultMessage="Description" />
                  </DataListItemLabel>
                  <DataListItemValue>{row.description}</DataListItemValue>
                </DataListItem>
                {row.expense && (
                  <DataListItem>
                    <DataListItemLabel>
                      <FormattedMessage id="TransactionImportRow.LinkedTo" defaultMessage="Linked to" />
                    </DataListItemLabel>
                    <DataListItemValue>
                      <StyledLink href={`/${row.expense.account.slug}/expenses/${row.expense.legacyId}`}>
                        <FormattedMessage
                          defaultMessage="Expense #{id}"
                          id="E9pJQz"
                          values={{ id: row.expense.legacyId }}
                        />
                      </StyledLink>
                    </DataListItemValue>
                  </DataListItem>
                )}
                {row.order && (
                  <DataListItem>
                    <DataListItemLabel>
                      <FormattedMessage id="TransactionImportRow.LinkedTo" defaultMessage="Linked to" />
                    </DataListItemLabel>
                    <DataListItemValue>
                      <StyledLink href={`/${row.order.toAccount.slug}/contributions/${row.order.legacyId}`}>
                        <FormattedMessage
                          defaultMessage="Contribution #{id}"
                          id="Siv4wU"
                          values={{ id: row.order.legacyId }}
                        />
                      </StyledLink>
                    </DataListItemValue>
                  </DataListItem>
                )}
              </DataList>
              <hr className="my-4 border-gray-200" />
              <p className="text-sm font-bold text-gray-600">
                <FormattedMessage defaultMessage="Raw values" id="gWz5pY" />
              </p>
              <ul className="mt-2 list-inside list-disc text-sm">
                <li>
                  <strong>
                    <FormattedMessage id="Fields.amount" defaultMessage="Amount" />
                  </strong>
                  :{' '}
                  <FormattedMoneyAmount
                    amount={row.amount.valueInCents}
                    currency={row.amount.currency}
                    amountStyles={null}
                  />
                </li>
                <li>
                  <strong>
                    <FormattedMessage id="expense.incurredAt" defaultMessage="Date" />
                  </strong>
                  : <DateTime value={row.date} />
                </li>
                {Object.entries(row.rawValue as Record<string, string>)
                  .filter(entry => !isEmpty(entry[1]))
                  .map(([key, value], index) => (
                    // eslint-disable-next-line react/no-array-index-key
                    <li key={index}>
                      <strong>{startCase(key)}</strong>: {value.toString()}{' '}
                    </li>
                  ))}
              </ul>
            </SheetBody>
          </React.Fragment>
        )}
      </SheetContent>
    </Sheet>
  );
};
