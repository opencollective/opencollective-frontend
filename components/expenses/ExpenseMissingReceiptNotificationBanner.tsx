import React from 'react';
import { FormattedMessage, useIntl } from 'react-intl';

import MessageBox from '../MessageBox';
import { Button } from '../ui/Button';

import EditExpenseDialog from './EditExpenseDialog';

const ExpenseMissingReceiptNotificationBanner = props => {
  const intl = useIntl();
  const { canAttachReceipts } = props.expense?.permissions || {};

  return (
    <MessageBox py={3} px="26px" mb={4} type="warning">
      <div className="flex">
        <div className="ml-0 flex flex-col sm:ml-2">
          <h4 className="mb-2">
            <FormattedMessage id="AttachReceipt" defaultMessage="Submit receipt" />
          </h4>
          <p className="text-sm leading-5 tracking-tight">
            <FormattedMessage
              id="AttachReceiptInstructions"
              defaultMessage="This expense was automatically created by charging a linked credit card. To complete the process, add a description and upload the receipt. All charges must have receipts."
            />
          </p>
          {canAttachReceipts && (
            <div className="mt-2">
              <EditExpenseDialog
                expense={props.expense}
                field="attachReceipts"
                dialogContentClassName="sm:max-w-2xl"
                title={intl.formatMessage({ defaultMessage: 'Attach receipts', id: 'Expense.attachReceipts' })}
                showTriggerTooltip={false} /** Not needed here, the button is explicit */
                trigger={
                  <Button size="xs" variant="outline">
                    <FormattedMessage id="Expense.attachReceipts" defaultMessage="Attach receipts" />
                  </Button>
                }
              />
            </div>
          )}
        </div>
      </div>
    </MessageBox>
  );
};

export default ExpenseMissingReceiptNotificationBanner;
