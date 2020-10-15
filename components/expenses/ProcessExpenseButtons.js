import React from 'react';
import PropTypes from 'prop-types';
import { useMutation } from '@apollo/client';
import { Ban as UnapproveIcon } from '@styled-icons/fa-solid/Ban';
import { Check as ApproveIcon } from '@styled-icons/fa-solid/Check';
import { Times as RejectIcon } from '@styled-icons/fa-solid/Times';
import { FormattedMessage } from 'react-intl';
import styled from 'styled-components';

import { getErrorFromGraphqlException } from '../../lib/errors';
import { API_V2_CONTEXT, gqlV2 } from '../../lib/graphql/helpers';

import MessageBoxGraphqlError from '../MessageBoxGraphqlError';
import StyledButton from '../StyledButton';

import { expensePageExpenseFieldsFragment } from './graphql/fragments';
import MarkExpenseAsUnpaidButton from './MarkExpenseAsUnpaidButton';
import PayExpenseButton from './PayExpenseButton';

const processExpenseMutation = gqlV2/* GraphQL */ `
  mutation ProcessExpense(
    $id: String
    $legacyId: Int
    $action: ExpenseProcessAction!
    $paymentParams: ProcessExpensePaymentParams
  ) {
    processExpense(expense: { id: $id, legacyId: $legacyId }, action: $action, paymentParams: $paymentParams) {
      ...ExpensePageExpenseFields
    }
  }

  ${expensePageExpenseFieldsFragment}
`;

const ButtonLabel = styled.span({ marginLeft: 6 });

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
    permissions.canMarkAsUnpaid
  );
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
  showError,
  onError,
  onSuccess,
}) => {
  const [selectedAction, setSelectedAction] = React.useState(null);
  const mutationOptions = { context: API_V2_CONTEXT };
  const [processExpense, { loading }] = useMutation(processExpenseMutation, mutationOptions);
  const [error, setError] = React.useState(null);

  const triggerAction = async (action, paymentParams) => {
    // Prevent submitting the action if another one is being submitted at the same time
    if (loading) {
      return;
    }

    setSelectedAction(action);

    try {
      const variables = { id: expense.id, legacyId: expense.legacyId, action, paymentParams };
      const processedExpense = await processExpense({ variables });
      if (onSuccess) {
        await onSuccess(processedExpense, action, paymentParams);
      }

      return processedExpense;
    } catch (e) {
      setError(e);
      if (onError && selectedAction !== 'PAY') {
        onError(getErrorFromGraphqlException(e));
      }
    }
  };

  const getButtonProps = (action, hasOnClick = true) => {
    const isSelectedAction = selectedAction === action;
    return {
      ...buttonProps,
      disabled: loading && !isSelectedAction,
      loading: loading && isSelectedAction,
      onClick: hasOnClick ? () => triggerAction(action) : undefined,
    };
  };

  return (
    <React.Fragment>
      {!loading && showError && error && selectedAction !== 'PAY' && (
        <MessageBoxGraphqlError flex="1 0 100%" error={error} />
      )}
      {permissions.canApprove && (
        <StyledButton {...getButtonProps('APPROVE')} buttonStyle="secondary" data-cy="approve-button">
          <ApproveIcon size={12} />
          <ButtonLabel>
            <FormattedMessage id="actions.approve" defaultMessage="Approve" />
          </ButtonLabel>
        </StyledButton>
      )}
      {permissions.canReject && (
        <StyledButton {...getButtonProps('REJECT')} buttonStyle="dangerSecondary" data-cy="reject-button">
          <RejectIcon size={14} />
          <ButtonLabel>
            <FormattedMessage id="actions.reject" defaultMessage="Reject" />
          </ButtonLabel>
        </StyledButton>
      )}
      {permissions.canPay && (
        <PayExpenseButton
          {...getButtonProps('PAY', false)}
          onSubmit={triggerAction}
          expense={expense}
          collective={collective}
          host={host}
          error={error && getErrorFromGraphqlException(error).message}
          resetError={() => setError(null)}
        />
      )}
      {permissions.canUnapprove && (
        <StyledButton {...getButtonProps('UNAPPROVE')} buttonStyle="dangerSecondary" data-cy="unapprove-button">
          <UnapproveIcon size={12} />
          <ButtonLabel>
            <FormattedMessage id="expense.unapprove.btn" defaultMessage="Unapprove" />
          </ButtonLabel>
        </StyledButton>
      )}
      {permissions.canMarkAsUnpaid && (
        <MarkExpenseAsUnpaidButton
          data-cy="mark-as-unpaid-button"
          {...getButtonProps('MARK_AS_UNPAID', false)}
          onConfirm={hasPaymentProcessorFeesRefunded =>
            triggerAction('MARK_AS_UNPAID', {
              paymentProcessorFee: hasPaymentProcessorFeesRefunded ? 1 : 0,
            })
          }
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
    canPay: PropTypes.bool,
    canMarkAsUnpaid: PropTypes.bool,
  }).isRequired,
  expense: PropTypes.shape({
    id: PropTypes.string,
    legacyId: PropTypes.number,
  }).isRequired,
  /** The account where the expense has been submitted */
  collective: PropTypes.object.isRequired,
  host: PropTypes.object,
  /** Props passed to all buttons. Useful to customize sizes, spaces, etc. */
  buttonProps: PropTypes.object,
  showError: PropTypes.bool,
  onError: PropTypes.func,
  onSuccess: PropTypes.func,
};

export const DEFAULT_PROCESS_EXPENSE_BTN_PROPS = {
  buttonSize: 'small',
  minWidth: 130,
  mx: 2,
  mt: 2,
};

ProcessExpenseButtons.defaultProps = {
  buttonProps: DEFAULT_PROCESS_EXPENSE_BTN_PROPS,
  showError: true,
};

export default ProcessExpenseButtons;
