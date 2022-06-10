import React from 'react';
import PropTypes from 'prop-types';
import { useQuery } from '@apollo/client';
import { create, Mode } from '@transferwise/approve-api-action-helpers';
import { FormattedMessage, useIntl } from 'react-intl';

import { addAuthTokenToHeader } from '../../lib/api';
import { API_V2_CONTEXT, gqlV2 } from '../../lib/graphql/helpers';

import ConfirmationModal from '../ConfirmationModal';
import { Box, Flex } from '../Grid';
import { I18nSupportLink } from '../I18nFormatters';
import TransferwiseIcon from '../icons/TransferwiseIcon';
import MessageBox from '../MessageBox';
import StyledButton from '../StyledButton';
import { TOAST_TYPE, useToasts } from '../ToastProvider';

const scheduledExpensesQuery = gqlV2/* GraphQL */ `
  query ScheduledExpensesBanner(
    $hostId: String!
    $limit: Int!
    $status: ExpenseStatusFilter
    $payoutMethodType: PayoutMethodType
  ) {
    expenses(host: { id: $hostId }, limit: $limit, status: $status, payoutMethodType: $payoutMethodType) {
      totalCount
      offset
      limit
      nodes {
        id
      }
    }
  }
`;

const ScheduledExpensesBanner = ({ host, onSubmit, secondButton, expenses }) => {
  const scheduledExpenses = useQuery(scheduledExpensesQuery, {
    variables: { hostId: host.id, limit: 100, status: 'SCHEDULED_FOR_PAYMENT', payoutMethodType: 'BANK_ACCOUNT' },
    context: API_V2_CONTEXT,
  });
  React.useEffect(() => {
    scheduledExpenses.refetch();
  }, [expenses]);
  const { addToast } = useToasts();
  const intl = useIntl();
  const [showConfirmationModal, setConfirmationModalDisplay] = React.useState(false);

  const hasScheduledExpenses = scheduledExpenses.data?.expenses?.totalCount > 0;
  if (!hasScheduledExpenses) {
    return null;
  }

  const request = create({ mode: process.env.WISE_ENVIRONMENT === 'production' ? Mode.PRODUCTION : Mode.SANDBOX });
  const handlePayBatch = async () => {
    const expenseIds = scheduledExpenses.data.expenses.nodes.map(e => e.id);
    try {
      await request(`${process.env.WEBSITE_URL}/api/services/transferwise/pay-batch`, {
        method: 'POST',
        body: JSON.stringify({ expenseIds, hostId: host.id }),
        headers: addAuthTokenToHeader(),
      });
      setConfirmationModalDisplay(false);
      addToast({
        type: TOAST_TYPE.SUCCESS,
        message: (
          <FormattedMessage
            id="expenses.scheduled.paybatch.success"
            defaultMessage="Expenses paid! They're now being processed by Wise."
          />
        ),
      });
      onSubmit?.();
    } catch (e) {
      const message = e?.response
        ? await e.response.text()
        : intl.formatMessage(
            {
              defaultMessage:
                'There was an error trying to process this batch, please <SupportLink>contact support</SupportLink>',
            },
            { SupportLink: I18nSupportLink },
          );

      addToast({
        type: TOAST_TYPE.ERROR,
        title: intl.formatMessage({ defaultMessage: 'Batch payment failed' }),
        message,
      });
    }
  };

  return (
    <React.Fragment>
      <MessageBox type="success" mb={4}>
        <Flex alignItems="center" justifyContent="space-between">
          <Box>
            <TransferwiseIcon size="1em" color="#25B869" mr={2} />
            <FormattedMessage
              id="expenses.scheduled.notification"
              defaultMessage="You have {count, plural, one {# expense} other {# expenses}} scheduled for payment."
              values={{ count: scheduledExpenses.data.expenses.totalCount }}
            />
          </Box>
          <Box>
            {secondButton}
            <StyledButton
              buttonSize="tiny"
              buttonStyle="successSecondary"
              onClick={() => setConfirmationModalDisplay(true)}
            >
              <FormattedMessage id="expenses.scheduled.paybatch" defaultMessage="Pay Batch" />
            </StyledButton>
          </Box>
        </Flex>
      </MessageBox>
      {showConfirmationModal && (
        <ConfirmationModal
          zindex={1000}
          header={<FormattedMessage id="expenses.scheduled.confirmation.title" defaultMessage="Pay Expenses Batch" />}
          body={
            <FormattedMessage
              id="expenses.scheduled.confirmation.body"
              defaultMessage="Are you sure you want to batch and pay {count, plural, one {# expense} other {# expenses}} scheduled for payment?"
              values={{ count: scheduledExpenses.data.expenses.totalCount }}
            />
          }
          onClose={() => setConfirmationModalDisplay(false)}
          continueLabel={
            <FormattedMessage
              id="expense.pay.btn"
              defaultMessage="Pay with {paymentMethod}"
              values={{ paymentMethod: 'Wise' }}
            />
          }
          continueHandler={handlePayBatch}
        />
      )}
    </React.Fragment>
  );
};

ScheduledExpensesBanner.propTypes = {
  host: PropTypes.shape({
    id: PropTypes.string,
  }).isRequired,
  expenses: PropTypes.array,
  onSubmit: PropTypes.func,
  secondButton: PropTypes.node,
};

export default ScheduledExpensesBanner;
