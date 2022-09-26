import React, { useEffect } from 'react';
import { useMutation } from '@apollo/client';
import { FormattedMessage, useIntl } from 'react-intl';

import { i18nGraphqlException } from '../../lib/errors';
import { API_V2_CONTEXT, gqlV2 } from '../../lib/graphql/helpers';

import CollectivePickerAsync from '../CollectivePickerAsync';
import Container from '../Container';
import { Box, Flex } from '../Grid';
import StyledButton from '../StyledButton';
import StyledCheckbox from '../StyledCheckbox';
import StyledInputField from '../StyledInputField';
import { TOAST_TYPE, useToasts } from '../ToastProvider';

export const editAccountFlagsMutation = gqlV2/* GraphQL */ `
  mutation EditAccountFlags(
    $account: AccountReferenceInput!
    $isDeleted: Boolean
    $isArchived: Boolean
    $isBanned: Boolean
    $isTrustedHost: Boolean
  ) {
    editAccountFlags(
      account: $account
      isDeleted: $isDeleted
      isArchived: $isArchived
      isBanned: $isBanned
      isTrustedHost: $isTrustedHost
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
  const [deletedFlag, setDeletedFlag] = React.useState();
  const [bannedFlag, setBannedFlag] = React.useState();
  const [archivedFlag, setArchivedFlag] = React.useState();
  const [trustedHostFlag, setTrustedHostFlag] = React.useState();
  const [editAccountFlags, { loading }] = useMutation(editAccountFlagsMutation, { context: API_V2_CONTEXT });

  useEffect(() => {
    setDeletedFlag(selectedAccountOption?.value?.isDeleted);
    setBannedFlag(selectedAccountOption?.value?.isBanned);
    setArchivedFlag(selectedAccountOption?.value?.isArchived);
    setTrustedHostFlag(selectedAccountOption?.value?.isTrustedHost);
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

      <Container px={1} pt={3} pb={3}>
        <Box pb={2}>
          <FormattedMessage defaultMessage="Flags" />
        </Box>
        <Flex flexWrap="wrap" px={1} mt={2}>
          <Box pr={4}>
            <StyledCheckbox
              name="Deleted"
              label="Deleted"
              checked={deletedFlag}
              onChange={({ checked }) => {
                setDeletedFlag(checked);
              }}
            />
          </Box>
          <Box pr={4}>
            <StyledCheckbox
              name="Banned"
              label="Banned"
              checked={bannedFlag}
              onChange={({ checked }) => {
                setBannedFlag(checked);
              }}
            />
          </Box>
          <Box pr={4}>
            <StyledCheckbox
              name="Archived"
              label="Archived"
              checked={archivedFlag}
              onChange={({ checked }) => {
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
                  setTrustedHostFlag(checked);
                }}
              />
            </Box>
          )}
        </Flex>
      </Container>
      <StyledButton
        mt={4}
        width="100%"
        buttonStyle="primary"
        loading={loading}
        onClick={async () => {
          try {
            const result = await editAccountFlags({
              variables: {
                account: { slug: selectedAccountOption?.value?.slug },
                isBanned: bannedFlag,
                isDeleted: deletedFlag,
                isArchived: archivedFlag,
                isTrustedHost: trustedHostFlag,
              },
            });
            const newSlug = result?.data?.editAccountFlags?.slug;
            if (newSlug !== selectedAccountOption?.value?.slug) {
              addToast({
                type: TOAST_TYPE.SUCCESS,
                title: 'Success',
                message: (
                  <FormattedMessage
                    defaultMessage="Account has been {deletedFlag, select, true {deleted} other {restored}}. Slug renamed to {newSlug}"
                    values={{ newSlug, deletedFlag }}
                  />
                ),
              });
              setSelectedAccountOption([]);
            } else {
              addToast({
                type: TOAST_TYPE.SUCCESS,
                title: 'Success',
                message: <FormattedMessage defaultMessage="Account flags saved" />,
              });
            }
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
  );
};

export default AccountSettings;
