import React from 'react';
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
import useLoggedInUser from '../../lib/hooks/useLoggedInUser';
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
    defaultMessage: 'This will prevent the submitter account to post new expenses.',
  },
});

const getErrorContent = (intl, error, host) => {
  // TODO: The proper way to check for error types is with error.type, not the message
  const message = error?.message;
  if (message) {
    if (message.startsWith('Insufficient Paypal balance')) {
      return {
        title: intl.formatMessage({ defaultMessage: 'Insufficient Paypal balance', id: 'BmZrOu' }),
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

/**
 * All the buttons to process an expense, displayed in a React.Fragment to let the parent
 * in charge of the layout.
 */
const ProcessExpenseButtons = ({
  expense,
  collective,
  host,
  permissions,
  buttonProps = DEFAULT_PROCESS_EXPENSE_BTN_PROPS,
  onSuccess,
  onModalToggle,
  onDelete,
  isMoreActions,
  displaySecurityChecks = true,
  isViewingExpenseInHostContext = false,
  disabled,
  enableKeyboardShortcuts,
}) => {
  const [confirmProcessExpenseAction, setConfirmProcessExpenseAction] = React.useState();
  const [showApproveExpenseModal, setShowApproveExpenseModal] = React.useState(false);
  const [selectedAction, setSelectedAction] = React.useState(null);
  const onUpdate = (cache, response) => onSuccess?.(response.data.processExpense, cache, selectedAction);
  const mutationOptions = { context: API_V2_CONTEXT, update: onUpdate };
  const [processExpense, { loading, error }] = useMutation(processExpenseMutation, mutationOptions);
  const intl = useIntl();
  const { toast } = useToast();
  const { LoggedInUser } = useLoggedInUser();

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
          enableKeyboardShortcuts={enableKeyboardShortcuts}
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
            const isSubmitter = expense.createdByAccount.legacyId === LoggedInUser?.CollectiveId;

            if (isSubmitter) {
              toast({
                variant: 'error',
                message: intl.formatMessage({
                  id: 'expense.spam.notAllowed',
                  defaultMessage: "You can't mark your own expenses as spam",
                }),
              });

              return;
            }

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
          className="text-nowrap"
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
        <SecurityChecksButton
          {...buttonProps}
          minWidth={0}
          expense={expense}
          enableKeyboardShortcuts={enableKeyboardShortcuts}
        />
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

export const DEFAULT_PROCESS_EXPENSE_BTN_PROPS = {
  buttonSize: 'small',
  minWidth: 130,
};

export default ProcessExpenseButtons;
