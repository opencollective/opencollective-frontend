// @deprecated: Use `useGetExpenseActions` instead
import React from 'react';
import { useLazyQuery, useMutation } from '@apollo/client';
import { InfoCircle } from '@styled-icons/boxicons-regular/InfoCircle';
import { Ban as UnapproveIcon } from '@styled-icons/fa-solid/Ban';
import { Check as ApproveIcon } from '@styled-icons/fa-solid/Check';
import { Times as RejectIcon } from '@styled-icons/fa-solid/Times';
import { pick } from 'lodash';
import { defineMessages, FormattedMessage, useIntl } from 'react-intl';
import { styled } from 'styled-components';

import PERMISSION_CODES, { ReasonMessage } from '../../lib/constants/permissions';
import { i18nGraphqlException } from '../../lib/errors';
import { gql } from '../../lib/graphql/helpers';
import useLoggedInUser from '../../lib/hooks/useLoggedInUser';
import { collectiveAdminsMustConfirmAccountingCategory } from './lib/accounting-categories';
import { ExpenseStatus } from '@/lib/graphql/types/v2/schema';
import { PREVIEW_FEATURE_KEYS } from '@/lib/preview-features';

import { ALL_SECTIONS } from '../dashboard/constants';
import {
  getScheduledExpensesQueryVariables,
  scheduledExpensesQuery,
} from '../dashboard/sections/expenses/ScheduledExpensesBanner';
import Link from '../Link';
import StyledTooltip from '../StyledTooltip';
import { Button } from '../ui/Button';
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
    permissions.canMarkAsPaid ||
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

const getErrorContent = (intl, error, host, LoggedInUser) => {
  // TODO: The proper way to check for error types is with error.type, not the message
  const message = error?.message;
  if (message) {
    if (message.startsWith('Insufficient Paypal balance')) {
      return {
        title: intl.formatMessage({ defaultMessage: 'Insufficient Paypal balance', id: 'BmZrOu' }),
        message: (
          <React.Fragment>
            <Link
              href={`/dashboard/${host.slug}/${LoggedInUser.hasEnabledPreviewFeature(PREVIEW_FEATURE_KEYS.SIDEBAR_REORG_DISBURSEMENTS) ? ALL_SECTIONS.PAY_DISBURSEMENTS : ALL_SECTIONS.HOST_EXPENSES}`}
            >
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
    <Button {...props} disabled={!permission.allowed}>
      {permission.reason ? <InfoCircle size={14} /> : icon}
      {label}
    </Button>
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
  const mutationOptions = { update: onUpdate };
  const [processExpense, { loading, error }] = useMutation(processExpenseMutation, mutationOptions);
  const intl = useIntl();
  const { toast } = useToast();
  const { LoggedInUser } = useLoggedInUser();

  const [getExpenseStatus] = useLazyQuery(
    gql`
      query ProcessExpenseButtonsExpenseStatus($expense: ExpenseReferenceInput!) {
        expense(expense: $expense) {
          id
          legacyId
          status
          ...ExpensePageExpenseFields
        }
      }

      ${expensePageExpenseFieldsFragment}
    `,
    {},
  );

  const waitExpenseStatus = React.useCallback(async () => {
    let maxAttempts = 10;
    while (true) {
      if (maxAttempts-- <= 0) {
        return;
      }

      await new Promise(resolve => setTimeout(resolve, 3000));

      const result = await getExpenseStatus({
        variables: {
          expense: pick(expense, ['id', 'legacyId']),
        },
      });

      if (result.error) {
        continue;
      }

      const updatedExpense = result.data.expense;

      if (updatedExpense.status === ExpenseStatus.PAID || updatedExpense.status === ExpenseStatus.PROCESSING) {
        return;
      }
    }
  }, [getExpenseStatus, expense]);

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

          variables: getScheduledExpensesQueryVariables(host.slug),
        });
      }

      await processExpense({ variables, refetchQueries });

      if (action === 'MARK_AS_PAID_WITH_STRIPE') {
        await waitExpenseStatus();
      }

      return true;
    } catch (e) {
      toast({ variant: 'error', ...getErrorContent(intl, e, host, LoggedInUser) });
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
      {(permissions.canPay || permissions.canMarkAsPaid) && (
        <PayExpenseButton
          {...getButtonProps('PAY')}
          onSubmit={triggerAction}
          expense={expense}
          collective={collective}
          host={host}
          error={error}
          enableKeyboardShortcuts={enableKeyboardShortcuts}
          canPayWithAutomaticPayment={permissions.canPay}
        />
      )}
      {permissions.canReject && !isViewingExpenseInHostContext && (
        <Button
          {...getButtonProps('REJECT')}
          onClick={() => setConfirmProcessExpenseAction('REJECT')}
          variant="outlineDestructive"
          data-cy="reject-button"
        >
          <RejectIcon size={14} />
          <ButtonLabel>
            <FormattedMessage id="actions.reject" defaultMessage="Reject" />
          </ButtonLabel>
        </Button>
      )}
      {permissions.canMarkAsSpam && !isMoreActions && (
        <Button
          {...getButtonProps('MARK_AS_SPAM')}
          variant="outlineDestructive"
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
        </Button>
      )}

      {permissions.canUnapprove && !isViewingExpenseInHostContext && (
        <Button
          {...getButtonProps('UNAPPROVE')}
          onClick={() => setConfirmProcessExpenseAction('UNAPPROVE')}
          variant="outlineDestructive"
          data-cy="unapprove-button"
        >
          <UnapproveIcon size={12} />
          <ButtonLabel>
            <FormattedMessage id="expense.unapprove.btn" defaultMessage="Unapprove" />
          </ButtonLabel>
        </Button>
      )}

      {permissions.canUnapprove && isViewingExpenseInHostContext && (
        <Button
          {...getButtonProps('UNAPPROVE')}
          onClick={() => setConfirmProcessExpenseAction('REQUEST_RE_APPROVAL')}
          variant="outlineDestructive"
          data-cy="request-re-approval-button"
          className="text-nowrap"
        >
          <UnapproveIcon size={12} />
          <ButtonLabel>
            <FormattedMessage id="expense.requestReApproval.btn" defaultMessage="Request re-approval" />
          </ButtonLabel>
        </Button>
      )}
      {permissions.canUnschedulePayment && (
        <Button
          {...getButtonProps('UNSCHEDULE_PAYMENT')}
          onClick={() => triggerAction('UNSCHEDULE_PAYMENT')}
          variant="outlineDestructive"
          data-cy="unapprove-button"
        >
          <UnapproveIcon size={12} />
          <ButtonLabel>
            <FormattedMessage id="expense.unschedulePayment.btn" defaultMessage="Unschedule Payment" />
          </ButtonLabel>
        </Button>
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
          open={!!confirmProcessExpenseAction}
          setOpen={open => {
            if (!open) {
              setConfirmProcessExpenseAction(null);
              onModalToggle?.(false);
            }
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
