import React from 'react';
import PropTypes from 'prop-types';
import { FormattedMessage } from 'react-intl';

import { Box, Flex } from '../../components/Grid';
import MessageBox from '../../components/MessageBox';
import StyledButton from '../../components/StyledButton';
import { H4, P } from '../../components/Text';

const ExpenseMissingReceiptNotificationBanner = props => {
  return (
    <MessageBox py={3} px="26px" mb={4} type="warning">
      <Flex>
        <Flex ml={[0, 2]} flexDirection="column">
          <H4 mb="10px" fontWeight="500">
            <FormattedMessage id="AttachReceipt" defaultMessage="Attach missing receipt" />
          </H4>
          <P lineHeight="20px">
            <FormattedMessage
              id="AttachReceiptInstructions"
              defaultMessage="This charge was automatically created from your credit card transactions and is missing its receipt photograph and description. Please edit this expense and add the missing information."
            />
          </P>
          <Box mt="10px">
            <StyledButton buttonSize="tiny" mr={1} onClick={props.onEdit}>
              <FormattedMessage id="Expense.edit" defaultMessage="Edit expense" />
            </StyledButton>
          </Box>
        </Flex>
      </Flex>
    </MessageBox>
  );
};

ExpenseMissingReceiptNotificationBanner.propTypes = {
  onEdit: PropTypes.func.isRequired,
};

export default ExpenseMissingReceiptNotificationBanner;
