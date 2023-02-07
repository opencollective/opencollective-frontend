import React from 'react';
import PropTypes from 'prop-types';
import { Mutation } from '@apollo/client/react/components';
import { Check } from '@styled-icons/feather/Check';
import { ChevronDown } from '@styled-icons/feather/ChevronDown/ChevronDown';
import { Download as IconDownload } from '@styled-icons/feather/Download';
import { Edit as IconEdit } from '@styled-icons/feather/Edit';
import { Flag as FlagIcon } from '@styled-icons/feather/Flag';
import { Link as IconLink } from '@styled-icons/feather/Link';
import { Trash2 as IconTrash } from '@styled-icons/feather/Trash2';
import { useRouter } from 'next/router';
import { FormattedMessage, useIntl } from 'react-intl';
import styled from 'styled-components';
import { margin } from 'styled-system';

import expenseTypes from '../../lib/constants/expenseTypes';
import { i18nGraphqlException } from '../../lib/errors';
import { API_V2_CONTEXT } from '../../lib/graphql/helpers';
import useClipboard from '../../lib/hooks/useClipboard';
import { getCollectivePageRoute } from '../../lib/url-helpers';

import { deleteExpenseMutation, removeExpenseFromCache } from '../../components/expenses/DeleteExpenseButton';

import ConfirmationModal from '../ConfirmationModal';
import { Flex } from '../Grid';
import PopupMenu from '../PopupMenu';
import StyledButton from '../StyledButton';
import { TOAST_TYPE, useToasts } from '../ToastProvider';

import ExpenseInvoiceDownloadHelper from './ExpenseInvoiceDownloadHelper';
import MarkExpenseAsIncompleteModal from './MarkExpenseAsIncompleteModal';

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

/**
 * Admin buttons for the expense, displayed in a React fragment to let parent
 * in control of the layout.
 */
const ExpenseMoreActionsButton = ({
  expense,
  collective,
  onError,
  onEdit,
  isDisabled,
  linkAction,
  onModalToggle,
  onDelete,
  ...props
}) => {
  const [showMarkAsIncompleteModal, setMarkAsIncompleteModal] = React.useState(false);
  const [hasDeleteConfirm, setDeleteConfirm] = React.useState(false);
  const { isCopied, copy } = useClipboard();
  const { addToast } = useToasts();
  const intl = useIntl();

  const router = useRouter();
  const permissions = expense?.permissions;

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
          <Flex flexDirection="column">
            {permissions?.canMarkAsIncomplete && (
              <Action
                onClick={() => {
                  setMarkAsIncompleteModal(true);
                  setOpen(false);
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
                disabled={isDisabled}
              >
                <IconTrash size="16px" />
                <FormattedMessage id="actions.delete" defaultMessage="Delete" />
              </Action>
            )}
            {permissions?.canEdit && (
              <Action data-cy="edit-expense-btn" onClick={onEdit} disabled={isDisabled}>
                <IconEdit size="16px" />
                <FormattedMessage id="Edit" defaultMessage="Edit" />
              </Action>
            )}
            {permissions?.canSeeInvoiceInfo && expense?.type === expenseTypes.INVOICE && (
              <ExpenseInvoiceDownloadHelper expense={expense} collective={collective} onError={onError}>
                {({ isLoading, downloadInvoice }) => (
                  <Action loading={isLoading} onClick={downloadInvoice} disabled={isDisabled}>
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
              disabled={isDisabled}
            >
              {isCopied ? <Check size="16px" /> : <IconLink size="16px" />}
              {isCopied ? (
                <FormattedMessage id="Clipboard.Copied" defaultMessage="Copied!" />
              ) : (
                <FormattedMessage id="CopyLink" defaultMessage="Copy link" />
              )}
            </Action>
          </Flex>
        )}
      </PopupMenu>
      {showMarkAsIncompleteModal && (
        <MarkExpenseAsIncompleteModal expense={expense} onClose={() => setMarkAsIncompleteModal(false)} />
      )}
      {hasDeleteConfirm && (
        <Mutation mutation={deleteExpenseMutation} context={API_V2_CONTEXT} update={removeExpenseFromCache}>
          {deleteExpense => (
            <ConfirmationModal
              isDanger
              type="delete"
              onClose={() => showDeleteConfirmMoreActions(false)}
              header={<FormattedMessage id="actions.delete" defaultMessage="Delete" />}
              continueHandler={async () => {
                try {
                  await deleteExpense({ variables: { id: expense.id } });
                  addToast({ type: TOAST_TYPE.SUCCESS, message: 'Expense has been deleted successfully' });
                } catch (e) {
                  addToast({ type: TOAST_TYPE.ERROR, message: i18nGraphqlException(intl, e) });
                }

                if (onDelete) {
                  await onDelete(expense);
                }
                showDeleteConfirmMoreActions(false);
              }}
            >
              <FormattedMessage
                id="Expense.DeleteDetails"
                defaultMessage="This will permanently delete the expense and all attachments and comments."
              />
            </ConfirmationModal>
          )}
        </Mutation>
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
  }),
  collective: PropTypes.shape({
    slug: PropTypes.string.isRequired,
    type: PropTypes.string.isRequired,
    parent: PropTypes.shape({
      slug: PropTypes.string.isRequired,
    }),
  }),
  /** Called with an error if anything wrong happens */
  onError: PropTypes.func,
  onDelete: PropTypes.func,
  onModalToggle: PropTypes.func,
  onEdit: PropTypes.func,
  linkAction: PropTypes.oneOf(['link', 'copy']),
};

ExpenseMoreActionsButton.defaultProps = {
  linkAction: 'copy',
};

export default ExpenseMoreActionsButton;
