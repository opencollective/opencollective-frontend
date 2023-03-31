import React from 'react';
import PropTypes from 'prop-types';
import { FormattedMessage, useIntl } from 'react-intl';

import expenseStatus from '../../lib/constants/expense-status';
import { i18nExpenseStatus } from '../../lib/i18n/expense';

import { Flex } from '../Grid';
import I18nFormatters from '../I18nFormatters';
import StyledTag from '../StyledTag';
import StyledTooltip from '../StyledTooltip';

export const getExpenseStatusMsgType = status => {
  switch (status) {
    case expenseStatus.REJECTED:
    case expenseStatus.SPAM:
    case expenseStatus.ERROR:
      return 'error';
    case expenseStatus.PENDING:
    case expenseStatus.UNVERIFIED:
      return 'warning';
    case expenseStatus.SCHEDULED_FOR_PAYMENT:
    case expenseStatus.APPROVED:
      return 'info';
    case expenseStatus.PAID:
    case 'COMPLETED':
      return 'success';
  }
};

const ExtendedTag = ({ children, ...props }) => (
  <StyledTag
    {...props}
    background="white"
    border="1px solid"
    borderColor="yellow.400"
    color="black.700"
    borderRadius="0px 4px 4px 0px"
    ml="-3px"
    lineHeight="100%"
  >
    {children}
  </StyledTag>
);

ExtendedTag.propTypes = {
  children: PropTypes.any,
};

const BaseTag = ({ status, ...props }) => {
  const intl = useIntl();
  return (
    <StyledTag type={getExpenseStatusMsgType(status)} data-cy="expense-status-msg" {...props}>
      {i18nExpenseStatus(intl, status)}
    </StyledTag>
  );
};

BaseTag.propTypes = {
  status: PropTypes.oneOf(Object.values(expenseStatus)),
};

/**
 * Displays an i18n version of the expense status in a `StyledTag`.
 * The color change in function of the status.
 *
 * Accepts all the props exposed by `StyledTag`.
 */
const ExpenseStatusTag = ({ status, showTaxFormTag, showTaxFormMsg, ...props }) => {
  const tagProps = {
    fontWeight: '600',
    fontSize: '10px',
    letterSpacing: '0.8px',
    textTransform: 'uppercase',
    ...props,
  };

  if (status === expenseStatus.UNVERIFIED) {
    return (
      <Flex alignItems="center">
        <BaseTag status={expenseStatus.PENDING} {...tagProps} />
        <ExtendedTag {...tagProps}>
          <FormattedMessage id="Unverified" defaultMessage="Unverified" />
        </ExtendedTag>
      </Flex>
    );
  } else if (!showTaxFormTag) {
    return <BaseTag status={status} {...tagProps} />;
  } else if (!showTaxFormMsg) {
    return (
      <Flex alignItems="center">
        <BaseTag status={status} {...tagProps} />
        <ExtendedTag>
          <FormattedMessage id="TaxForm" defaultMessage="Tax form" />
        </ExtendedTag>
      </Flex>
    );
  } else {
    return (
      <Flex alignItems="center">
        <BaseTag status={status} {...tagProps} />
        <StyledTooltip
          content={() => (
            <FormattedMessage
              id="expenseNeedsTaxForm.hover"
              defaultMessage="We can't pay until we receive your tax info. Check your inbox for an email from HelloWorks. Need help? Contact <SupportLink>support</SupportLink>"
              values={I18nFormatters}
            />
          )}
        >
          <ExtendedTag>
            <FormattedMessage id="TaxForm" defaultMessage="Tax form" />
          </ExtendedTag>
        </StyledTooltip>
      </Flex>
    );
  }
};

ExpenseStatusTag.propTypes = {
  status: PropTypes.oneOf(Object.values(expenseStatus)),
  showTaxFormMsg: PropTypes.bool,
  showTaxFormTag: PropTypes.bool,
};

export default ExpenseStatusTag;
