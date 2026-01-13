import React, { Fragment } from 'react';
import { useMutation, useQuery } from '@apollo/client';
import { Add } from '@styled-icons/material/Add';
import { findLast, get, omit } from 'lodash';
import { Edit, X } from 'lucide-react';
import { FormattedMessage, injectIntl } from 'react-intl';

import { BANK_TRANSFER_DEFAULT_INSTRUCTIONS, PayoutMethodType } from '../../../lib/constants/payout-method';
import { gql } from '../../../lib/graphql/helpers';
import { formatManualInstructions } from '../../../lib/payment-method-utils';

import ConfirmationModal from '../../ConfirmationModal';
import { Box, Flex } from '../../Grid';
import Loading from '../../Loading';
import { P } from '../../Text';
import { Button } from '../../ui/Button';
import { EditCustomBankPaymentMethodDialog } from './receive-money/EditCustomBankPaymentMethodDialog';
import { formatAccountDetails } from '../utils';

import SettingsSectionTitle from './SettingsSectionTitle';

const hostQuery = gql`
  query EditCollectiveBankTransferHost($slug: String) {
    host(slug: $slug) {
      id
      slug
      legacyId
      currency
      settings
      connectedAccounts {
        id
        service
      }
      plan {
        id
        hostedCollectives
        manualPayments
        name
      }
      payoutMethods {
        id
        name
        data
        type
      }
    }
  }
`;

const removePayoutMethodMutation = gql`
  mutation EditCollectiveBankTransferRemovePayoutMethod($payoutMethodId: String!) {
    removePayoutMethod(payoutMethodId: $payoutMethodId) {
      id
    }
  }
`;

const editBankTransferMutation = gql`
  mutation EditCollectiveBankTransfer($account: AccountReferenceInput!, $key: AccountSettingsKey!, $value: JSON!) {
    editAccountSetting(account: $account, key: $key, value: $value) {
      id
      settings
    }
  }
`;

const renderBankInstructions = (instructions, bankAccountInfo) => {
  const formattedValues = {
    account: bankAccountInfo ? formatAccountDetails(bankAccountInfo) : '',
    reference: '76400',
    OrderId: '76400',
    amount: '30,00 USD',
    collective: 'acme',
  };

  return formatManualInstructions(instructions, formattedValues);
};

const BankTransfer = props => {
  const { loading, data } = useQuery(hostQuery, {
    variables: { slug: props.collectiveSlug },
  });
  const [removePayoutMethod] = useMutation(removePayoutMethodMutation);
  const [editBankTransfer] = useMutation(editBankTransferMutation);
  const [showDialog, setShowDialog] = React.useState(false);
  const [showRemoveBankConfirmationModal, setShowRemoveBankConfirmationModal] = React.useState(false);

  if (loading) {
    return <Loading />;
  }

  const existingPayoutMethod = data.host.payoutMethods.find(pm => pm.data.isManualBankTransfer);
  const existingManualPaymentMethod = !!get(data.host, 'settings.paymentMethods.manual') && existingPayoutMethod;
  const instructions = data.host.settings?.paymentMethods?.manual?.instructions || BANK_TRANSFER_DEFAULT_INSTRUCTIONS;

  const latestBankAccount = findLast(
    data.host?.payoutMethods,
    payoutMethod => payoutMethod.type === PayoutMethodType.BANK_ACCOUNT,
  );

  const handleDialogSuccess = () => {
    // Refetch query is handled by the dialog
    props.hideTopsection?.(false);
  };

  return (
    <Flex className="EditPaymentMethods" flexDirection="column">
      {data.host && (
        <Fragment>
          {!props.hideTitle && (
            <SettingsSectionTitle>
              <FormattedMessage id="editCollective.receivingMoney.bankTransfers" defaultMessage="Bank Transfers" />
            </SettingsSectionTitle>
          )}

          <Box>
            <p className="text-sm text-gray-700">
              {data.host.plan.manualPayments ? (
                <FormattedMessage
                  id="paymentMethods.manual.add.info"
                  defaultMessage="Define instructions for contributions via bank transfer. When funds arrive, you can mark them as confirmed to credit the budget balance."
                />
              ) : (
                <FormattedMessage
                  id="paymentMethods.manual.upgradePlan"
                  defaultMessage="Subscribe to our special plans for hosts"
                />
              )}
            </p>
          </Box>
          {existingManualPaymentMethod && (
            <Box pt={2}>
              <p className="mb-2 text-sm font-bold">
                <FormattedMessage defaultMessage="Preview of bank transfer instructions" id="13qBPb" />
              </p>
              <pre className="rounded border bg-neutral-100 px-4 py-3 text-sm whitespace-pre-wrap">
                {renderBankInstructions(instructions, latestBankAccount?.data)}
              </pre>
            </Box>
          )}
          <div className="my-3 flex items-center gap-2">
            {existingManualPaymentMethod && (
              <Button
                size="sm"
                variant="outline"
                disabled={!data.host.plan.manualPayments}
                onClick={() => {
                  setShowRemoveBankConfirmationModal(true);
                }}
              >
                <X size={12} className="mr-1" />
                <FormattedMessage defaultMessage="Remove bank details" id="D0TAWz" />
              </Button>
            )}
            <Button
              size="sm"
              variant="outline"
              disabled={!data.host.plan.manualPayments}
              onClick={() => {
                setShowDialog(true);
                props.hideTopsection?.(true);
              }}
            >
              {existingManualPaymentMethod ? (
                <Fragment>
                  <Edit size={12} className="mr-1" />
                  <FormattedMessage id="paymentMethods.manual.edit" defaultMessage="Edit bank details" />
                </Fragment>
              ) : (
                <Fragment>
                  <Add size="1em" />
                  {'  '}
                  <FormattedMessage id="paymentMethods.manual.add" defaultMessage="Set bank details" />
                </Fragment>
              )}
            </Button>
          </div>
        </Fragment>
      )}
      <EditCustomBankPaymentMethodDialog
        open={showDialog}
        onClose={() => {
          setShowDialog(false);
          props.hideTopsection?.(false);
        }}
        collectiveSlug={props.collectiveSlug}
        host={data.host}
        onSuccess={handleDialogSuccess}
      />
      {showRemoveBankConfirmationModal && (
        <ConfirmationModal
          width="100%"
          maxWidth="570px"
          onClose={() => {
            setShowRemoveBankConfirmationModal(false);
          }}
          header={<FormattedMessage defaultMessage="Remove Bank Account" id="GW8+0X" />}
          continueHandler={async () => {
            const paymentMethods = get(data.host, 'settings.paymentMethods');
            const modifiedPaymentMethods = omit(paymentMethods, 'manual');
            if (latestBankAccount) {
              await removePayoutMethod({
                variables: {
                  payoutMethodId: latestBankAccount.id,
                },
              });
            }
            await editBankTransfer({
              variables: {
                key: 'paymentMethods',
                value: modifiedPaymentMethods,
                account: { slug: props.collectiveSlug },
              },
              refetchQueries: [{ query: hostQuery, variables: { slug: props.collectiveSlug } }],
              awaitRefetchQueries: true,
            });
            setShowRemoveBankConfirmationModal(false);
          }}
        >
          <P fontSize="14px" lineHeight="18px" mt={2}>
            <FormattedMessage defaultMessage="Are you sure you want to remove bank account details?" id="kNxL0S" />
          </P>
        </ConfirmationModal>
      )}
    </Flex>
  );
};

export default injectIntl(BankTransfer);
