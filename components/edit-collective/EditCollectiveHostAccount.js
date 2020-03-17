import React, { useState, useContext } from 'react';
import { FormattedMessage } from 'react-intl';
import PropTypes from 'prop-types';
import gql from 'graphql-tag';
import { graphql } from 'react-apollo';

import { H2, P } from '../Text';
import Container from '../Container';
import StyledButton from '../StyledButton';
// import MessageBox from '../MessageBox';
import Modal, { ModalBody, ModalHeader, ModalFooter } from '../StyledModal';
import { getErrorFromGraphqlException } from '../../lib/errors';
import { GraphQLContext } from '../../lib/graphql/context';

const activateCollectiveAsHostQuery = gql`
  mutation activateCollectiveAsHost($id: Int!) {
    activateCollectiveAsHost(id: $id) {
      id
      isHost
    }
  }
`;

const deactivateCollectiveAsHostQuery = gql`
  mutation deactivateCollectiveAsHost($id: Int!) {
    deactivateCollectiveAsHost(id: $id) {
      id
      isHost
    }
  }
`;

const addActivateCollectiveAsHostMutation = graphql(activateCollectiveAsHostQuery, {
  props: ({ mutate }) => ({
    activateCollectiveAsHost: async id => {
      return await mutate({ variables: { id } });
    },
  }),
});

const addDeactivateCollectiveAsHostMutation = graphql(deactivateCollectiveAsHostQuery, {
  props: ({ mutate }) => ({
    deactivateCollectiveAsHost: async id => {
      return await mutate({ variables: { id } });
    },
  }),
});

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

const EditCollectiveHostAccount = ({ collective, activateCollectiveAsHost, deactivateCollectiveAsHost }) => {
  const collectiveType = getCollectiveType(collective.type);
  const { refetch } = useContext(GraphQLContext);
  const defaultAction = isHostAccount ? 'Activate' : 'Deactivate';
  const [modal, setModal] = useState({ type: defaultAction, show: false });
  const [activationStatus, setaActivationStatus] = useState({
    processing: false,
    isHostAccount: collective.isHost,
    error: null,
    confirmationMsg: '',
  });

  const { processing, isHostAccount, error /* , confirmationMsg */ } = activationStatus;

  const handleActivateAsHost = async ({ activateCollectiveAsHost, id }) => {
    setModal({ type: 'Activate', show: false });
    try {
      setaActivationStatus({ ...activationStatus, processing: true });
      await activateCollectiveAsHost(id);
      await refetch();
      setaActivationStatus({
        ...activationStatus,
        processing: false,
        isHostAccount: true,
        // confirmationMsg: 'The Host status was succesfully activated.',
      });
    } catch (err) {
      const errorMsg = getErrorFromGraphqlException(err).message;
      setaActivationStatus({ ...activationStatus, processing: false, error: errorMsg });
    }
  };

  const handleDeactivateAsHost = async ({ deactivateCollectiveAsHost, id }) => {
    setModal({ type: 'Deactivate', show: false });
    try {
      setaActivationStatus({ ...activationStatus, processing: true });
      await deactivateCollectiveAsHost(id);
      await refetch();
      setaActivationStatus({
        ...activationStatus,
        processing: false,
        isHostAccount: false,
        // confirmationMsg: 'The Host status was succesfully deactivated.',
      });
    } catch (err) {
      const errorMsg = getErrorFromGraphqlException(err).message;
      setaActivationStatus({ ...activationStatus, processing: false, error: errorMsg });
    }
  };

  return (
    <Container display="flex" flexDirection="column" width={1} alignItems="flex-start">
      <H2>
        <FormattedMessage id="Fiscalhost" defaultMessage={'Fiscal Host'} />
      </H2>

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

      <Modal show={modal.show} width="570px" onClose={() => setModal({ ...modal, show: false })}>
        <ModalHeader>
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

EditCollectiveHostAccount.propTypes = {
  collective: PropTypes.object.isRequired,
  activateCollectiveAsHost: PropTypes.func,
  deactivateCollectiveAsHost: PropTypes.func,
};

export default addDeactivateCollectiveAsHostMutation(addActivateCollectiveAsHostMutation(EditCollectiveHostAccount));
