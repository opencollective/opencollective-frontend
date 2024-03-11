import React from 'react';
import PropTypes from 'prop-types';
import { isNil } from 'lodash';
import { defineMessages, FormattedMessage, useIntl } from 'react-intl';

import { ORDER_STATUS } from '../../lib/constants/order-status';
import { getPaymentMethodName } from '../../lib/payment_method_label';
import { getPaymentMethodIcon, getPaymentMethodMetadata } from '../../lib/payment-method-utils';

import Avatar from '../Avatar';
import Container from '../Container';
import FormattedMoneyAmount from '../FormattedMoneyAmount';
import { Box, Flex } from '../Grid';
import StyledButton from '../StyledButton';
import StyledCollectiveCard from '../StyledCollectiveCard';
import StyledTag from '../StyledTag';
import StyledTooltip from '../StyledTooltip';
import { P } from '../Text';

import RecurringContributionsPopUp from './RecurringContributionsPopUp';

const messages = defineMessages({
  manage: {
    id: 'Edit',
    defaultMessage: 'Edit',
  },
  tag: {
    id: 'Subscriptions.Status',
    defaultMessage:
      '{status, select, ACTIVE {Active contribution} CANCELLED {Cancelled contribution} ERROR {Error} REJECTED {Rejected contribution} PROCESSING {Processing} NEW {Processing} other {}}',
  },
});

const RecurringContributionsCard = ({
  collective,
  status,
  contribution,
  account,
  isEditing,
  canEdit,
  isAdmin,
  onCloseEdit,
  onEdit,
  showPaymentMethod,
  ...props
}) => {
  const { formatMessage } = useIntl();
  const isError = status === ORDER_STATUS.ERROR;
  const isRejected = status === ORDER_STATUS.REJECTED;
  const isEditable = [ORDER_STATUS.ACTIVE, ORDER_STATUS.PROCESSING, ORDER_STATUS.NEW].includes(status) || isError;
  return (
    <StyledCollectiveCard
      {...props}
      collective={collective}
      bodyHeight="400px"
      tag={
        <StyledTag
          display="inline-block"
          textTransform="uppercase"
          my={2}
          type={isError || isRejected ? 'error' : undefined}
        >
          {formatMessage(messages.tag, { status })}
        </StyledTag>
      }
    >
      {Boolean(contribution.fromAccount?.isIncognito) && (
        <Container position="absolute" right="12px" top="12px">
          <StyledTooltip
            content={() => (
              <FormattedMessage
                id="RecurringContribution.Incognito"
                defaultMessage="This is an incognito recurring contribution, only you can see it."
              />
            )}
          >
            <Container borderRadius="100%" css={{ filter: 'drop-shadow(-1px 1px 2px #dcdcdc)' }}>
              <Avatar collective={contribution.fromAccount} radius={36} />
            </Container>
          </StyledTooltip>
        </Container>
      )}
      <Container p={3} pt={0}>
        <Box mb={3}>
          {showPaymentMethod && contribution.paymentMethod && (
            <Box mb={3}>
              <P mb={2} fontSize="14px" lineHeight="20px" fontWeight="400">
                <FormattedMessage id="Fields.paymentMethod" defaultMessage="Payment method" />
              </P>
              <Flex alignItems="center" height="28px">
                <Box mr={2}>{getPaymentMethodIcon(contribution.paymentMethod, account, 32)}</Box>
                <Flex flexDirection="column" css={{ position: 'relative', minWidth: 0 }}>
                  <P
                    fontSize="11px"
                    lineHeight="14px"
                    fontWeight="bold"
                    truncateOverflow
                    title={getPaymentMethodName(contribution.paymentMethod)}
                  >
                    {getPaymentMethodName(contribution.paymentMethod)}
                  </P>
                  <P fontSize="11px" color="black.700" truncateOverflow>
                    {getPaymentMethodMetadata(contribution.paymentMethod)}
                  </P>
                </Flex>
              </Flex>
            </Box>
          )}
          <div>
            <P fontSize="14px" lineHeight="20px" fontWeight="400">
              <FormattedMessage id="membership.totalDonations.title" defaultMessage="Amount contributed" />
            </P>
            <P fontSize="14px" lineHeight="20px" fontWeight="bold" data-cy="recurring-contribution-amount-contributed">
              <FormattedMoneyAmount
                amount={contribution.totalAmount.valueInCents}
                interval={contribution.frequency.toLowerCase().slice(0, -2)}
                currency={contribution.totalAmount.currency}
              />
            </P>
            {!isNil(contribution.platformTipAmount?.valueInCents) && (
              <StyledTooltip
                content={() => (
                  <FormattedMessage
                    id="Subscriptions.FeesOnTopTooltip"
                    defaultMessage="Contribution plus Platform Tip"
                  />
                )}
              >
                <P fontSize="12px" lineHeight="20px" color="black.700">
                  (
                  <FormattedMoneyAmount
                    amount={contribution.amount.valueInCents}
                    currency={contribution.amount.currency}
                    showCurrencyCode={false}
                    precision="auto"
                    amountStyles={{ fontWeight: 'normal', color: 'black.700' }}
                  />
                  {' + '}
                  <FormattedMoneyAmount
                    amount={contribution.platformTipAmount.valueInCents}
                    currency={contribution.amount.currency}
                    showCurrencyCode={false}
                    precision="auto"
                    amountStyles={{ fontWeight: 'normal', color: 'black.700' }}
                  />
                  )
                </P>
              </StyledTooltip>
            )}
          </div>
        </Box>
        <Box mb={3}>
          <P fontSize="14px" lineHeight="20px" fontWeight="400">
            <FormattedMessage id="Subscriptions.ContributedToDate" defaultMessage="Contributed to date" />
          </P>
          <P fontSize="14px" lineHeight="20px">
            <FormattedMoneyAmount
              amount={contribution.totalDonations.valueInCents}
              currency={contribution.totalDonations.currency}
            />
          </P>
        </Box>
        {isAdmin && isEditable && (
          <StyledButton
            buttonSize="tiny"
            onClick={onEdit}
            disabled={!canEdit}
            data-cy="recurring-contribution-edit-activate-button"
            width="100%"
          >
            {formatMessage(messages.manage)}
          </StyledButton>
        )}
      </Container>
      {isEditing && (
        <RecurringContributionsPopUp
          contribution={contribution}
          status={status}
          onCloseEdit={onCloseEdit}
          account={account}
        />
      )}
    </StyledCollectiveCard>
  );
};

RecurringContributionsCard.propTypes = {
  collective: PropTypes.object.isRequired,
  isEditing: PropTypes.bool,
  isAdmin: PropTypes.bool,
  canEdit: PropTypes.bool,
  onCloseEdit: PropTypes.func,
  onEdit: PropTypes.func,
  contribution: PropTypes.shape({
    amount: PropTypes.object.isRequired,
    totalAmount: PropTypes.object.isRequired,
    platformTipAmount: PropTypes.object,
    frequency: PropTypes.string.isRequired,
    totalDonations: PropTypes.object.isRequired,
    paymentMethod: PropTypes.object,
    fromAccount: PropTypes.object,
  }),
  status: PropTypes.string.isRequired,
  LoggedInUser: PropTypes.object,
  account: PropTypes.object.isRequired,
  showPaymentMethod: PropTypes.bool,
};

RecurringContributionsCard.defaultProps = {
  showPaymentMethod: true,
};

export default RecurringContributionsCard;
