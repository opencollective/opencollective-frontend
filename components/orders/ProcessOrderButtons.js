import React from 'react';
import { useMutation } from '@apollo/client';
import { Check as ApproveIcon } from '@styled-icons/fa-solid/Check';
import { Times as RejectIcon } from '@styled-icons/fa-solid/Times';
import { FormattedMessage, useIntl } from 'react-intl';

import { i18nGraphqlException } from '../../lib/errors';
import { gql } from '../../lib/graphql/helpers';

import ConfirmationModal from '../ConfirmationModal';
import ContributionConfirmationModal from '../ContributionConfirmationModal';
import { Button } from '../ui/Button';
import { useToast } from '../ui/useToast';

const processPendingOrderMutation = gql`
  mutation ProcessPendingOrder($id: String!, $action: ProcessOrderAction!) {
    processPendingOrder(order: { id: $id }, action: $action) {
      id
      status
      permissions {
        id
        canMarkAsPaid
        canMarkAsExpired
      }
    }
  }
`;

const usablePermissions = ['canMarkAsPaid', 'canMarkAsExpired'];

/**
 * A small helper to know if expense process buttons should be displayed
 */
export const hasProcessButtons = permissions => {
  return Object.keys(permissions).some(
    permission => usablePermissions.includes(permission) && Boolean(permissions[permission]),
  );
};

/**
 * All the buttons to process an expense, displayed in a React.Fragment to let the parent
 * in charge of the layout.
 */
const ProcessOrderButtons = ({ order, permissions, onSuccess }) => {
  const intl = useIntl();
  const { toast } = useToast();
  const [selectedAction, setSelectedAction] = React.useState(null);
  const [processOrder, { loading }] = useMutation(processPendingOrderMutation);
  const [hasConfirm, setConfirm] = React.useState(false);
  const [showContributionConfirmationModal, setShowContributionConfirmationModal] = React.useState(false);

  const triggerAction = async action => {
    // Prevent submitting the action if another one is being submitted at the same time
    if (loading && selectedAction === action) {
      return;
    }

    setSelectedAction(action);
    setConfirm(false);
    try {
      await processOrder({ variables: { id: order.id, action } });
      await Promise.resolve(onSuccess?.());
    } catch (e) {
      toast({ variant: 'error', message: i18nGraphqlException(intl, e) });
    }
  };

  const getButtonProps = action => {
    const isSelectedAction = selectedAction === action;
    return {
      'data-cy': `${action}-button`,
      size: 'xs',
      className: 'min-w-[130px] mx-2 mt-2',
      disabled: loading && !isSelectedAction,
      loading: loading && isSelectedAction,
      onClick: () => {
        setSelectedAction(action);
        setConfirm(true);
      },
    };
  };

  return (
    <React.Fragment>
      {permissions.canMarkAsPaid && (
        <Button
          {...getButtonProps('MARK_AS_PAID')}
          onClick={() => setShowContributionConfirmationModal(true)}
          variant="outlineSuccess"
        >
          <ApproveIcon size={12} />
          <span className="ml-1.5">
            <FormattedMessage id="order.markAsCompleted" defaultMessage="Mark as completed" />
          </span>
        </Button>
      )}
      {permissions.canMarkAsExpired && (
        <Button {...getButtonProps('MARK_AS_EXPIRED')} variant="outlineDestructive">
          <RejectIcon size={14} />
          <span className="ml-1.5">
            <FormattedMessage id="order.markAsExpired" defaultMessage="Mark as expired" />
          </span>
        </Button>
      )}
      {hasConfirm && (
        <ConfirmationModal
          data-cy={`${selectedAction}-confirmation-modal`}
          onClose={() => setConfirm(false)}
          continueHandler={() =>
            triggerAction(selectedAction).then(() => {
              if (selectedAction === 'MARK_AS_EXPIRED') {
                toast({
                  variant: 'success',
                  message: intl.formatMessage({
                    defaultMessage: 'The contribution has been marked as expired',
                    id: '46L6cy',
                  }),
                });
              }
            })
          }
          isDanger={selectedAction === 'MARK_AS_EXPIRED'}
          isSuccess={selectedAction === 'MARK_AS_PAID'}
          continueLabel={
            selectedAction === 'MARK_AS_EXPIRED' ? (
              <FormattedMessage id="order.markAsExpired" defaultMessage="Mark as expired" />
            ) : undefined
          }
          header={
            selectedAction === 'MARK_AS_PAID' ? (
              <FormattedMessage id="Order.MarkPaidConfirm" defaultMessage="Mark this contribution as paid?" />
            ) : (
              <FormattedMessage id="Order.MarkExpiredConfirm" defaultMessage="Mark this contribution as expired?" />
            )
          }
        >
          {selectedAction === 'MARK_AS_PAID' && (
            <FormattedMessage
              id="Order.MarkPaidConfirmDetails"
              defaultMessage="Confirm you have received the funds for this contribution."
            />
          )}
          {selectedAction === 'MARK_AS_EXPIRED' && (
            <FormattedMessage
              id="Order.MarkPaidExpiredDetails"
              defaultMessage="This contribution will be marked as expired removed from Expected Funds. You can find this page by searching for its ID in the search bar or through the status filter in the Financial Contributions page."
            />
          )}
        </ConfirmationModal>
      )}
      <ContributionConfirmationModal
        order={order}
        open={showContributionConfirmationModal}
        setOpen={setShowContributionConfirmationModal}
        onSuccess={onSuccess}
      />
    </React.Fragment>
  );
};

export default ProcessOrderButtons;
