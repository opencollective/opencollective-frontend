import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { useMutation } from '@apollo/client';
import { withRouter } from 'next/router';
import { FormattedMessage } from 'react-intl';

import { CollectiveType } from '../../../lib/constants/collectives';
import { getErrorFromGraphqlException } from '../../../lib/errors';
import { gqlV1 } from '../../../lib/graphql/helpers';

import Container from '../../Container';
import { getI18nLink } from '../../I18nFormatters';
import StyledButton from '../../StyledButton';
import StyledModal, { ModalBody, ModalFooter, ModalHeader } from '../../StyledModal';
import { P } from '../../Text';
import { withUser } from '../../UserProvider';
import SettingsSectionTitle from '../sections/SettingsSectionTitle';

const deleteCollectiveMutation = gqlV1/* GraphQL */ `
  mutation DeleteCollective($id: Int!) {
    deleteCollective(id: $id) {
      id
    }
  }
`;

const deleteUserCollectiveMutation = gqlV1/* GraphQL */ `
  mutation DeleteUserCollective($id: Int!) {
    deleteUserCollective(id: $id) {
      id
    }
  }
`;

const DeleteCollective = ({ collective, ...props }) => {
  const [showModal, setShowModal] = useState(false);
  const [deleteStatus, setDeleteStatus] = useState({ deleting: false, error: null });
  const [deleteCollective] = useMutation(deleteCollectiveMutation);
  const [deleteUserCollective] = useMutation(deleteUserCollectiveMutation);
  const isSelfHosted = collective.host?.id === collective.id;

  const handleDelete = async () => {
    try {
      setDeleteStatus({ ...deleteStatus, deleting: true });
      if (collective.type === 'USER') {
        await deleteUserCollective({ variables: { id: collective.id } });
      } else {
        await deleteCollective({ variables: { id: collective.id } });
        await props.refetchLoggedInUser();
      }
      await props.router.push(`/deleteCollective/confirmed?type=${collective.type}`);
    } catch (err) {
      const errorMsg = getErrorFromGraphqlException(err).message;
      setDeleteStatus({ deleting: false, error: errorMsg });
    }
  };

  const { deleting, error } = deleteStatus;

  const closeModal = () => setShowModal(false);

  return (
    <Container display="flex" flexDirection="column" width={1} alignItems="flex-start" mb={50}>
      <SettingsSectionTitle>
        <FormattedMessage
          id="collective.delete.title"
          defaultMessage="Delete {type, select, EVENT {this Event} PROJECT {this Project} FUND {this Fund} COLLECTIVE {this Collective} ORGANIZATION {this Organization} other {this account}}"
          values={{ type: collective.type }}
        />
      </SettingsSectionTitle>
      <P mb={3}>
        <FormattedMessage
          id="collective.delete.description"
          defaultMessage="{type, select, EVENT {This Event} PROJECT {This Project} FUND {This Fund} COLLECTIVE {This Collective} ORGANIZATION {This Organization} other {This account}} will be deleted, along with all related data."
          values={{ type: collective.type }}
        />
      </P>
      {error && (
        <P my={3} color="#ff5252">
          {error}
        </P>
      )}
      <StyledButton
        onClick={() => setShowModal(true)}
        loading={deleting}
        disabled={collective.isHost || !collective.isDeletable}
        mb={2}
      >
        <FormattedMessage
          id="collective.delete.title"
          defaultMessage="Delete {type, select, EVENT {this Event} PROJECT {this Project} FUND {this Fund} COLLECTIVE {this Collective} ORGANIZATION {this Organization} other {this account}}"
          values={{ type: collective.type }}
        />
      </StyledButton>
      {collective.isHost && (
        <P color="rgb(224, 183, 0)" my={1}>
          {isSelfHosted ? (
            <FormattedMessage
              id="collective.delete.selfHost"
              defaultMessage={`To delete this Independent Collective, first go to your <SettingsLink>Fiscal Host settings</SettingsLink> and click 'Reset Fiscal Host'.`}
              values={{ SettingsLink: getI18nLink({ href: `/dashboard/${collective.host?.slug}/host` }) }}
            />
          ) : (
            <FormattedMessage
              id="collective.delete.isHost"
              defaultMessage="You can't delete {type, select, ORGANIZATION {your Organization} other {your account}} while being a Host. Please deactivate as Host first (in your Fiscal Hosting settings)."
              values={{ type: collective.type }}
            />
          )}{' '}
        </P>
      )}
      {!collective.isDeletable &&
        collective.type !== CollectiveType.EVENT &&
        collective.type !== CollectiveType.PROJECT && (
          <P color="rgb(224, 183, 0)" my={1}>
            <FormattedMessage
              id="collective.delete.isNotDeletable-message"
              defaultMessage="{type, select, EVENT {Events} PROJECT {Projects} FUND {Funds} COLLECTIVE {Collectives} ORGANIZATION {Organizations} other {Accounts}} with transactions, contributions, events or paid expenses cannot be deleted. Please archive it instead."
              values={{ type: collective.type }}
            />{' '}
          </P>
        )}
      {!collective.isDeletable &&
        (collective.type === CollectiveType.EVENT || collective.type === CollectiveType.PROJECT) && (
          <P color="rgb(224, 183, 0)" my={1}>
            <FormattedMessage
              id="collective.event.delete.isNotDeletable-message"
              defaultMessage="{type, select, EVENT {Events} PROJECT {Projects} other {Accounts}} with transactions, contributions or paid expenses cannot be deleted. Please archive it instead."
              values={{ type: collective.type }}
            />
          </P>
        )}
      {showModal && (
        <StyledModal width="570px" onClose={closeModal}>
          <ModalHeader onClose={closeModal}>
            <FormattedMessage
              id="collective.delete.modal.header"
              defaultMessage="Delete {name}"
              values={{ name: collective.name }}
            />
          </ModalHeader>
          <ModalBody>
            <P>
              <FormattedMessage
                id="collective.delete.modal.body"
                defaultMessage="Are you sure you want to delete {type, select, EVENT {this Event} PROJECT {this Project} FUND {this Fund} COLLECTIVE {this Collective} ORGANIZATION {this Organization} other {this account}}?"
                values={{ type: collective.type }}
              />
            </P>
          </ModalBody>
          <ModalFooter>
            <Container display="flex" justifyContent="flex-end">
              <StyledButton mx={20} onClick={() => setShowModal(false)}>
                <FormattedMessage id="actions.cancel" defaultMessage="Cancel" />
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
        </StyledModal>
      )}
    </Container>
  );
};

DeleteCollective.propTypes = {
  collective: PropTypes.object.isRequired,
  refetchLoggedInUser: PropTypes.func,
  router: PropTypes.object,
};

export default withUser(withRouter(DeleteCollective));
