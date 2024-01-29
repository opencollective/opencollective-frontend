import React from 'react';
import PropTypes from 'prop-types';
import { Check } from '@styled-icons/feather/Check';
import { ChevronDown } from '@styled-icons/feather/ChevronDown/ChevronDown';
import { Download as IconDownload } from '@styled-icons/feather/Download';
import { Edit as IconEdit } from '@styled-icons/feather/Edit';
import { Flag as FlagIcon } from '@styled-icons/feather/Flag';
import { Link as IconLink } from '@styled-icons/feather/Link';
import { MinusCircle } from '@styled-icons/feather/MinusCircle';
import { Pause as PauseIcon } from '@styled-icons/feather/Pause';
import { Play as PlayIcon } from '@styled-icons/feather/Play';
import { Trash2 as IconTrash } from '@styled-icons/feather/Trash2';
import { useRouter } from 'next/router';
import { FormattedMessage } from 'react-intl';
import styled from 'styled-components';
import { margin } from 'styled-system';

import expenseTypes from '../../lib/constants/expenseTypes';
import useProcessExpense from '../../lib/expenses/useProcessExpense';
import useClipboard from '../../lib/hooks/useClipboard';
import { getCollectivePageCanonicalURL, getCollectivePageRoute } from '../../lib/url-helpers';

import PopupMenu from '../PopupMenu';
import StyledButton from '../StyledButton';

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
    display: inline-block;
    margin-right: 14px;
  }
`;

/**
 * Admin buttons for the expense, displayed in a React fragment to let parent
 * in control of the layout.
 */
const ExpenseMoreActionsButton = ({
  expense,
  onError,
  onEdit,
  isDisabled,
  linkAction,
  onModalToggle,
  onDelete,
  ...props
}) => {
  const [processModal, setProcessModal] = React.useState(false);
  const [hasDeleteConfirm, setDeleteConfirm] = React.useState(false);
  const { isCopied, copy } = useClipboard();

  const router = useRouter();
  const permissions = expense?.permissions;

  const processExpense = useProcessExpense({
    expense,
  });

  const showDeleteConfirmMoreActions = isOpen => {
    setDeleteConfirm(isOpen);
    onModalToggle?.(isOpen);
  };

  return (
    <React.Fragment>
      <PopupMenu
        placement="bottom-start"
        Button={({ onClick }) => (
          <StyledButton
            data-cy="more-actions"
            onClick={onClick}
            buttonSize="small"
            minWidth={140}
            flexGrow={1}
            {...props}
          >
            <FormattedMessage defaultMessage="More actions" />
            &nbsp;
            <ChevronDown size="20px" />
          </StyledButton>
        )}
      >
        {({ setOpen }) => (
          <div className="flex flex-col">
            {permissions.canMarkAsSpam && (
              <Action
                disabled={processExpense.loading || isDisabled}
                buttonStyle="dangerSecondary"
                data-cy="spam-button"
                onClick={async () => {
                  setProcessModal('MARK_AS_SPAM');
                  setOpen(false);
                }}
              >
                <FlagIcon size={14} />
                <FormattedMessage id="actions.spam" defaultMessage="Mark as Spam" />
              </Action>
            )}
            {permissions?.canApprove && props.isViewingExpenseInHostContext && (
              <Action
                loading={processExpense.loading && processExpense.currentAction === 'APPROVE'}
                disabled={processExpense.loading || isDisabled}
                onClick={async () => {
                  setOpen(false);
                  await processExpense.approve();
                }}
              >
                <Check size={12} />
                <FormattedMessage id="actions.approve" defaultMessage="Approve" />
              </Action>
            )}
            {permissions?.canReject && props.isViewingExpenseInHostContext && (
              <Action
                loading={processExpense.loading && processExpense.currentAction === 'REJECT'}
                disabled={processExpense.loading || isDisabled}
                onClick={async () => {
                  setProcessModal('REJECT');
                  setOpen(false);
                }}
              >
                <MinusCircle size={12} />
                <FormattedMessage id="actions.reject" defaultMessage="Reject" />
              </Action>
            )}
            {permissions?.canMarkAsIncomplete && (
              <Action
                disabled={processExpense.loading || isDisabled}
                onClick={() => {
                  setProcessModal('MARK_AS_INCOMPLETE');
                  setOpen(false);
                }}
              >
                <FlagIcon size={14} />
                <FormattedMessage id="actions.markAsIncomplete" defaultMessage="Mark as Incomplete" />
              </Action>
            )}
            {permissions?.canHold && (
              <Action
                disabled={processExpense.loading || isDisabled}
                onClick={() => {
                  setProcessModal('HOLD');
                  setOpen(false);
                }}
              >
                <PauseIcon size={14} />
                <FormattedMessage id="actions.hold" defaultMessage="Put On Hold" />
              </Action>
            )}
            {permissions?.canRelease && (
              <Action
                disabled={processExpense.loading || isDisabled}
                onClick={() => {
                  setProcessModal('RELEASE');
                  setOpen(false);
                }}
              >
                <PlayIcon size={14} />
                <FormattedMessage id="actions.release" defaultMessage="Release Hold" />
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
            {permissions?.canSeeInvoiceInfo &&
              [expenseTypes.INVOICE, expenseTypes.SETTLEMENT].includes(expense?.type) && (
                <ExpenseInvoiceDownloadHelper expense={expense} collective={expense.account} onError={onError}>
                  {({ isLoading, downloadInvoice }) => (
                    <Action
                      loading={isLoading}
                      onClick={downloadInvoice}
                      disabled={processExpense.loading || isDisabled}
                      data-cy="download-expense-invoice-btn"
                    >
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
                  ? router.push(`${getCollectivePageRoute(expense.account)}/expenses/${expense.legacyId}`)
                  : copy(`${getCollectivePageCanonicalURL(expense.account)}/expenses/${expense.legacyId}`)
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
          </div>
        )}
      </PopupMenu>
      {processModal && (
        <ConfirmProcessExpenseModal type={processModal} expense={expense} onClose={() => setProcessModal(false)} />
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

ExpenseMoreActionsButton.propTypes = {
  isDisabled: PropTypes.bool,
  expense: PropTypes.shape({
    id: PropTypes.string.isRequired,
    legacyId: PropTypes.number.isRequired,
    type: PropTypes.oneOf(Object.values(expenseTypes)),
    permissions: PropTypes.shape({
      canEdit: PropTypes.bool,
      canSeeInvoiceInfo: PropTypes.bool,
      canMarkAsIncomplete: PropTypes.bool,
    }),
    account: PropTypes.shape({
      slug: PropTypes.string.isRequired,
      type: PropTypes.string.isRequired,
      parent: PropTypes.shape({
        slug: PropTypes.string.isRequired,
      }),
    }),
  }),
  /** Called with an error if anything wrong happens */
  onError: PropTypes.func,
  onDelete: PropTypes.func,
  onModalToggle: PropTypes.func,
  onEdit: PropTypes.func,
  linkAction: PropTypes.oneOf(['link', 'copy']),
  isViewingExpenseInHostContext: PropTypes.bool,
};

ExpenseMoreActionsButton.defaultProps = {
  linkAction: 'copy',
  isViewingExpenseInHostContext: false,
};

export default ExpenseMoreActionsButton;
