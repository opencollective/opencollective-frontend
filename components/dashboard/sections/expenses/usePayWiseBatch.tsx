import React from 'react';
import { create, Mode } from '@transferwise/approve-api-action-helpers';
import { FormattedMessage, useIntl } from 'react-intl';

import { addAuthTokenToHeader } from '../../../../lib/api';
import { ERROR } from '../../../../lib/errors';
import { TwoFactorAuthenticationHeader } from '../../../../lib/two-factor-authentication';
import { useTwoFactorAuthenticationPrompt } from '../../../../lib/two-factor-authentication/TwoFactorAuthenticationContext';
import { getWebsiteUrl } from '../../../../lib/utils';

import { I18nSupportLink } from '../../../I18nFormatters';
import { useToast } from '../../../ui/useToast';

type PayBatchErrorBody = {
  message?: string;
  supportedMethods?: string[];
  authenticationOptions?: Record<string, unknown>;
};

/**
 * Reads the body of a failed `pay-batch` request once: the API answers with JSON for 2FA errors and plain text
 * otherwise.
 */
const getErrorResponseBody = async (error): Promise<PayBatchErrorBody | null> => {
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

/**
 * Pays a batch of Wise expenses scheduled for payment. The API runs the host's payout 2FA check first: when it asks
 * for a code, the 2FA prompt opens and the request is sent again with it. Wise may then ask for its own approval,
 * which `@transferwise/approve-api-action-helpers` handles.
 *
 * @returns a function that resolves to true once the batch is paid. Errors are shown in a toast.
 */
export function usePayWiseBatch() {
  const { toast } = useToast();
  const intl = useIntl();
  const prompt2fa = useTwoFactorAuthenticationPrompt();

  return React.useCallback(
    async ({ expenseIds, hostId }: { expenseIds: string[]; hostId: string }): Promise<boolean> => {
      const request = create({
        mode: process.env.WISE_ENVIRONMENT === 'production' ? Mode.PRODUCTION : Mode.SANDBOX,
      });
      // The Wise helper sends the same headers again when the Wise approval is done, 2FA code included
      const payBatch = (headers = {}) =>
        request(`${getWebsiteUrl()}/api/services/transferwise/pay-batch`, {
          method: 'POST',
          body: JSON.stringify({ expenseIds, hostId }),
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
            return false; // The prompt is already open
          }

          await payBatch({ [TwoFactorAuthenticationHeader]: `${result.type} ${result.code}` });
        }

        toast({
          variant: 'success',
          message: (
            <FormattedMessage
              id="expenses.scheduled.paybatch.success"
              defaultMessage="Expenses paid! They're now being processed by Wise."
            />
          ),
        });
        return true;
      } catch (e) {
        if (e?.type === ERROR.TWO_FACTOR_AUTH_CANCELED) {
          return false;
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
        return false;
      }
    },
    [intl, prompt2fa, toast],
  );
}
