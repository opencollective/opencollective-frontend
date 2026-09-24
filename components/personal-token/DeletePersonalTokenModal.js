import React from 'react';
import { useMutation } from '@apollo/client';
import { FormattedMessage, useIntl } from 'react-intl';

import { i18nGraphqlException } from '../../lib/errors';
import { gql } from '../../lib/graphql/helpers';

import ConfirmationModal, { CONFIRMATION_MODAL_TERMINATE } from '../ConfirmationModal';
import { P } from '../Text';
import { useToast } from '../ui/useToast';

const deletePersonalTokenMutation = gql`
  mutation DeletePersonalToken($id: String!) {
    deletePersonalToken(personalToken: { id: $id }) {
      id
      account {
        id
      }
    }
  }
`;

const DeletePersonalTokenModal = ({ personalToken, onDelete, ...props }) => {
  const { toast } = useToast();
  const intl = useIntl();
  const [deleteToken] = useMutation(deletePersonalTokenMutation, {
    update: (cache, { data }) => {
      cache.evict({ id: cache.identify(personalToken) });
      cache.gc();

      // Remove object from parent query
      const accountCacheId = cache.identify(data.deletePersonalToken.account);
      cache.modify({ id: accountCacheId, fields: { personalTokens: (_, { DELETE }) => DELETE } });
    },
  });

  return (
    <ConfirmationModal
      isDanger
      type="delete"
      header={
        <FormattedMessage
          defaultMessage="Delete token {name}"
          id="WzSLvB"
          values={{ name: personalToken.name || '' }}
        />
      }
      {...props}
      continueHandler={async () => {
        try {
          await deleteToken({ variables: { id: personalToken.id } });
          await onDelete(personalToken);
          toast({
            variant: 'success',
            message: intl.formatMessage(
              { defaultMessage: 'Personal token "{name}" deleted', id: 'Ix3kXB' },
              { name: personalToken.name || '' },
            ),
          });
          return CONFIRMATION_MODAL_TERMINATE;
        } catch (e) {
          toast({ variant: 'error', message: i18nGraphqlException(intl, e) });
        }
      }}
    >
      <P>
        <FormattedMessage
          defaultMessage="This will permanently delete the token, revoking all access associated with it. Are you sure you want to continue?"
          id="7YAGj2"
        />
      </P>
    </ConfirmationModal>
  );
};

export default DeletePersonalTokenModal;
