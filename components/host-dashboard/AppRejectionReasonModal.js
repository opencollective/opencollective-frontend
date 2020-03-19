import React, { useState } from 'react';
import PropTypes from 'prop-types';
import gql from 'graphql-tag';
import { useMutation } from '@apollo/react-hooks';
import { FormattedMessage, defineMessages, useIntl } from 'react-intl';

import Modal, { ModalHeader, ModalBody, ModalFooter } from '../StyledModal';
import Container from '../Container';
import StyledTextarea from '../StyledTextarea';
import StyledButton from '../StyledButton';
import MessageBox from '../MessageBox';
import { getHostPendingApplicationsQuery } from '../../lib/graphql/queries';

const rejectCollectiveQuery = gql`
  mutation rejectCollective($id: Int!, $rejectionReason: String) {
    rejectCollective(id: $id, rejectionReason: $rejectionReason) {
      id
    }
  }
`;

const messages = defineMessages({
  placeholder: {
    id: 'appRejectionReason.placeholder',
    defaultMessage: 'What is the reason for rejecting this application?',
  },
});

const AppRejectionReasonModal = ({ show, onClose, collectiveId, hostCollectiveSlug }) => {
  const [rejectionReason, setRejectionReason] = useState('');
  const [rejectCollective, { loading, error }] = useMutation(rejectCollectiveQuery);
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
                refetchQueries: [{ query: getHostPendingApplicationsQuery, variables: { hostCollectiveSlug } }],
                awaitRefetchQueries: true,
                ignoreResults: true,
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

AppRejectionReasonModal.propTypes = {
  show: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  collectiveId: PropTypes.number.isRequired,
  hostCollectiveSlug: PropTypes.string.isRequired,
};

export default AppRejectionReasonModal;
