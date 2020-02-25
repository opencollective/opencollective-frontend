import { Box, Flex } from '@rebass/grid';
import PropTypes from 'prop-types';
import React from 'react';
import { defineMessages, FormattedMessage, useIntl } from 'react-intl';

import expenseTypes from '../../lib/constants/expenseTypes';
import { PayoutMethodType } from '../../lib/constants/payout-method';
import { i18nExpenseType } from '../../lib/i18n-expense';
import i18nPayoutMethodType from '../../lib/i18n-payout-method-type';
import Avatar from '../Avatar';
import Container from '../Container';
import FormattedMoneyAmount, { DEFAULT_AMOUNT_STYLES } from '../FormattedMoneyAmount';
import PrivateInfoIcon from '../icons/PrivateInfoIcon';
import LinkCollective from '../LinkCollective';
import StyledHr from '../StyledHr';
import StyledInputField from '../StyledInputField';
import StyledTag from '../StyledTag';
import StyledTextarea from '../StyledTextarea';
import { H4, P, Span } from '../Text';
import AttachmentsTotalAmount from './AttachmentsTotalAmount';
import PayoutMethodData from './PayoutMethodData';

const msg = defineMessages({
  notesPlaceholder: {
    id: 'ExpenseSummary.addNotesPlaceholder',
    defaultMessage: 'Add attachments, notes, or any other important thing. ',
  },
});

const PrivateNoteLabel = () => {
  return (
    <Span fontSize="Caption" color="black.700">
      <FormattedMessage id="ExpenseSummary.addNotesLabel" defaultMessage="Add notes or attachments" />
      &nbsp;&nbsp;
      <PrivateInfoIcon color="#969BA3" />
    </Span>
  );
};

/**
 * Last step of the create expense flow, shows the summary of the expense with
 * the ability to submit it.
 */
const ExpenseSummary = ({ expense, host, onChange }) => {
  const intl = useIntl();
  const { formatMessage } = intl;
  const { payee, createdByAccount } = expense;

  return (
    <div>
      <StyledTag fontSize="Caption" textTransform="none" display="inline-block" letterSpacing="0.1em" color="black.700">
        {i18nExpenseType(intl, expense.type)}
      </StyledTag>
      <H4 mb={3} mt={2}>
        {expense.description}
      </H4>
      <Flex alignItems="center">
        <LinkCollective collective={createdByAccount}>
          <Avatar collective={createdByAccount} size={40} />
        </LinkCollective>
        <Flex flexDirection="column" justifyContent="center" ml={3}>
          <LinkCollective collective={createdByAccount}>
            <Span color="black.800" fontWeight={500} textDecoration="none">
              {createdByAccount.name}
            </Span>
          </LinkCollective>
        </Flex>
      </Flex>
      <StyledHr mt={4} borderColor="black.300" />
      <Flex width="100%" justifyContent="space-between" flexWrap="wrap">
        <Flex flexDirection="column" minWidth={250} mt={4}>
          <Span fontWeight="bold" mb={2}>
            <FormattedMessage id="Expense.Payee" defaultMessage="Payee" />
          </Span>
          <LinkCollective collective={payee} data-cy="expense-summary-payee">
            <Span color="black.600" fontSize="Caption" fontWeight="bold">
              {payee.name}
            </Span>
          </LinkCollective>
          {payee.location && (
            <React.Fragment>
              <Span fontSize="Caption" fontWeight="bold" color="black.700" mb={2} mt={3}>
                <FormattedMessage id="PrivateAddress" defaultMessage="Private address" />
                &nbsp;&nbsp;
                <PrivateInfoIcon color="#969BA3" />
              </Span>
              <P whiteSpace="pre-wrap" fontSize="Caption" color="black.600">
                {payee.location.address}
              </P>
            </React.Fragment>
          )}
        </Flex>
        {host && (
          <Flex flexDirection="column" minWidth={250} mt={4}>
            <Span fontWeight="bold" mb={2}>
              <FormattedMessage id="Fiscalhost" defaultMessage="Fiscal Host" />
            </Span>
            <LinkCollective collective={host} data-cy="expense-summary-host">
              <Span color="black.600" fontSize="Caption" fontWeight="bold">
                {host.name}
              </Span>
            </LinkCollective>
            {host.location && (
              <P whiteSpace="pre-wrap" fontSize="Caption" color="black.600" mt={2}>
                {host.location.address}
              </P>
            )}
          </Flex>
        )}
      </Flex>
      <StyledHr my={4} borderColor="black.300" />
      <P fontWeight="bold">
        <FormattedMessage id="PayoutOption" defaultMessage="Payout option" />
      </P>
      <Flex justifyContent="space-between" flexWrap="wrap">
        <Box minWidth={250} mt={3}>
          <Container fontSize="Caption" lineHeight="Caption" fontWeight="bold" color="black.600" mb={2}>
            <FormattedMessage id="ExpenseSummary.PayoutDetails" defaultMessage="Payout details:" />
            &nbsp;&nbsp;
            <PrivateInfoIcon color="#969BA3" />
          </Container>
          <P fontSize="Caption" color="black.600" data-cy="expense-summary-payout-method-data">
            <PayoutMethodData payoutMethod={expense.payoutMethod} />
          </P>
        </Box>
        <Box minWidth={250} mt={3}>
          <P fontSize="Caption" lineHeight="Caption" fontWeight="bold" color="black.600" mb={2}>
            <FormattedMessage id="ExpenseSummary.PayoutMethod" defaultMessage="Payout method:" />
          </P>
          <P fontSize="Caption" color="black.600" data-cy="expense-summary-payout-method-type">
            {i18nPayoutMethodType(formatMessage, expense.payoutMethod.type)}
          </P>
        </Box>
      </Flex>
      <StyledHr my={4} borderColor="black.300" />
      <P fontWeight="bold" mb={3}>
        {expense.type === expenseTypes.INVOICE ? (
          <FormattedMessage id="InvoiceItems" defaultMessage="Invoice items" />
        ) : (
          <FormattedMessage id="ReceiptItems" defaultMessage="Receipt items" />
        )}
      </P>
      <div data-cy="expense-summary-attachments">
        {expense.attachments.map((attachment, idx) => (
          <React.Fragment key={attachment.id}>
            <Flex justifyContent="space-between" my={24}>
              <P fontWeight="500" color="black.900">
                {attachment.description}
              </P>
              <P fontSize={15} color="black.600">
                <FormattedMoneyAmount
                  amount={attachment.amount}
                  currency={expense.currency}
                  amountStyles={{ ...DEFAULT_AMOUNT_STYLES, color: 'black.600' }}
                  precision={2}
                />
              </P>
            </Flex>
            {idx + 1 !== expense.attachments.length && <StyledHr borderStyle="dotted" />}
          </React.Fragment>
        ))}
      </div>
      <StyledHr borderColor="black.300" />
      <Flex justifyContent="flex-end" my={3}>
        <Flex width={220} justifyContent="space-between" alignItems="center">
          <Container fontSize="Caption" fontWeight="bold" mr={2}>
            <FormattedMessage id="ExpenseFormAttachments.TotalAmount" defaultMessage="Total amount:" />
          </Container>
          <AttachmentsTotalAmount name={name} currency={expense.currency} attachments={expense.attachments} />
        </Flex>
      </Flex>
      <StyledHr mb={4} borderColor="black.300" />
      <StyledInputField
        name="privateInfo"
        required={false}
        maxWidth={782}
        label={<PrivateNoteLabel />}
        labelProps={{ fontWeight: 'bold', fontSize: 'SmallCaption', mb: 3 }}
      >
        {inputProps => (
          <StyledTextarea
            {...inputProps}
            placeholder={formatMessage(msg.notesPlaceholder)}
            minHeight={80}
            onChange={onChange}
          />
        )}
      </StyledInputField>
    </div>
  );
};

ExpenseSummary.propTypes = {
  host: PropTypes.shape({
    id: PropTypes.string.isRequired,
    name: PropTypes.string.isRequired,
    slug: PropTypes.string.isRequired,
    type: PropTypes.string.isRequired,
    location: PropTypes.shape({
      address: PropTypes.string,
      country: PropTypes.string,
    }),
  }),
  expense: PropTypes.shape({
    description: PropTypes.string.isRequired,
    currency: PropTypes.string.isRequired,
    type: PropTypes.oneOf(Object.values(expenseTypes)).isRequired,
    privateInfo: PropTypes.string,
    tags: PropTypes.arrayOf(PropTypes.string),
    attachments: PropTypes.arrayOf(
      PropTypes.shape({
        id: PropTypes.string,
        incurredAt: PropTypes.string,
        description: PropTypes.string.isRequired,
        amount: PropTypes.number.isRequired,
        url: PropTypes.string,
      }).isRequired,
    ).isRequired,
    payee: PropTypes.shape({
      id: PropTypes.string.isRequired,
      name: PropTypes.string.isRequired,
      slug: PropTypes.string.isRequired,
      type: PropTypes.string.isRequired,
      location: PropTypes.shape({
        address: PropTypes.string,
        country: PropTypes.string,
      }),
    }).isRequired,
    createdByAccount: PropTypes.shape({
      id: PropTypes.string.isRequired,
      name: PropTypes.string.isRequired,
      slug: PropTypes.string.isRequired,
      type: PropTypes.string.isRequired,
    }).isRequired,
    payoutMethod: PropTypes.shape({
      id: PropTypes.string,
      type: PropTypes.oneOf(Object.values(PayoutMethodType)),
      data: PropTypes.object,
    }).isRequired,
  }).isRequired,
  onChange: PropTypes.func,
};

export default ExpenseSummary;
