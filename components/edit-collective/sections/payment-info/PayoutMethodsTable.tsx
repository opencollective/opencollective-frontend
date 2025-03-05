import React from 'react';
import { useMutation } from '@apollo/client';
import { orderBy } from 'lodash';
import { FormattedMessage, useIntl } from 'react-intl';

import { i18nGraphqlException } from '../../../../lib/errors';
import { API_V2_CONTEXT, gql } from '../../../../lib/graphql/helpers';
import { PayoutMethodType } from '@/lib/constants/payout-method';

import { PayoutMethodRadioGroupItem } from '@/components/submit-expense/form/PayoutMethodSection';

import { useToast } from '../../../ui/useToast';

import { MethodCard, moreActionsThunk } from './common';
import { PayoutMethodFragment } from './gql';

export default function PayoutMethodsTable({ account, loading, onUpdate, ...props }) {
  const { toast } = useToast();
  const intl = useIntl();

  const [removePayoutMethod] = useMutation(
    gql`
      mutation PaymentInfoRemovePayoutMethod($payoutMethodId: String!) {
        removePayoutMethod(payoutMethodId: $payoutMethodId) {
          id
          ...PayoutMethodFields
        }
      }
      ${PayoutMethodFragment}
    `,
    {
      context: API_V2_CONTEXT,
    },
  );
  const [restorePayoutMethod] = useMutation(
    gql`
      mutation PaymentInfoRestorePayoutMethod($payoutMethod: PayoutMethodReferenceInput!) {
        restorePayoutMethod(payoutMethod: $payoutMethod) {
          id
          ...PayoutMethodFields
        }
      }
      ${PayoutMethodFragment}
    `,
    {
      context: API_V2_CONTEXT,
    },
  );

  const actions = React.useMemo(
    () => ({
      archive: async (payoutMethodId: string) => {
        try {
          await removePayoutMethod({ variables: { payoutMethodId } });
          toast({
            variant: 'success',
            message: intl.formatMessage({ defaultMessage: 'Payment method Archived', id: 'v6++yS' }),
          });
        } catch (error) {
          toast({ variant: 'error', message: i18nGraphqlException(intl, error) });
        }
      },
      restore: async (id: string) => {
        try {
          await restorePayoutMethod({ variables: { payoutMethod: { id } } });
          toast({
            variant: 'success',
            message: intl.formatMessage({ defaultMessage: 'Payment method Restored', id: '9/9dt8' }),
          });
        } catch (error) {
          toast({ variant: 'error', message: i18nGraphqlException(intl, error) });
        }
      },
    }),
    [account],
  );

  const [archived, active] = React.useMemo(() => {
    const { archived, active } = orderBy(props.payoutMethods, ['isSaved'], ['desc'])
      .filter(pm => pm.type !== PayoutMethodType.ACCOUNT_BALANCE)
      .reduce(
        (acc, pm) => {
          if (pm.isSaved) {
            acc.active.push(pm);
          } else {
            acc.archived.push(pm);
          }
          return acc;
        },
        { archived: [], active: [] },
      );
    return [archived, active];
  }, [props.payoutMethods]);

  const generateMoreActions = moreActionsThunk(account);

  return !loading && !props.payoutMethods?.length ? (
    <div className="flex flex-col items-center gap-2 py-6 text-center text-sm sm:p-12">
      <FormattedMessage
        defaultMessage="After you add a new payout information or submit an expense, you'll find your saved payout method(s) here."
        id="Z2/9Fy"
      />
    </div>
  ) : (
    <div className="flex flex-col gap-5">
      {active?.map(payoutMethod => (
        <PayoutMethodRadioGroupItem
          key={payoutMethod.id}
          payoutMethod={payoutMethod}
          payeeSlug={account.slug}
          payee={account}
          Component={MethodCard}
          onPaymentMethodDeleted={onUpdate}
          onPaymentMethodEdited={onUpdate}
          refresh={onUpdate}
          moreActions={generateMoreActions(payoutMethod)}
          isChecked
          isEditable
          disableWarningMessages
        />
      ))}
      {archived?.length > 0 && (
        <React.Fragment>
          <div className="mt-2">
            <h1>
              <FormattedMessage defaultMessage="Archived" id="0HT+Ib" />
            </h1>
            <p className="text-sm leading-none text-muted-foreground">
              <FormattedMessage
                defaultMessage="Account details that were previously used and can no longer be deleted."
                id="bqX7g3"
              />
            </p>
          </div>
          {archived?.map(payoutMethod => (
            <PayoutMethodRadioGroupItem
              key={payoutMethod.id}
              payoutMethod={payoutMethod}
              payeeSlug={account.slug}
              payee={account}
              Component={MethodCard}
              onPaymentMethodDeleted={onUpdate}
              onPaymentMethodEdited={onUpdate}
              refresh={onUpdate}
              onRestore={() => actions.restore(payoutMethod.id)}
              moreActions={generateMoreActions(payoutMethod)}
              isChecked
              isEditable
              archived
              disableWarningMessages
            />
          ))}
        </React.Fragment>
      )}
    </div>
  );
}
