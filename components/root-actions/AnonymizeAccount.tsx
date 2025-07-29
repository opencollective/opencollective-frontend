import React from 'react';
import { useMutation } from '@apollo/client';
import { useIntl } from 'react-intl';

import { getAccountReferenceInput } from '../../lib/collective';
import { i18nGraphqlException } from '../../lib/errors';
import { API_V2_CONTEXT, gql } from '../../lib/graphql/helpers';

import CollectivePickerAsync from '../CollectivePickerAsync';
import ConfirmationModal from '../ConfirmationModal';
import DashboardHeader from '../dashboard/DashboardHeader';
import LinkCollective from '../LinkCollective';
import StyledInputField from '../StyledInputField';
import StyledLink from '../StyledLink';
import { Button } from '../ui/Button';
import { useToast } from '../ui/useToast';

const anonymizeAccountMutation = gql`
  mutation AnonymizeAccount($account: AccountReferenceInput!) {
    rootAnonymizeAccount(account: $account) {
      id
    }
  }
`;

export const AnonymizeAccount = () => {
  const [showModal, setShowModal] = React.useState(false);
  const [selectedAccount, setSelectedAccount] = React.useState(null);
  const [_anonymizeAccount, { loading }] = useMutation(anonymizeAccountMutation, { context: API_V2_CONTEXT });
  const { toast } = useToast();
  const intl = useIntl();
  const isValid = Boolean(selectedAccount);
  const anonymizeAccount = () =>
    _anonymizeAccount({ variables: { account: getAccountReferenceInput(selectedAccount) } });

  return (
    <div>
      <DashboardHeader title="Anonymize Account" className="mb-4" />
      <div className="mb-6">
        This action will anonymize the selected account, stripping its name/slug/website/description...etc. It is meant
        to be used:
        <ul className="list-disc pl-6">
          <li>For accounts that are spammy or abusive but have transactions recorded</li>
          <li>For GDPR requests</li>
        </ul>
      </div>
      <div className="rounded border p-4">
        <StyledInputField htmlFor="ban-accounts-picker" label="Account" flex="1 1">
          {({ id }) => (
            <CollectivePickerAsync
              inputId={id}
              skipGuests={false}
              includeArchived
              collective={selectedAccount}
              onChange={option => setSelectedAccount(option?.value)}
            />
          )}
        </StyledInputField>

        <Button className="mt-4" disabled={!isValid} loading={loading} onClick={() => setShowModal(true)}>
          Anonymize
        </Button>
      </div>
      {showModal && (
        <ConfirmationModal
          isDanger
          continueLabel="Anonymize account"
          header="Anonymize account"
          onClose={() => setShowModal(false)}
          continueHandler={async () => {
            try {
              await anonymizeAccount();
              toast({ variant: 'success', message: `Account ${selectedAccount.slug} has been anonymized` });
              setShowModal(false);
              setSelectedAccount(null);
            } catch (e) {
              toast({ variant: 'error', message: i18nGraphqlException(intl, e) });
            }
          }}
        >
          This will anonymize <StyledLink as={LinkCollective} collective={selectedAccount} />. Are you sure you want to
          proceed?
        </ConfirmationModal>
      )}
    </div>
  );
};
