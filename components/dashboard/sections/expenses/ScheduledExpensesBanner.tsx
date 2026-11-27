import React from 'react';
import { useQuery } from '@apollo/client';
import { FormattedMessage } from 'react-intl';

import { formatCurrency } from '../../../../lib/currency-utils';
import { gql } from '../../../../lib/graphql/helpers';

import ConfirmationModal from '../../../ConfirmationModal';
import { Box } from '../../../Grid';
import TransferwiseIcon from '../../../icons/TransferwiseIcon';
import MessageBox from '../../../MessageBox';
import StyledButton from '../../../StyledButton';

import { usePayWiseBatch } from './usePayWiseBatch';

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

interface ScheduledExpensesBannerProps {
  hostSlug: string;
  onSubmit?(...args: unknown[]): unknown;
  secondButton?: React.ReactNode;
}

const ScheduledExpensesBanner = ({ hostSlug, onSubmit, secondButton }: ScheduledExpensesBannerProps) => {
  const scheduledExpenses = useQuery(scheduledExpensesQuery, {
    variables: getScheduledExpensesQueryVariables(hostSlug),
  });

  const payWiseBatch = usePayWiseBatch();
  const [showConfirmationModal, setConfirmationModalDisplay] = React.useState(false);

  const hasScheduledExpenses = scheduledExpenses.data?.expenses?.totalCount > 0;
  const amountBatched = scheduledExpenses.data?.host?.transferwise?.amountBatched;
  if (!hasScheduledExpenses || !amountBatched) {
    return null;
  }

  const handlePayBatch = async () => {
    const expenseIds = scheduledExpenses.data.expenses.nodes.map(e => e.id);
    if (await payWiseBatch({ expenseIds, hostId: scheduledExpenses.data.host.id })) {
      setConfirmationModalDisplay(false);
      await scheduledExpenses.refetch();
      onSubmit?.();
    }
  };

  return (
    <React.Fragment>
      <MessageBox type="success">
        <div className="flex flex-col gap-2 align-baseline md:flex-row md:justify-between">
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
          <div className="flex justify-between gap-2">
            {secondButton}
            <StyledButton
              buttonSize="tiny"
              buttonStyle="successSecondary"
              onClick={() => setConfirmationModalDisplay(true)}
            >
              <FormattedMessage id="expenses.scheduled.paybatch" defaultMessage="Pay Batch" />
            </StyledButton>
          </div>
        </div>
      </MessageBox>
      {showConfirmationModal && (
        <ConfirmationModal
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
          overlayClassName="z-1000"
        />
      )}
    </React.Fragment>
  );
};

export default ScheduledExpensesBanner;
