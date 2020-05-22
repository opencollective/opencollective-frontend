import React, { useState } from 'react';
import PropTypes from 'prop-types';
import styled from 'styled-components';

import { Flex } from '../Grid';

import RecurringContributionsCard from './RecurringContributionsCard';

const AllCardsContainer = styled(Flex).attrs({
  flexWrap: 'wrap',
  justifyContent: 'space-evenly',
})``;

const CollectiveCardContainer = styled.div`
  width: 280px;
  padding: 20px 15px;
`;

const RecurringContributionsContainer = ({ recurringContributions, filter, createNotification, account }) => {
  const [isHovering, setHovering] = useState(null);

  const activeRecurringContributions = recurringContributions.nodes.filter(
    contribution => contribution.status === 'ACTIVE',
  );
  const monthlyRecurringContributions = activeRecurringContributions.filter(
    contribution => contribution.status === 'ACTIVE' && contribution.frequency === 'MONTHLY',
  );
  const yearlyRecurringContributions = activeRecurringContributions.filter(
    contribution => contribution.status === 'ACTIVE' && contribution.frequency === 'YEARLY',
  );
  const cancelledRecurringContributions = recurringContributions.nodes.filter(
    contribution => contribution.status === 'CANCELLED',
  );

  let displayedRecurringContributions;
  if (filter === 'active') {
    displayedRecurringContributions = activeRecurringContributions;
  } else if (filter === 'monthly') {
    displayedRecurringContributions = monthlyRecurringContributions;
  } else if (filter === 'yearly') {
    displayedRecurringContributions = yearlyRecurringContributions;
  } else if (filter === 'cancelled') {
    displayedRecurringContributions = cancelledRecurringContributions;
  }

  return (
    <AllCardsContainer my={2}>
      {displayedRecurringContributions.map(contribution => (
        <CollectiveCardContainer key={`${contribution.id}-container`}>
          <RecurringContributionsCard
            key={contribution.id}
            mx={3}
            width={250}
            height={360}
            collective={contribution.toAccount}
            status={contribution.status}
            contribution={contribution}
            hover={isHovering === contribution.id}
            onMouseEnter={() => setHovering(contribution.id)}
            onMouseLeave={() => setHovering(null)}
            style={{ position: 'relative' }}
            createNotification={createNotification}
            account={account}
          />
        </CollectiveCardContainer>
      ))}
    </AllCardsContainer>
  );
};

RecurringContributionsContainer.propTypes = {
  recurringContributions: PropTypes.object.isRequired,
  filter: PropTypes.string.isRequired,
  createNotification: PropTypes.func,
  account: PropTypes.object.isRequired,
};

export default RecurringContributionsContainer;
