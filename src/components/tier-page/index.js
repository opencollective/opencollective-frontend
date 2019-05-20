import React, { Component } from 'react';
import { FormattedMessage } from 'react-intl';
import PropTypes from 'prop-types';
import { Flex, Box } from '@rebass/grid';
import styled from 'styled-components';
import { themeGet } from 'styled-system';
import { withRouter } from 'next/router';

// Open Collective Frontend imports
import { getWebsiteUrl } from '../../lib/utils';
import { P } from '../Text';
import StyledButton from '../StyledButton';
import Container from '../Container';
import Link from '../Link';
import FormattedMoneyAmount from '../FormattedMoneyAmount';
import StyledProgressBar from '../StyledProgressBar';

// Local tier page imports
import { Dimensions } from './_constants';
import ShareButtons from './ShareButtons';
import BubblesSVG from './Bubbles.svg';
import TierName from './TierName';
import TierLongDescription from './TierLongDescription';

/** The blured background image displayed under the tier description */
const TierCover = styled(Container)`
  width: 100%;
  height: ${Dimensions.COVER_HEIGHT}px;
  background-color: #005ea6;
  background-repeat: no-repeat;
  background-size: cover;
  filter: blur(15px);
  transform: scale(1.1);
`;

/** The little bubbles displayed above the tier's description */
const Bubbles = styled.div`
  background: url(${BubblesSVG}) no-repeat;
  height: 260px;
  background-size: 75% auto;
  background-position-x: right;
  background-position-y: 90px;

  @media (max-width: ${themeGet('breakpoints.0')}) {
    height: 130px;
    background-size: 90% auto;
    background-position-x: center;
    background-position-y: 110%;
  }
`;

/**
 * This is the tier page main layout.
 *
 * See design: https://www.figma.com/file/e71tBo0Sr8J7R5n6iMkqI42d/OC.COM-07-%2F-Collectives?node-id=2587%3A39809
 */
class TierPage extends Component {
  static propTypes = {
    /** The collective the tier belongs to */
    collective: PropTypes.shape({
      id: PropTypes.number.isRequired,
      slug: PropTypes.string.isRequired,
      type: PropTypes.string.isRequired,
    }).isRequired,

    /** The actual tier */
    tier: PropTypes.shape({
      id: PropTypes.number.isRequired,
      name: PropTypes.string.isRequired,
      slug: PropTypes.string.isRequired,
      description: PropTypes.string,
    }).isRequired,

    /** The logged in user */
    LoggedInUser: PropTypes.object,

    /** @ignore from `withRouter` */
    router: PropTypes.object,
  };

  render() {
    const { collective, tier, LoggedInUser, router } = this.props;
    const canEditTier = LoggedInUser && LoggedInUser.canEditCollective(collective);
    const pageUrl = `${getWebsiteUrl()}${router.asPath}`;
    const amountRaised = tier.interval ? tier.stats.totalRecurringDonations : tier.stats.totalDonated;

    return (
      <Container borderTop="1px solid #E6E8EB">
        <Container position="relative">
          <Container position="absolute" width={1} zIndex={-1} overflow="hidden">
            <TierCover
              backgroundImage={collective.backgroundImage ? `url(${collective.backgroundImage})` : undefined}
            />
          </Container>
          <Container
            position="absolute"
            background="white"
            height="100%"
            width={1}
            zIndex={-1}
            top={Dimensions.COVER_HEIGHT}
          />
        </Container>
        <Flex justifyContent="center">
          <Flex flex="0 1 1800px" px={[2, 4]} justifyContent="space-evenly" flexWrap="wrap" mb={64}>
            <Container
              display="flex"
              flexDirection="column"
              justifyContent="flex-end"
              flex="0 1 800px"
              mb={4}
              mx={[0, null, 3]}
            >
              <Bubbles />
              <Container
                background="white"
                borderRadius={8}
                px={[3, 4]}
                py={[4, 5]}
                boxShadow="0px 10px 15px 3px rgba(0, 0, 0, 0.05)"
              >
                <P fontSize="LeadParagraph" color="#C0C5CC" mb={3}>
                  <FormattedMessage id="TierPage.FinancialGoal" defaultMessage="Financial Goal" />
                </P>
                <Box mb={4}>
                  <TierName tierId={tier.id} name={tier.name} canEdit={canEditTier} />
                </Box>

                <TierLongDescription tierId={tier.id} description={tier.longDescription} canEdit={canEditTier} />
              </Container>
            </Container>
            <Container
              display="flex"
              flexDirection="column"
              justifyContent="space-evenly"
              background="white"
              height={Dimensions.COVER_HEIGHT}
              flex="0 1 385px"
              p="60px 32px"
            >
              {tier.goal && (
                <P fontSize="H5" color="black.500" lineHeight="H3" mb={3}>
                  <FormattedMessage
                    id="TierPage.AmountGoal"
                    defaultMessage="{amountWithInterval} goal"
                    values={{
                      amountWithInterval: (
                        <FormattedMoneyAmount
                          fontWeight="bold"
                          fontSize="H3"
                          color="black.900"
                          amount={tier.goal}
                          currency={tier.currency}
                          interval={tier.interval}
                        />
                      ),
                    }}
                  />
                </P>
              )}
              <P fontSize="Paragraph" color="black.400" lineHeight="LeadParagraph" mb={2}>
                <FormattedMessage
                  id="TierPage.AmountRaised"
                  defaultMessage="{amountWithInterval} raised"
                  values={{
                    amountWithInterval: (
                      <FormattedMoneyAmount
                        fontWeight="bold"
                        fontSize="LeadParagraph"
                        color="black.700"
                        amount={amountRaised}
                        currency={tier.currency}
                        interval={tier.interval}
                      />
                    ),
                  }}
                />
                {tier.goal && ` (${Math.round((amountRaised / tier.goal) * 100)}%)`}
              </P>
              {tier.goal && (
                <Box mt={1} mb={2}>
                  <StyledProgressBar percentage={amountRaised / tier.goal} />
                </Box>
              )}
              <div>
                <Link
                  route="orderCollectiveTierNew"
                  params={{ verb: 'contribute', tierId: tier.id, tierSlug: tier.slug, collectiveSlug: collective.slug }}
                >
                  <StyledButton buttonStyle="dark" width={1} my={4}>
                    <FormattedMessage id="Tier.Contribute" defaultMessage="Contribute" />
                  </StyledButton>
                </Link>
              </div>
              <P fontSize="LeadParagraph" color="black.700" fontWeight="bold" mt={4} mb={3}>
                <FormattedMessage id="TierPage.ShareGoal" defaultMessage="Share this goal" />
              </P>
              <ShareButtons pageUrl={pageUrl} collective={collective} />
            </Container>
          </Flex>
        </Flex>
      </Container>
    );
  }
}

export default withRouter(TierPage);
