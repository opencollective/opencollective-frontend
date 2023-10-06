import React from 'react';
import { FormikProps } from 'formik';
import { get } from 'lodash';
import { FormattedMessage, useIntl } from 'react-intl';

import { filterParsableItems, splitExpenseItem } from './lib/ocr';

import ConfirmationModal from '../ConfirmationModal';
import FormattedMoneyAmount from '../FormattedMoneyAmount';

import { ExpenseFormValues } from './types/FormValues';

type SplitExpenseItemsModalProps = {
  form: FormikProps<ExpenseFormValues>;
  itemIdx: number;
  onClose: () => void;
};

export const SplitExpenseItemsModal = ({ form, itemIdx, onClose }: SplitExpenseItemsModalProps) => {
  const intl = useIntl();
  const item = get(form.values, `items[${itemIdx}]`);
  const items = filterParsableItems(item.__parsingResult?.items);
  return (
    <ConfirmationModal
      header={intl.formatMessage({ defaultMessage: 'Split expense item' })}
      onClose={onClose}
      continueHandler={() => {
        splitExpenseItem(form, itemIdx);
        onClose();
      }}
    >
      <p className="mb-2">
        <FormattedMessage
          defaultMessage="This will split {itemName} into {count} items:"
          values={{
            count: items.length,
            itemName: item.description
              ? `"${item.description}"`
              : intl.formatMessage({
                  defaultMessage: 'expense item',
                }),
          }}
        />
      </p>
      <ul className="list-inside list-disc pl-2">
        {items.map((item, idx) => (
          // eslint-disable-next-line react/no-array-index-key
          <li key={`item-${idx}`}>
            {item.description} (
            <FormattedMoneyAmount
              amount={item.amount.valueInCents}
              currency={item.amount.currency}
              amountStyles={null}
            />
            )
          </li>
        ))}
      </ul>
    </ConfirmationModal>
  );
};
