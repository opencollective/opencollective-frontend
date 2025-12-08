import React from 'react';
import { FormattedMessage, useIntl } from 'react-intl';

import { Flex } from '../../components/Grid';
import MessageBox from '../../components/MessageBox';
import StyledButton from '../../components/StyledButton';
import { H4, P } from '../../components/Text';

import { Button } from '../ui/Button';

import EditExpenseDialog from './EditExpenseDialog';

const ExpenseMissingReceiptNotificationBanner = props => {
  const intl = useIntl();
  const { canAttachReceipts } = props.expense?.permissions || {};

  return (
    <MessageBox py={3} px="26px" mb={4} type="warning">
      <Flex>
        <Flex ml={[0, 2]} flexDirection="column">
          <H4 mb="10px" fontWeight="500">
            <FormattedMessage id="AttachReceipt" defaultMessage="Submit receipt" />
          </H4>
          <P lineHeight="20px">
            <FormattedMessage
              id="AttachReceiptInstructions"
              defaultMessage="This expense was automatically created by charging a linked credit card. To complete the process, add a description and upload the receipt. All charges must have receipts."
            />
          </P>
          <div className="mt-2.5">
            {canAttachReceipts ? (
              <EditExpenseDialog
                expense={props.expense}
                field="attachReceipts"
                dialogContentClassName="sm:max-w-2xl"
                title={intl.formatMessage({ defaultMessage: 'Attach receipts', id: 'Expense.attachReceipts' })}
                trigger={
                  <Button size="xs" variant="outline">
                    <FormattedMessage id="Expense.attachReceipts" defaultMessage="Attach receipts" />
                  </Button>
                }
              />
            ) : (
              props.onEdit && (
                <StyledButton buttonSize="tiny" mr={1} onClick={props.onEdit}>
                  <FormattedMessage id="Expense.edit" defaultMessage="Edit expense" />
                </StyledButton>
              )
            )}
          </div>
        </Flex>
      </Flex>
    </MessageBox>
  );
};

export default ExpenseMissingReceiptNotificationBanner;
