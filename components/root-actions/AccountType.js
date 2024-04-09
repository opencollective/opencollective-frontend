import React from 'react';
import { useMutation } from '@apollo/client';
import { useIntl } from 'react-intl';

import { i18nGraphqlException } from '../../lib/errors';
import { API_V2_CONTEXT, gql } from '../../lib/graphql/helpers';

import CollectivePickerAsync from '../CollectivePickerAsync';
import ConfirmationModal from '../ConfirmationModal';
import StyledButton from '../StyledButton';
import StyledInputField from '../StyledInputField';
import { P } from '../Text';
import { useToast } from '../ui/useToast';

const editAccountTypeMutation = gql`
  mutation EditAccountType($account: AccountReferenceInput!) {
    editAccountType(account: $account) {
      id
      slug
      type
    }
  }
`;

const AccountType = () => {
  const { toast } = useToast();
  const intl = useIntl();
  const [selectedAccountOption, setSelectedAccountOption] = React.useState([]);
  const [editAccountType, { loading }] = useMutation(editAccountTypeMutation, { context: API_V2_CONTEXT });
  const [isConfirmationModelOpen, setIsConfirmationModelOpen] = React.useState(false);

  const callToAction = selectedAccountOption?.value
    ? `Change ${selectedAccountOption?.value.slug} to Organization`
    : 'Change User to Organization';

  const changeAccountTypeToOrg = React.useCallback(async () => {
    try {
      await editAccountType({
        variables: {
          account: { slug: selectedAccountOption?.value?.slug },
        },
      });
      toast({ variant: 'success', title: 'Account Type Successfully Changed', message: callToAction });
      // Reset form and purge cache
      setIsConfirmationModelOpen(false);
      setSelectedAccountOption([]);
    } catch (e) {
      toast({ variant: 'error', message: i18nGraphqlException(intl, e) });
    }
  }, [intl, toast, editAccountType, selectedAccountOption, callToAction]);

  return (
    <React.Fragment>
      <StyledInputField htmlFor="accounts-picker" label="Account" flex="1 1">
        {({ id }) => (
          <CollectivePickerAsync
            inputId={id}
            onChange={setSelectedAccountOption}
            value={selectedAccountOption}
            noCache
            types={['USER']}
          />
        )}
      </StyledInputField>

      <StyledButton
        mt={4}
        width="100%"
        buttonStyle="danger"
        loading={loading}
        disabled={selectedAccountOption.length === 0}
        onClick={async () => {
          setIsConfirmationModelOpen(true);
        }}
      >
        {callToAction}
      </StyledButton>
      {isConfirmationModelOpen && (
        <ConfirmationModal
          header={callToAction}
          continueHandler={changeAccountTypeToOrg}
          onClose={() => setIsConfirmationModelOpen(false)}
        >
          <P>You&apos;re about to change {selectedAccountOption?.value.slug} to an Organization.</P>
        </ConfirmationModal>
      )}
    </React.Fragment>
  );
};

export default AccountType;
