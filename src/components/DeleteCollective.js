import React, { useState } from 'react';
import { FormattedMessage } from 'react-intl';
import PropTypes from 'prop-types';

import withIntl from '../lib/withIntl';
import { withUser } from './UserProvider';
import { addDeleteCollectiveMutation, addDeleteUserCollectiveMutation } from '../graphql/mutations';
import { H2, P } from './Text';
import Container from './Container';
import StyledButton from './StyledButton';
import Modal from './Modal';
import { Router } from '../server/pages';

const getCollectiveType = type => {
  switch (type) {
    case 'ORGANIZATION':
      return 'Organization';
    case 'COLLECTIVE':
      return 'Collective';
    default:
      return 'Account';
  }
};

const DeleteCollective = ({ collective, deleteCollective, deleteUserCollective, logout }) => {
  const collectiveType = getCollectiveType(collective.type);
  const [showModal, setShowModal] = useState(false);
  const [deleteStatus, setDeleteStatus] = useState({
    deleting: false,
    error: null,
  });

  const handleDelete = async () => {
    try {
      setDeleteStatus({ ...deleteStatus, deleting: true });
      if (collective.type === 'USER') {
        await logout();
        await deleteUserCollective(collective.id);
      } else {
        await deleteCollective(collective.id);
      }
      await Router.pushRoute(`/deleteCollective/confirmed?type=${collective.type}`);
    } catch (err) {
      console.error('>>> deleteUserCollective error: ', JSON.stringify(err));
      const errorMsg = err.graphQLErrors && err.graphQLErrors[0] ? err.graphQLErrors[0].message : err.message;
      setDeleteStatus({ deleting: false, error: errorMsg });
    }
  };

  const { deleting, error } = deleteStatus;

  return (
    <Container display="flex" flexDirection="column" width={1}>
      <H2>
        <FormattedMessage
          values={{ type: collectiveType }}
          id="collective.delete.title"
          defaultMessage={'Delete this {type}.'}
        />
      </H2>
      <P>
        <FormattedMessage
          values={{ type: collectiveType.toLowerCase() }}
          id="collective.delete.description"
          defaultMessage={
            'This will delete {type} and delete all related data such as: memberships, payment methods etc.'
          }
        />
      </P>
      {error && <P color="#ff5252">{error}</P>}
      <StyledButton
        width={0.3}
        onClick={() => setShowModal(true)}
        loading={deleting}
        disabled={!collective.isDeletable}
      >
        <FormattedMessage
          values={{ type: collectiveType.toLowerCase() }}
          id="collective.delete.button"
          defaultMessage={'Delete this {type}'}
        />
      </StyledButton>
      {!collective.isDeletable && (
        <P>
          <FormattedMessage
            values={{ type: collectiveType }}
            id="collective.delete.isNotDeletable-message"
            defaultMessage={'{type} with transcations, order or paid expense cannot be deleted.'}
          />
        </P>
      )}
      <Modal
        onClose={() => setShowModal(false)}
        show={showModal}
        className="confirm-deleteCollective"
        title={`Are you sure you want to delete this ${collectiveType.toLowerCase()}?`}
      >
        <Container display="flex" justifyContent="space-between" width={1} mt={4}>
          <StyledButton onClick={() => setShowModal(false)}>
            <FormattedMessage id="collective.delete.cancel.btn" defaultMessage={'Cancel'} />
          </StyledButton>
          <StyledButton
            buttonStyle="primary"
            onClick={() => {
              setShowModal(false);
              handleDelete();
            }}
          >
            <FormattedMessage id="collective.delete.confirm.btn" defaultMessage={'Delete'} />
          </StyledButton>
        </Container>
      </Modal>
    </Container>
  );
};

DeleteCollective.propTypes = {
  collective: PropTypes.object.isRequired,
  deleteCollective: PropTypes.func,
  logout: PropTypes.func,
  deleteUserCollective: PropTypes.func,
};

export default withIntl(withUser(addDeleteCollectiveMutation(addDeleteUserCollectiveMutation(DeleteCollective))));
