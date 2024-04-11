import React from 'react';
import PropTypes from 'prop-types';
import { useMutation } from '@apollo/client';
import { FormattedMessage, useIntl } from 'react-intl';

import { i18nGraphqlException } from '../../lib/errors';
import { API_V2_CONTEXT, gql } from '../../lib/graphql/helpers';

import ConfirmationModal, { CONFIRMATION_MODAL_TERMINATE } from '../ConfirmationModal';
import { P } from '../Text';
import { useToast } from '../ui/useToast';

const deleteApplicationMutation = gql`
  mutation DeleteOAuthApplication($id: String!) {
    deleteApplication(application: { id: $id }) {
      id
      account {
        id
      }
    }
  }
`;

const DeleteOAuthApplicationModal = ({ application, onDelete, ...props }) => {
  const { toast } = useToast();
  const intl = useIntl();
  const [deleteApplication] = useMutation(deleteApplicationMutation, {
    context: API_V2_CONTEXT,
    update: (cache, { data }) => {
      // Remove object from cache
      cache.evict({ id: cache.identify(application) });
      cache.gc();

      // Remove object from parent query
      const accountCacheId = cache.identify(data.deleteApplication.account);
      cache.modify({ id: accountCacheId, fields: { oAuthApplications: (_, { DELETE }) => DELETE } });
    },
  });

  return (
    <ConfirmationModal
      isDanger
      type="delete"
      header={
        <FormattedMessage defaultMessage="Delete application {name}" id="M5dGYy" values={{ name: application.name }} />
      }
      {...props}
      continueHandler={async () => {
        try {
          await deleteApplication({ variables: { id: application.id } });
          await onDelete(application);
          toast({
            variant: 'success',
            message: intl.formatMessage(
              { defaultMessage: 'Application {name} deleted', id: 'vAzArE' },
              { name: application.name },
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
          defaultMessage="This will permanently delete the application, revoking all tokens associated with it. Are you sure you want to continue?"
          id="pp/kVH"
        />
      </P>
    </ConfirmationModal>
  );
};

DeleteOAuthApplicationModal.propTypes = {
  application: PropTypes.shape({
    id: PropTypes.string.isRequired,
    name: PropTypes.string.isRequired,
  }).isRequired,
  onDelete: PropTypes.func.isRequired,
  onClose: PropTypes.func.isRequired,
};

export default DeleteOAuthApplicationModal;
