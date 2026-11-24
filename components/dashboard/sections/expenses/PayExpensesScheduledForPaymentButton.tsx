import React from 'react';
import { useQuery } from '@apollo/client';
import { create, Mode } from '@transferwise/approve-api-action-helpers';
import { FormattedMessage, useIntl } from 'react-intl';

import { addAuthTokenToHeader } from '../../../../lib/api';
import { ERROR } from '../../../../lib/errors';
import { gql } from '../../../../lib/graphql/helpers';
import type { Host } from '../../../../lib/graphql/types/v2/graphql';
import { TwoFactorAuthenticationHeader } from '../../../../lib/two-factor-authentication';
import { useTwoFactorAuthenticationPrompt } from '../../../../lib/two-factor-authentication/TwoFactorAuthenticationContext';
import { getWebsiteUrl } from '../../../../lib/utils';

import ConfirmationModal from '../../../ConfirmationModal';
import { I18nSupportLink } from '../../../I18nFormatters';
import Loading from '../../../Loading';
import StyledButton from '../../../StyledButton';
import { useToast } from '../../../ui/useToast';

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

/**
 * Reads the body of a failed `pay-batch` request once: the API answers with JSON for 2FA errors and plain text
 * otherwise.
 */
const getErrorResponseBody = async (
  error,
): Promise<{
  message?: string;
  supportedMethods?: string[];
  authenticationOptions?: Record<string, unknown>;
} | null> => {
  if (!error?.response) {
    return null;
  } else if (!error.responseBody) {
    const text = await error.response.text();
    try {
      error.responseBody = JSON.parse(text);
    } catch {
      error.responseBody = { message: text };
    }
  }

  return error.responseBody;
};

type PayExpensesScheduledForPaymentButtonProps = {
  className?: string;
  host: Pick<Host, 'id' | 'slug'>;
  onSubmit?: () => void;
};

export default function PayExpensesScheduledForPaymentButton(props: PayExpensesScheduledForPaymentButtonProps) {
  const { toast } = useToast();
  const intl = useIntl();
  const prompt2fa = useTwoFactorAuthenticationPrompt();
  const [showConfirmationModal, setConfirmationModalDisplay] = React.useState(false);

  const scheduledExpenses = useQuery(scheduledExpensesQuery, {
    variables: {
      hostSlug: props.host.slug,
    },
    skip: !showConfirmationModal,
  });

  const request = create({ mode: process.env.WISE_ENVIRONMENT === 'production' ? Mode.PRODUCTION : Mode.SANDBOX });
  const handlePayBatch = async () => {
    const expenseIds = scheduledExpenses.data.expenses.nodes.map(e => e.id);
    // The Wise helper sends the same headers again when the Wise approval is done, 2FA code included
    const payBatch = (headers = {}) =>
      request(`${getWebsiteUrl()}/api/services/transferwise/pay-batch`, {
        method: 'POST',
        body: JSON.stringify({ expenseIds, hostId: props.host.id }),
        headers: { ...addAuthTokenToHeader(), ...headers },
      });

    try {
      try {
        await payBatch();
      } catch (e) {
        // Paying a batch goes through the host's payout 2FA: prompt for a code and retry
        const responseBody = await getErrorResponseBody(e);
        if (e?.response?.status !== 401 || responseBody?.message !== 'Two-factor authentication required') {
          throw e;
        }

        const result = await prompt2fa.open({
          supportedMethods: responseBody.supportedMethods,
          authenticationOptions: responseBody.authenticationOptions,
        });
        if (!result) {
          return; // The prompt is already open
        }

        await payBatch({ [TwoFactorAuthenticationHeader]: `${result.type} ${result.code}` });
      }

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
      if (e?.type === ERROR.TWO_FACTOR_AUTH_CANCELED) {
        return;
      }

      const responseBody = await getErrorResponseBody(e);
      const message = responseBody?.message
        ? responseBody.message
        : intl.formatMessage(
            {
              defaultMessage:
                'There was an error trying to process this batch, please <SupportLink>contact support</SupportLink>',
              id: 'MEB9ET',
            },
            { SupportLink: I18nSupportLink },
          );

      toast({
        variant: 'error',
        title: intl.formatMessage({ defaultMessage: 'Batch payment failed', id: 'HYFu3j' }),
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
          overlayClassName="z-1000"
        />
      )}
    </React.Fragment>
  );
}
