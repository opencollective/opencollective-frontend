import React, { useEffect } from 'react';
import { gql, useMutation } from '@apollo/client';
import { FormattedMessage, useIntl } from 'react-intl';

import { i18nGraphqlException } from '../../lib/errors';
import { API_V2_CONTEXT } from '../../lib/graphql/helpers';

import CollectivePickerAsync from '../CollectivePickerAsync';
import Container from '../Container';
import { Box, Flex } from '../Grid';
import MessageBox from '../MessageBox';
import StyledButton from '../StyledButton';
import StyledCheckbox from '../StyledCheckbox';
import StyledInputField from '../StyledInputField';
import StyledLink from '../StyledLink';
import { TOAST_TYPE, useToasts } from '../ToastProvider';

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
  const { addToast } = useToasts();
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
      <StyledInputField htmlFor="ban-accounts-picker" label="Account" flex="1 1">
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
                <MessageBox type="warning" withIcon>
                  <FormattedMessage
                    defaultMessage={`Make sure to take appropriate steps in order verify the user before resetting the 2FA codes. Reference: {reference}`}
                    values={{
                      reference: (
                        <StyledLink
                          href="https://github.com/opencollective/opencollective/issues/4478#issuecomment-887483590"
                          openInNewTab
                        >
                          https://github.com/opencollective/opencollective/issues/4478#issuecomment-887483590
                        </StyledLink>
                      ),
                    }}
                  />
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
                addToast({
                  type: TOAST_TYPE.SUCCESS,
                  title: 'Success',
                  message: 'Account flags saved',
                });
                setEnableSave(false);
              } catch (e) {
                addToast({
                  type: TOAST_TYPE.ERROR,
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
