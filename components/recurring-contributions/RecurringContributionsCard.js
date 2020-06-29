import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { get } from 'lodash';
import { defineMessages, FormattedMessage, useIntl } from 'react-intl';

import Avatar from '../Avatar';
import Container from '../Container';
import FormattedMoneyAmount from '../FormattedMoneyAmount';
import { Flex } from '../Grid';
import I18nCollectiveTags from '../I18nCollectiveTags';
import LinkCollective from '../LinkCollective';
import StyledButton from '../StyledButton';
import StyledCard from '../StyledCard';
import StyledTag from '../StyledTag';
import { P } from '../Text';
import { withUser } from '../UserProvider';

import RecurringContributionsPopUp from './RecurringContributionsPopUp';

const getBackground = collective => {
  const backgroundImage = collective.backgroundImageUrl || get(collective, 'parentCollective.backgroundImageUrl');
  const primaryColor = get(collective.settings, 'collectivePage.primaryColor', '#1776E1');
  return backgroundImage
    ? `url(/static/images/collective-card-mask.svg) 0 0 / cover no-repeat, url(${backgroundImage}) 0 0 / cover no-repeat, ${primaryColor}`
    : `url(/static/images/collective-card-mask.svg) 0 0 / cover no-repeat, ${primaryColor}`;
};

const messages = defineMessages({
  manage: {
    id: 'Subscriptions.Edit',
    defaultMessage: 'Edit',
  },
  tag: {
    id: 'Subscriptions.Status',
    defaultMessage: '{status, select, ACTIVE {Active} CANCELLED {Cancelled}} contribution',
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
  const statusTag = formatMessage(messages.tag, { status });
  const buttonText = formatMessage(messages.manage);
  const isAdmin = LoggedInUser && LoggedInUser.canEditCollective(account);
  const isActive = status === 'ACTIVE';

  return (
    <StyledCard {...props}>
      <Container style={{ background: getBackground(collective) }} backgroundSize="cover" height={100} px={3} pt={26}>
        <Container border="2px solid white" borderRadius="25%" backgroundColor="white.full" width={68}>
          <LinkCollective collective={collective}>
            <Avatar collective={collective} radius={64} />
          </LinkCollective>
        </Container>
      </Container>
      <Flex flexDirection="column" justifyContent="space-around" height={260}>
        <Container p={2}>
          <P fontSize="LeadParagraph" fontWeight="bold" color="black.800">
            {collective.name}
          </P>
          <StyledTag display="inline-block" textTransform="uppercase" my={2}>
            <I18nCollectiveTags tags={statusTag} />
          </StyledTag>
        </Container>
        <Container p={2} flexGrow={1} display="flex" flexDirection="column" justifyContent="space-around">
          <Flex flexDirection="column">
            <P fontSize="Paragraph" fontWeight="400">
              <FormattedMessage id="Subscriptions.AmountContributed" defaultMessage="Amount contributed" />
            </P>
            <P fontSize="Paragraph" fontWeight="bold" data-cy="recurring-contribution-amount-contributed">
              <FormattedMoneyAmount
                amount={contribution.amount.value * 100}
                interval={contribution.frequency.toLowerCase().slice(0, -2)}
                currency={contribution.amount.currency}
              />
            </P>
          </Flex>
          <Flex flexDirection="column" mb={2}>
            <P fontSize="Paragraph" fontWeight="400">
              <FormattedMessage id="Subscriptions.ContributedToDate" defaultMessage="Contributed to date" />
            </P>
            <P fontSize="Paragraph">
              <FormattedMoneyAmount
                amount={contribution.totalDonations.value * 100}
                currency={contribution.totalDonations.currency}
              />
            </P>
          </Flex>
          {isAdmin && isActive && (
            <StyledButton
              buttonSize="tiny"
              onClick={() => setShowPopup(true)}
              data-cy="recurring-contribution-edit-activate-button"
            >
              {buttonText}
            </StyledButton>
          )}
        </Container>
      </Flex>
      {showPopup && (
        <RecurringContributionsPopUp
          contribution={contribution}
          status={status}
          setShowPopup={setShowPopup}
          createNotification={createNotification}
          account={account}
        />
      )}
    </StyledCard>
  );
};

RecurringContributionsCard.propTypes = {
  collective: PropTypes.object.isRequired,
  contribution: PropTypes.object.isRequired,
  status: PropTypes.string.isRequired,
  LoggedInUser: PropTypes.object.isRequired,
  createNotification: PropTypes.func,
  account: PropTypes.object.isRequired,
};

export default withUser(RecurringContributionsCard);
