import React, { useContext, useState } from 'react';
import PropTypes from 'prop-types';
import { useMutation } from '@apollo/react-hooks';
import gql from 'graphql-tag';
import { FormattedMessage } from 'react-intl';

import { getErrorFromGraphqlException } from '../../../lib/errors';
import { GraphQLContext } from '../../../lib/graphql/context';

import Container from '../../Container';
import StyledButton from '../../StyledButton';
import Modal, { ModalBody, ModalFooter, ModalHeader } from '../../StyledModal';
import { H2, P } from '../../Text';

const activateCollectiveAsHostMutation = gql`
  mutation ActivateCollectiveAsHost($id: Int!) {
    activateCollectiveAsHost(id: $id) {
      id
      isHost
    }
  }
`;

const deactivateCollectiveAsHostMutation = gql`
  mutation DeactivateCollectiveAsHost($id: Int!) {
    deactivateCollectiveAsHost(id: $id) {
      id
      isHost
    }
  }
`;

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

const FiscalHosting = ({ collective }) => {
  const collectiveType = getCollectiveType(collective.type);
  const { refetch } = useContext(GraphQLContext);
  const [activationStatus, setActivationStatus] = useState({
    processing: false,
    isHostAccount: collective.isHost,
    error: null,
    confirmationMsg: '',
  });

  const { processing, isHostAccount, error } = activationStatus;
  const defaultAction = isHostAccount ? 'Activate' : 'Deactivate';
  const [modal, setModal] = useState({ type: defaultAction, show: false });

  const [activateCollectiveAsHost] = useMutation(activateCollectiveAsHostMutation);
  const [deactivateCollectiveAsHost] = useMutation(deactivateCollectiveAsHostMutation);

  const handleActivateAsHost = async ({ activateCollectiveAsHost, id }) => {
    setModal({ type: 'Activate', show: false });
    try {
      setActivationStatus({ ...activationStatus, processing: true });
      await activateCollectiveAsHost({ variables: { id } });
      await refetch();
      setActivationStatus({
        ...activationStatus,
        processing: false,
        isHostAccount: true,
        // confirmationMsg: 'The Host status was successfully activated.',
      });
    } catch (err) {
      const errorMsg = getErrorFromGraphqlException(err).message;
      setActivationStatus({ ...activationStatus, processing: false, error: errorMsg });
    }
  };

  const handleDeactivateAsHost = async ({ deactivateCollectiveAsHost, id }) => {
    setModal({ type: 'Deactivate', show: false });
    try {
      setActivationStatus({ ...activationStatus, processing: true });
      await deactivateCollectiveAsHost({ variables: { id } });
      await refetch();
      setActivationStatus({
        ...activationStatus,
        processing: false,
        isHostAccount: false,
        // confirmationMsg: 'The Host status was successfully deactivated.',
      });
    } catch (err) {
      const errorMsg = getErrorFromGraphqlException(err).message;
      setActivationStatus({ ...activationStatus, processing: false, error: errorMsg });
    }
  };

  const onClose = () => setModal({ ...modal, show: false });

  return (
    <Container display="flex" flexDirection="column" width={1} alignItems="flex-start">
      {!isHostAccount && (
        <P>
          <FormattedMessage
            id="collective.hostAccount.activate.description"
            defaultMessage={
              'A fiscal host is a legal entity who holds a Collective’s funds in their bank account, and can generate invoices and receipts for backers and sponsors.'
            }
          />
        </P>
      )}

      {isHostAccount && (
        <H2>
          <FormattedMessage id="DeactivateFiscalhost" defaultMessage={'Deactivating as host'} />
        </H2>
      )}

      {isHostAccount && (
        <P>
          <FormattedMessage
            values={{ type: collectiveType.toLowerCase() }}
            id="collective.hostAccount.deactivate.description"
            defaultMessage={
              "After deactivating your organization as host, you will not be able to host collectives anymore. The profile will remain active as an {type}'s profile."
            }
          />
        </P>
      )}

      {error && <P color="#ff5252">{error}</P>}

      {!isHostAccount && (
        <StyledButton onClick={() => setModal({ type: 'Activate', show: true })} loading={processing} disabled={false}>
          <FormattedMessage id="collective.activateAsHost" defaultMessage={'Activate as Host'} />
        </StyledButton>
      )}

      {/* isHostAccount && confirmationMsg && (
        <MessageBox withIcon type="info" mb={4}>
          <FormattedMessage
            values={{ message: confirmationMsg }}
            id="collective.hostAccount.activatedConfirmMessage"
            defaultMessage={'{message}.'}
          />
        </MessageBox>
      )*/}

      {isHostAccount && (
        <StyledButton
          onClick={() => setModal({ type: 'Deactivate', show: true })}
          loading={processing}
          disabled={collective.plan.hostedCollectives > 0}
        >
          <FormattedMessage id="host.deactivate" defaultMessage={'Deactivate as Host'} />
        </StyledButton>
      )}

      {collective.plan.hostedCollectives > 0 && (
        <P color="rgb(224, 183, 0)">
          <FormattedMessage
            values={{ hostedCollectives: collective.plan.hostedCollectives }}
            id="collective.hostAccount.deactivate.isHost"
            defaultMessage={"You can't deactivate hosting while still hosting {hostedCollectives} other collectives."}
          />
        </P>
      )}

      <Modal show={modal.show} width="570px" onClose={onClose}>
        <ModalHeader onClose={onClose}>
          {modal.type === 'Activate' && (
            <FormattedMessage id="collective.activateAsHost" defaultMessage={'Activate as Host'} />
          )}
          {modal.type === 'Deactivate' && (
            <FormattedMessage id="host.deactivate" defaultMessage={'Deactivate as Host'} />
          )}
        </ModalHeader>
        <ModalBody>
          <P mb="1rem">
            <FormattedMessage
              id="collective.hostAccount.modal.description"
              defaultMessage={
                'A fiscal host is a legal company or individual who holds a Collective’s funds in their bank account, and can generate invoices and receipts for Financial Contributors.{br}You can think of a fiscal host as an umbrella organization for the Collectives in it.'
              }
              values={{
                br: <br />,
              }}
            />
          </P>
          <P>
            {modal.type === 'Activate' && (
              <FormattedMessage
                id="collective.hostAccount.modal.activate.body"
                defaultMessage={'Are you sure you want to activate this account as Host?'}
              />
            )}
            {modal.type === 'Deactivate' && (
              <FormattedMessage
                id="collective.hostAccount.modal.deactivate.body"
                defaultMessage={'Are you sure you want to deactivate this account as Host?'}
              />
            )}
          </P>
        </ModalBody>
        <ModalFooter>
          <Container display="flex" justifyContent="flex-end">
            <StyledButton mx={20} onClick={() => setModal({ ...modal, show: false })}>
              <FormattedMessage id="actions.cancel" defaultMessage={'Cancel'} />
            </StyledButton>
            <StyledButton
              buttonStyle="primary"
              data-cy="action"
              onClick={() => {
                if (modal.type === 'Deactivate') {
                  handleDeactivateAsHost({ deactivateCollectiveAsHost, id: collective.id });
                } else {
                  handleActivateAsHost({ activateCollectiveAsHost, id: collective.id });
                }
              }}
            >
              {modal.type === 'Activate' && (
                <FormattedMessage id="collective.activateAsHost" defaultMessage={'Activate as Host'} />
              )}
              {modal.type === 'Deactivate' && (
                <FormattedMessage id="host.deactivate" defaultMessage={'Deactivate as Host'} />
              )}
            </StyledButton>
          </Container>
        </ModalFooter>
      </Modal>
    </Container>
  );
};

FiscalHosting.propTypes = {
  collective: PropTypes.object.isRequired,
  activateCollectiveAsHost: PropTypes.func,
  deactivateCollectiveAsHost: PropTypes.func,
};

export default FiscalHosting;
