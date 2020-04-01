import React from 'react';
import { Download as IconDownload } from '@styled-icons/feather/Download';
import { Link as IconLink } from '@styled-icons/feather/Link';
import { Trash2 as IconTrash } from '@styled-icons/feather/Trash2';
import { PencilAlt } from '@styled-icons/fa-solid/PencilAlt';
import { Check } from '@styled-icons/feather/Check';
import PropTypes from 'prop-types';
import { FormattedMessage } from 'react-intl';
import styled from 'styled-components';

import { fadeIn } from '../StyledKeyframes';
import StyledRoundButton from '../StyledRoundButton';
import ExpenseInvoiceDownloadHelper from './ExpenseInvoiceDownloadHelper';
import expenseTypes from '../../lib/constants/expenseTypes';
import useClipboard from '../../lib/hooks/useClipboard';

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
        <ButtonWithLabel onClick={onEdit} disabled={isDisabled}>
          <PencilAlt size={16} />
          <ButtonLabel>
            <FormattedMessage id="Expense.edit" defaultMessage="Edit expense" />
          </ButtonLabel>
        </ButtonWithLabel>
      )}
      {permissions?.canDelete && (
        <ButtonWithLabel buttonStyle="danger" disabled={isDisabled}>
          <IconTrash size={18} />
          <ButtonLabel>
            <FormattedMessage id="Expense.delete" defaultMessage="Delete expense" />
          </ButtonLabel>
        </ButtonWithLabel>
      )}
    </React.Fragment>
  );
};

ExpenseAdminActions.propTypes = {
  isDisabled: PropTypes.bool,
  expense: PropTypes.shape({
    type: PropTypes.oneOf(Object.values(expenseTypes)),
  }),
  collective: PropTypes.object,
  permissions: PropTypes.shape({
    canEdit: PropTypes.bool,
    canDelete: PropTypes.bool,
    canSeeInvoiceInfo: PropTypes.bool,
  }),
  /** Callback when edit button is clicked */
  onEdit: PropTypes.func,
  /** Called with an error if anything wrong happens */
  onError: PropTypes.func,
};

export default ExpenseAdminActions;
