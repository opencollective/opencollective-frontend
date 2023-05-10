import React from 'react';
import PropTypes from 'prop-types';
import { Check } from '@styled-icons/feather/Check';
import { ChevronDown } from '@styled-icons/feather/ChevronDown/ChevronDown';
import { Download as IconDownload } from '@styled-icons/feather/Download';
import { Edit as IconEdit } from '@styled-icons/feather/Edit';
import { Flag as FlagIcon } from '@styled-icons/feather/Flag';
import { Link as IconLink } from '@styled-icons/feather/Link';
import { Trash2 as IconTrash } from '@styled-icons/feather/Trash2';
import { useRouter } from 'next/router';
import { FormattedMessage } from 'react-intl';
import styled from 'styled-components';
import { margin } from 'styled-system';

import expenseTypes from '../../lib/constants/expenseTypes';
import useProcessExpense from '../../lib/expenses/useProcessExpense';
import useClipboard from '../../lib/hooks/useClipboard';
import { getCollectivePageRoute } from '../../lib/url-helpers';

import ConfirmProcessExpenseModal from './ConfirmProcessExpenseModal';
import ExpenseConfirmDeletion from './ExpenseConfirmDeletionModal';
import ExpenseInvoiceDownloadHelper from './ExpenseInvoiceDownloadHelper';

const Action = styled.button`
  ${margin}
  padding: 16px;
  cursor: pointer;
  line-height: 16px;
  font-size: 14px;
  font-weight: 500;
  border: none;
  background: transparent;
  outline: none;
  text-align: inherit;
  text-transform: capitalize;

  color: ${props => props.theme.colors.black[900]};

  :hover {
    color: ${props => props.theme.colors.black[700]};
  }

  :focus {
    color: ${props => props.theme.colors.black[700]};
    text-decoration: underline;
  }

  &[disabled] {
    color: ${props => props.theme.colors.black[600]};
  }

  > svg {
    margin-right: 14px;
  }
`;

const ExpenseMoreActionsButtons = ({
  expense,
  linkAction,
  collective,
  isDisabled,
  onModalToggle,
  setParentTooltipOpen,
  onEdit,
  onError,
  onDelete,
  isViewingExpenseInHostContext,
}) => {
  const [showMarkAsIncompleteModal, setMarkAsIncompleteModal] = React.useState(false);
  const [hasDeleteConfirm, setDeleteConfirm] = React.useState(false);
  const { isCopied, copy } = useClipboard();
  const router = useRouter();
  const processExpense = useProcessExpense({ expense });
  const permissions = expense?.permissions;
  const showDeleteConfirmMoreActions = isOpen => {
    setDeleteConfirm(isOpen);
    onModalToggle?.(isOpen);
  };

  return (
    <React.Fragment>
      {permissions?.canApprove && isViewingExpenseInHostContext && (
        <Action
          loading={processExpense.loading && processExpense.currentAction === 'APPROVE'}
          disabled={processExpense.loading || isDisabled}
          onClick={async () => {
            setParentTooltipOpen?.(false);
            await processExpense.approve();
          }}
        >
          <Check size={12} />
          <FormattedMessage id="actions.approve" defaultMessage="Approve" />
        </Action>
      )}
      {permissions?.canMarkAsIncomplete && (
        <Action
          disabled={processExpense.loading || isDisabled}
          onClick={() => {
            setMarkAsIncompleteModal(true);
            setParentTooltipOpen?.(false);
          }}
        >
          <FlagIcon size={14} />
          <FormattedMessage id="actions.markAsIncomplete" defaultMessage="Mark as Incomplete" />
        </Action>
      )}
      {permissions?.canDelete && (
        <Action
          data-cy="more-actions-delete-expense-btn"
          onClick={() => showDeleteConfirmMoreActions(true)}
          disabled={processExpense.loading || isDisabled}
        >
          <IconTrash size="16px" />
          <FormattedMessage id="actions.delete" defaultMessage="Delete" />
        </Action>
      )}
      {permissions?.canEdit && (
        <Action data-cy="edit-expense-btn" onClick={onEdit} disabled={processExpense.loading || isDisabled}>
          <IconEdit size="16px" />
          <FormattedMessage id="Edit" defaultMessage="Edit" />
        </Action>
      )}
      {permissions?.canSeeInvoiceInfo && expense?.type === expenseTypes.INVOICE && (
        <ExpenseInvoiceDownloadHelper expense={expense} collective={collective} onError={onError}>
          {({ isLoading, downloadInvoice }) => (
            <Action loading={isLoading} onClick={downloadInvoice} disabled={processExpense.loading || isDisabled}>
              <IconDownload size="16px" />
              {isLoading ? (
                <FormattedMessage id="loading" defaultMessage="loading" />
              ) : (
                <FormattedMessage id="Download" defaultMessage="Download" />
              )}
            </Action>
          )}
        </ExpenseInvoiceDownloadHelper>
      )}
      <Action
        onClick={() =>
          linkAction === 'link'
            ? router.push(`${getCollectivePageRoute(collective)}/expenses/${expense.legacyId}`)
            : copy(window.location.href)
        }
        disabled={processExpense.loading || isDisabled}
      >
        {isCopied ? <Check size="16px" /> : <IconLink size="16px" />}
        {isCopied ? (
          <FormattedMessage id="Clipboard.Copied" defaultMessage="Copied!" />
        ) : (
          <FormattedMessage id="CopyLink" defaultMessage="Copy link" />
        )}
      </Action>
      {showMarkAsIncompleteModal && (
        <ConfirmProcessExpenseModal
          type="MARK_AS_INCOMPLETE"
          expense={expense}
          onClose={() => setMarkAsIncompleteModal(false)}
        />
      )}
      {hasDeleteConfirm && (
        <ExpenseConfirmDeletion
          onDelete={onDelete}
          expense={expense}
          showDeleteConfirmMoreActions={showDeleteConfirmMoreActions}
        />
      )}
    </React.Fragment>
  );
};

ExpenseMoreActionsButtons.propTypes = {
  /** The expense to be processed */
  expense: PropTypes.shape({
    legacyId: PropTypes.number,
    type: PropTypes.string,
    permissions: PropTypes.shape({
      canApprove: PropTypes.bool,
      canMarkAsIncomplete: PropTypes.bool,
      canDelete: PropTypes.bool,
      canEdit: PropTypes.bool,
      canSeeInvoiceInfo: PropTypes.bool,
    }),
  }),
  /** If true, the buttons will be disabled */
  isDisabled: PropTypes.bool,
  /** Called when the modal is toggled */
  onModalToggle: PropTypes.func,
  /** Called when the edit button is clicked */
  onEdit: PropTypes.func,
  /** Called when an error happens */
  onError: PropTypes.func,
  /** Called when the delete button is clicked */
  onDelete: PropTypes.func,
  /** Called when the tooltip is toggled */
  setParentTooltipOpen: PropTypes.func,
  /** If true, the expense is being viewed in the host context */
  isViewingExpenseInHostContext: PropTypes.bool,
  /** The expense's collective */
  collective: PropTypes.object,
  /** The action to perform when clicking on the link button */
  linkAction: PropTypes.oneOf(['link', 'copy']),
};

export default ExpenseMoreActionsButtons;
