import React from 'react';
import PropTypes from 'prop-types';
import { FormattedMessage, defineMessages, injectIntl } from 'react-intl';
import styled from 'styled-components';
import { Flex, Box } from '@rebass/grid';

import Link from '../../Link';
import StyledCard from '../../StyledCard';
import StyledTag from '../../StyledTag';
import { P } from '../../Text';
import StyledButton from '../../StyledButton';

import { ContributionTypes } from '../_constants';
import tierCardDefaultImage from '../ContributeCardDefaultImage.svg';

/** The main container */
const StyledContributeCard = styled(StyledCard)`
  display: flex;
  flex-direction: column;
  width: 264px;
  flex: 0 0 264px;
  height: 100%;
`;

/** Tier card banner */
const CoverImage = styled.div`
  background-color: #f5f7fa;
  background-image: url(${tierCardDefaultImage});
  height: 135px;
  background-repeat: no-repeat;
  background-size: cover;
  padding: 16px;
`;

/** Translations */
const I18nContributionType = defineMessages({
  [ContributionTypes.FINANCIAL_CUSTOM]: {
    id: 'ContributionType.Custom',
    defaultMessage: 'Custom contribution',
  },
  [ContributionTypes.FINANCIAL_ONE_TIME]: {
    id: 'ContributionType.OneTime',
    defaultMessage: 'One time contribution',
  },
  [ContributionTypes.FINANCIAL_RECURRING]: {
    id: 'ContributionType.Recurring',
    defaultMessage: 'Recurring contribution',
  },
  [ContributionTypes.FINANCIAL_GOAL]: {
    id: 'ContributionType.Goal',
    defaultMessage: 'Goal',
  },
  [ContributionTypes.EVENT_PARTICIPATE]: {
    id: 'ContributionType.Event',
    defaultMessage: 'Event',
  },
});

const getContributeCTA = type => {
  if (type === ContributionTypes.FINANCIAL_GOAL) {
    return <FormattedMessage id="ContributeCard.BtnGoal" defaultMessage="Contribute with this goal" />;
  } else if (type === ContributionTypes.EVENT_PARTICIPATE) {
    return <FormattedMessage id="ContributeCard.BtnEvent" defaultMessage="Get tickets" />;
  } else {
    return <FormattedMessage id="ContributeCard.Btn" defaultMessage="Contribute" />;
  }
};

/**
 * A contribute card with a "Contribute" call to action
 */
const ContributeCard = ({ intl, title, type, contributeRoute, children }) => {
  return (
    <StyledContributeCard>
      <CoverImage />
      <Flex px={3} py={3} flexDirection="column" justifyContent="space-between" flex="1">
        <div>
          <Box mb={3}>
            <StyledTag>{intl.formatMessage(I18nContributionType[type])}</StyledTag>
          </Box>
          <P fontSize="H5" mt={1} mb={3} fontWeight="bold" textTransform="capitalize">
            {title}
          </P>
          <Box mb={4} mt={2}>
            {children}
          </Box>
        </div>
        <Link route={contributeRoute}>
          <StyledButton width={1} mb={2} mt={3}>
            {getContributeCTA(type)}
          </StyledButton>
        </Link>
      </Flex>
    </StyledContributeCard>
  );
};

ContributeCard.propTypes = {
  /** Contribution title */
  title: PropTypes.node.isRequired,
  /** Type of the contribution */
  type: PropTypes.oneOf(Object.values(ContributionTypes)).isRequired,
  /** Route for the contribute button */
  route: PropTypes.string.isRequired,
  /** Params for the route */
  routeParams: PropTypes.object,
  /** The card body */
  children: PropTypes.node,
  /** @ignore from injectIntl */
  intl: PropTypes.object.isRequired,
};

export default injectIntl(ContributeCard);
