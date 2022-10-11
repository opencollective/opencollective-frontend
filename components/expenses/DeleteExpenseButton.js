import React from 'react';
import PropTypes from 'prop-types';
import { gql } from '@apollo/client';
import { Mutation } from '@apollo/client/react/components';
import { Trash2 as IconTrash } from '@styled-icons/feather/Trash2';
import { FormattedMessage, useIntl } from 'react-intl';

import { i18nGraphqlException } from '../../lib/errors';
import { API_V2_CONTEXT } from '../../lib/graphql/helpers';

import ConfirmationModal from '../ConfirmationModal';
import StyledButton from '../StyledButton';
import { Span } from '../Text';
import { TOAST_TYPE, useToasts } from '../ToastProvider';

const deleteExpenseMutation = gql`
  mutation DeleteExpense($id: String!) {
    deleteExpense(expense: { id: $id }) {
      id
    }
  }
`;

const removeExpenseFromCache = (cache, { data: { deleteExpense } }) => {
  cache.modify({
    fields: {
      expenses(existingExpenses, { readField }) {
        if (!existingExpenses?.nodes) {
          return existingExpenses;
        } else {
          return {
            ...existingExpenses,
            totalCount: existingExpenses.totalCount - 1,
            nodes: existingExpenses.nodes.filter(expense => deleteExpense.id !== readField('id', expense)),
          };
        }
      },
    },
  });
};

const DeleteExpenseButton = ({ expense, onDelete, buttonProps, isDisabled, onModalToggle }) => {
  const [hasDeleteConfirm, setDeleteConfirm] = React.useState(false);
  const { addToast } = useToasts();
  const intl = useIntl();
  const showDeleteConfirm = isOpen => {
    setDeleteConfirm(isOpen);
    onModalToggle?.(isOpen);
  };

  return (
    <React.Fragment>
      <StyledButton
        buttonStyle="dangerSecondary"
        data-cy="delete-expense-button"
        disabled={isDisabled}
        {...buttonProps}
        onClick={() => showDeleteConfirm(true)}
      >
        <IconTrash size="1em" />
        <Span ml="6px">
          <FormattedMessage id="actions.delete" defaultMessage="Delete" />
        </Span>
      </StyledButton>
      {hasDeleteConfirm && (
        <Mutation mutation={deleteExpenseMutation} context={API_V2_CONTEXT} update={removeExpenseFromCache}>
          {deleteExpense => (
            <ConfirmationModal
              isDanger
              type="delete"
              onClose={() => showDeleteConfirm(false)}
              header={<FormattedMessage id="actions.delete" defaultMessage="Delete" />}
              continueHandler={async () => {
                try {
                  await deleteExpense({ variables: { id: expense.id } });
                } catch (e) {
                  addToast({ type: TOAST_TYPE.ERROR, message: i18nGraphqlException(intl, e) });
                }

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
  );
};

DeleteExpenseButton.propTypes = {
  isDisabled: PropTypes.bool,
  expense: PropTypes.shape({
    id: PropTypes.string.isRequired,
    legacyId: PropTypes.number.isRequired,
  }),
  onDelete: PropTypes.func,
  buttonProps: PropTypes.object,
  /** Called when a modal is opened/closed with a boolean like (isOpen) */
  onModalToggle: PropTypes.func,
};

export default DeleteExpenseButton;
