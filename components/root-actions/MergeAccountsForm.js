import React from 'react';
import { useMutation } from '@apollo/client';
import { useIntl } from 'react-intl';

import { i18nGraphqlException } from '../../lib/errors';
import { API_V2_CONTEXT, gql } from '../../lib/graphql/helpers';

import CollectivePickerAsync from '../CollectivePickerAsync';
import ConfirmationModal from '../ConfirmationModal';
import { Flex } from '../Grid';
import StyledButton from '../StyledButton';
import StyledInputField from '../StyledInputField';
import { P } from '../Text';
import { useToast } from '../ui/useToast';

const mergeAccountsMutation = gql`
  mutation MergeAccounts($fromAccount: AccountReferenceInput!, $toAccount: AccountReferenceInput!, $dryRun: Boolean!) {
    mergeAccounts(fromAccount: $fromAccount, toAccount: $toAccount, dryRun: $dryRun) {
      message
      account {
        id
        name
        slug
        isIncognito
        ... on Individual {
          isGuest
        }
      }
    }
  }
`;

const MergeAccountsForm = () => {
  const [submitMergeAccounts, { loading }] = useMutation(mergeAccountsMutation, { context: API_V2_CONTEXT });
  const [mergeSummary, setMergeSummary] = React.useState(false);
  const [fromAccount, setFromAccount] = React.useState(null);
  const [toAccount, setToAccount] = React.useState(null);
  const { toast } = useToast();
  const isValid = fromAccount && toAccount;
  const intl = useIntl();
  const mergeCTA = getMergeCTA(fromAccount, toAccount);

  const mergeAccounts = async (dryRun = true) => {
    try {
      const result = await submitMergeAccounts({
        variables: {
          dryRun,
          fromAccount: { legacyId: fromAccount.id },
          toAccount: { legacyId: toAccount.id },
        },
      });

      const resultMessage = result.data.mergeAccounts.message;
      if (dryRun) {
        setMergeSummary(resultMessage);
      } else {
        const successMessage = `@${fromAccount.slug} has been merged into @${toAccount.slug}`;
        toast({
          variant: 'success',
          message: !resultMessage ? successMessage : `${successMessage}\n${resultMessage}`,
        });

        // Reset the form
        setMergeSummary(null);
        setFromAccount(null);
        setToAccount(null);
      }
    } catch (e) {
      toast({
        variant: 'error',
        message: i18nGraphqlException(intl, e),
      });
    }
  };

  return (
    <div>
      <Flex alignItems="flex-end">
        <StyledInputField htmlFor="merge-account-1" label="Merge Account..." flex="1 1">
          {({ id }) => (
            <CollectivePickerAsync
              inputId={id}
              onChange={option => setFromAccount(option?.value || null)}
              collective={fromAccount}
              isClearable
              noCache // Don't cache to prevent showing merged collectives
              skipGuests={false}
            />
          )}
        </StyledInputField>
      </Flex>
      <Flex alignItems="flex-end" mt={3}>
        <StyledInputField htmlFor="merge-account-2" label="...into" flex="1 1">
          {({ id }) => (
            <CollectivePickerAsync
              inputId={id}
              onChange={option => setToAccount(option?.value || null)}
              filterResults={accounts => (!fromAccount ? accounts : accounts.filter(a => a.id !== fromAccount.id))}
              collective={toAccount}
              types={fromAccount ? [fromAccount.type] : undefined}
              isClearable
              noCache // Don't cache to prevent showing merged collectives
              skipGuests={false}
            />
          )}
        </StyledInputField>
      </Flex>
      <StyledButton
        mt={4}
        width="100%"
        buttonStyle="danger"
        disabled={!isValid}
        loading={loading}
        onClick={() => mergeAccounts(true)}
      >
        {mergeCTA}
      </StyledButton>
      {mergeSummary && (
        <ConfirmationModal
          isDanger
          continueLabel="Merge profiles"
          header={mergeCTA}
          continueHandler={() => mergeAccounts(false)}
          onClose={() => setMergeSummary(false)}
        >
          <P whiteSpace="pre-wrap" lineHeight="24px">
            {mergeSummary}
          </P>
        </ConfirmationModal>
      )}
    </div>
  );
};

const getMergeCTA = (fromAccount, toAccount) => {
  if (!fromAccount || !toAccount) {
    return 'Merge';
  } else {
    return `Merge @${fromAccount.slug} into @${toAccount.slug}`;
  }
};

MergeAccountsForm.propTypes = {};

export default MergeAccountsForm;
