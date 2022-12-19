import React from 'react';
import PropTypes from 'prop-types';
import { gql, useMutation } from '@apollo/client';
import { FormattedMessage, useIntl } from 'react-intl';

import { i18nGraphqlException } from '../../lib/errors';
import { API_V2_CONTEXT } from '../../lib/graphql/helpers';

import ConfirmationModal, { CONFIRMATION_MODAL_TERMINATE } from '../ConfirmationModal';
import { P } from '../Text';
import { TOAST_TYPE, useToasts } from '../ToastProvider';

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
  const { addToast } = useToasts();
  const intl = useIntl();
  const [deleteToken] = useMutation(deletePersonalTokenMutation, {
    context: API_V2_CONTEXT,
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
      header={<FormattedMessage defaultMessage="Delete token {name}" values={{ name: personalToken.name || '' }} />}
      {...props}
      continueHandler={async () => {
        try {
          await deleteToken({ variables: { id: personalToken.id } });
          await onDelete(personalToken);
          addToast({
            type: TOAST_TYPE.SUCCESS,
            message: intl.formatMessage({ defaultMessage: 'Token {name} deleted' }, { name: personalToken.name || '' }),
          });
          return CONFIRMATION_MODAL_TERMINATE;
        } catch (e) {
          addToast({ type: TOAST_TYPE.ERROR, variant: 'light', message: i18nGraphqlException(intl, e) });
        }
      }}
    >
      <P>
        <FormattedMessage defaultMessage="This will permanently delete the token, revoking all access associated with it. Are you sure you want to continue?" />
      </P>
    </ConfirmationModal>
  );
};

DeletePersonalTokenModal.propTypes = {
  personalToken: PropTypes.shape({
    id: PropTypes.string.isRequired,
    name: PropTypes.string.isRequired,
  }).isRequired,
  onDelete: PropTypes.func.isRequired,
  onClose: PropTypes.func.isRequired,
};

export default DeletePersonalTokenModal;
