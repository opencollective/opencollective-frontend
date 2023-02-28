import React from 'react';
import PropTypes from 'prop-types';
import { gql } from '@apollo/client';
import { Mutation } from '@apollo/client/react/components';
import { FormattedMessage, useIntl } from 'react-intl';

import expenseTypes from '../../lib/constants/expenseTypes';
import { i18nGraphqlException } from '../../lib/errors';
import { API_V2_CONTEXT } from '../../lib/graphql/helpers';

import ConfirmationModal from '../ConfirmationModal';
import { TOAST_TYPE, useToasts } from '../ToastProvider';

export const deleteExpenseMutation = gql`
  mutation DeleteExpense($id: String!) {
    deleteExpense(expense: { id: $id }) {
      id
    }
  }
`;

export const removeExpenseFromCache = (cache, { data: { deleteExpense } }) => {
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

const ExpenseConfirmDeletion = ({ onDelete, showDeleteConfirmMoreActions, expense }) => {
  const { addToast } = useToasts();
  const intl = useIntl();
  return (
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
              addToast({
                type: TOAST_TYPE.SUCCESS,
                message: (
                  <FormattedMessage
                    id="delete.successMessage"
                    defaultMessage="'Expense has been deleted successfully'"
                  />
                ),
              });
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
  );
};

ExpenseConfirmDeletion.propTypes = {
  onDelete: PropTypes.func,
  showDeleteConfirmMoreActions: PropTypes.func,
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
};

export default ExpenseConfirmDeletion;
