import React from 'react';
import PropTypes from 'prop-types';
import { Mutation } from '@apollo/client/react/components';
import { Check } from '@styled-icons/feather/Check';
import { Download as IconDownload } from '@styled-icons/feather/Download';
import { Edit as IconEdit } from '@styled-icons/feather/Edit';
import { Link as IconLink } from '@styled-icons/feather/Link';
import { Trash2 as IconTrash } from '@styled-icons/feather/Trash2';
import { FormattedMessage } from 'react-intl';

import expenseTypes from '../../lib/constants/expenseTypes';
import { API_V2_CONTEXT, gqlV2 } from '../../lib/graphql/helpers';
import useClipboard from '../../lib/hooks/useClipboard';

import ConfirmationModal from '../ConfirmationModal';
import Link from '../Link';
import StyledRoundButton from '../StyledRoundButton';
import StyledTooltip from '../StyledTooltip';

import ExpenseInvoiceDownloadHelper from './ExpenseInvoiceDownloadHelper';

const deleteExpenseMutation = gqlV2/* GraphQL */ `
  mutation DeleteExpense($id: String!) {
    deleteExpense(expense: { id: $id }) {
      id
    }
  }
`;

const ButtonWithLabel = ({ label, icon, size, tooltipPosition, ...props }) => {
  return (
    <StyledTooltip content={label} delayHide={0} place={tooltipPosition}>
      {tiggerProps => (
        <StyledRoundButton size={size} m={2} {...props} {...tiggerProps}>
          {icon}
        </StyledRoundButton>
      )}
    </StyledTooltip>
  );
};

ButtonWithLabel.propTypes = {
  label: PropTypes.node,
  icon: PropTypes.node,
  size: PropTypes.number,
  tooltipPosition: PropTypes.string,
};

ButtonWithLabel.defaultProps = {
  size: 40,
};

/**
 * Admin buttons for the expense, displayed in a React fragment to let parent
 * in control of the layout.
 */
const ExpenseAdminActions = ({
  expense,
  collective,
  permissions,
  onError,
  onEdit,
  isDisabled,
  buttonProps,
  linkAction,
  onDelete,
}) => {
  const [hasDeleteConfirm, showDeleteConfirm] = React.useState(false);
  const { isCopied, copy } = useClipboard();

  return (
    <React.Fragment>
      {linkAction === 'copy' ? (
        <ButtonWithLabel
          onClick={() => copy(window.location.href.replace('?createSuccess=true', ''))}
          disabled={isDisabled}
          icon={isCopied ? <Check size="50%" /> : <IconLink size="50%" />}
          {...buttonProps}
          label={
            isCopied ? (
              <FormattedMessage id="Clipboard.Copied" defaultMessage="Copied!" />
            ) : (
              <FormattedMessage id="CopyLink" defaultMessage="Copy link" />
            )
          }
        />
      ) : (
        <Link route="expense-v2" params={{ collectiveSlug: collective.slug, ExpenseId: expense.legacyId }}>
          <ButtonWithLabel
            onClick={() => copy(window.location.href.replace('?createSuccess=true', ''))}
            disabled={isDisabled}
            icon={<IconLink size="50%" />}
            label={
              <span>
                <FormattedMessage id="Transactions.Modal.ExpenseLink" defaultMessage="Go to expense" /> →
              </span>
            }
            {...buttonProps}
          />
        </Link>
      )}
      {permissions?.canSeeInvoiceInfo && expense?.type === expenseTypes.INVOICE && (
        <ExpenseInvoiceDownloadHelper expense={expense} collective={collective} onError={onError}>
          {({ isLoading, downloadInvoice }) => (
            <ButtonWithLabel
              loading={isLoading}
              onClick={downloadInvoice}
              disabled={isDisabled}
              label={<FormattedMessage id="actions.download" defaultMessage="Download" />}
              icon={<IconDownload size="50%" />}
              {...buttonProps}
            />
          )}
        </ExpenseInvoiceDownloadHelper>
      )}
      {permissions?.canEdit && (
        <ButtonWithLabel
          onClick={onEdit}
          disabled={isDisabled}
          data-cy="edit-expense-btn"
          icon={<IconEdit size="50%" />}
          label={<FormattedMessage id="Edit" defaultMessage="Edit" />}
          {...buttonProps}
        />
      )}
      {permissions?.canDelete && (
        <React.Fragment>
          <ButtonWithLabel
            buttonStyle="danger"
            data-cy="delete-expense-button"
            disabled={isDisabled}
            onClick={() => showDeleteConfirm(true)}
            icon={<IconTrash size="50%" />}
            label={<FormattedMessage id="actions.delete" defaultMessage="Delete" />}
            {...buttonProps}
          />
          {hasDeleteConfirm && (
            <Mutation mutation={deleteExpenseMutation} context={API_V2_CONTEXT}>
              {deleteExpense => (
                <ConfirmationModal
                  isDanger
                  show
                  type="delete"
                  onClose={() => showDeleteConfirm(false)}
                  header={<FormattedMessage id="actions.delete" defaultMessage="Delete" />}
                  continueHandler={async () => {
                    await deleteExpense({ variables: { id: expense.id } });
                    if (onDelete) {
                      await onDelete(expense);
                    }
                    showDeleteConfirm(false);
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
      )}
    </React.Fragment>
  );
};

ExpenseAdminActions.propTypes = {
  isDisabled: PropTypes.bool,
  expense: PropTypes.shape({
    id: PropTypes.string.isRequired,
    legacyId: PropTypes.number.isRequired,
    type: PropTypes.oneOf(Object.values(expenseTypes)),
  }),
  collective: PropTypes.shape({
    slug: PropTypes.string.isRequired,
    type: PropTypes.string.isRequired,
    parent: PropTypes.shape({
      slug: PropTypes.string.isRequired,
    }),
  }),
  permissions: PropTypes.shape({
    canEdit: PropTypes.bool,
    canDelete: PropTypes.bool,
    canSeeInvoiceInfo: PropTypes.bool,
  }),
  /** Called with an error if anything wrong happens */
  onError: PropTypes.func,
  onEdit: PropTypes.func,
  onDelete: PropTypes.func,
  buttonProps: PropTypes.object,
  tooltipPosition: PropTypes.string,
  linkAction: PropTypes.oneOf(['link', 'copy']),
};

ExpenseAdminActions.defaultProps = {
  linkAction: 'copy',
  buttonProps: {
    tooltipPosition: 'left',
  },
};

export default ExpenseAdminActions;
