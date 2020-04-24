import React from 'react';
import { Mutation } from '@apollo/react-components';
import { Download as IconDownload } from '@styled-icons/feather/Download';
import { Link as IconLink } from '@styled-icons/feather/Link';
import { Trash2 as IconTrash } from '@styled-icons/feather/Trash2';
import { Edit as IconEdit } from '@styled-icons/feather/Edit';
import { Check } from '@styled-icons/feather/Check';
import PropTypes from 'prop-types';
import { FormattedMessage } from 'react-intl';
import styled from 'styled-components';

import { Router } from '../../server/pages';
import { API_V2_CONTEXT, gqlV2 } from '../../lib/graphql/helpers';
import { fadeIn } from '../StyledKeyframes';
import StyledRoundButton from '../StyledRoundButton';
import ExpenseInvoiceDownloadHelper from './ExpenseInvoiceDownloadHelper';
import expenseTypes from '../../lib/constants/expenseTypes';
import useClipboard from '../../lib/hooks/useClipboard';
import ConfirmationModal from '../ConfirmationModal';

const deleteExpenseMutation = gqlV2`
  mutation deleteExpense($id: String!) {
    deleteExpense(expense: {id: $id}) {
      id
    }
  }
`;

const ButtonLabel = styled.div`
  position: absolute;
  background: rgba(10, 10, 10, 0.9);
  right: 50px;
  top: 5px;
  width: 154px;
  padding: 6px;
  color: white;
  border-radius: 4px;
  display: none;
  animation: ${fadeIn} 0.2s;
`;

const ButtonWithLabel = styled(StyledRoundButton).attrs({ size: 40, m: 2 })`
  position: relative;

  &:hover ${ButtonLabel} {
    display: block;
  }
`;

/**
 * Admin buttons for the expense, displayed in a React fragment to let parent
 * in control of the layout.
 */
const ExpenseAdminActions = ({ expense, collective, permissions, onError, onEdit, isDisabled }) => {
  const [hasDeleteConfirm, showDeleteConfirm] = React.useState(false);
  const { isCopied, copy } = useClipboard();

  return (
    <React.Fragment>
      {permissions?.canSeeInvoiceInfo && expense?.type === expenseTypes.INVOICE && (
        <ExpenseInvoiceDownloadHelper expense={expense} collective={collective} onError={onError}>
          {({ isLoading, downloadInvoice }) => (
            <ButtonWithLabel loading={isLoading} onClick={downloadInvoice} disabled={isDisabled}>
              <IconDownload size={18} />
              <ButtonLabel>
                <FormattedMessage id="actions.download" defaultMessage="Download" />
              </ButtonLabel>
            </ButtonWithLabel>
          )}
        </ExpenseInvoiceDownloadHelper>
      )}
      <ButtonWithLabel onClick={() => copy(window.location.href)} disabled={isDisabled}>
        {isCopied ? <Check size={18} /> : <IconLink size={18} />}
        <ButtonLabel>
          {isCopied ? (
            <FormattedMessage id="Clipboard.Copied" defaultMessage="Copied!" />
          ) : (
            <FormattedMessage id="CopyLink" defaultMessage="Copy link" />
          )}
        </ButtonLabel>
      </ButtonWithLabel>
      {permissions?.canEdit && (
        <ButtonWithLabel onClick={onEdit} disabled={isDisabled} data-cy="edit-expense-btn">
          <IconEdit size={16} />
          <ButtonLabel>
            <FormattedMessage id="Edit" defaultMessage="Edit" />
          </ButtonLabel>
        </ButtonWithLabel>
      )}
      {permissions?.canDelete && (
        <React.Fragment>
          <ButtonWithLabel buttonStyle="danger" disabled={isDisabled} onClick={() => showDeleteConfirm(true)}>
            <IconTrash size={18} />
            <ButtonLabel>
              <FormattedMessage id="Expense.delete" defaultMessage="Delete expense" />
            </ButtonLabel>
          </ButtonWithLabel>
          {hasDeleteConfirm && (
            <Mutation mutation={deleteExpenseMutation} context={API_V2_CONTEXT}>
              {deleteExpense => (
                <ConfirmationModal
                  isDanger
                  show
                  type="delete"
                  onClose={() => showDeleteConfirm(false)}
                  header={<FormattedMessage id="deleteExpense.modal.header" defaultMessage="Delete Expense" />}
                  continueHandler={() =>
                    deleteExpense({ variables: { id: expense.id } }).then(() =>
                      Router.replaceRoute('expenses', {
                        parentCollectiveSlug: collective.parentCollective?.slug,
                        collectiveType: collective.parentCollective && 'events',
                        collectiveSlug: collective.slug,
                      }),
                    )
                  }
                >
                  <FormattedMessage
                    id="Expense.DeleteDetails"
                    defaultMessage="This will permanently delete this expense and all attached comments."
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
    type: PropTypes.oneOf(Object.values(expenseTypes)),
  }),
  collective: PropTypes.shape({
    slug: PropTypes.string.isRequired,
    parentCollective: PropTypes.shape({
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
};

export default ExpenseAdminActions;
