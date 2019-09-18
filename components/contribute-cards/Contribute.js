import React from 'react';
import PropTypes from 'prop-types';
import { FormattedMessage, defineMessages, injectIntl } from 'react-intl';
import styled from 'styled-components';
import { Flex, Box } from '@rebass/grid';

import { ContributionTypes } from '../../lib/constants/contribution-types';

import Link from '../Link';
import StyledTag from '../StyledTag';
import { P } from '../Text';
import StyledButton from '../StyledButton';
import { ContributorAvatar } from '../Avatar';
import Container from '../Container';

/** Max number of contributors on each tier card */
export const MAX_CONTRIBUTORS_PER_CONTRIBUTE_CARD = 4;
export const CONTRIBUTE_CARD_WIDTH = 280;
export const CONTRIBUTE_CARD_BORDER_RADIUS = 16;

/** The main container */
const StyledContributeCard = styled.div`
  display: flex;
  flex-direction: column;
  width: ${CONTRIBUTE_CARD_WIDTH}px;
  flex: 0 0 ${CONTRIBUTE_CARD_WIDTH}px;
  height: 100%;
  border-radius: ${CONTRIBUTE_CARD_BORDER_RADIUS}px;
  border: 1px solid #dcdee0;
`;

/** Tier card banner */
const CoverImage = styled.div`
  background: ${props => {
    const primary = props.theme.colors.primary;
    const radial = `radial-gradient(circle, ${primary[300]} 0%, ${primary[800]} 150%)`;
    return `${radial}, ${primary[500]}`;
  }};
  height: 104px;
  background-repeat: no-repeat;
  background-size: cover;
  padding: 16px;
  position: relative;
  border-radius: 16px 16px 0 0;
`;

/** Tier's description */
const TierBody = styled.div`
  overflow-wrap: break-word;
  margin: 8px 0;
  font-size: 14px;
  letter-spacing: -0.2px;
  line-height: 20px;
  height: 100%;
  flex: 1 1;
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
const ContributeCard = ({
  intl,
  title,
  type,
  route,
  routeParams,
  buttonText,
  children,
  contributors,
  stats,
  hideContributors,
  withoutCTA,
}) => {
  const totalContributors = (stats && stats.all) || (contributors && contributors.length) || 0;

  return (
    <StyledContributeCard>
      <CoverImage>
        <StyledTag position="absolute" bottom="8px" left="8px" background="white" color="black.700" fontWeight="600">
          {intl.formatMessage(I18nContributionType[type])}
        </StyledTag>
      </CoverImage>
      <Flex px={3} py={3} flexDirection="column" justifyContent="space-between" flex="1">
        <Flex flexDirection="column" flex="1 1">
          <P fontSize="H5" mt={1} mb={2} fontWeight="bold" textTransform="capitalize">
            {title}
          </P>
          <TierBody>{children}</TierBody>
        </Flex>
        <Box>
          {!withoutCTA && (
            <Link route={route} params={routeParams}>
              <StyledButton buttonStyle="secondary" width={1} mb={2} mt={3}>
                {buttonText || getContributeCTA(type)}
              </StyledButton>
            </Link>
          )}
          {!hideContributors && (
            <Box mt={2} height={60}>
              {contributors && contributors.length > 0 && (
                <React.Fragment>
                  <Flex>
                    {contributors.slice(0, MAX_CONTRIBUTORS_PER_CONTRIBUTE_CARD).map(contributor => (
                      <Box key={contributor.id} mx={2}>
                        {contributor.collectiveSlug ? (
                          <Link
                            route="collective"
                            params={{ slug: contributor.collectiveSlug }}
                            title={contributor.name}
                          >
                            <ContributorAvatar contributor={contributor} radius={32} />
                          </Link>
                        ) : (
                          <ContributorAvatar contributor={contributor} radius={32} title={contributor.name} />
                        )}
                      </Box>
                    ))}
                    {totalContributors > MAX_CONTRIBUTORS_PER_CONTRIBUTE_CARD && (
                      <Container ml={2} pt="0.7em" fontSize="Caption" color="black.600">
                        + {totalContributors - MAX_CONTRIBUTORS_PER_CONTRIBUTE_CARD}
                      </Container>
                    )}
                  </Flex>
                  {stats && stats.all > 0 && (
                    <P mt={2} fontSize="Tiny" color="black.600" letterSpacing="-0.6px">
                      <FormattedMessage
                        id="ContributorsCount"
                        defaultMessage="{userCount, plural, =0 {} one {# individual } other {# individuals }} {both, plural, =0 {} other {and }}{orgCount, plural, =0 {} one {# organization} other {# organizations}} {totalCount, plural, one {has } other {have }} contributed"
                        values={{
                          userCount: stats.users,
                          orgCount: stats.organizations,
                          totalCount: stats.all,
                          both: Number(stats.users && stats.organizations),
                        }}
                      />
                    </P>
                  )}
                </React.Fragment>
              )}
            </Box>
          )}
        </Box>
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
  /** A custom button text to override the default one */
  buttonText: PropTypes.string,
  /** Params for the route */
  routeParams: PropTypes.object,
  /** The card body */
  children: PropTypes.node,
  /** Contributors */
  contributors: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.string.isRequired,
      name: PropTypes.string.isRequired,
      image: PropTypes.string,
      collectiveSlug: PropTypes.string,
    }),
  ),
  /** Contributors stats */
  stats: PropTypes.shape({
    all: PropTypes.number,
    users: PropTypes.number,
    organizations: PropTypes.number,
  }),
  /** If true, contributors will not be displayed */
  hideContributors: PropTypes.bool,
  /** If true, contribute button will be withoutCTA */
  withoutCTA: PropTypes.bool,
  /** @ignore from injectIntl */
  intl: PropTypes.object.isRequired,
};

export default injectIntl(ContributeCard);
