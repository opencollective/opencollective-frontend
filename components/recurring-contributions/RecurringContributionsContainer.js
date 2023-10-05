import React from 'react';
import PropTypes from 'prop-types';
import { defineMessages, FormattedMessage, useIntl } from 'react-intl';
import styled from 'styled-components';

import { ORDER_STATUS } from '../../lib/constants/order-status';

import Container from '../Container';
import { Box, Flex, Grid } from '../Grid';
import Image from '../Image';
import LoadingPlaceholder from '../LoadingPlaceholder';
import { fadeIn } from '../StyledKeyframes';
import { StyledSelectFilter } from '../StyledSelectFilter';
import { P } from '../Text';
import { withUser } from '../UserProvider';

import RecurringContributionsCard from './RecurringContributionsCard';

import EmptyCollectivesSectionImageSVG from '../collective-page/images/EmptyCollectivesSectionImage.svg';

export const FILTERS = {
  ACTIVE: 'ACTIVE',
  MONTHLY: 'MONTHLY',
  YEARLY: 'YEARLY',
  CANCELLED: 'CANCELLED',
};

export const I18nFilters = defineMessages({
  [FILTERS.ACTIVE]: {
    id: 'Subscriptions.Active',
    defaultMessage: 'Active',
  },
  [FILTERS.MONTHLY]: {
    id: 'Frequency.Monthly',
    defaultMessage: 'Monthly',
  },
  [FILTERS.YEARLY]: {
    id: 'Frequency.Yearly',
    defaultMessage: 'Yearly',
  },
  [FILTERS.CANCELLED]: {
    id: 'Subscriptions.Cancelled',
    defaultMessage: 'Canceled',
  },
});

const CollectiveCardContainer = styled.div`
  animation: ${fadeIn} 0.2s;
`;

const filterContributions = (contributions, filterName) => {
  const isActive = ({ status }) =>
    status === ORDER_STATUS.ACTIVE ||
    status === ORDER_STATUS.ERROR ||
    status === ORDER_STATUS.PROCESSING ||
    status === ORDER_STATUS.NEW;
  const isInactive = ({ status }) => status === ORDER_STATUS.CANCELLED || status === ORDER_STATUS.REJECTED;
  switch (filterName) {
    case FILTERS.ACTIVE:
      return contributions.filter(isActive);
    case FILTERS.MONTHLY:
      return contributions.filter(contrib => isActive(contrib) && contrib.frequency === 'MONTHLY');
    case FILTERS.YEARLY:
      return contributions.filter(contrib => isActive(contrib) && contrib.frequency === 'YEARLY');
    case FILTERS.CANCELLED:
      return contributions.filter(isInactive);
    default:
      return [];
  }
};

const RecurringContributionsContainer = ({
  recurringContributions,
  account,
  LoggedInUser,
  isLoading,
  displayFilters,
  ...props
}) => {
  const isAdminOrRoot = Boolean(LoggedInUser?.isAdminOfCollective(account) || LoggedInUser?.isRoot);
  const intl = useIntl();
  const [editingContributionId, setEditingContributionId] = React.useState();
  const [filter, setFilter] = React.useState(FILTERS.ACTIVE);
  const displayedRecurringContributions = React.useMemo(() => {
    const filteredContributions = filterContributions(recurringContributions?.nodes || [], filter);
    return isAdminOrRoot
      ? filteredContributions
      : filteredContributions.filter(contrib => contrib.status !== ORDER_STATUS.ERROR);
  }, [recurringContributions, filter, isAdminOrRoot]);

  // Reset edit when changing filters and contribution is not in the list anymore
  React.useEffect(() => {
    if (!displayedRecurringContributions.some(c => c.id === editingContributionId)) {
      setEditingContributionId(null);
    }
  }, [displayedRecurringContributions]);

  const filterOptions = React.useMemo(() => [
    { value: FILTERS.ACTIVE, label: intl.formatMessage(I18nFilters[FILTERS.ACTIVE]) },
    { value: FILTERS.MONTHLY, label: intl.formatMessage(I18nFilters[FILTERS.MONTHLY]) },
    { value: FILTERS.YEARLY, label: intl.formatMessage(I18nFilters[FILTERS.YEARLY]) },
    { value: FILTERS.CANCELLED, label: intl.formatMessage(I18nFilters[FILTERS.CANCELLED]) },
  ]);

  if (isLoading) {
    return <LoadingPlaceholder height="400px" mt={3} />;
  }

  return (
    <Container {...props}>
      {displayFilters && (
        <Box mb={3}>
          <StyledSelectFilter
            inputId="recurring-contribution-interval"
            onChange={({ value }) => setFilter(value)}
            value={{ value: filter, label: intl.formatMessage(I18nFilters[filter]) }}
            options={filterOptions}
            maxWidth="180px"
            disabled={isLoading}
            data-cy="recurring-contributions-interval"
          />
        </Box>
      )}
      {displayedRecurringContributions.length ? (
        <Grid gridGap={24} gridTemplateColumns="repeat(auto-fill, minmax(275px, 1fr))" my={2}>
          {displayedRecurringContributions.map(contribution => (
            <CollectiveCardContainer key={contribution.id}>
              <RecurringContributionsCard
                collective={contribution.toAccount}
                status={contribution.status}
                contribution={contribution}
                position="relative"
                account={account}
                isAdmin={isAdminOrRoot}
                isEditing={contribution.id === editingContributionId}
                canEdit={isAdminOrRoot && !editingContributionId}
                onEdit={() => setEditingContributionId(contribution.id)}
                onCloseEdit={() => setEditingContributionId(null)}
                showPaymentMethod={isAdminOrRoot}
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
  account: PropTypes.object.isRequired,
  LoggedInUser: PropTypes.object,
  displayFilters: PropTypes.bool,
  isLoading: PropTypes.bool,
};

export default withUser(RecurringContributionsContainer);
