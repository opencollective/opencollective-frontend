import React from 'react';
import { useQuery } from '@apollo/client';
import { FormattedMessage } from 'react-intl';

import { gql } from '../../../../lib/graphql/helpers';
import type { Host } from '../../../../lib/graphql/types/v2/graphql';

import ConfirmationModal from '../../../ConfirmationModal';
import Loading from '../../../Loading';
import StyledButton from '../../../StyledButton';

import { usePayWiseBatch } from './usePayWiseBatch';

const scheduledExpensesQuery = gql`
  query ExpensesScheduledForPayment($hostSlug: String!) {
    expenses(host: { slug: $hostSlug }, status: SCHEDULED_FOR_PAYMENT, payoutMethodType: BANK_ACCOUNT, limit: 100) {
      totalCount
      nodes {
        id
      }
    }
  }
`;

type PayExpensesScheduledForPaymentButtonProps = {
  className?: string;
  host: Pick<Host, 'id' | 'slug'>;
  onSubmit?: () => void;
};

export default function PayExpensesScheduledForPaymentButton(props: PayExpensesScheduledForPaymentButtonProps) {
  const payWiseBatch = usePayWiseBatch();
  const [showConfirmationModal, setConfirmationModalDisplay] = React.useState(false);

  const scheduledExpenses = useQuery(scheduledExpensesQuery, {
    variables: {
      hostSlug: props.host.slug,
    },
    skip: !showConfirmationModal,
  });

  const handlePayBatch = async () => {
    const expenseIds = scheduledExpenses.data.expenses.nodes.map(e => e.id);
    if (await payWiseBatch({ expenseIds, hostId: props.host.id })) {
      setConfirmationModalDisplay(false);
      props.onSubmit?.();
    }
  };
  return (
    <React.Fragment>
      <StyledButton
        className={props.className}
        buttonSize="tiny"
        buttonStyle="successSecondary"
        onClick={() => setConfirmationModalDisplay(true)}
      >
        <FormattedMessage id="expenses.scheduled.paybatch" defaultMessage="Pay Batch" />
      </StyledButton>
      {showConfirmationModal && (
        <ConfirmationModal
          header={<FormattedMessage id="expenses.scheduled.confirmation.title" defaultMessage="Pay Expenses Batch" />}
          disableSubmit={!scheduledExpenses?.data?.expenses}
          body={
            !scheduledExpenses.called || scheduledExpenses.loading ? (
              <Loading />
            ) : (
              <FormattedMessage
                id="expenses.scheduled.confirmation.body"
                defaultMessage="Are you sure you want to batch and pay {count, plural, one {# expense} other {# expenses}} scheduled for payment?"
                values={{ count: scheduledExpenses?.data?.expenses?.totalCount }}
              />
            )
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
}
