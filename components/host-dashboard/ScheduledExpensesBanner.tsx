import React from 'react';
import PropTypes from 'prop-types';
import { gql, useQuery } from '@apollo/client';
import { create, Mode } from '@transferwise/approve-api-action-helpers';
import { FormattedMessage, useIntl } from 'react-intl';

import { addAuthTokenToHeader } from '../../lib/api';
import { formatCurrency } from '../../lib/currency-utils';
import { API_V2_CONTEXT } from '../../lib/graphql/helpers';
import { getWebsiteUrl } from '../../lib/utils';

import ConfirmationModal from '../ConfirmationModal';
import { Box, Flex } from '../Grid';
import { I18nSupportLink } from '../I18nFormatters';
import TransferwiseIcon from '../icons/TransferwiseIcon';
import MessageBox from '../MessageBox';
import StyledButton from '../StyledButton';
import { useToast } from '../ui/useToast';

export const scheduledExpensesQuery = gql`
  query ScheduledExpensesBanner($hostSlug: String!, $limit: Int!, $payoutMethodType: PayoutMethodType) {
    host(slug: $hostSlug) {
      id
      currency
      transferwise {
        id
        amountBatched {
          valueInCents
          currency
        }
      }
    }
    expenses(
      host: { slug: $hostSlug }
      status: SCHEDULED_FOR_PAYMENT
      limit: $limit
      payoutMethodType: $payoutMethodType
    ) {
      totalCount
      offset
      limit
      nodes {
        id
      }
    }
  }
`;

export const getScheduledExpensesQueryVariables = hostSlug => ({
  hostSlug,
  limit: 100,
  payoutMethodType: 'BANK_ACCOUNT',
});

const ScheduledExpensesBanner = ({ hostSlug, onSubmit, secondButton }) => {
  const scheduledExpenses = useQuery(scheduledExpensesQuery, {
    variables: getScheduledExpensesQueryVariables(hostSlug),
    context: API_V2_CONTEXT,
  });

  const { toast } = useToast();
  const intl = useIntl();
  const [showConfirmationModal, setConfirmationModalDisplay] = React.useState(false);

  const hasScheduledExpenses = scheduledExpenses.data?.expenses?.totalCount > 0;
  const amountBatched = scheduledExpenses.data?.host?.transferwise?.amountBatched;
  if (!hasScheduledExpenses || !amountBatched) {
    return null;
  }

  const request = create({ mode: process.env.WISE_ENVIRONMENT === 'production' ? Mode.PRODUCTION : Mode.SANDBOX });
  const handlePayBatch = async () => {
    const expenseIds = scheduledExpenses.data.expenses.nodes.map(e => e.id);
    try {
      await request(`${getWebsiteUrl()}/api/services/transferwise/pay-batch`, {
        method: 'POST',
        body: JSON.stringify({ expenseIds, hostId: scheduledExpenses.data.host.id }),
        headers: addAuthTokenToHeader(),
      });
      setConfirmationModalDisplay(false);
      toast({
        variant: 'success',
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

      toast({
        variant: 'error',
        title: intl.formatMessage({ defaultMessage: 'Batch payment failed' }),
        message,
      });
    }
  };

  return (
    <React.Fragment>
      <MessageBox type="success">
        <Flex alignItems="baseline" flexDirection={['column', 'row']} gap="8px">
          <Box>
            <TransferwiseIcon size="1em" color="#25B869" mr={2} />
            <FormattedMessage
              id="expenses.scheduled.notification"
              defaultMessage="You have {count, plural, one {# expense} other {# expenses}} scheduled for payment that will require {amount} in balance."
              values={{
                count: scheduledExpenses.data.expenses.totalCount,
                amount: formatCurrency(amountBatched.valueInCents, amountBatched.currency),
              }}
            />
          </Box>
          <Flex gap="8px">
            {secondButton}
            <StyledButton
              buttonSize="tiny"
              buttonStyle="successSecondary"
              onClick={() => setConfirmationModalDisplay(true)}
            >
              <FormattedMessage id="expenses.scheduled.paybatch" defaultMessage="Pay Batch" />
            </StyledButton>
          </Flex>
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
  hostSlug: PropTypes.string.isRequired,
  onSubmit: PropTypes.func,
  secondButton: PropTypes.node,
};

export default ScheduledExpensesBanner;
