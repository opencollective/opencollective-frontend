import React from 'react';
import { some } from 'lodash';
import { FormattedMessage } from 'react-intl';

import { compareItemOCRValues } from './lib/ocr';

import MessageBox from '../MessageBox';
import { Checkbox } from '../ui/Checkbox';

import type { ExpenseItemFormValues } from './types/FormValues';

export const ConfirmOCRValues = ({
  onConfirm,
  items,
  currency,
}: {
  onConfirm: (boolean) => void;
  items: ExpenseItemFormValues[];
  currency: string;
}) => {
  const hasMismatches = React.useMemo(() => {
    return items.some(item => some(compareItemOCRValues(item), { hasMismatch: true }));
  }, [items, currency]);

  return (
    <MessageBox type={hasMismatches ? 'warning' : 'info'}>
      <div className="flex items-center">
        <Checkbox id="confirm-expense-ocr-values" onCheckedChange={onConfirm} />
        <label htmlFor="confirm-expense-ocr-values" className="ml-2 text-xs font-medium leading-none">
          <FormattedMessage defaultMessage="I have confirmed the date and amount." />
        </label>
      </div>
    </MessageBox>
  );
};
