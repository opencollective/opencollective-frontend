import React from 'react';
import PropTypes from 'prop-types';
import { useMutation } from '@apollo/client';
import { useFormik } from 'formik';
import { FormattedMessage } from 'react-intl';

import { API_V2_CONTEXT, gql } from '../../lib/graphql/helpers';

import StyledModal, { ModalBody, ModalFooter, ModalHeader } from '../StyledModal';
import { P } from '../Text';
import { Button } from '../ui/Button';
import { useToast } from '../ui/useToast';

const deleteVirtualCardMutation = gql`
  mutation DeleteVirtualCard($virtualCard: VirtualCardReferenceInput!) {
    deleteVirtualCard(virtualCard: $virtualCard)
  }
`;

const DeleteVirtualCardModal = ({ virtualCard, onSuccess, onClose, onDeleteRefetchQuery, ...modalProps }) => {
  const { toast } = useToast();

  const refetchOptions = onDeleteRefetchQuery
    ? {
        refetchQueries: [onDeleteRefetchQuery],
        awaitRefetchQueries: true,
      }
    : {};

  const [deleteVirtualCard, { loading: isBusy }] = useMutation(deleteVirtualCardMutation, {
    context: API_V2_CONTEXT,
    ...refetchOptions,
  });

  const formik = useFormik({
    initialValues: {},
    async onSubmit() {
      try {
        await deleteVirtualCard({
          variables: {
            virtualCard: { id: virtualCard.id },
          },
        });
      } catch (e) {
        toast({
          variant: 'error',
          message: (
            <FormattedMessage
              defaultMessage="Error deleting virtual card: {error}"
              id="qYxNsK"
              values={{
                error: e.message,
              }}
            />
          ),
        });
        return;
      }
      onSuccess?.(<FormattedMessage defaultMessage="Card successfully deleted" id="+RvjCt" />);
      handleClose();
    },
  });

  const handleClose = () => {
    onClose?.();
  };

  return (
    <StyledModal onClose={handleClose} maxWidth={450} trapFocus {...modalProps}>
      <form onSubmit={formik.handleSubmit}>
        <ModalHeader onClose={handleClose}>
          <FormattedMessage defaultMessage="Delete virtual card" id="7nrRJ/" />
        </ModalHeader>
        <ModalBody pt={2}>
          <P>
            <FormattedMessage
              defaultMessage="You are about to delete the virtual card, are you sure you want to continue ?"
              id="TffQlZ"
            />
          </P>
        </ModalBody>
        <ModalFooter isFullWidth>
          <div className="flex flex-wrap justify-end gap-2">
            <Button className="min-w-36" variant="outline" onClick={handleClose} type="button">
              <FormattedMessage defaultMessage="Cancel" id="actions.cancel" />
            </Button>
            <Button
              variant="destructive"
              className="min-w-36"
              data-cy="confirmation-modal-continue"
              loading={isBusy}
              type="submit"
            >
              <FormattedMessage id="actions.delete" defaultMessage="Delete" />
            </Button>
          </div>
        </ModalFooter>
      </form>
    </StyledModal>
  );
};

DeleteVirtualCardModal.propTypes = {
  onClose: PropTypes.func,
  onSuccess: PropTypes.func,
  onDeleteRefetchQuery: PropTypes.string,
  virtualCard: PropTypes.shape({
    id: PropTypes.string,
    name: PropTypes.string,
  }),
};

/** @component */
export default DeleteVirtualCardModal;
