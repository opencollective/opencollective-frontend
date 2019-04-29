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

const DeleteCollective = ({ collective, deleteCollective, deleteUserCollective, ...props }) => {
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
        await deleteUserCollective(collective.id);
      } else {
        await deleteCollective(collective.id);
        await props.refetchLoggedInUser();
      }
      await Router.pushRoute(`/deleteCollective/confirmed?type=${collective.type}`);
    } catch (err) {
      console.error('>>> deleteUserCollective error: ', JSON.stringify(err));
      const errorMsg = err.graphQLErrors && err.graphQLErrors[0] ? err.graphQLErrors[0].message : err.message;
      setDeleteStatus({ deleting: false, error: errorMsg });
    }
  };

  const { deleting, error } = deleteStatus;

  const hasBalance = collective.stats.balance > 0 && collective.type === 'COLLECTIVE';

  return (
    <Container display="flex" flexDirection="column" width={1} alignItems="flex-start">
      <H2>
        <FormattedMessage
          values={{ type: collectiveType }}
          id="collective.delete.title"
          defaultMessage={'Delete this {type}'}
        />
      </H2>
      <P>
        <FormattedMessage
          values={{ type: collectiveType.toLowerCase() }}
          id="collective.delete.description"
          defaultMessage={
            'This {type} will be deleted along with all related data, such as memberships and payment methods.'
          }
        />
      </P>
      {error && <P color="#ff5252">{error}</P>}
      <StyledButton onClick={() => setShowModal(true)} loading={deleting} disabled={!collective.isDeletable}>
        <FormattedMessage
          values={{ type: collectiveType.toLowerCase() }}
          id="collective.delete.button"
          defaultMessage={'Delete this {type}'}
        />
      </StyledButton>
      {!collective.isDeletable && (
        <P color="rgb(224, 183, 0)">
          <FormattedMessage
            values={{ type: collectiveType }}
            id="collective.delete.isNotDeletable-message"
            defaultMessage={'{type}s with transactions, orders, or paid expenses cannot be deleted. Please archive it instead.'}
          />{' '}
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
