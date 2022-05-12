import React from 'react';
import PropTypes from 'prop-types';
import { Check } from '@styled-icons/feather/Check';
import { ChevronDown } from '@styled-icons/feather/ChevronDown/ChevronDown';
import { Download as IconDownload } from '@styled-icons/feather/Download';
import { Edit as IconEdit } from '@styled-icons/feather/Edit';
import { Link as IconLink } from '@styled-icons/feather/Link';
import { useRouter } from 'next/router';
import { FormattedMessage } from 'react-intl';
import styled from 'styled-components';
import { margin } from 'styled-system';

import expenseTypes from '../../lib/constants/expenseTypes';
import useClipboard from '../../lib/hooks/useClipboard';
import { getCollectivePageRoute } from '../../lib/url-helpers';

import { Flex } from '../Grid';
import PopupMenu from '../PopupMenu';
import StyledButton from '../StyledButton';

import ExpenseInvoiceDownloadHelper from './ExpenseInvoiceDownloadHelper';

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

  color: ${props => props.theme.colors[props.color]?.[500] || props.color || props.theme.colors.black[900]};

  :hover {
    color: ${props => props.theme.colors[props.color]?.[300] || props.color || props.theme.colors.black[700]};
  }

  &[disabled] {
    color: ${props => props.theme.colors[props.color]?.[200] || props.color || props.theme.colors.black[600]};
  }

  > svg {
    margin-right: 14px;
  }
`;

/**
 * Admin buttons for the expense, displayed in a React fragment to let parent
 * in control of the layout.
 */
const ExpenseMoreActionsButton = ({ expense, collective, onError, onEdit, isDisabled, linkAction, ...props }) => {
  const { isCopied, copy } = useClipboard();

  const router = useRouter();
  const permissions = expense?.permissions;

  return (
    <PopupMenu
      placement="bottom-end"
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
      <Flex flexDirection="column">
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
                <FormattedMessage id="Download" defaultMessage="Download" />
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
    </PopupMenu>
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
  onEdit: PropTypes.func,
  linkAction: PropTypes.oneOf(['link', 'copy']),
};

ExpenseMoreActionsButton.defaultProps = {
  linkAction: 'copy',
};

export default ExpenseMoreActionsButton;
