import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { defineMessages, FormattedMessage, useIntl } from 'react-intl';

import { ORDER_STATUS } from '../../lib/constants/order-status';

import Container from '../Container';
import FormattedMoneyAmount from '../FormattedMoneyAmount';
import { Box } from '../Grid';
import StyledButton from '../StyledButton';
import StyledCollectiveCard from '../StyledCollectiveCard';
import StyledTag from '../StyledTag';
import StyledTooltip from '../StyledTooltip';
import { P } from '../Text';
import { withUser } from '../UserProvider';

import RecurringContributionsPopUp from './RecurringContributionsPopUp';

const messages = defineMessages({
  manage: {
    id: 'Edit',
    defaultMessage: 'Edit',
  },
  tag: {
    id: 'Subscriptions.Status',
    defaultMessage:
      '{status, select, ACTIVE {Active contribution} CANCELLED {Cancelled contribution} ERROR {Error} REJECTED {Rejected contribution} other {}}',
  },
});

const RecurringContributionsCard = ({
  collective,
  status,
  contribution,
  createNotification,
  account,
  LoggedInUser,
  ...props
}) => {
  const [showPopup, setShowPopup] = useState(false);
  const { formatMessage } = useIntl();
  const isAdmin = LoggedInUser && LoggedInUser.canEditCollective(account);
  const isError = status === ORDER_STATUS.ERROR;
  const isRejected = status === ORDER_STATUS.REJECTED;
  const isActive = status === ORDER_STATUS.ACTIVE || isError;

  return (
    <StyledCollectiveCard
      {...props}
      collective={collective}
      bodyHeight="290px"
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
      <Container p={3}>
        <Box mb={3}>
          <P fontSize="14px" lineHeight="20px" fontWeight="400">
            <FormattedMessage id="membership.totalDonations.title" defaultMessage="Amount contributed" />
          </P>
          <div>
            <P fontSize="14px" lineHeight="20px" fontWeight="bold" data-cy="recurring-contribution-amount-contributed">
              <FormattedMoneyAmount
                amount={contribution.amount.valueInCents}
                interval={contribution.frequency.toLowerCase().slice(0, -2)}
                currency={contribution.amount.currency}
              />
            </P>
            {contribution.platformContributionAmount && (
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
                    amount={contribution.amount.valueInCents - contribution.platformContributionAmount.valueInCents}
                    currency={contribution.amount.currency}
                    showCurrencyCode={false}
                    precision="auto"
                    amountStyles={{ fontWeight: 'normal', color: 'black.700' }}
                  />
                  {' + '}
                  <FormattedMoneyAmount
                    amount={contribution.platformContributionAmount.valueInCents}
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
        {isAdmin && isActive && (
          <StyledButton
            buttonSize="tiny"
            onClick={() => setShowPopup(true)}
            data-cy="recurring-contribution-edit-activate-button"
            width="100%"
          >
            {formatMessage(messages.manage)}
          </StyledButton>
        )}
      </Container>
      {showPopup && (
        <RecurringContributionsPopUp
          contribution={contribution}
          status={status}
          setShowPopup={setShowPopup}
          createNotification={createNotification}
          account={account}
        />
      )}
    </StyledCollectiveCard>
  );
};

RecurringContributionsCard.propTypes = {
  collective: PropTypes.object.isRequired,
  contribution: PropTypes.shape({
    amount: PropTypes.object.isRequired,
    platformContributionAmount: PropTypes.object,
    frequency: PropTypes.string.isRequired,
    totalDonations: PropTypes.object.isRequired,
  }),
  status: PropTypes.string.isRequired,
  LoggedInUser: PropTypes.object,
  createNotification: PropTypes.func,
  account: PropTypes.object.isRequired,
};

export default withUser(RecurringContributionsCard);
