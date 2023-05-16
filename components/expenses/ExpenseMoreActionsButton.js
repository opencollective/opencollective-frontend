import React from 'react';
import PropTypes from 'prop-types';
import { ChevronDown } from '@styled-icons/feather/ChevronDown/ChevronDown';
import { FormattedMessage } from 'react-intl';

import expenseTypes from '../../lib/constants/expenseTypes';

import { Flex } from '../Grid';
import PopupMenu from '../PopupMenu';
import StyledButton from '../StyledButton';

import ExpenseMoreActionsButtons from './ExpenseMoreActionsButtons';

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
            <ExpenseMoreActionsButtons
              expense={expense}
              collective={collective}
              linkAction={linkAction}
              onEdit={onEdit}
              isDisabled={isDisabled}
              onModalToggle={onModalToggle}
              onDelete={onDelete}
              onError={onError}
              setParentTooltipOpen={setOpen}
            />
          </Flex>
        )}
      </PopupMenu>
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
  isViewingExpenseInHostContext: PropTypes.bool,
};

ExpenseMoreActionsButton.defaultProps = {
  linkAction: 'copy',
  isViewingExpenseInHostContext: false,
};

export default ExpenseMoreActionsButton;
