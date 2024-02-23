import React from 'react';
import { useQuery } from '@apollo/client';
import { create, Mode } from '@transferwise/approve-api-action-helpers';
import { FormattedMessage, useIntl } from 'react-intl';

import { addAuthTokenToHeader } from '../../../lib/api';
import { API_V2_CONTEXT, gql } from '../../../lib/graphql/helpers';
import type { Host } from '../../../lib/graphql/types/v2/graphql';
import { getWebsiteUrl } from '../../../lib/utils';

import ConfirmationModal from '../../ConfirmationModal';
import { I18nSupportLink } from '../../I18nFormatters';
import Loading from '../../Loading';
import StyledButton from '../../StyledButton';
import { useToast } from '../../ui/useToast';

const scheduledExpensesQuery = gql`
  query ExpensesScheduledForPayment($hostSlug: String!) {
    expenses(host: { slug: $hostSlug }, status: SCHEDULED_FOR_PAYMENT, payoutMethodType: BANK_ACCOUNT) {
      totalCount
      nodes {
        id
      }
    }
  }
`;

type PayExpensesScheduledForPaymentButtonProps = {
  className?: string;
  host: Pick<Host, 'id' | 'transferwise' | 'slug'>;
  onSubmit?: () => void;
};

export default function PayExpensesScheduledForPaymentButton(props: PayExpensesScheduledForPaymentButtonProps) {
  const { toast } = useToast();
  const intl = useIntl();
  const [showConfirmationModal, setConfirmationModalDisplay] = React.useState(false);

  const scheduledExpenses = useQuery(scheduledExpensesQuery, {
    context: API_V2_CONTEXT,
    variables: {
      hostSlug: props.host.slug,
    },
    skip: !showConfirmationModal,
  });

  const request = create({ mode: process.env.WISE_ENVIRONMENT === 'production' ? Mode.PRODUCTION : Mode.SANDBOX });
  const handlePayBatch = async () => {
    const expenseIds = scheduledExpenses.data.expenses.nodes.map(e => e.id);
    try {
      await request(`${getWebsiteUrl()}/api/services/transferwise/pay-batch`, {
        method: 'POST',
        body: JSON.stringify({ expenseIds, hostId: props.host.id }),
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
      props.onSubmit?.();
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
        />
      )}
    </React.Fragment>
  );
}
