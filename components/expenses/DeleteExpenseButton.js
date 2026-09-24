import React from 'react';
import { Trash2 as IconTrash } from '@styled-icons/feather/Trash2';
import { FormattedMessage } from 'react-intl';

import { Span } from '../Text';
import { Button } from '../ui/Button';

import ExpenseConfirmDeletion from './ExpenseConfirmDeletionModal';

const DeleteExpenseButton = ({ expense, onDelete, buttonProps, isDisabled, onModalToggle }) => {
  const [hasDeleteConfirm, setDeleteConfirm] = React.useState(false);
  const showDeleteConfirm = isOpen => {
    setDeleteConfirm(isOpen);
    onModalToggle?.(isOpen);
  };

  return (
    <React.Fragment>
      <Button
        variant="outlineDestructive"
        data-cy="delete-expense-button"
        disabled={isDisabled}
        {...buttonProps}
        onClick={() => showDeleteConfirm(true)}
      >
        <IconTrash size="1em" />
        <Span ml="6px">
          <FormattedMessage id="actions.delete" defaultMessage="Delete" />
        </Span>
      </Button>
      {hasDeleteConfirm && (
        <ExpenseConfirmDeletion
          onDelete={onDelete}
          expense={expense}
          showDeleteConfirmMoreActions={showDeleteConfirm}
        />
      )}
    </React.Fragment>
  );
};

export default DeleteExpenseButton;
