import React from 'react';
import { gql, useMutation } from '@apollo/client';
import { useIntl } from 'react-intl';

import { i18nGraphqlException } from '../../lib/errors';
import { API_V2_CONTEXT } from '../../lib/graphql/helpers';

import CollectivePickerAsync from '../CollectivePickerAsync';
import ConfirmationModal from '../ConfirmationModal';
import { Flex } from '../Grid';
import StyledButton from '../StyledButton';
import StyledCheckbox from '../StyledCheckbox';
import StyledInputField from '../StyledInputField';
import { P } from '../Text';
import { useToast } from '../ui/useToast';

import BanAccountsSummary from './BanAccountsSummary';

export const banAccountsMutation = gql`
  mutation BanAccounts($account: [AccountReferenceInput!]!, $dryRun: Boolean!, $includeAssociatedAccounts: Boolean!) {
    banAccount(account: $account, includeAssociatedAccounts: $includeAssociatedAccounts, dryRun: $dryRun) {
      isAllowed
      message
      accounts {
        id
        slug
        name
        type
        ... on AccountWithParent {
          parent {
            id
            slug
            type
          }
        }
      }
    }
  }
`;

const BanAccount = () => {
  const [selectedAccountsOptions, setSelectedAccountsOptions] = React.useState([]);
  const [includeAssociatedAccounts, setIncludeAssociatedAccounts] = React.useState(true);
  const [dryRunData, setDryRunData] = React.useState(null);
  const [_banAccounts, { loading }] = useMutation(banAccountsMutation, { context: API_V2_CONTEXT });
  const { toast } = useToast();
  const intl = useIntl();
  const isValid = Boolean(selectedAccountsOptions?.length);
  const banAccounts = (dryRun = true) =>
    _banAccounts({
      variables: {
        account: selectedAccountsOptions.map(a => ({ legacyId: a.value.id })),
        includeAssociatedAccounts,
        dryRun,
      },
    });

  return (
    <div>
      <StyledInputField htmlFor="ban-accounts-picker" label="Account" flex="1 1">
        {({ id }) => (
          <CollectivePickerAsync
            inputId={id}
            onChange={setSelectedAccountsOptions}
            isMulti
            skipGuests={false}
            includeArchived
          />
        )}
      </StyledInputField>

      <Flex flexWrap="wrap" px={1} mt={2}>
        <StyledCheckbox
          name="associated-accounts"
          label="Include all associated accounts"
          checked={includeAssociatedAccounts}
          onChange={({ checked }) => {
            setIncludeAssociatedAccounts(checked);
          }}
        />
      </Flex>

      <StyledButton
        mt={4}
        width="100%"
        buttonStyle="primary"
        disabled={!isValid}
        loading={loading}
        onClick={async () => {
          try {
            const result = await banAccounts(true);
            setDryRunData(result.data.banAccount);
          } catch (e) {
            toast({
              variant: 'error',
              message: i18nGraphqlException(intl, e),
            });
          }
        }}
      >
        Analyze
      </StyledButton>
      {dryRunData && (
        <ConfirmationModal
          isDanger
          continueLabel="Ban accounts"
          header="Ban accounts"
          onClose={() => setDryRunData(null)}
          disableSubmit={!dryRunData.isAllowed}
          continueHandler={async () => {
            try {
              const result = await banAccounts(false);
              setDryRunData(null);
              toast({
                variant: 'success',
                title: `Successfully banned ${result.data.banAccount.accounts.length} accounts`,
                message: <P whiteSpace="pre-wrap">{result.data.banAccount.message}</P>,
              });
            } catch (e) {
              toast({
                variant: 'error',
                message: i18nGraphqlException(intl, e),
              });
            }
          }}
        >
          <BanAccountsSummary dryRunData={dryRunData} />
        </ConfirmationModal>
      )}
    </div>
  );
};

export default BanAccount;
