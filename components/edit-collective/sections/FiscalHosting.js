import React, { Fragment, useState } from 'react';
import PropTypes from 'prop-types';
import { gql, useMutation } from '@apollo/client';
import { FormattedMessage } from 'react-intl';

import { getErrorFromGraphqlException } from '../../../lib/errors';
import useKeyboardShortcut, { ENTER_KEY } from '../../../lib/hooks/useKeyboardKey';

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

const activateBudgetMutation = gql`
  mutation ActivateHostBudget($id: Int!) {
    activateBudget(id: $id) {
      id
      isActive
    }
  }
`;

const deactivateBudgetMutation = gql`
  mutation DeactivateHostBudget($id: Int!) {
    deactivateBudget(id: $id) {
      id
      isActive
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
  const isHostAccount = collective.isHost;
  const isBudgetActive = collective.isActive;

  const collectiveType = getCollectiveType(collective.type);
  const [activateAsHostStatus, setActivateAsHostStatus] = useState({
    processing: false,
    error: null,
  });
  const [activateBudgetStatus, setActivateBudgetStatus] = useState({
    processing: false,
    error: null,
  });

  const [activateAsHostModal, setActivateAsHostModal] = useState({
    type: isHostAccount ? 'Activate' : 'Deactivate',
    show: false,
  });
  const [activateBudgetModal, setActivateBudgetModal] = useState({
    type: collective.isActive ? 'Activate' : 'Deactivate',
    show: false,
  });

  const [activateCollectiveAsHost] = useMutation(activateCollectiveAsHostMutation);
  const [deactivateCollectiveAsHost] = useMutation(deactivateCollectiveAsHostMutation);

  const [activateBudget] = useMutation(activateBudgetMutation);
  const [deactivateBudget] = useMutation(deactivateBudgetMutation);

  const handleActivateAsHost = async ({ id }) => {
    setActivateAsHostModal({ type: 'Activate', show: false });
    try {
      setActivateAsHostStatus({ ...activateAsHostStatus, processing: true });
      await activateCollectiveAsHost({ variables: { id } });
      setActivateAsHostStatus({
        ...activateAsHostStatus,
        processing: false,
      });
    } catch (err) {
      const errorMsg = getErrorFromGraphqlException(err).message;
      setActivateAsHostStatus({ ...activateAsHostStatus, processing: false, error: errorMsg });
    }
  };

  const handleDeactivateAsHost = async ({ id }) => {
    setActivateAsHostModal({ type: 'Deactivate', show: false });
    try {
      setActivateAsHostStatus({ ...activateAsHostStatus, processing: true });
      await deactivateCollectiveAsHost({ variables: { id } });
      setActivateAsHostStatus({
        ...activateAsHostStatus,
        processing: false,
      });
    } catch (err) {
      const errorMsg = getErrorFromGraphqlException(err).message;
      setActivateAsHostStatus({ ...activateAsHostStatus, processing: false, error: errorMsg });
    }
  };

  const closeActivateAsHost = () => setActivateAsHostModal({ ...activateAsHostModal, show: false });

  const handleActivateBudget = async ({ id }) => {
    setActivateBudgetModal({ type: 'Activate', show: false });
    try {
      setActivateBudgetStatus({ ...activateBudgetStatus, processing: true });
      await activateBudget({ variables: { id } });
      setActivateBudgetStatus({
        ...activateBudgetStatus,
        processing: false,
      });
    } catch (err) {
      const errorMsg = getErrorFromGraphqlException(err).message;
      setActivateBudgetStatus({ ...activateBudgetStatus, processing: false, error: errorMsg });
    }
  };

  const handleDeactivateBudget = async ({ id }) => {
    setActivateBudgetModal({ type: 'Deactivate', show: false });
    try {
      setActivateBudgetStatus({ ...activateBudgetStatus, processing: true });
      await deactivateBudget({ variables: { id } });
      setActivateBudgetStatus({
        ...activateBudgetStatus,
        processing: false,
      });
    } catch (err) {
      const errorMsg = getErrorFromGraphqlException(err).message;
      setActivateBudgetStatus({ ...activateBudgetStatus, processing: false, error: errorMsg });
    }
  };

  const closeActivateBudget = () => setActivateBudgetModal({ ...activateBudgetModal, show: false });

  const handlePrimaryBtnClick = () => {
    if (activateBudgetModal.type === 'Deactivate') {
      handleDeactivateBudget({ id: collective.id });
    } else {
      handleActivateBudget({ id: collective.id });
    }
  };

  useKeyboardShortcut({ callback: handlePrimaryBtnClick, keyMatch: ENTER_KEY });

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
              "After deactivating your {type} as host, you will not be able to host collectives anymore. The profile will remain active as an {type}'s profile."
            }
          />
        </P>
      )}

      {activateAsHostStatus.error && <P color="#ff5252">{activateAsHostStatus.error}</P>}

      {!isHostAccount && (
        <StyledButton
          onClick={() => setActivateAsHostModal({ type: 'Activate', show: true })}
          loading={activateAsHostStatus.processing}
          disabled={false}
        >
          <FormattedMessage id="collective.activateAsHost" defaultMessage={'Activate as Host'} />
        </StyledButton>
      )}

      {isHostAccount && (
        <StyledButton
          onClick={() => setActivateAsHostModal({ type: 'Deactivate', show: true })}
          loading={activateAsHostStatus.processing}
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

      <Modal show={activateAsHostModal.show} width="570px" onClose={closeActivateAsHost}>
        <ModalHeader onClose={closeActivateAsHost}>
          {activateAsHostModal.type === 'Activate' && (
            <FormattedMessage id="collective.activateAsHost" defaultMessage={'Activate as Host'} />
          )}
          {activateAsHostModal.type === 'Deactivate' && (
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
            {activateAsHostModal.type === 'Activate' && (
              <FormattedMessage
                id="collective.hostAccount.modal.activate.body"
                defaultMessage={'Are you sure you want to activate this account as Host?'}
              />
            )}
            {activateAsHostModal.type === 'Deactivate' && (
              <FormattedMessage
                id="collective.hostAccount.modal.deactivate.body"
                defaultMessage={'Are you sure you want to deactivate this account as Host?'}
              />
            )}
          </P>
        </ModalBody>
        <ModalFooter>
          <Container display="flex" justifyContent="flex-end">
            <StyledButton mx={20} onClick={() => setActivateAsHostModal({ ...activateAsHostModal, show: false })}>
              <FormattedMessage id="actions.cancel" defaultMessage={'Cancel'} />
            </StyledButton>
            <StyledButton
              buttonStyle="primary"
              data-cy="action"
              onClick={() => {
                if (activateAsHostModal.type === 'Deactivate') {
                  handleDeactivateAsHost({ id: collective.id });
                } else {
                  handleActivateAsHost({ id: collective.id });
                }
              }}
            >
              {activateAsHostModal.type === 'Activate' && (
                <FormattedMessage id="collective.activateAsHost" defaultMessage={'Activate as Host'} />
              )}
              {activateAsHostModal.type === 'Deactivate' && (
                <FormattedMessage id="host.deactivate" defaultMessage={'Deactivate as Host'} />
              )}
            </StyledButton>
          </Container>
        </ModalFooter>
      </Modal>

      {isHostAccount && (
        <Fragment>
          {!isBudgetActive && (
            <H2>
              <FormattedMessage id="FiscalHosting.budget.activate" defaultMessage={'Activate Host Budget'} />
            </H2>
          )}

          {isBudgetActive ? (
            <P>
              <FormattedMessage
                id="FiscalHosting.budget.deactivate.description"
                defaultMessage={
                  'Your Host Budget is activated, you can receive financial contributions and manage expenses directly with this Organization.'
                }
              />
            </P>
          ) : (
            <P>
              <FormattedMessage
                id="FiscalHosting.budget.activate.description"
                defaultMessage={
                  'By activating the Host budget, you will be able to receive financial contributions and manage expenses directly with this Organization.'
                }
              />
            </P>
          )}

          {activateBudgetStatus.error && <P color="#ff5252">{activateBudgetStatus.error}</P>}

          {!isBudgetActive && (
            <StyledButton
              onClick={() => setActivateBudgetModal({ type: 'Activate', show: true })}
              loading={activateBudgetStatus.processing}
            >
              <FormattedMessage id="FiscalHosting.budget.activate" defaultMessage={'Activate Host Budget'} />
            </StyledButton>
          )}
        </Fragment>
      )}

      <Modal show={activateBudgetModal.show} width="570px" onClose={closeActivateBudget}>
        <ModalHeader onClose={closeActivateBudget}>
          {activateBudgetModal.type === 'Activate' && (
            <FormattedMessage id="FiscalHosting.budget.activate" defaultMessage={'Activate Host Budget'} />
          )}
          {activateBudgetModal.type === 'Deactivate' && (
            <FormattedMessage id="FiscalHosting.budget.deactivate" defaultMessage={'Deactivate Host Budget'} />
          )}
        </ModalHeader>
        <ModalBody>
          <P>
            {activateBudgetModal.type === 'Activate' && (
              <FormattedMessage
                id="FiscalHosting.budget.modal.activate.body"
                defaultMessage={'Are you sure you want to activate the Host budget?'}
              />
            )}
            {activateBudgetModal.type === 'Deactivate' && (
              <FormattedMessage
                id="FiscalHosting.budget.modal.deactivate.body"
                defaultMessage={'Are you sure you want to deactivate the Host budget?'}
              />
            )}
          </P>
        </ModalBody>
        <ModalFooter>
          <Container display="flex" justifyContent="flex-end">
            <StyledButton mx={20} onClick={() => setActivateBudgetModal({ ...activateBudgetModal, show: false })}>
              <FormattedMessage id="actions.cancel" defaultMessage={'Cancel'} />
            </StyledButton>
            <StyledButton buttonStyle="primary" data-cy="action" onClick={() => handlePrimaryBtnClick()}>
              {activateBudgetModal.type === 'Activate' && (
                <FormattedMessage id="FiscalHosting.budget.activate" defaultMessage={'Activate Host Budget'} />
              )}
              {activateBudgetModal.type === 'Deactivate' && (
                <FormattedMessage id="FiscalHosting.budget.deactivate" defaultMessage={'Deactivate Host Budget'} />
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
};

export default FiscalHosting;
