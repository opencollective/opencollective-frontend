import React, { Fragment, useState } from 'react';
import { useMutation } from '@apollo/client';
import { FormattedMessage } from 'react-intl';

import { getErrorFromGraphqlException } from '../../../lib/errors';
import { API_V2_CONTEXT, gql, gqlV1 } from '../../../lib/graphql/helpers';
import useKeyboardShortcut, { ENTER_KEY } from '../../../lib/hooks/useKeyboardKey';
import { hasAccountHosting, hasAccountMoneyManagement } from '@/lib/collective';
import { editCollectivePageQuery } from '@/lib/graphql/v1/queries';

import MessageBox from '@/components/MessageBox';

import { adminPanelQuery } from '../../dashboard/queries';
import { useModal } from '../../ModalContext';
import StyledModal, { ModalBody, ModalFooter, ModalHeader } from '../../StyledModal';
import { P } from '../../Text';
import { Button } from '../../ui/Button';

import SettingsSectionTitle from './SettingsSectionTitle';

const activateCollectiveAsHostMutation = gqlV1 /* GraphQL */ `
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

const deactivateCollectiveAsHostMutation = gqlV1 /* GraphQL */ `
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

const activateBudgetMutation = gqlV1 /* GraphQL */ `
  mutation ActivateHostBudget($id: Int!) {
    activateBudget(id: $id) {
      id
      isActive
    }
  }
`;

const deactivateBudgetMutation = gqlV1 /* GraphQL */ `
  mutation DeactivateHostBudget($id: Int!) {
    deactivateBudget(id: $id) {
      id
      isActive
    }
  }
`;

const toggleHostAccountsSettingsQuery = gql`
  mutation ToggleHostAccounts($account: AccountReferenceInput!, $key: AccountSettingsKey!, $enabled: JSON!) {
    editAccountSetting(account: $account, key: $key, value: $enabled) {
      id
      name
      settings
    }
  }
`;

const FiscalHosting = ({ collective }) => {
  const hasMoneyManagement = hasAccountMoneyManagement(collective);
  const isBudgetActive = collective.isActive;
  const hasHosting = hasAccountHosting(collective);
  const { showConfirmationModal } = useModal();

  const [activateBudgetStatus, setActivateBudgetStatus] = useState({
    processing: false,
    error: null,
  });

  const [activateBudgetModal, setActivateBudgetModal] = useState({
    type: collective.isActive ? 'Activate' : 'Deactivate',
    show: false,
  });

  const refetchAdminPanelMutationParams = {
    refetchQueries: [
      { query: adminPanelQuery, variables: { slug: collective.slug }, context: API_V2_CONTEXT },
      {
        query: editCollectivePageQuery,
        variables: {
          slug: collective.slug,
        },
      },
    ],
  };
  const [activateAsFiscalEntity] = useMutation(activateCollectiveAsHostMutation);
  const [deactivateAsFiscalEntity] = useMutation(deactivateCollectiveAsHostMutation, refetchAdminPanelMutationParams);
  const [toggleHostAccountsSetting] = useMutation(toggleHostAccountsSettingsQuery, {
    ...refetchAdminPanelMutationParams,
    context: API_V2_CONTEXT,
  });
  const [activateBudget] = useMutation(activateBudgetMutation);
  const [deactivateBudget] = useMutation(deactivateBudgetMutation);

  const handleMoneyManagementUpdate = async ({ id, activate }) => {
    showConfirmationModal({
      title: activate ? (
        <FormattedMessage id="FiscalHosting.moneyManagement.activate" defaultMessage="Activate Money Management" />
      ) : (
        <FormattedMessage id="FiscalHosting.moneyManagement.deactivate" defaultMessage="Deactivate Money Management" />
      ),
      description: (
        <div className="my-4 flex flex-col text-sm">
          <p>
            {activate ? (
              <FormattedMessage defaultMessage="Are you sure you want to activate money management?" id="gqr6ok" />
            ) : (
              <FormattedMessage defaultMessage="Are you sure you want to deactivate money management?" id="kAso3j" />
            )}
          </p>
          {hasHosting && (
            <FormattedMessage
              id="FiscalHosting.moneyManagement.deactivate.warning"
              defaultMessage="Deactivating money management will also deactivate fiscal hosting."
            />
          )}
        </div>
      ),
      onConfirm: async () => {
        if (activate) {
          await activateAsFiscalEntity({ variables: { id } });
        } else {
          await deactivateAsFiscalEntity({ variables: { id } });
        }
      },
      confirmLabel: activate ? (
        <FormattedMessage id="Activate" defaultMessage="Activate" />
      ) : (
        <FormattedMessage id="Deactivate" defaultMessage="Deactivate" />
      ),
    });
  };

  const handleFiscalHostUpdate = async ({ id, activate }) => {
    showConfirmationModal({
      title: activate ? (
        <FormattedMessage id="collective.activateAsHost" defaultMessage="Activate as Host" />
      ) : (
        <FormattedMessage id="host.deactivate" defaultMessage="Deactivate as Host" />
      ),
      description: (
        <div className="my-4 flex flex-col gap-4">
          <p className="text-sm">
            <FormattedMessage
              id="collective.hostAccount.modal.description"
              defaultMessage="A Fiscal Host is a legal entity (company or individual) who holds Collective funds in their bank account, and can generate invoices and receipts for Financial Contributors.{br}Think of a Fiscal Host as an umbrella organization for its Collectives."
              values={{
                br: <br />,
              }}
            />
          </p>
          <p className="text-sm">
            {activate ? (
              <FormattedMessage
                id="collective.hostAccount.modal.activate.body"
                defaultMessage="Are you sure you want to activate this Fiscal Host?"
              />
            ) : (
              <FormattedMessage
                id="collective.hostAccount.modal.deactivate.body"
                defaultMessage="Are you sure you want to deactivate this Fiscal Host?"
              />
            )}
          </p>
        </div>
      ),
      onConfirm: () => {
        return toggleHostAccountsSetting({
          variables: {
            account: { legacyId: id },
            key: 'canHostAccounts',
            enabled: activate ? true : false,
          },
        });
      },
      confirmLabel: activate ? (
        <FormattedMessage id="collective.activateAsHost" defaultMessage="Activate as Host" />
      ) : (
        <FormattedMessage id="host.deactivate" defaultMessage="Deactivate as Host" />
      ),
    });
  };

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
    <div className="mb-10 flex w-full flex-col gap-4">
      <div className="mt-4 flex w-full flex-col gap-2">
        <SettingsSectionTitle>
          <FormattedMessage id="FiscalHosting.moneyManagement" defaultMessage="Money Management" />
        </SettingsSectionTitle>
        <p className="text-sm">
          <FormattedMessage
            id="FiscalHosting.moneyManagement.description"
            defaultMessage="Money management gives you the ability to receive contributions and pay expenses."
          />
        </p>
        <Button
          onClick={() => handleMoneyManagementUpdate({ id: collective.id, activate: !hasMoneyManagement })}
          disabled={hasMoneyManagement && collective.plan.hostedCollectives > 0}
          variant="outline"
          className="my-2 w-fit"
        >
          {hasMoneyManagement ? (
            <FormattedMessage
              id="FiscalHosting.moneyManagement.deactivate"
              defaultMessage="Deactivate Money Management"
            />
          ) : (
            <FormattedMessage id="FiscalHosting.moneyManagement.activate" defaultMessage="Activate Money Management" />
          )}
        </Button>

        {hasMoneyManagement && collective.type === 'ORGANIZATION' && !isBudgetActive && (
          <Fragment>
            <SettingsSectionTitle className="mt-4">
              <FormattedMessage id="FiscalHosting.budget.activate" defaultMessage="Activate Host Budget" />
            </SettingsSectionTitle>
            <p className="text-sm">
              <FormattedMessage
                id="FiscalHosting.budget.activate.description"
                defaultMessage="By activating the Host Budget, it will be able to receive financial contributions and manage expenses."
              />
            </p>
            {activateBudgetStatus.error && <P color="#ff5252">{activateBudgetStatus.error}</P>}
            <Button
              onClick={() => setActivateBudgetModal({ type: 'Activate', show: true })}
              loading={activateBudgetStatus.processing}
              className="mb-2 w-fit"
            >
              <FormattedMessage id="FiscalHosting.budget.activate" defaultMessage="Activate Host Budget" />
            </Button>
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
              <p>
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
              </p>
            </ModalBody>
            <ModalFooter showDivider={false}>
              <div className="flex justify-between gap-2">
                <Button
                  variant="outline"
                  onClick={() => setActivateBudgetModal({ ...activateBudgetModal, show: false })}
                >
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
      </div>

      <div className="mt-4 flex w-full flex-col gap-2">
        <SettingsSectionTitle>
          <FormattedMessage id="editCollective.fiscalHosting" defaultMessage="Fiscal Hosting" />
        </SettingsSectionTitle>
        <p className="text-sm">
          <FormattedMessage
            id="collective.hostAccount.activate.description"
            defaultMessage="A Fiscal Host is a legal entity who holds Collective funds in their bank account, manages payouts, and generates invoices and receipts."
          />
        </p>
        {collective.plan.hostedCollectives > 0 && (
          <MessageBox type="warning">
            <FormattedMessage
              values={{ hostedCollectives: collective.plan.hostedCollectives }}
              id="collective.hostAccount.deactivate.isHost"
              defaultMessage="You are currently hosting {hostedCollectives} Collectives. To deactivate, they need to be moved to a different Host or archived."
            />
          </MessageBox>
        )}
        <Button
          onClick={() => handleFiscalHostUpdate({ id: collective.id, activate: !hasHosting })}
          disabled={!hasMoneyManagement || (hasMoneyManagement && collective.plan.hostedCollectives > 0)}
          variant="outline"
          className="my-2 w-fit"
        >
          {hasHosting ? (
            <FormattedMessage id="host.deactivate" defaultMessage="Deactivate as Host" />
          ) : (
            <FormattedMessage id="collective.activateAsHost" defaultMessage="Activate as Host" />
          )}
        </Button>
      </div>
    </div>
  );
};

export default FiscalHosting;
