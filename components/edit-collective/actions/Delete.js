import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { useMutation } from '@apollo/react-hooks';
import gql from 'graphql-tag';
import { FormattedMessage } from 'react-intl';

import { CollectiveType } from '../../../lib/constants/collectives';
import { getErrorFromGraphqlException } from '../../../lib/errors';
import { Router } from '../../../server/pages';

import Container from '../../Container';
import StyledButton from '../../StyledButton';
import Modal, { ModalBody, ModalFooter, ModalHeader } from '../../StyledModal';
import { H2, P } from '../../Text';
import { withUser } from '../../UserProvider';

const deleteCollectiveMutation = gql`
  mutation DeleteCollective($id: Int!) {
    deleteCollective(id: $id) {
      id
    }
  }
`;

const deleteUserCollectiveMutation = gql`
  mutation DeleteUserCollective($id: Int!) {
    deleteUserCollective(id: $id) {
      id
    }
  }
`;

const DeleteCollective = ({ collective, ...props }) => {
  const collectiveType = collective.settings?.fund ? 'FUND' : collective.type; // Funds MVP, to refactor
  const [showModal, setShowModal] = useState(false);
  const [deleteStatus, setDeleteStatus] = useState({ deleting: false, error: null });
  const [deleteCollective] = useMutation(deleteCollectiveMutation, { variables: { id: collective.id } });
  const [deleteUserCollective] = useMutation(deleteUserCollectiveMutation, { variables: { id: collective.id } });

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
          id="collective.delete.title"
          defaultMessage={
            'Delete {type, select, EVENT {this Event} PROJECT {this Project} FUND {this Fund} COLLECTIVE {this Collective} ORGANIZATION {this Organization} other {this account}}'
          }
          values={{ type: collectiveType }}
        />
      </H2>
      <P>
        <FormattedMessage
          id="collective.delete.description"
          defaultMessage={
            '{type, select, EVENT {This Event} PROJECT {This Project} FUND {This Fund} COLLECTIVE {This Collective} ORGANIZATION {This Organization} other {This account}} will be deleted, along with all related data.'
          }
          values={{ type: collectiveType }}
        />
      </P>
      {error && <P color="#ff5252">{error}</P>}
      <StyledButton
        onClick={() => setShowModal(true)}
        loading={deleting}
        disabled={collective.isHost || !collective.isDeletable}
      >
        <FormattedMessage
          id="collective.delete.title"
          defaultMessage={
            'Delete {type, select, EVENT {this Event} PROJECT {this Project} FUND {this Fund} COLLECTIVE {this Collective} ORGANIZATION {this Organization} other {this account}}'
          }
          values={{ type: collectiveType }}
        />
      </StyledButton>
      {collective.isHost && (
        <P color="rgb(224, 183, 0)">
          <FormattedMessage
            id="collective.delete.isHost"
            defaultMessage={
              "You can't delete {type, select, ORGANIZATION {your Organization} other {your account}} while being a Host, please deactivate as Host first."
            }
            values={{ type: collectiveType }}
          />{' '}
        </P>
      )}
      {!collective.isDeletable &&
        collective.type !== CollectiveType.EVENT &&
        collective.type !== CollectiveType.PROJECT && (
          <P color="rgb(224, 183, 0)">
            <FormattedMessage
              id="collective.delete.isNotDeletable-message"
              defaultMessage={
                '{type, select, EVENT {Events} PROJECT {Projects} FUND {Funds} COLLECTIVE {Collectives} ORGANIZATION {Organizations} other {Accounts}} with transactions, orders, events or paid expenses cannot be deleted. Please archive it instead.'
              }
              values={{ type: collectiveType }}
            />{' '}
          </P>
        )}
      {!collective.isDeletable &&
        (collective.type === CollectiveType.EVENT || collective.type === CollectiveType.PROJECT) && (
          <P color="rgb(224, 183, 0)">
            <FormattedMessage
              id="collective.event.delete.isNotDeletable-message"
              defaultMessage={
                '{type, select, EVENT {Events} PROJECT {Projects}} with transactions, orders or paid expenses cannot be deleted. Please archive it instead.'
              }
              values={{ type: collectiveType }}
            />
          </P>
        )}
      <Modal show={showModal} width="570px" onClose={closeModal}>
        <ModalHeader onClose={closeModal}>
          <FormattedMessage
            id="collective.delete.modal.header"
            defaultMessage={'Delete {name}'}
            values={{ name: collective.name }}
          />
        </ModalHeader>
        <ModalBody>
          <P>
            <FormattedMessage
              id="collective.delete.modal.body"
              defaultMessage={
                'Are you sure you want to delete {type, select, EVENT {this Event} PROJECT {this Project} FUND {this Fund} COLLECTIVE {this Collective} ORGANIZATION {this Organization} other {this account}}?'
              }
              values={{ type: collectiveType }}
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
