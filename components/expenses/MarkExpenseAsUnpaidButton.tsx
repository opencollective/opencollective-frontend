import React from 'react';
import { FormattedMessage } from 'react-intl';

import type { Expense } from '../../lib/graphql/types/v2/schema';

import { Button } from '../ui/Button';

import MarkExpenseAsUnpaidModal from './MarkExpenseAsUnpaidModal';

type MarkExpenseAsUnpaidButtonProps = {
  expense: Pick<Expense, 'id' | 'legacyId' | 'type'>;
};

const MarkExpenseAsUnpaidButton = ({ expense, ...props }: MarkExpenseAsUnpaidButtonProps) => {
  const [open, setOpen] = React.useState(false);

  return (
    <React.Fragment>
      <Button {...props} variant="outlineDestructive" onClick={() => setOpen(true)}>
        <FormattedMessage id="expense.markAsUnpaid.btn" defaultMessage="Mark as unpaid" />
      </Button>
      <MarkExpenseAsUnpaidModal expense={expense} open={open} setOpen={setOpen} />
    </React.Fragment>
  );
};

export default MarkExpenseAsUnpaidButton;
