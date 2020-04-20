import React, { useState } from 'react';
import { FormattedMessage } from 'react-intl';
import PropTypes from 'prop-types';
import { useMutation } from '@apollo/react-hooks';
import gql from 'graphql-tag';

import { getErrorFromGraphqlException } from '../../../lib/errors';
import { CollectiveType } from '../../../lib/constants/collectives';
import { Router } from '../../../server/pages';

import { withUser } from '../../UserProvider';
import { H2, P } from '../../Text';
import Container from '../../Container';
import StyledButton from '../../StyledButton';
import Modal, { ModalBody, ModalHeader, ModalFooter } from '../../StyledModal';

const getCollectiveType = type => {
  switch (type) {
    case 'ORGANIZATION':
      return 'Organization';
    case 'COLLECTIVE':
      return 'Collective';
    case 'EVENT':
      return 'Event';
    default:
      return 'Account';
  }
};

const DELETE_COLLECTIVE = gql`
  mutation deleteCollective($id: Int!) {
    deleteCollective(id: $id) {
      id
    }
  }
`;

const DELETE_USER_COLLECTIVE = gql`
  mutation deleteUserCollective($id: Int!) {
    deleteUserCollective(id: $id) {
      id
    }
  }
`;

const DeleteCollective = ({ collective, ...props }) => {
  const collectiveType = getCollectiveType(collective.type);
  const [showModal, setShowModal] = useState(false);
  const [deleteStatus, setDeleteStatus] = useState({ deleting: false, error: null });
  const [deleteCollective] = useMutation(DELETE_COLLECTIVE, { variables: { id: collective.id } });
  const [deleteUserCollective] = useMutation(DELETE_USER_COLLECTIVE, { variables: { id: collective.id } });

  const handleDelete = async () => {
    try {
      setDeleteStatus({ ...deleteStatus, deleting: true });
      if (collective.type === 'USER') {
        await deleteUserCollective();
      } else {
        await deleteCollective();
        await props.refetchLoggedInUser();
      }
      await Router.pushRoute(`/deleteCollective/confirmed?type=${collective.type}`);
    } catch (err) {
      const errorMsg = getErrorFromGraphqlException(err).message;
      setDeleteStatus({ deleting: false, error: errorMsg });
    }
  };

  const { deleting, error } = deleteStatus;

  const closeModal = () => setShowModal(false);

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
            'This {type} will be deleted, along with all related data like Core Contributor roles and payment methods.'
          }
        />
      </P>
      {error && <P color="#ff5252">{error}</P>}
      <StyledButton
        onClick={() => setShowModal(true)}
        loading={deleting}
        disabled={collective.isHost || !collective.isDeletable}
      >
        <FormattedMessage
          values={{ type: collectiveType.toLowerCase() }}
          id="collective.delete.title"
          defaultMessage={'Delete this {type}'}
        />
      </StyledButton>
      {collective.isHost && (
        <P color="rgb(224, 183, 0)">
          <FormattedMessage
            id="collective.delete.isHost"
            defaultMessage={"You can't delete your collective while being a Host, please deactivate as Host first."}
          />{' '}
        </P>
      )}
      {!collective.isDeletable && collective.type !== CollectiveType.EVENT && (
        <P color="rgb(224, 183, 0)">
          <FormattedMessage
            values={{ type: collectiveType }}
            id="collective.delete.isNotDeletable-message"
            defaultMessage={
              '{type}s with transactions, orders, events or paid expenses cannot be deleted. Please archive it instead.'
            }
          />{' '}
        </P>
      )}
      {!collective.isDeletable && collective.type === CollectiveType.EVENT && (
        <P color="rgb(224, 183, 0)">
          <FormattedMessage
            id="collective.event.delete.isNotDeletable-message"
            defaultMessage={
              'Events with transactions, orders or paid expenses cannot be deleted. Please archive it instead.'
            }
          />
        </P>
      )}
      <Modal show={showModal} width="570px" onClose={closeModal}>
        <ModalHeader onClose={closeModal}>
          <FormattedMessage
            id="collective.delete.modal.header"
            values={{ name: collective.name }}
            defaultMessage={'Delete {name}'}
          />
        </ModalHeader>
        <ModalBody>
          <P>
            <FormattedMessage
              id="collective.delete.modal.body"
              values={{ type: collectiveType.toLowerCase() }}
              defaultMessage={'Are you sure you want to delete this {type}?'}
            />
          </P>
        </ModalBody>
        <ModalFooter>
          <Container display="flex" justifyContent="flex-end">
            <StyledButton mx={20} onClick={() => setShowModal(false)}>
              <FormattedMessage id="actions.cancel" defaultMessage={'Cancel'} />
            </StyledButton>
            <StyledButton
              buttonStyle="primary"
              data-cy="delete"
              onClick={() => {
                setShowModal(false);
                handleDelete();
              }}
            >
              <FormattedMessage id="actions.delete" defaultMessage="Delete" />
            </StyledButton>
          </Container>
        </ModalFooter>
      </Modal>
    </Container>
  );
};

DeleteCollective.propTypes = {
  collective: PropTypes.object.isRequired,
  refetchLoggedInUser: PropTypes.func,
};

export default withUser(DeleteCollective);
