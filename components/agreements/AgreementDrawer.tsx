import React from 'react';
import { gql, useMutation } from '@apollo/client';

import { API_V2_CONTEXT } from '../../lib/graphql/helpers';

import Drawer from '../Drawer';

import Agreement from './Agreement';
import AgreementForm from './AgreementForm';

const ADD_AGREEMENT_MUTATION = gql`
  mutation addAgreement(
    $host: AccountReferenceInput!
    $account: AccountReferenceInput!
    $attachment: Upload
    $title: NonEmptyString!
    $expiresAt: DateTime
  ) {
    addAgreement(host: $host, title: $title, account: $account, attachment: $attachment, expiresAt: $expiresAt) {
      id
      title
      expiresAt
      account {
        id
        legacyId
        slug
        imageUrl
        name
      }
      attachment {
        id
        url
      }
    }
  }
`;

export default function AgreementDrawer({ open, onClose, agreement, hostLegacyId }) {
  const [addAgreement, { loading, error }] = useMutation(ADD_AGREEMENT_MUTATION, {
    context: API_V2_CONTEXT,
  });
  const showForm = !agreement;

  return (
    <Drawer maxWidth="512px" open={open} onClose={onClose} showActionsContainer={showForm}>
      {showForm ? (
        <AgreementForm
          hostLegacyId={hostLegacyId}
          // isEditing={isEditing}
          // agreement={agreement}
          onSubmit={async values => {
            await addAgreement({ variables: { ...values, host: { legacyId: hostLegacyId } } });
          }}
          // loading={loading}
          // error={error}
        />
      ) : (
        <Agreement agreement={agreement} />
      )}
    </Drawer>
  );
}
