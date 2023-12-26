import React, { useEffect } from 'react';
import { useMutation } from '@apollo/client';
import { useIntl } from 'react-intl';

import { i18nGraphqlException } from '../../lib/errors';
import { API_V2_CONTEXT, gql } from '../../lib/graphql/helpers';

import CollectivePickerAsync from '../CollectivePickerAsync';
import Container from '../Container';
import { Box, Flex } from '../Grid';
import MessageBox from '../MessageBox';
import StyledButton from '../StyledButton';
import StyledCheckbox from '../StyledCheckbox';
import StyledInputField from '../StyledInputField';
import { useToast } from '../ui/useToast';

export const editAccountFlagsMutation = gql`
  mutation EditAccountFlags(
    $account: AccountReferenceInput!
    $isArchived: Boolean
    $isTrustedHost: Boolean
    $isTwoFactorAuthEnabled: Boolean
  ) {
    editAccountFlags(
      account: $account
      isArchived: $isArchived
      isTrustedHost: $isTrustedHost
      isTwoFactorAuthEnabled: $isTwoFactorAuthEnabled
    ) {
      id
      slug
    }
  }
`;

const AccountSettings = () => {
  const { toast } = useToast();
  const intl = useIntl();
  const [selectedAccountOption, setSelectedAccountOption] = React.useState([]);
  const [archivedFlag, setArchivedFlag] = React.useState();
  const [trustedHostFlag, setTrustedHostFlag] = React.useState();
  const [twoFactorEnabledFlag, setTwoFactorEnabledFlag] = React.useState();
  const [enableSave, setEnableSave] = React.useState(false);
  const [editAccountFlags, { loading }] = useMutation(editAccountFlagsMutation, { context: API_V2_CONTEXT });

  useEffect(() => {
    setArchivedFlag(selectedAccountOption?.value?.isArchived);
    setTrustedHostFlag(selectedAccountOption?.value?.isTrustedHost);
    setTwoFactorEnabledFlag(selectedAccountOption?.value?.isTwoFactorAuthEnabled);
  }, [selectedAccountOption]);

  return (
    <React.Fragment>
      <StyledInputField htmlFor="accounts-picker" label="Account" flex="1 1">
        {({ id }) => (
          <CollectivePickerAsync
            inputId={id}
            onChange={setSelectedAccountOption}
            includeDeleted={true}
            includeArchived={true}
            value={selectedAccountOption}
            noCache
          />
        )}
      </StyledInputField>

      {selectedAccountOption.length !== 0 && (
        <React.Fragment>
          <Container px={1} pt={3} pb={3}>
            <Box pb={2}>Flags</Box>
            <Flex flexWrap="wrap" px={1} mt={2}>
              <Box pr={4}>
                <StyledCheckbox
                  name="Archived"
                  label="Archived"
                  checked={archivedFlag}
                  onChange={({ checked }) => {
                    setEnableSave(true);
                    setArchivedFlag(checked);
                  }}
                />
              </Box>
              {selectedAccountOption?.value?.isHost && (
                <Box>
                  <StyledCheckbox
                    name="Trusted Host"
                    label="Trusted Host"
                    checked={trustedHostFlag}
                    onChange={({ checked }) => {
                      setEnableSave(true);
                      setTrustedHostFlag(checked);
                    }}
                  />
                </Box>
              )}
              <Box>
                <StyledCheckbox
                  name="2FA"
                  label="2FA"
                  disabled={!twoFactorEnabledFlag && !enableSave}
                  checked={twoFactorEnabledFlag}
                  onChange={({ checked }) => {
                    setEnableSave(true);
                    setTwoFactorEnabledFlag(checked);
                  }}
                />
              </Box>
            </Flex>
            {!twoFactorEnabledFlag && enableSave && (
              <Container pt={4}>
                <MessageBox type="error">
                  <div>Some instructions on what to look when disabling 2FA for a user;</div>
                  <ul>
                    <li>
                      If user has Twitter, GitHub or any other social accounts linked we can ask for a proof to be added
                      to them.
                    </li>
                    <li>
                      If the user has a payment method linked, we can ask for the credit card information (last 4 digits
                      + type of card etc).
                    </li>
                    <li>
                      If the account is completely empty, but the user is an admin of another collective or host (where
                      there&apos;s other admins), we notify the other admins of the collective to verify if it&apos;s
                      okay to reset the user&apos;s 2FA codes.
                    </li>
                    <li>
                      If the account is completely empty, but the user is the sole admin of another collective or host,
                      we look at any links in the collective or host account (such as the website link) and ask the user
                      to upload something to those social links in order to verify. For example if the collective has a
                      twitter account we ask the user to post a message with that account.
                    </li>
                    <li>
                      If none of the above, there&apos;s no links to social accounts, there&apos;s no credit card
                      information and the user account is completely empty we just reset them as there&apos;s nothing to
                      lose.
                    </li>
                  </ul>
                  <div>In doubt, do not hesitate to ask the engineering team.</div>
                </MessageBox>
              </Container>
            )}
          </Container>
          <StyledButton
            mt={4}
            width="100%"
            buttonStyle="primary"
            loading={loading}
            disabled={!enableSave}
            onClick={async () => {
              try {
                await editAccountFlags({
                  variables: {
                    account: { slug: selectedAccountOption?.value?.slug },
                    isArchived: archivedFlag,
                    isTrustedHost: trustedHostFlag,
                    isTwoFactorAuthEnabled: twoFactorEnabledFlag,
                  },
                });
                toast({
                  variant: 'success',
                  title: 'Success',
                  message: 'Account flags saved',
                });
                setEnableSave(false);
              } catch (e) {
                toast({
                  variant: 'error',
                  message: i18nGraphqlException(intl, e),
                });
              }
            }}
          >
            Save
          </StyledButton>
        </React.Fragment>
      )}
    </React.Fragment>
  );
};

export default AccountSettings;
