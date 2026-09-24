import React, { useState } from 'react';
import { useMutation } from '@apollo/client';
import { withRouter } from 'next/router';
import { FormattedMessage } from 'react-intl';

import { hasAccountMoneyManagement } from '@/lib/collective';
import { CollectiveType } from '@/lib/constants/collectives';
import { getErrorFromGraphqlException } from '@/lib/errors';
import { API_V1_CONTEXT, gqlV1 } from '@/lib/graphql/helpers';

import MessageBox from '@/components/MessageBox';

import StyledModal, { ModalBody, ModalFooter, ModalHeader } from '../../StyledModal';
import { P } from '../../Text';
import { Button } from '../../ui/Button';
import { withUser } from '../../UserProvider';
import SettingsSectionTitle from '../sections/SettingsSectionTitle';

const deleteCollectiveMutation = gqlV1 /* GraphQL */ `
  mutation DeleteCollective($id: Int!) {
    deleteCollective(id: $id) {
      id
    }
  }
`;

const deleteUserCollectiveMutation = gqlV1 /* GraphQL */ `
  mutation DeleteUserCollective($id: Int!) {
    deleteUserCollective(id: $id) {
      id
    }
  }
`;

const { PROJECT, EVENT } = CollectiveType;

const DeleteCollective = ({ collective, ...props }) => {
  const [showModal, setShowModal] = useState(false);
  const [deleteStatus, setDeleteStatus] = useState({ deleting: false, error: null });
  const [deleteCollective] = useMutation(deleteCollectiveMutation, { context: API_V1_CONTEXT });
  const [deleteUserCollective] = useMutation(deleteUserCollectiveMutation, { context: API_V1_CONTEXT });

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
  const hasMoneyManagement = hasAccountMoneyManagement(collective);

  const closeModal = () => setShowModal(false);

  return (
    <div className="mb-8 flex flex-col items-start gap-2">
      <SettingsSectionTitle>
        <FormattedMessage
          id="collective.delete.title"
          defaultMessage="Delete {type, select, EVENT {this Event} PROJECT {this Project} FUND {this Fund} COLLECTIVE {this Collective} ORGANIZATION {this Organization} other {this account}}"
          values={{ type: collective.type }}
        />
      </SettingsSectionTitle>
      <p className="text-sm">
        <FormattedMessage
          id="collective.delete.description"
          defaultMessage="{type, select, EVENT {This Event} PROJECT {This Project} FUND {This Fund} COLLECTIVE {This Collective} ORGANIZATION {This Organization} other {This account}} will be deleted, along with all related data."
          values={{ type: collective.type }}
        />
      </p>
      {error && <MessageBox type="error">{error}</MessageBox>}
      {!collective.isDeletable && ![EVENT, PROJECT].includes(collective.type) ? (
        <MessageBox type="warning">
          <FormattedMessage
            id="collective.delete.isNotDeletable-message"
            defaultMessage="{type, select, EVENT {Events} PROJECT {Projects} FUND {Funds} COLLECTIVE {Collectives} ORGANIZATION {Organizations} other {Accounts}} with transactions, contributions, events or paid expenses cannot be deleted. Please archive it instead."
            values={{ type: collective.type }}
          />
        </MessageBox>
      ) : hasMoneyManagement ? (
        <MessageBox type="warning">
          <FormattedMessage
            id="collective.delete.balance.warning"
            defaultMessage="You can't delete {type, select, ORGANIZATION {your organization} other {your account}} while managing money on the platform. Please disable Money Management (and Fiscal Hosting if enabled) before archiving this account."
            values={{ type: collective.type }}
          />
        </MessageBox>
      ) : !collective.isDeletable && [EVENT, PROJECT].includes(collective.type) ? (
        <MessageBox type="warning">
          <FormattedMessage
            id="collective.event.delete.isNotDeletable-message"
            defaultMessage="{type, select, EVENT {Events} PROJECT {Projects} other {Accounts}} with transactions, contributions or paid expenses cannot be deleted. Please archive it instead."
            values={{ type: collective.type }}
          />
        </MessageBox>
      ) : null}
      <Button
        onClick={() => setShowModal(true)}
        loading={deleting}
        disabled={hasMoneyManagement || !collective.isDeletable}
        variant="outline"
      >
        <FormattedMessage
          id="collective.delete.title"
          defaultMessage="Delete {type, select, EVENT {this Event} PROJECT {this Project} FUND {this Fund} COLLECTIVE {this Collective} ORGANIZATION {this Organization} other {this account}}"
          values={{ type: collective.type }}
        />
      </Button>
      {showModal && (
        <StyledModal onClose={closeModal}>
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
          <ModalFooter showDivider={false}>
            <div className="flex justify-between gap-2">
              <Button variant="outline" onClick={() => setShowModal(false)}>
                <FormattedMessage id="actions.cancel" defaultMessage="Cancel" />
              </Button>
              <Button
                data-cy="delete"
                onClick={() => {
                  setShowModal(false);
                  handleDelete();
                }}
              >
                <FormattedMessage id="actions.delete" defaultMessage="Delete" />
              </Button>
            </div>
          </ModalFooter>
        </StyledModal>
      )}
    </div>
  );
};

export default withUser(withRouter(DeleteCollective));
