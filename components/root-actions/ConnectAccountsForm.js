import React from 'react';
import { useMutation } from '@apollo/client';
import { useIntl } from 'react-intl';

import { CollectiveType } from '../../lib/constants/collectives';
import { i18nGraphqlException } from '../../lib/errors';
import { API_V2_CONTEXT, gql } from '../../lib/graphql/helpers';

import CollectivePickerAsync from '../CollectivePickerAsync';
import { Flex } from '../Grid';
import LinkCollective from '../LinkCollective';
import StyledButton from '../StyledButton';
import StyledInputField from '../StyledInputField';
import { useToast } from '../ui/useToast';

const connectAccountsMutation = gql`
  mutation ConnectAccounts($memberAccount: AccountReferenceInput!, $account: AccountReferenceInput!) {
    createMember(memberAccount: $memberAccount, account: $account, role: CONNECTED_ACCOUNT) {
      id
    }
  }
`;

const CONNECTED_ACCOUNT_ACCEPTED_TYPES = [
  CollectiveType.COLLECTIVE,
  CollectiveType.EVENT,
  CollectiveType.ORGANIZATION,
  CollectiveType.PROJECT,
  CollectiveType.FUND,
];

const ConnectAccountsForm = () => {
  const [submitConnectAccounts, { loading }] = useMutation(connectAccountsMutation, { context: API_V2_CONTEXT });
  const [memberAccount, setMemberAccount] = React.useState(null);
  const [account, setAccount] = React.useState(null);
  const { toast } = useToast();
  const isValid = memberAccount && account;
  const intl = useIntl();
  const connectCTA = getConnectCTA(memberAccount, account);

  const connectAccounts = async () => {
    try {
      await submitConnectAccounts({
        variables: {
          memberAccount: { legacyId: memberAccount.id },
          account: { legacyId: account.id },
        },
      });

      toast({
        variant: 'success',
        message: (
          <React.Fragment>
            <LinkCollective collective={memberAccount} /> is now connected to <LinkCollective collective={account} />
          </React.Fragment>
        ),
      });

      // Reset the form
      setMemberAccount(null);
      setAccount(null);
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
        <StyledInputField htmlFor="connect-account-1" label="Make..." flex="1 1">
          {({ id }) => (
            <CollectivePickerAsync
              inputId={id}
              onChange={option => setMemberAccount(option?.value || null)}
              collective={memberAccount}
              types={CONNECTED_ACCOUNT_ACCEPTED_TYPES}
              isClearable
            />
          )}
        </StyledInputField>
      </Flex>
      <Flex alignItems="flex-end" mt={3}>
        <StyledInputField htmlFor="connect-account-2" label="...a connected account of" flex="1 1">
          {({ id }) => (
            <CollectivePickerAsync
              inputId={id}
              onChange={option => setAccount(option?.value || null)}
              filterResults={accounts => (!memberAccount ? accounts : accounts.filter(a => a.id !== memberAccount.id))}
              collective={account}
              types={CONNECTED_ACCOUNT_ACCEPTED_TYPES}
              isClearable
            />
          )}
        </StyledInputField>
      </Flex>
      <StyledButton
        mt={4}
        width="100%"
        buttonStyle="primary"
        disabled={!isValid}
        loading={loading}
        onClick={() => connectAccounts()}
      >
        {connectCTA}
      </StyledButton>
    </div>
  );
};

const getConnectCTA = (fromAccount, toAccount) => {
  if (!fromAccount || !toAccount) {
    return 'Connect';
  } else {
    return `Connect @${fromAccount.slug} to @${toAccount.slug}`;
  }
};

ConnectAccountsForm.propTypes = {};

export default ConnectAccountsForm;
