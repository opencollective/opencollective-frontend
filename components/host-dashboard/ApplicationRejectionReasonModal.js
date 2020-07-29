import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { useMutation } from '@apollo/react-hooks';
import gql from 'graphql-tag';
import { defineMessages, FormattedMessage, useIntl } from 'react-intl';

import Container from '../Container';
import MessageBox from '../MessageBox';
import StyledButton from '../StyledButton';
import Modal, { ModalBody, ModalFooter, ModalHeader } from '../StyledModal';
import StyledTextarea from '../StyledTextarea';

const rejectCollectiveMutation = gql`
  mutation RejectCollective($id: Int!, $rejectionReason: String) {
    rejectCollective(id: $id, rejectionReason: $rejectionReason) {
      id
      isActive
      isApproved
      host {
        id
        name
        slug
        type
        settings
      }
    }
  }
`;

const messages = defineMessages({
  placeholder: {
    id: 'appRejectionReason.placeholder',
    defaultMessage: 'What is the reason for rejecting this application?',
  },
});

const ApplicationRejectionReasonModal = ({ show, onClose, collectiveId }) => {
  const [rejectionReason, setRejectionReason] = useState('');
  const [rejectCollective, { loading, error }] = useMutation(rejectCollectiveMutation);
  const intl = useIntl();

  return (
    <Modal show={show} onClose={onClose} width="570px">
      <ModalHeader>
        <FormattedMessage id="appRejectionReason.modal.header" defaultMessage="Application Rejection Reason" />
      </ModalHeader>
      <ModalBody>
        {error && (
          <MessageBox type="error" withIcon my={3}>
            {error.message}
          </MessageBox>
        )}
        <Container>
          <StyledTextarea
            width="100%"
            resize="none"
            autoSize={true}
            minHeight={200}
            value={rejectionReason}
            onChange={({ target }) => setRejectionReason(target.value)}
            placeholder={intl.formatMessage(messages.placeholder)}
          />
        </Container>
      </ModalBody>
      <ModalFooter>
        <Container display="flex" justifyContent="flex-end">
          <StyledButton mx={20} onClick={onClose}>
            <FormattedMessage id="actions.cancel" defaultMessage="Cancel" />
          </StyledButton>
          <StyledButton
            buttonStyle="primary"
            data-cy="action"
            loading={loading}
            onClick={async () => {
              await rejectCollective({
                variables: { id: collectiveId, rejectionReason },
              });
              onClose();
            }}
          >
            <FormattedMessage id="actions.continue" defaultMessage="Continue" />
          </StyledButton>
        </Container>
      </ModalFooter>
    </Modal>
  );
};

ApplicationRejectionReasonModal.propTypes = {
  show: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  collectiveId: PropTypes.number.isRequired,
};

export default ApplicationRejectionReasonModal;
