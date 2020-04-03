import React from 'react';
import PropTypes from 'prop-types';
import { FormattedMessage, FormattedDate, injectIntl } from 'react-intl';
import { Flex, Box } from '@rebass/grid';
import gql from 'graphql-tag';
import styled, { css } from 'styled-components';
import { round, truncate } from 'lodash';

import { ChevronDown } from '@styled-icons/feather/ChevronDown';
import { ChevronUp } from '@styled-icons/feather/ChevronUp';

import { i18nPaymentMethodType } from '../lib/i18n-payment-method-type';
import { TransactionTypes } from '../lib/constants/transactions';
import { formatCurrency } from './../lib/utils';
import { i18nExpenseCategory, i18nExpenseType } from '../lib/i18n-expense';
import ExpenseStatusTag from './expenses/ExpenseStatusTag';
import InvoiceDownloadLink from './expenses/InvoiceDownloadLink';
import { P, Span } from './Text';
import Container from './Container';
import DebitCreditList, { DebitItem, CreditItem } from './DebitCreditList';
import DefinedTerm, { Terms } from './DefinedTerm';
import LinkCollective from './LinkCollective';
import Avatar from './Avatar';
import StyledLink from './StyledLink';
import StyledButton from './StyledButton';
import Link from './Link';

/** A fragment to use for `ExpenseType` items */
export const BudgetItemExpenseTypeFragment = gql`
  fragment BudgetItemExpenseTypeFragment on ExpenseType {
    id
    amount
    description
    createdAt
    category
    currency
    type
    payoutMethod
    status
    transaction {
      id
      uuid
      amount
      netAmountInCollectiveCurrency
      hostFeeInHostCurrency
      platformFeeInHostCurrency
      paymentProcessorFeeInHostCurrency
      taxAmount
      refundTransaction {
        id
      }
      paymentMethod {
        id
        type
      }
    }
    fromCollective {
      id
      slug
      name
      type
      imageUrl
      isIncognito
      host {
        id
        slug
        name
      }
    }
    collective {
      id
      slug
      name
      type
      imageUrl
      isIncognito
      host {
        id
        slug
        name
      }
    }
  }
`;

/** A fragment to use for `Expense` items */
export const BudgetItemExpenseFragment = gql`
  fragment BudgetItemExpenseFragment on Expense {
    id
    uuid
    amount
    netAmountInCollectiveCurrency
    description
    type
    createdAt
    currency
    hostFeeInHostCurrency
    platformFeeInHostCurrency
    paymentProcessorFeeInHostCurrency
    taxAmount
    refundTransaction {
      id
    }
    paymentMethod {
      id
      type
    }
    fromCollective {
      id
      slug
      name
      type
      imageUrl
      isIncognito
      host {
        id
        slug
        name
      }
    }
    collective {
      slug
      name
      type
      isIncognito
    }
    usingVirtualCardFromCollective {
      id
      slug
      name
      type
    }
  }
`;

/** A fragment to use for `Order` items */
export const BudgetItemOrderFragment = gql`
  fragment BudgetItemOrderFragment on Order {
    id
    uuid
    amount
    netAmountInCollectiveCurrency
    description
    type
    createdAt
    currency
    hostFeeInHostCurrency
    platformFeeInHostCurrency
    paymentProcessorFeeInHostCurrency
    taxAmount
    refundTransaction {
      id
    }
    paymentMethod {
      id
      type
    }
    fromCollective {
      id
      slug
      name
      type
      imageUrl
      isIncognito
      host {
        id
        slug
        name
      }
    }
    usingVirtualCardFromCollective {
      id
      slug
      name
      type
    }
  }
`;

const ViewMoreLink = styled.span`
  cursor: pointer;
  border-bottom: 1px dotted #c2c2c2;
  margin: 0 2px;
  padding 1px 2px;
  user-select: none;
  white-space: nowrap;

  &:hover {
    opacity: 0.8;
  }
`;

const DetailsContainer = styled.div`
  display: flex;
  flex-wrap: wrap;
  justify-content: space-between;
  align-items: center;
  background: #f7f8fa;
  box-shadow: 0px 3px 6px -5px #868686 inset;
  font-size: 12px;
  padding: 16px 24px 16px 80px;

  ${props =>
    props.isCompact &&
    css`
      padding: 16px 24px 16px 24px;
    `}

  @media (max-width: 40em) {
    padding: 8px;
  }
`;

const DetailTitle = styled.p`
  margin: 8px 8px 4px 8px;
  font-size: 10px;
  color: #76777a;
  text-transform: uppercase;
`;

const DetailDescription = styled.p`
  margin: 0 8px 8px 8px;
  font-size: 11px;
  color: #4e5052;
`;

const getItemInfo = (item, isInverted) => {
  switch (item.__typename) {
    case 'ExpenseType':
      return {
        isCredit: isInverted,
        amount: item.amount,
        collective: isInverted ? item.collective : item.fromCollective,
        paymentMethod: item.transaction && item.transaction.paymentMethod,
        transaction: item.transaction,
        isExpense: true,
        route: `/${item.collective.slug}/expenses/${item.id}`,
      };
    case 'Expense':
      return {
        isCredit: item.type === TransactionTypes.CREDIT,
        amount: isInverted ? item.netAmountInCollectiveCurrency : item.amount,
        collective: item.fromCollective,
        paymentMethod: item.paymentMethod,
        transaction: item,
        originCollective: item.type === TransactionTypes.CREDIT ? item.fromCollective : item.collective,
      };
    case 'Order':
      return {
        isCredit: item.type === TransactionTypes.CREDIT,
        amount: item.type === TransactionTypes.CREDIT && isInverted ? item.netAmountInCollectiveCurrency : item.amount,
        collective: item.fromCollective,
        paymentMethod: item.paymentMethod,
        transaction: item,
      };
  }
};

/** To separate individual information below description */
const INFO_SEPARATOR = ' | ';

const formatFee = (value, totalAmount, currency, name) => {
  if (!value || !totalAmount) {
    return '';
  } else {
    const percentage = round((value / totalAmount) * 100, 2);
    return ` ${formatCurrency(value, currency)} (${percentage}% ${name})`;
  }
};

const getAmountDetailsStr = (amount, currency, transaction) => {
  const totalAmount = formatCurrency(Math.abs(amount), currency);
  const platformFee = formatFee(transaction.platformFeeInHostCurrency, amount, currency, 'Open Collective fee');
  const hostFee = formatFee(transaction.hostFeeInHostCurrency, amount, currency, 'host fee');
  const pmFee = formatFee(transaction.paymentProcessorFeeInHostCurrency, amount, currency, 'payment processor fee');
  return (
    <React.Fragment>
      <strong>{totalAmount}</strong>
      {hostFee}
      {platformFee}
      {pmFee}
    </React.Fragment>
  );
};

/**
 * A single item
 */
const BudgetItem = ({ item, isInverted, isCompact, canDownloadInvoice, intl }) => {
  const [isExpanded, setExpanded] = React.useState(false);
  const { description, createdAt, currency } = item;
  const { isCredit, amount, paymentMethod, transaction, isExpense, collective, route, originCollective } = getItemInfo(
    item,
    isInverted,
  );
  const ItemContainer = isCredit ? CreditItem : DebitItem;
  const hasRefund = Boolean(transaction && transaction.refundTransaction);
  const hasAccessToInvoice = canDownloadInvoice && transaction && transaction.uuid;
  const hasInvoiceBtn = hasAccessToInvoice && !isExpense && !hasRefund && (!isCredit || !isInverted);

  const formattedDescription = description ? (
    <P color="black.900" fontWeight="600" fontSize="Paragraph" title={description}>
      {truncate(description, { length: 60 })}
    </P>
  ) : (
    <P color="black.500" fontStyle="italic" fontWeight="600" fontSize="Paragraph">
      <FormattedMessage id="NoDescription" defaultMessage="No description provided" />
    </P>
  );

  return (
    <React.Fragment>
      <ItemContainer>
        <Flex
          data-cy={`${isCredit ? 'expenses' : 'contributions'} transactions`}
          p={[3, 24]}
          flexWrap="wrap"
          alignItems={['center', 'flex-start']}
        >
          <Box mr={2} order="1">
            <LinkCollective collective={collective}>
              <Avatar collective={collective} radius={40} />
            </LinkCollective>
          </Box>
          <Flex
            flexDirection="column"
            justifyContent="space-between"
            order={[3, 2]}
            width={['100%', 'auto']}
            flex="1"
            mt={[2, 0]}
            mx={2}
          >
            <Flex data-cy="transaction-description" alignItems="center" flexWrap="wrap">
              {route ? <Link route={route}>{formattedDescription}</Link> : formattedDescription}
              {isExpense && <ExpenseStatusTag status={item.status} ml={3} py="6px" />}
            </Flex>
            <Container data-cy="transaction-details" fontSize="Caption" color="black.500" mt={2}>
              <StyledLink as={LinkCollective} collective={originCollective ? originCollective : collective} />
              {INFO_SEPARATOR}
              {item.usingVirtualCardFromCollective && (
                <React.Fragment>
                  <FormattedMessage
                    id="transaction.usingGiftCardFrom"
                    defaultMessage="using a {giftCard} from {collective}"
                    values={{
                      giftCard: <DefinedTerm term={Terms.GIFT_CARD} textTransform="lowercase" />,
                      collective: <StyledLink as={LinkCollective} collective={item.usingVirtualCardFromCollective} />,
                    }}
                  />
                  {INFO_SEPARATOR}
                </React.Fragment>
              )}
              <span data-cy="transaction-date">
                <FormattedDate value={createdAt} day="2-digit" month="2-digit" year="numeric" />
              </span>
              {INFO_SEPARATOR}
              {isExpanded ? (
                <ViewMoreLink onClick={() => setExpanded(false)}>
                  <FormattedMessage id="closeDetails" defaultMessage="Close Details" />
                  &nbsp;
                  <ChevronUp size="1em" />
                </ViewMoreLink>
              ) : (
                <ViewMoreLink onClick={() => setExpanded(true)}>
                  <FormattedMessage id="viewDetails" defaultMessage="View Details" />
                  &nbsp;
                  <ChevronDown size="1em" />
                </ViewMoreLink>
              )}
            </Container>
          </Flex>
          <Container data-cy="transaction-amount" fontSize="LeadParagraph" ml="auto" order={[2, 3]}>
            <Span
              data-cy="transaction-sign"
              color={isCredit ? 'green.700' : 'red.700'}
              mr={2}
              css={{ verticalAlign: 'text-bottom' }}
            >
              {isCredit ? '+' : '-'}
            </Span>
            <Span fontWeight="bold" mr={1}>
              {formatCurrency(Math.abs(amount), item.currency)}
            </Span>
            <Span color="black.400" textTransform="uppercase">
              {item.currency}
            </Span>
          </Container>
        </Flex>
      </ItemContainer>
      {isExpanded && (
        <DetailsContainer isCompact={isCompact}>
          {collective.host && (
            <div>
              <DetailTitle>
                <FormattedMessage id="Member.Role.HOST" defaultMessage="Host" />
              </DetailTitle>
              <DetailDescription>
                <LinkCollective collective={collective.host} />
              </DetailDescription>
            </div>
          )}
          {isExpense && (
            <React.Fragment>
              <div>
                <DetailTitle>
                  <FormattedMessage id="expense.type" defaultMessage="Type" />
                </DetailTitle>
                <DetailDescription>{i18nExpenseType(intl, item.type)}</DetailDescription>
              </div>
              <div>
                <DetailTitle>
                  <FormattedMessage id="expense.category" defaultMessage="category" />
                </DetailTitle>
                <DetailDescription>{i18nExpenseCategory(intl, item.category)}</DetailDescription>
              </div>
              <div>
                <DetailTitle>
                  <FormattedMessage id="expense.payoutMethod" defaultMessage="payout method" />
                </DetailTitle>
                <DetailDescription>
                  <Span textTransform="capitalize">{item.payoutMethod}</Span>
                </DetailDescription>
              </div>
            </React.Fragment>
          )}
          {paymentMethod && (
            <div>
              <DetailTitle>
                <FormattedMessage id="paymentmethod.label" defaultMessage="Payment Method" />
              </DetailTitle>
              <DetailDescription>{i18nPaymentMethodType(intl, paymentMethod.type)}</DetailDescription>
            </div>
          )}
          {transaction && (
            <div>
              <DetailTitle>
                <FormattedMessage id="transaction.details" defaultMessage="transaction details" />
              </DetailTitle>
              <DetailDescription>{getAmountDetailsStr(amount, currency, transaction)}</DetailDescription>
            </div>
          )}
          {hasInvoiceBtn && (
            <InvoiceDownloadLink type="transaction" transactionUuid={transaction.uuid}>
              {({ loading, download }) => (
                <StyledButton buttonSize="small" loading={loading} onClick={download} minWidth={140} height={30}>
                  <FormattedMessage id="DownloadInvoice" defaultMessage="Download invoice" />
                </StyledButton>
              )}
            </InvoiceDownloadLink>
          )}
        </DetailsContainer>
      )}
    </React.Fragment>
  );
};

BudgetItem.propTypes = {
  /** The actual item to display */
  item: PropTypes.oneOfType([
    PropTypes.shape({
      __typename: PropTypes.oneOf(['ExpenseType']),
      id: PropTypes.number.isRequired,
      amount: PropTypes.number.isRequired,
      currency: PropTypes.string.isRequired,
      description: PropTypes.string.isRequired,
      createdAt: PropTypes.string.isRequired,
      category: PropTypes.string.isRequired,
      payoutMethod: PropTypes.string,
      status: PropTypes.string,
      transaction: PropTypes.shape({
        id: PropTypes.number,
        uuid: PropTypes.string,
        hostFeeInHostCurrency: PropTypes.number,
        platformFeeInHostCurrency: PropTypes.number,
        paymentProcessorFeeInHostCurrency: PropTypes.number,
        taxAmount: PropTypes.number,
        refundTransaction: PropTypes.object,
      }),
      fromCollective: PropTypes.shape({
        id: PropTypes.number,
        slug: PropTypes.string.isRequired,
        name: PropTypes.string.isRequired,
        imageUrl: PropTypes.string,
        host: PropTypes.shape({
          id: PropTypes.number,
          slug: PropTypes.string.isRequired,
          name: PropTypes.string,
        }),
      }).isRequired,
      collective: PropTypes.shape({
        id: PropTypes.number,
        slug: PropTypes.string.isRequired,
        name: PropTypes.string.isRequired,
        imageUrl: PropTypes.string,
        host: PropTypes.shape({
          id: PropTypes.number,
          slug: PropTypes.string.isRequired,
          name: PropTypes.string,
        }),
      }).isRequired,
    }),
    PropTypes.shape({
      __typename: PropTypes.oneOf(['Order', 'Expense']),
      id: PropTypes.number,
      amount: PropTypes.number,
      currency: PropTypes.string.isRequired,
      type: PropTypes.oneOf(['CREDIT', 'DEBIT']),
      hostFeeInHostCurrency: PropTypes.number,
      uuid: PropTypes.string,
      platformFeeInHostCurrency: PropTypes.number,
      paymentProcessorFeeInHostCurrency: PropTypes.number,
      taxAmount: PropTypes.number,
      refundTransaction: PropTypes.object,
      usingVirtualCardFromCollective: PropTypes.shape({
        id: PropTypes.number,
        slug: PropTypes.string.isRequired,
        name: PropTypes.string,
      }),
      fromCollective: PropTypes.shape({
        id: PropTypes.number,
        slug: PropTypes.string.isRequired,
        name: PropTypes.string,
        imageUrl: PropTypes.string,
        host: PropTypes.shape({
          id: PropTypes.number,
          slug: PropTypes.string.isRequired,
          name: PropTypes.string,
        }),
      }),
    }),
  ]),

  /** If true, debit and credit will be inverted. Useful to adapt based on who's viewing */
  isInverted: PropTypes.bool,

  /** Use this if the place where the component is rendered isn't that big to compact it */
  isCompact: PropTypes.bool,

  /** If true, a button to download invoice will be displayed when possible */
  canDownloadInvoice: PropTypes.bool,

  /** Component is not connected, please provide this prop */
  intl: PropTypes.object.isRequired,
};

/**
 * Based on `DebitCreditList`, this will display transactions/expenses regardless of their
 * types. You must provide items fetched from GraphQL, as the component will use the
 * `__typename` to know how to display item.
 */
const BudgetItemsList = ({ items, isInverted, isCompact, canDownloadInvoice, intl }) => {
  return !items || items.length === 0 ? null : (
    <DebitCreditList>
      {items.map(item => (
        <BudgetItem
          key={`${item.__typename}_${item.id}`}
          item={item}
          isInverted={isInverted}
          isCompact={isCompact}
          canDownloadInvoice={canDownloadInvoice}
          intl={intl}
        />
      ))}
    </DebitCreditList>
  );
};

BudgetItemsList.propTypes = {
  /** The actual items to display */
  items: PropTypes.arrayOf(
    PropTypes.shape({
      __typename: PropTypes.oneOf(['ExpenseType', 'Order', 'Expense']),
      id: PropTypes.number.isRequired,
    }),
  ),

  /** If true, debit and credit will be inverted. Useful to adapt based on who's viewing */
  isInverted: PropTypes.bool,

  /** Use this if the place where the component is rendered isn't that big to compact it */
  isCompact: PropTypes.bool,

  /** If true, a button to download invoice will be displayed when possible */
  canDownloadInvoice: PropTypes.bool,

  /** @ignore from injectIntl */
  intl: PropTypes.object.isRequired,
};

BudgetItemsList.defaultProps = {
  isInverted: false,
  canDownloadInvoice: false,
};

export default injectIntl(React.memo(BudgetItemsList));
