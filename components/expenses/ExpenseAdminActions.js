import React from 'react';
import PropTypes from 'prop-types';
import { Check } from '@styled-icons/feather/Check';
import { Download as IconDownload } from '@styled-icons/feather/Download';
import { Edit as IconEdit } from '@styled-icons/feather/Edit';
import { Link as IconLink } from '@styled-icons/feather/Link';
import { FormattedMessage } from 'react-intl';

import expenseTypes from '../../lib/constants/expenseTypes';
import useClipboard from '../../lib/hooks/useClipboard';

import Link from '../Link';
import StyledRoundButton from '../StyledRoundButton';
import StyledTooltip from '../StyledTooltip';

import ExpenseInvoiceDownloadHelper from './ExpenseInvoiceDownloadHelper';

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
}) => {
  const { isCopied, copy } = useClipboard();

  return (
    <React.Fragment>
      {linkAction === 'copy' ? (
        <ButtonWithLabel
          onClick={() => copy(window.location.href)}
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
        <Link href={`/${collective.slug}/expenses/${expense.legacyId}`}>
          <ButtonWithLabel
            onClick={() => copy(window.location.href)}
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
    canSeeInvoiceInfo: PropTypes.bool,
  }),
  /** Called with an error if anything wrong happens */
  onError: PropTypes.func,
  onEdit: PropTypes.func,
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
