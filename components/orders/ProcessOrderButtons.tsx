import React from 'react';
import PropTypes from 'prop-types';
import { useMutation } from '@apollo/client';
import { Check as ApproveIcon } from '@styled-icons/fa-solid/Check';
import { Times as RejectIcon } from '@styled-icons/fa-solid/Times';
import { FormattedMessage, useIntl } from 'react-intl';
import styled from 'styled-components';

import { i18nGraphqlException } from '../../lib/errors';
import { API_V2_CONTEXT, gql } from '../../lib/graphql/helpers';

import ConfirmationModal from '../ConfirmationModal';
import ContributionConfirmationModal from '../ContributionConfirmationModal';
import StyledButton from '../StyledButton';
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

const ButtonLabel = styled.span({ marginLeft: 6 });

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
  const mutationOptions = { context: API_V2_CONTEXT };
  const [processOrder, { loading }] = useMutation(processPendingOrderMutation, mutationOptions);
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
      buttonSize: 'tiny',
      minWidth: 130,
      mx: 2,
      mt: 2,
      py: '9px',
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
        <StyledButton
          {...getButtonProps('MARK_AS_PAID')}
          onClick={() => setShowContributionConfirmationModal(true)}
          buttonStyle="successSecondary"
        >
          <ApproveIcon size={12} />
          <ButtonLabel>
            <FormattedMessage id="order.markAsCompleted" defaultMessage="Mark as completed" />
          </ButtonLabel>
        </StyledButton>
      )}
      {permissions.canMarkAsExpired && (
        <StyledButton {...getButtonProps('MARK_AS_EXPIRED')} buttonStyle="dangerSecondary">
          <RejectIcon size={14} />
          <ButtonLabel>
            <FormattedMessage id="order.markAsExpired" defaultMessage="Mark as expired" />
          </ButtonLabel>
        </StyledButton>
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
      {showContributionConfirmationModal && (
        <ContributionConfirmationModal
          order={order}
          onClose={() => setShowContributionConfirmationModal(false)}
          onSuccess={onSuccess}
        />
      )}
    </React.Fragment>
  );
};

ProcessOrderButtons.propTypes = {
  permissions: PropTypes.shape({
    canMarkAsExpired: PropTypes.bool,
    canMarkAsPaid: PropTypes.bool,
  }).isRequired,
  order: PropTypes.shape({
    id: PropTypes.string,
    legacyId: PropTypes.number,
    paymentMethod: PropTypes.object,
  }).isRequired,
  onError: PropTypes.func,
  onSuccess: PropTypes.func,
};

export default ProcessOrderButtons;
