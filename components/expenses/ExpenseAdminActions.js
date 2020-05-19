import React from 'react';
import PropTypes from 'prop-types';
import { Mutation } from '@apollo/react-components';
import { Check } from '@styled-icons/feather/Check';
import { Download as IconDownload } from '@styled-icons/feather/Download';
import { Edit as IconEdit } from '@styled-icons/feather/Edit';
import { Link as IconLink } from '@styled-icons/feather/Link';
import { Trash2 as IconTrash } from '@styled-icons/feather/Trash2';
import { FormattedMessage } from 'react-intl';
import { usePopper } from 'react-popper';
import styled from 'styled-components';

import { getCollectiveTypeForUrl } from '../../lib/collective.lib';
import expenseTypes from '../../lib/constants/expenseTypes';
import { API_V2_CONTEXT, gqlV2 } from '../../lib/graphql/helpers';
import useClipboard from '../../lib/hooks/useClipboard';
import { useHover } from '../../lib/hooks/useHover';
import { Router } from '../../server/pages';

import ConfirmationModal from '../ConfirmationModal';
import { fadeIn } from '../StyledKeyframes';
import StyledRoundButton from '../StyledRoundButton';

import ExpenseInvoiceDownloadHelper from './ExpenseInvoiceDownloadHelper';

const deleteExpenseMutation = gqlV2/* GraphQL */ `
  mutation DeleteExpense($id: String!) {
    deleteExpense(expense: { id: $id }) {
      id
    }
  }
`;

const ButtonLabel = styled.div`
  background: rgba(10, 10, 10, 0.9);
  min-width: 154px;
  padding: 6px;
  color: white;
  border-radius: 4px;
  text-align: center;
  animation: ${fadeIn} 0.2s;
`;

const REACT_POPPER_MODIFIERS = [
  {
    name: 'offset',
    options: {
      offset: [0, 8],
    },
  },
];

const ButtonWithLabel = ({ label, icon, ...props }) => {
  const [isHovered, hoverProps] = useHover();
  const [referenceElement, setReferenceElement] = React.useState(null);
  const [popperElement, setPopperElement] = React.useState(null);
  const { styles, attributes } = usePopper(referenceElement, popperElement, {
    modifiers: REACT_POPPER_MODIFIERS,
    placement: 'left',
  });

  return (
    <React.Fragment>
      <StyledRoundButton ref={setReferenceElement} size={40} m={2} {...hoverProps} {...props}>
        {icon}
      </StyledRoundButton>
      {isHovered && (
        <ButtonLabel ref={setPopperElement} style={styles.popper} {...attributes.popper}>
          {label}
        </ButtonLabel>
      )}
    </React.Fragment>
  );
};

ButtonWithLabel.propTypes = {
  label: PropTypes.node,
  icon: PropTypes.node,
};

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
        <ExpenseInvoiceDownloadHelper expense={expense} collective={collective} onError={onError} disablePreview>
          {({ isLoading, downloadInvoice }) => (
            <ButtonWithLabel
              loading={isLoading}
              onClick={downloadInvoice}
              disabled={isDisabled}
              label={<FormattedMessage id="actions.download" defaultMessage="Download" />}
              icon={<IconDownload size={18} />}
            />
          )}
        </ExpenseInvoiceDownloadHelper>
      )}
      <ButtonWithLabel
        onClick={() => copy(window.location.href.replace('?createSuccess=true', ''))}
        disabled={isDisabled}
        icon={isCopied ? <Check size={18} /> : <IconLink size={18} />}
        label={
          isCopied ? (
            <FormattedMessage id="Clipboard.Copied" defaultMessage="Copied!" />
          ) : (
            <FormattedMessage id="CopyLink" defaultMessage="Copy link" />
          )
        }
      />
      {permissions?.canEdit && (
        <ButtonWithLabel
          onClick={onEdit}
          disabled={isDisabled}
          data-cy="edit-expense-btn"
          icon={<IconEdit size={16} />}
          label={<FormattedMessage id="Edit" defaultMessage="Edit" />}
        />
      )}
      {permissions?.canDelete && (
        <React.Fragment>
          <ButtonWithLabel
            buttonStyle="danger"
            data-cy="delete-expense-button"
            disabled={isDisabled}
            onClick={() => showDeleteConfirm(true)}
            icon={<IconTrash size={18} />}
            label={<FormattedMessage id="Expense.delete" defaultMessage="Delete expense" />}
          />
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
                        parentCollectiveSlug: collective.parent?.slug,
                        collectiveType: collective.parent ? getCollectiveTypeForUrl(collective) : undefined,
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
};

export default ExpenseAdminActions;
