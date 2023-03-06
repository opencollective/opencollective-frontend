import React from 'react';
import PropTypes from 'prop-types';
import { Trash2 as IconTrash } from '@styled-icons/feather/Trash2';
import { FormattedMessage } from 'react-intl';

import StyledButton from '../StyledButton';
import { Span } from '../Text';

import ExpenseConfirmDeletion from './ExpenseConfirmDeletionModal';

const DeleteExpenseButton = ({ expense, onDelete, buttonProps, isDisabled, onModalToggle }) => {
  const [hasDeleteConfirm, setDeleteConfirm] = React.useState(false);
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
        <ExpenseConfirmDeletion
          onDelete={onDelete}
          expense={expense}
          showDeleteConfirmMoreActions={showDeleteConfirm}
        />
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
