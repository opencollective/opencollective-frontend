import React from 'react';
import PropTypes from 'prop-types';
import { FormattedMessage, useIntl } from 'react-intl';

import { ExpenseStatus } from '../../lib/graphql/types/v2/graphql';
import { i18nExpenseStatus } from '../../lib/i18n/expense';
import { getDashboardRoute } from '../../lib/url-helpers';
import { parseToBoolean } from '../../lib/utils';

import { Flex } from '../Grid';
import I18nFormatters, { getI18nLink } from '../I18nFormatters';
import Link from '../Link';
import StyledTag from '../StyledTag';
import StyledTooltip from '../StyledTooltip';

export const getExpenseStatusMsgType = status => {
  switch (status) {
    case ExpenseStatus.REJECTED:
    case ExpenseStatus.SPAM:
    case ExpenseStatus.ERROR:
      return 'error';
    case ExpenseStatus.PENDING:
    case ExpenseStatus.UNVERIFIED:
    case 'ON_HOLD':
      return 'warning';
    case ExpenseStatus.SCHEDULED_FOR_PAYMENT:
    case ExpenseStatus.APPROVED:
      return 'info';
    case ExpenseStatus.PAID:
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
  status: PropTypes.oneOf([...Object.values(ExpenseStatus), 'COMPLETED', 'REFUNDED']),
};

/**
 * Displays an i18n version of the expense status in a `StyledTag`.
 * The color change in function of the status.
 *
 * Accepts all the props exposed by `StyledTag`.
 */
const ExpenseStatusTag = ({ status, showTaxFormTag = false, payee = null, ...props }) => {
  const tagProps = {
    fontWeight: '600',
    fontSize: '10px',
    letterSpacing: '0.8px',
    textTransform: 'uppercase',
    ...props,
  };

  if (status === ExpenseStatus.UNVERIFIED) {
    return (
      <Flex alignItems="center">
        <BaseTag status={ExpenseStatus.PENDING} {...tagProps} />
        <ExtendedTag {...tagProps}>
          <FormattedMessage id="Unverified" defaultMessage="Unverified" />
        </ExtendedTag>
      </Flex>
    );
  } else if (!showTaxFormTag) {
    return <BaseTag status={status} {...tagProps} />;
  } else if (!payee?.isAdmin) {
    return (
      <Flex alignItems="center">
        <BaseTag status={status} {...tagProps} />
        <ExtendedTag fontSize="10px">
          <FormattedMessage defaultMessage="Tax Form" id="7TBksX" />
        </ExtendedTag>
      </Flex>
    );
  } else {
    return (
      <Flex alignItems="center">
        <BaseTag status={status} {...tagProps} />
        <StyledTooltip
          content={() =>
            parseToBoolean(process.env.TAX_FORMS_USE_LEGACY) ? (
              <FormattedMessage
                id="expenseNeedsTaxForm.hover"
                defaultMessage="We can't pay until we receive your tax info. Check your inbox for an email from HelloWorks. Need help? Contact <SupportLink>support</SupportLink>"
                values={I18nFormatters}
              />
            ) : (
              <FormattedMessage
                id="expenseNeedsTaxForm.new.hover"
                defaultMessage="We can't pay until we receive your tax info. <Link>Click here</Link> to complete your tax form."
                values={{
                  Link: getI18nLink({ as: Link, href: getDashboardRoute(payee, 'tax-information') }),
                }}
              />
            )
          }
        >
          <ExtendedTag fontSize="10px">
            <FormattedMessage defaultMessage="Tax Form" id="7TBksX" />
          </ExtendedTag>
        </StyledTooltip>
      </Flex>
    );
  }
};

ExpenseStatusTag.propTypes = {
  status: PropTypes.oneOf([...Object.values(ExpenseStatus), 'COMPLETED', 'REFUNDED']),
  payee: PropTypes.shape({ isAdmin: PropTypes.bool }),
  showTaxFormTag: PropTypes.bool,
};

export default ExpenseStatusTag;
