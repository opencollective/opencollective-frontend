import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { gql } from '@apollo/client';
import themeGet from '@styled-system/theme-get';
import { withRouter } from 'next/router';
import { FormattedMessage } from 'react-intl';
import styled from 'styled-components';

import { isTierExpired } from '../../lib/tier-utils';
// Open Collective Frontend imports
import { getWebsiteUrl } from '../../lib/utils';

import { Sections } from '../collective-page/_constants';
import CollectiveNavbar from '../CollectiveNavbar';
import Container from '../Container';
import FormattedMoneyAmount from '../FormattedMoneyAmount';
import { Box, Flex } from '../Grid';
import InlineEditField from '../InlineEditField';
import Link from '../Link';
import StyledButton from '../StyledButton';
import StyledProgressBar from '../StyledProgressBar';
import { H1, H2, P } from '../Text';

// Local tier page imports
import { Dimensions } from './_constants';
import ShareButtons from './ShareButtons';
import TierContributors from './TierContributors';
import TierLongDescription from './TierLongDescription';
import TierVideo from './TierVideo';

import BubblesSVG from './Bubbles.svg';

const generateBackground = (theme, image) => {
  const color = theme.colors.primary[300];
  const gradient = `linear-gradient(0deg, ${theme.colors.primary[800]}, ${theme.colors.primary[400]})`;
  const imageCss = image ? `url(${image}), ` : '';
  return `${imageCss}${gradient}, ${color}`;
};

/** The blured background image displayed under the tier description */
const TierCover = styled.div`
  width: 100%;
  height: ${Dimensions.COVER_HEIGHT}px;
  background: ${props => generateBackground(props.theme, props.backgroundImage)};
  background-color: ${props => props.theme.colors.primary[300]};
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

/** Container for the info, with overflow hidden to truncate text with css */
const ProgressInfoContainer = styled.div`
  overflow: hidden;
  display: flex;
  flex-direction: column;
  justify-content: center;
  flex: 0 1 50%;
`;

/** A mutation with all the info that user is allowed to edit on this page */
const editTierMutation = gql`
  mutation UpdateTier($id: Int!, $name: String, $description: String, $longDescription: String, $videoUrl: String) {
    editTier(
      tier: { id: $id, description: $description, name: $name, longDescription: $longDescription, videoUrl: $videoUrl }
    ) {
      id
      name
      description
      longDescription
      videoUrl
    }
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
      name: PropTypes.string.isRequired,
      currency: PropTypes.string,
      type: PropTypes.string.isRequired,
      image: PropTypes.string,
      backgroundImage: PropTypes.string,
    }).isRequired,

    /** The actual tier */
    tier: PropTypes.shape({
      id: PropTypes.number.isRequired,
      name: PropTypes.string.isRequired,
      slug: PropTypes.string.isRequired,
      interval: PropTypes.string.isRequired,
      currency: PropTypes.string,
      endsAt: PropTypes.string,
      button: PropTypes.string,
      goal: PropTypes.number,
      description: PropTypes.string,
      longDescription: PropTypes.string,
      videoUrl: PropTypes.string,
      stats: PropTypes.shape({
        totalRecurringDonations: PropTypes.number,
        totalDonated: PropTypes.number,
      }),
    }).isRequired,

    /** The contributors for this tier */
    contributors: PropTypes.arrayOf(PropTypes.object),

    /** Some statistics about this tier */
    contributorsStats: PropTypes.shape({
      all: PropTypes.number.isRequired,
      collectives: PropTypes.number.isRequired,
      organizations: PropTypes.number.isRequired,
      users: PropTypes.number.isRequired,
    }).isRequired,

    /** The logged in user */
    LoggedInUser: PropTypes.object,

    /** @ignore from `withRouter` */
    router: PropTypes.object,
  };

  renderShareBlock() {
    const pageUrl = `${getWebsiteUrl()}${this.props.router.asPath}`;
    return (
      <div>
        <P fontSize="16px" color="black.700" fontWeight="bold" mt={4} mb={3}>
          <FormattedMessage id="TierPage.ShareGoal" defaultMessage="Share this goal" />
        </P>
        <ShareButtons pageUrl={pageUrl} collective={this.props.collective} />
      </div>
    );
  }

  render() {
    const { collective, tier, contributors, contributorsStats, LoggedInUser } = this.props;
    const canEdit = LoggedInUser && LoggedInUser.canEditCollective(collective);
    const amountRaised = tier.interval ? tier.stats.totalRecurringDonations : tier.stats.totalDonated;
    const shareBlock = this.renderShareBlock();
    const isPassed = isTierExpired(tier);

    return (
      <Container pb={4}>
        {/** ---- Hero / Banner ---- */}
        <Container position="sticky" top={0} zIndex={999}>
          <CollectiveNavbar collective={collective} selected={Sections.CONTRIBUTE} isAdmin={canEdit} />
        </Container>
        <Container position="relative">
          <Container position="absolute" width={1} zIndex={-1} overflow="hidden">
            <TierCover backgroundImage={collective.backgroundImage} />
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
        {/** ---- Description ---- */}
        <Flex justifyContent="center">
          <Flex flex="0 1 1800px" px={[2, 4]} justifyContent="space-evenly" mb={64}>
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
                boxShadow="-3px 11px 13px rgba(75, 75, 75, 0.1)"
              >
                <P fontSize="16px" color="#C0C5CC" mb={3}>
                  <FormattedMessage id="TierPage.FinancialGoal" defaultMessage="Financial Goal" />
                </P>
                <H1 fontSize="40px" textAlign="left" color="black.900" wordBreak="break-word" mb={3} data-cy="TierName">
                  <InlineEditField
                    mutation={editTierMutation}
                    canEdit={canEdit}
                    values={tier}
                    field="name"
                    maxLength={255}
                    placeholder={<FormattedMessage id="TierPage.AddTitle" defaultMessage="Add a title" />}
                  />
                </H1>
                <H2
                  color="black.600"
                  fontSize="20px"
                  lineHeight="1.5em"
                  mb={4}
                  whiteSpace="pre-line"
                  data-cy="shortDescription"
                  wordBreak="break-word"
                >
                  <InlineEditField
                    mutation={editTierMutation}
                    canEdit={canEdit}
                    values={tier}
                    field="description"
                    maxLength={510}
                    placeholder={
                      <FormattedMessage id="TierPage.AddDescription" defaultMessage="Add a short description" />
                    }
                  />
                </H2>
                <Container display="flex" flexDirection="column-reverse" position="relative" flexWrap="wrap">
                  <div>
                    <TierLongDescription tier={tier} editMutation={editTierMutation} canEdit={canEdit} />
                  </div>
                  <Container
                    position={['relative', null, null, 'absolute']}
                    right={[null, null, null, -390, -490]}
                    width={['100%', null, null, 380, 472]}
                    mb={[4, 5]}
                    top={[0, null, null, -50]}
                  >
                    <TierVideo tier={tier} editMutation={editTierMutation} canEdit={canEdit} />
                  </Container>
                </Container>
                <Container display={['block', null, null, 'none']} mt={2} maxWidth={275}>
                  {shareBlock}
                </Container>
              </Container>
            </Container>

            {/** ---- Contribute ---- */}
            <Container
              position={['fixed', null, null, 'relative']}
              bottom={0}
              width={1}
              display="flex"
              flexDirection={['row', null, null, 'column']}
              justifyContent="space-between"
              background="white"
              height={[72, null, 82, Dimensions.COVER_HEIGHT]}
              zIndex={9}
              flex="0 1 385px"
              p={['0 16px', '0 24px', null, '60px 32px']}
              boxShadow={['0px -3px 5px rgba(70, 70, 70, 0.15)', null, null, 'none']}
            >
              {/** Tier progress */}
              <ProgressInfoContainer>
                {tier.goal && (
                  <P
                    fontSize={['12px', '14px', null, '20px']}
                    color="black.500"
                    lineHeight={['24px', null, null, '36px']}
                    mb={[0, null, null, 3]}
                    truncateOverflow
                  >
                    <FormattedMessage
                      id="TierPage.AmountGoal"
                      defaultMessage="{amountWithInterval} goal"
                      values={{
                        amountWithInterval: (
                          <FormattedMoneyAmount
                            amount={tier.goal}
                            currency={tier.currency}
                            interval={tier.interval}
                            abbreviateAmount={tier.goal > 1000000}
                            abbreviateInterval
                            amountStyles={{ fontWeight: 'bold', color: 'black.900' }}
                            precision={0}
                          />
                        ),
                      }}
                    />
                  </P>
                )}
                <P
                  fontSize={['10px', '14px']}
                  color="black.500"
                  lineHeight={['18px', null, '24px']}
                  mb={[0, null, null, 2]}
                  truncateOverflow
                >
                  {amountRaised > 0 && (
                    <FormattedMessage
                      id="TierPage.AmountRaised"
                      defaultMessage="{amountWithInterval} raised"
                      values={{
                        amountWithInterval: (
                          <FormattedMoneyAmount
                            color="black.700"
                            amount={amountRaised}
                            currency={tier.currency}
                            interval={tier.interval}
                            amountStyles={{ fontWeight: 'bold', color: 'black.700' }}
                            abbreviateAmount={amountRaised > 1000000}
                            precision={0}
                            abbreviateInterval
                          />
                        ),
                      }}
                    />
                  )}
                  {tier.goal && ` (${Math.round((amountRaised / tier.goal) * 100)}%)`}
                </P>
                {tier.goal && (
                  <Box mt={1} mb={2}>
                    <StyledProgressBar percentage={amountRaised / tier.goal} />
                  </Box>
                )}
              </ProgressInfoContainer>
              {/** Contribute button */}
              <Flex alignItems="center">
                <Box width={1}>
                  {isPassed ? (
                    <P textAlign="center">
                      <FormattedMessage id="Tier.Past" defaultMessage="This contribution type is not active anymore." />{' '}
                      <Link route="contribute" params={{ collectiveSlug: collective.slug, verb: 'contribute' }}>
                        <FormattedMessage
                          id="createOrder.backToTier"
                          defaultMessage="View all the other ways to contribute"
                        />
                        .
                      </Link>
                    </P>
                  ) : (
                    <Link
                      route="orderCollectiveTierNew"
                      params={{
                        verb: 'contribute',
                        tierId: tier.id,
                        tierSlug: tier.slug,
                        collectiveSlug: collective.slug,
                      }}
                    >
                      <StyledButton buttonStyle="primary" width={1} my={4} minWidth={128} data-cy="ContributeBtn">
                        {tier.button ? tier.button : <FormattedMessage id="Contribute" defaultMessage="Contribute" />}
                      </StyledButton>
                    </Link>
                  )}
                </Box>
              </Flex>
              {/** Share buttons (desktop only) */}
              <Container display={['none', null, null, 'block']}>{shareBlock}</Container>
            </Container>
          </Flex>
        </Flex>
        {contributors && contributors.length > 0 && (
          <TierContributors
            collectiveName={collective.name}
            contributors={contributors}
            contributorsStats={contributorsStats}
            currency={tier.currency || collective.currency}
            collectiveId={collective.id}
          />
        )}
      </Container>
    );
  }
}

export default withRouter(TierPage);
