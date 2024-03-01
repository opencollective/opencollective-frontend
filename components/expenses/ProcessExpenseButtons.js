import React from 'react';
import PropTypes from 'prop-types';
import { useMutation } from '@apollo/client';
import { InfoCircle } from '@styled-icons/boxicons-regular/InfoCircle';
import { Ban as UnapproveIcon } from '@styled-icons/fa-solid/Ban';
import { Check as ApproveIcon } from '@styled-icons/fa-solid/Check';
import { Times as RejectIcon } from '@styled-icons/fa-solid/Times';
import { defineMessages, FormattedMessage, useIntl } from 'react-intl';
import styled from 'styled-components';

import PERMISSION_CODES, { ReasonMessage } from '../../lib/constants/permissions';
import { i18nGraphqlException } from '../../lib/errors';
import { API_V2_CONTEXT, gql } from '../../lib/graphql/helpers';
import { collectiveAdminsMustConfirmAccountingCategory } from './lib/accounting-categories';

import {
  getScheduledExpensesQueryVariables,
  scheduledExpensesQuery,
} from '../dashboard/sections/expenses/ScheduledExpensesBanner';
import Link from '../Link';
import StyledButton from '../StyledButton';
import StyledTooltip from '../StyledTooltip';
import { useToast } from '../ui/useToast';

import { expensePageExpenseFieldsFragment } from './graphql/fragments';
import ApproveExpenseModal from './ApproveExpenseModal';
import ConfirmProcessExpenseModal from './ConfirmProcessExpenseModal';
import DeleteExpenseButton from './DeleteExpenseButton';
import MarkExpenseAsUnpaidButton from './MarkExpenseAsUnpaidButton';
import PayExpenseButton from './PayExpenseButton';
import { SecurityChecksButton } from './SecurityChecksModal';

const processExpenseMutation = gql`
  mutation ProcessExpense(
    $id: String
    $legacyId: Int
    $action: ExpenseProcessAction!
    $paymentParams: ProcessExpensePaymentParams
  ) {
    processExpense(expense: { id: $id, legacyId: $legacyId }, action: $action, paymentParams: $paymentParams) {
      id
      ...ExpensePageExpenseFields
    }
  }

  ${expensePageExpenseFieldsFragment}
`;

export const ButtonLabel = styled.span({ marginLeft: 6 });

/**
 * A small helper to know if expense process buttons should be displayed
 */
export const hasProcessButtons = permissions => {
  if (!permissions) {
    return false;
  }

  return (
    permissions.canApprove ||
    permissions.canUnapprove ||
    permissions.canReject ||
    permissions.canPay ||
    permissions.canMarkAsUnpaid ||
    permissions.canMarkAsSpam ||
    permissions.canDelete ||
    permissions.canUnschedulePayment
  );
};

const messages = defineMessages({
  markAsSpamWarning: {
    id: 'Expense.MarkAsSpamWarning',
    defaultMessage: 'This will prevent the submitter account to post new expenses. Are you sure?',
  },
});

const getErrorContent = (intl, error, host) => {
  // TODO: The proper way to check for error types is with error.type, not the message
  const message = error?.message;
  if (message) {
    if (message.startsWith('Insufficient Paypal balance')) {
      return {
        title: intl.formatMessage({ defaultMessage: 'Insufficient Paypal balance' }),
        message: (
          <React.Fragment>
            <Link href={`/dashboard/${host.slug}/host-expenses`}>
              <FormattedMessage
                id="PayExpenseModal.RefillBalanceError"
                defaultMessage="Refill your balance from the Host dashboard"
              />
            </Link>
          </React.Fragment>
        ),
      };
    }
  }

  return { message: i18nGraphqlException(intl, error) };
};

const PermissionButton = ({ icon, label, permission, ...props }) => {
  const intl = useIntl();
  let button = (
    <StyledButton {...props} disabled={!permission.allowed}>
      {permission.reason ? <InfoCircle size={14} /> : icon}
      {label}
    </StyledButton>
  );
  const message = permission.reason && intl.formatMessage(ReasonMessage[permission.reason], permission.reasonDetails);
  if (message) {
    button = <StyledTooltip content={message}>{button}</StyledTooltip>;
  }

  return button;
};

PermissionButton.propTypes = {
  icon: PropTypes.element.isRequired,
  label: PropTypes.element.isRequired,
  permission: PropTypes.shape({
    allowed: PropTypes.bool,
    reason: PropTypes.string,
    reasonDetails: PropTypes.object,
  }).isRequired,
};

/**
 * All the buttons to process an expense, displayed in a React.Fragment to let the parent
 * in charge of the layout.
 */
const ProcessExpenseButtons = ({
  expense,
  collective,
  host,
  permissions,
  buttonProps,
  onSuccess,
  onModalToggle,
  onDelete,
  isMoreActions,
  displaySecurityChecks,
  isViewingExpenseInHostContext,
  disabled,
}) => {
  const [confirmProcessExpenseAction, setConfirmProcessExpenseAction] = React.useState();
  const [showApproveExpenseModal, setShowApproveExpenseModal] = React.useState(false);
  const [selectedAction, setSelectedAction] = React.useState(null);
  const onUpdate = (cache, response) => onSuccess?.(response.data.processExpense, cache, selectedAction);
  const mutationOptions = { context: API_V2_CONTEXT, update: onUpdate };
  const [processExpense, { loading, error }] = useMutation(processExpenseMutation, mutationOptions);
  const intl = useIntl();
  const { toast } = useToast();

  React.useEffect(() => {
    onModalToggle?.(!!confirmProcessExpenseAction);
    return () => onModalToggle?.(false);
  }, [confirmProcessExpenseAction, onModalToggle]);

  const triggerAction = async (action, paymentParams) => {
    // Prevent submitting the action if another one is being submitted at the same time
    if (loading) {
      return;
    }

    setSelectedAction(action);

    try {
      const variables = { id: expense.id, legacyId: expense.legacyId, action, paymentParams };
      const refetchQueries = [];
      if (action === 'SCHEDULE_FOR_PAYMENT' || action === 'UNSCHEDULE_PAYMENT') {
        refetchQueries.push({
          query: scheduledExpensesQuery,
          context: API_V2_CONTEXT,
          variables: getScheduledExpensesQueryVariables(host.slug),
        });
      }

      await processExpense({ variables, refetchQueries });
      return true;
    } catch (e) {
      toast({ variant: 'error', ...getErrorContent(intl, e, host) });
      return false;
    }
  };

  const getButtonProps = action => {
    const isSelectedAction = selectedAction === action;
    return {
      ...buttonProps,
      disabled: disabled || (loading && !isSelectedAction),
      loading: loading && isSelectedAction,
    };
  };

  return (
    <React.Fragment>
      {!isViewingExpenseInHostContext &&
        (permissions.approve.allowed || permissions.approve.reason === PERMISSION_CODES.AUTHOR_CANNOT_APPROVE) && (
          <PermissionButton
            {...getButtonProps('APPROVE')}
            onClick={() => {
              if (collectiveAdminsMustConfirmAccountingCategory(collective, host)) {
                setShowApproveExpenseModal(true);
              } else {
                triggerAction('APPROVE');
              }
            }}
            buttonStyle="secondary"
            data-cy="approve-button"
            icon={<ApproveIcon size={12} />}
            permission={permissions.approve}
            label={
              <ButtonLabel>
                <FormattedMessage id="actions.approve" defaultMessage="Approve" />
              </ButtonLabel>
            }
          />
        )}
      {permissions.canPay && (
        <PayExpenseButton
          {...getButtonProps('PAY')}
          onSubmit={triggerAction}
          expense={expense}
          collective={collective}
          host={host}
          error={error}
        />
      )}
      {permissions.canReject && !isViewingExpenseInHostContext && (
        <StyledButton
          {...getButtonProps('REJECT')}
          onClick={() => setConfirmProcessExpenseAction('REJECT')}
          buttonStyle="dangerSecondary"
          data-cy="reject-button"
        >
          <RejectIcon size={14} />
          <ButtonLabel>
            <FormattedMessage id="actions.reject" defaultMessage="Reject" />
          </ButtonLabel>
        </StyledButton>
      )}
      {permissions.canMarkAsSpam && !isMoreActions && (
        <StyledButton
          {...getButtonProps('MARK_AS_SPAM')}
          buttonStyle="dangerSecondary"
          data-cy="spam-button"
          onClick={() => {
            if (confirm(intl.formatMessage(messages.markAsSpamWarning))) {
              triggerAction('MARK_AS_SPAM');
            }
          }}
        >
          <RejectIcon size={14} />
          <ButtonLabel>
            <FormattedMessage id="actions.spam" defaultMessage="Mark as Spam" />
          </ButtonLabel>
        </StyledButton>
      )}

      {permissions.canUnapprove && !isViewingExpenseInHostContext && (
        <StyledButton
          {...getButtonProps('UNAPPROVE')}
          onClick={() => setConfirmProcessExpenseAction('UNAPPROVE')}
          buttonStyle="dangerSecondary"
          data-cy="unapprove-button"
        >
          <UnapproveIcon size={12} />
          <ButtonLabel>
            <FormattedMessage id="expense.unapprove.btn" defaultMessage="Unapprove" />
          </ButtonLabel>
        </StyledButton>
      )}

      {permissions.canUnapprove && isViewingExpenseInHostContext && (
        <StyledButton
          {...getButtonProps('UNAPPROVE')}
          onClick={() => setConfirmProcessExpenseAction('REQUEST_RE_APPROVAL')}
          buttonStyle="dangerSecondary"
          data-cy="request-re-approval-button"
        >
          <UnapproveIcon size={12} />
          <ButtonLabel>
            <FormattedMessage id="expense.requestReApproval.btn" defaultMessage="Request re-approval" />
          </ButtonLabel>
        </StyledButton>
      )}
      {permissions.canUnschedulePayment && (
        <StyledButton
          {...getButtonProps('UNSCHEDULE_PAYMENT')}
          onClick={() => triggerAction('UNSCHEDULE_PAYMENT')}
          buttonStyle="dangerSecondary"
          data-cy="unapprove-button"
        >
          <UnapproveIcon size={12} />
          <ButtonLabel>
            <FormattedMessage id="expense.unschedulePayment.btn" defaultMessage="Unschedule Payment" />
          </ButtonLabel>
        </StyledButton>
      )}
      {permissions.canMarkAsUnpaid && (
        <MarkExpenseAsUnpaidButton
          data-cy="mark-as-unpaid-button"
          expense={expense}
          {...getButtonProps('MARK_AS_UNPAID')}
        />
      )}
      {permissions.canDelete && !isMoreActions && (
        <DeleteExpenseButton
          buttonProps={getButtonProps()}
          expense={expense}
          onModalToggle={onModalToggle}
          onDelete={onDelete}
        />
      )}
      {displaySecurityChecks && expense?.securityChecks?.length > 0 && (
        <SecurityChecksButton {...buttonProps} minWidth={0} expense={expense} />
      )}

      {confirmProcessExpenseAction && (
        <ConfirmProcessExpenseModal
          type={confirmProcessExpenseAction}
          onClose={() => {
            setConfirmProcessExpenseAction(null);
            onModalToggle?.(false);
          }}
          expense={expense}
        />
      )}
      {showApproveExpenseModal && (
        <ApproveExpenseModal
          expense={expense}
          host={host}
          account={collective}
          onConfirm={() => triggerAction('APPROVE')}
          onClose={() => {
            setShowApproveExpenseModal(false);
            onModalToggle?.(false);
          }}
        />
      )}
    </React.Fragment>
  );
};

ProcessExpenseButtons.propTypes = {
  permissions: PropTypes.shape({
    canApprove: PropTypes.bool,
    canUnapprove: PropTypes.bool,
    canReject: PropTypes.bool,
    canMarkAsSpam: PropTypes.bool,
    canPay: PropTypes.bool,
    canMarkAsUnpaid: PropTypes.bool,
    canMarkAsIncomplete: PropTypes.bool,
    canUnschedulePayment: PropTypes.bool,
    canDelete: PropTypes.bool,
    approve: PropTypes.shape({
      allowed: PropTypes.bool,
      reason: PropTypes.string,
    }),
  }).isRequired,
  expense: PropTypes.shape({
    id: PropTypes.string,
    legacyId: PropTypes.number,
    status: PropTypes.string,
    securityChecks: PropTypes.arrayOf(
      PropTypes.shape({
        level: PropTypes.string,
        scope: PropTypes.string,
        message: PropTypes.string,
      }),
    ),
  }).isRequired,
  /** The account where the expense has been submitted */
  collective: PropTypes.object.isRequired,
  host: PropTypes.object,
  /** Props passed to all buttons. Useful to customize sizes, spaces, etc. */
  buttonProps: PropTypes.object,
  showError: PropTypes.bool,
  onSuccess: PropTypes.func,
  /** Called when the expense gets deleted */
  onDelete: PropTypes.func,
  /** Checks if the delete action is inside the more actions button */
  isMoreActions: PropTypes.bool,
  /** Called when a modal is opened/closed with a boolean like (isOpen) */
  onModalToggle: PropTypes.func,
  displayMarkAsIncomplete: PropTypes.bool,
  displaySecurityChecks: PropTypes.bool,
  isViewingExpenseInHostContext: PropTypes.bool,
  disabled: PropTypes.bool,
};

export const DEFAULT_PROCESS_EXPENSE_BTN_PROPS = {
  buttonSize: 'small',
  minWidth: 130,
};

ProcessExpenseButtons.defaultProps = {
  buttonProps: DEFAULT_PROCESS_EXPENSE_BTN_PROPS,
  displaySecurityChecks: true,
  isViewingExpenseInHostContext: false,
};

export default ProcessExpenseButtons;
