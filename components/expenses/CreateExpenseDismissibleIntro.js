import React from 'react';
import PropTypes from 'prop-types';
import { FormattedMessage } from 'react-intl';

import { HELP_MESSAGE } from '../../lib/constants/dismissable-help-message';

import DismissibleMessage from '../DismissibleMessage';
import MessageBox from '../MessageBox';
import StyledButton from '../StyledButton';
import { P } from '../Text';

const CreateExpenseDismissibleIntro = ({ collectiveName }) => {
  return (
    <DismissibleMessage messageId={HELP_MESSAGE.EXPENSE_CREATE_INFO}>
      {({ dismiss }) => (
        <MessageBox type="info" mb={4} px={0} py={3}>
          <P fontSize="Caption" lineHeight="Paragraph" color="black.800" px={24} data-cy="expense-create-help">
            <FormattedMessage
              id="CreateExpense.HelpCreateInfo"
              defaultMessage="Request payment from {collective} for work you’ve done or to be reimbursed for purchases. Expenses will be processed for payment once approved by a Collective admin. Only the amount and description are public in the Collective’s transparent budget—attachments, payment details, and other personal info is kept private."
              values={{ collective: <strong>{collectiveName}</strong> }}
            />
          </P>
          <StyledButton
            asLink
            onClick={dismiss}
            fontSize="Caption"
            data-cy="dismiss-expense-create-help"
            color="blue.600"
            buttonSize="tiny"
            ml={10}
            mt={2}
          >
            <FormattedMessage id="DismissableHelp.DontShowAgain" defaultMessage="Ok, don’t show me again" />
          </StyledButton>
        </MessageBox>
      )}
    </DismissibleMessage>
  );
};

CreateExpenseDismissibleIntro.propTypes = {
  collectiveName: PropTypes.string.isRequired,
};

export default CreateExpenseDismissibleIntro;
