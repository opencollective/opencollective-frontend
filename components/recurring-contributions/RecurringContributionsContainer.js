import React from 'react';
import PropTypes from 'prop-types';
import Image from 'next/image';
import { FormattedMessage } from 'react-intl';
import styled from 'styled-components';

import { ORDER_STATUS } from '../../lib/constants/order-status';

import Container from '../Container';
import { Flex, Grid } from '../Grid';
import { fadeIn } from '../StyledKeyframes';
import { P } from '../Text';
import { withUser } from '../UserProvider';

import RecurringContributionsCard from './RecurringContributionsCard';

import EmptyCollectivesSectionImageSVG from '../collective-page/images/EmptyCollectivesSectionImage.svg';

const CollectiveCardContainer = styled.div`
  animation: ${fadeIn} 0.2s;
`;

const filterContributions = (contributions, filterName) => {
  const isActive = ({ status }) => status === ORDER_STATUS.ACTIVE || status === ORDER_STATUS.ERROR;
  const isInactive = ({ status }) => status === ORDER_STATUS.CANCELLED || status === ORDER_STATUS.REJECTED;
  switch (filterName) {
    case 'ACTIVE':
      return contributions.filter(isActive);
    case 'MONTHLY':
      return contributions.filter(contrib => isActive(contrib) && contrib.frequency === 'MONTHLY');
    case 'YEARLY':
      return contributions.filter(contrib => isActive(contrib) && contrib.frequency === 'YEARLY');
    case 'CANCELLED':
      return contributions.filter(isInactive);
    default:
      return [];
  }
};

const RecurringContributionsContainer = ({ recurringContributions, filter, account, LoggedInUser }) => {
  let displayedRecurringContributions = filterContributions(recurringContributions.nodes, filter);
  const isAdmin = LoggedInUser && LoggedInUser.canEditCollective(account);
  displayedRecurringContributions = isAdmin
    ? displayedRecurringContributions
    : displayedRecurringContributions.filter(contrib => contrib.status !== ORDER_STATUS.ERROR);

  return (
    <Container mt={4}>
      {displayedRecurringContributions.length ? (
        <Grid gridGap={24} gridTemplateColumns="repeat(auto-fill, minmax(220px, 1fr))" my={2}>
          {displayedRecurringContributions.map(contribution => (
            <CollectiveCardContainer key={contribution.id}>
              <RecurringContributionsCard
                collective={contribution.toAccount}
                status={contribution.status}
                contribution={contribution}
                position="relative"
                account={account}
                data-cy="recurring-contribution-card"
              />
            </CollectiveCardContainer>
          ))}
        </Grid>
      ) : (
        <Flex flexDirection="column" alignItems="center" py={4}>
          <Image src={EmptyCollectivesSectionImageSVG} alt="" width={309} height={200} />
          <P color="black.600" fontSize="16px" mt={5}>
            <FormattedMessage
              id="RecurringContributions.none"
              defaultMessage="No recurring contributions to see here! 👀"
            />
          </P>
        </Flex>
      )}
    </Container>
  );
};

RecurringContributionsContainer.propTypes = {
  recurringContributions: PropTypes.object.isRequired,
  filter: PropTypes.string.isRequired,
  account: PropTypes.object.isRequired,
  LoggedInUser: PropTypes.object,
};

export default withUser(RecurringContributionsContainer);
