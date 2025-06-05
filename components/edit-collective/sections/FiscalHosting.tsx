import React, { Fragment, useState } from 'react';
import PropTypes from 'prop-types';
import { useMutation } from '@apollo/client';
import { FormattedMessage } from 'react-intl';

import { getErrorFromGraphqlException } from '../../../lib/errors';
import { API_V2_CONTEXT, gqlV1 } from '../../../lib/graphql/helpers';
import useKeyboardShortcut, { ENTER_KEY } from '../../../lib/hooks/useKeyboardKey';

import Container from '../../Container';
import { adminPanelQuery } from '../../dashboard/queries';
import StyledModal, { ModalBody, ModalFooter, ModalHeader } from '../../StyledModal';
import { P } from '../../Text';
import { Button } from '../../ui/Button';

import SettingsSectionTitle from './SettingsSectionTitle';

const activateCollectiveAsHostMutation = gqlV1/* GraphQL */ `
  mutation ActivateCollectiveAsHost($id: Int!) {
    activateCollectiveAsHost(id: $id) {
      id
      currency
      isActive
      isDeletable
      isHost
      plan {
        id
        name
      }
    }
  }
`;

const deactivateCollectiveAsHostMutation = gqlV1/* GraphQL */ `
  mutation DeactivateCollectiveAsHost($id: Int!) {
    deactivateCollectiveAsHost(id: $id) {
      id
      currency
      isActive
      isDeletable
      isHost
      plan {
        id
        name
      }
    }
  }
`;

const activateBudgetMutation = gqlV1/* GraphQL */ `
  mutation ActivateHostBudget($id: Int!) {
    activateBudget(id: $id) {
      id
      isActive
    }
  }
`;

const deactivateBudgetMutation = gqlV1/* GraphQL */ `
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

  const adminPanelMutationParams = {
    refetchQueries: [{ query: adminPanelQuery, variables: { slug: collective.slug }, context: API_V2_CONTEXT }],
  };
  const [activateCollectiveAsHost] = useMutation(activateCollectiveAsHostMutation, adminPanelMutationParams);
  const [deactivateCollectiveAsHost] = useMutation(deactivateCollectiveAsHostMutation, adminPanelMutationParams);

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
    <Container display="flex" flexDirection="column" width={1} alignItems="flex-start" mb={50}>
      <SettingsSectionTitle>
        <FormattedMessage id="editCollective.fiscalHosting" defaultMessage="Fiscal Hosting" />
      </SettingsSectionTitle>

      {!isHostAccount && (
        <P>
          <FormattedMessage
            id="collective.hostAccount.activate.description"
            defaultMessage="A Fiscal Host is a legal entity who holds Collective funds in their bank account, manages payouts, and generates invoices and receipts."
          />
        </P>
      )}

      {isHostAccount && (
        <P mb={2}>
          <FormattedMessage
            values={{ type: collectiveType.toLowerCase() }}
            id="collective.hostAccount.deactivate.description"
            defaultMessage="After deactivating, you will not be able to act as a Host anymore. The profile will remain active as a {type}."
          />
        </P>
      )}

      {activateAsHostStatus.error && <P color="#ff5252">{activateAsHostStatus.error}</P>}

      {isHostAccount ? (
        <Button
          onClick={() => setActivateAsHostModal({ type: 'Deactivate', show: true })}
          loading={activateAsHostStatus.processing}
          disabled={collective.plan.hostedCollectives > 0}
          variant="outline"
          className="my-2"
        >
          <FormattedMessage id="host.deactivate" defaultMessage="Deactivate as Host" />
        </Button>
      ) : (
        <Button
          onClick={() => setActivateAsHostModal({ type: 'Activate', show: true })}
          loading={activateAsHostStatus.processing}
          disabled={false}
          variant="outline"
          className="my-2"
        >
          <FormattedMessage id="collective.activateAsHost" defaultMessage="Activate as Host" />
        </Button>
      )}

      {collective.plan.hostedCollectives > 0 && (
        <P color="rgb(224, 183, 0)" my={1}>
          <FormattedMessage
            values={{ hostedCollectives: collective.plan.hostedCollectives }}
            id="collective.hostAccount.deactivate.isHost"
            defaultMessage="You are currently hosting {hostedCollectives} Collectives. To deactivate, they need to be moved to a different Host or archived."
          />
        </P>
      )}

      {activateAsHostModal.show && (
        <StyledModal onClose={closeActivateAsHost}>
          <ModalHeader onClose={closeActivateAsHost}>
            {activateAsHostModal.type === 'Activate' && (
              <FormattedMessage id="collective.activateAsHost" defaultMessage="Activate as Host" />
            )}
            {activateAsHostModal.type === 'Deactivate' && (
              <FormattedMessage id="host.deactivate" defaultMessage="Deactivate as Host" />
            )}
          </ModalHeader>
          <ModalBody>
            <P mb="0.65rem">
              <FormattedMessage
                id="collective.hostAccount.modal.description"
                defaultMessage="A Fiscal Host is a legal entity (company or individual) who holds Collective funds in their bank account, and can generate invoices and receipts for Financial Contributors.{br}Think of a Fiscal Host as an umbrella organization for its Collectives."
                values={{
                  br: <br />,
                }}
              />
            </P>
            <P>
              {activateAsHostModal.type === 'Activate' && (
                <FormattedMessage
                  id="collective.hostAccount.modal.activate.body"
                  defaultMessage="Are you sure you want to activate this Fiscal Host?"
                />
              )}
              {activateAsHostModal.type === 'Deactivate' && (
                <FormattedMessage
                  id="collective.hostAccount.modal.deactivate.body"
                  defaultMessage="Are you sure you want to deactivate this Fiscal Host?"
                />
              )}
            </P>
          </ModalBody>
          <ModalFooter showDivider={false}>
            <div className="flex justify-between gap-2">
              <Button variant="outline" onClick={() => setActivateAsHostModal({ ...activateAsHostModal, show: false })}>
                <FormattedMessage id="actions.cancel" defaultMessage="Cancel" />
              </Button>
              <Button
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
                  <FormattedMessage id="collective.activateAsHost" defaultMessage="Activate as Host" />
                )}
                {activateAsHostModal.type === 'Deactivate' && (
                  <FormattedMessage id="host.deactivate" defaultMessage="Deactivate as Host" />
                )}
              </Button>
            </div>
          </ModalFooter>
        </StyledModal>
      )}

      {isHostAccount && (
        <Fragment>
          {!isBudgetActive && collective.type === 'ORGANIZATION' && (
            <SettingsSectionTitle mt={4}>
              <FormattedMessage id="FiscalHosting.budget.activate" defaultMessage="Activate Host Budget" />
            </SettingsSectionTitle>
          )}

          {isBudgetActive && (
            <P mb={2}>
              <FormattedMessage
                id="FiscalHosting.budget.deactivate.description"
                defaultMessage="Your Host Budget is activated. It can receive financial contributions and manage expenses."
              />
            </P>
          )}

          {!isBudgetActive && collective.type === 'ORGANIZATION' && (
            <P mb={2}>
              <FormattedMessage
                id="FiscalHosting.budget.activate.description"
                defaultMessage="By activating the Host Budget, it will be able to receive financial contributions and manage expenses."
              />
            </P>
          )}

          {activateBudgetStatus.error && <P color="#ff5252">{activateBudgetStatus.error}</P>}

          {!isBudgetActive && collective.type === 'ORGANIZATION' && (
            <Button
              onClick={() => setActivateBudgetModal({ type: 'Activate', show: true })}
              loading={activateBudgetStatus.processing}
              className="mb-2"
            >
              <FormattedMessage id="FiscalHosting.budget.activate" defaultMessage="Activate Host Budget" />
            </Button>
          )}
        </Fragment>
      )}

      {activateBudgetModal.show && (
        <StyledModal onClose={closeActivateBudget}>
          <ModalHeader onClose={closeActivateBudget}>
            {activateBudgetModal.type === 'Activate' && (
              <FormattedMessage id="FiscalHosting.budget.activate" defaultMessage="Activate Host Budget" />
            )}
            {activateBudgetModal.type === 'Deactivate' && (
              <FormattedMessage id="FiscalHosting.budget.deactivate" defaultMessage="Deactivate Host Budget" />
            )}
          </ModalHeader>
          <ModalBody>
            <P>
              {activateBudgetModal.type === 'Activate' && (
                <FormattedMessage
                  id="FiscalHosting.budget.modal.activate.body"
                  defaultMessage="Are you sure you want to activate the Host budget?"
                />
              )}
              {activateBudgetModal.type === 'Deactivate' && (
                <FormattedMessage
                  id="FiscalHosting.budget.modal.deactivate.body"
                  defaultMessage="Are you sure you want to deactivate the Host budget?"
                />
              )}
            </P>
          </ModalBody>
          <ModalFooter showDivider={false}>
            <div className="flex justify-between gap-2">
              <Button variant="outline" onClick={() => setActivateBudgetModal({ ...activateBudgetModal, show: false })}>
                <FormattedMessage id="actions.cancel" defaultMessage="Cancel" />
              </Button>
              <Button data-cy="action" onClick={() => handlePrimaryBtnClick()}>
                {activateBudgetModal.type === 'Activate' && (
                  <FormattedMessage id="FiscalHosting.budget.activate" defaultMessage="Activate Host Budget" />
                )}
                {activateBudgetModal.type === 'Deactivate' && (
                  <FormattedMessage id="FiscalHosting.budget.deactivate" defaultMessage="Deactivate Host Budget" />
                )}
              </Button>
            </div>
          </ModalFooter>
        </StyledModal>
      )}
    </Container>
  );
};

FiscalHosting.propTypes = {
  collective: PropTypes.object.isRequired,
};

export default FiscalHosting;
