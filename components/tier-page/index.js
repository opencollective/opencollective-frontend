import React, { Component } from 'react';
import { FormattedMessage } from 'react-intl';
import PropTypes from 'prop-types';
import { Flex, Box } from '@rebass/grid';
import styled from 'styled-components';
import themeGet from '@styled-system/theme-get';
import { withRouter } from 'next/router';
import gql from 'graphql-tag';

// Open Collective Frontend imports
import { getWebsiteUrl } from '../../lib/utils';
import { P, H1, H3 } from '../Text';
import StyledButton from '../StyledButton';
import Container from '../Container';
import Link from '../Link';
import FormattedMoneyAmount from '../FormattedMoneyAmount';
import StyledProgressBar from '../StyledProgressBar';
import Avatar from '../Avatar';
import LinkCollective from '../LinkCollective';
import InlineEditField from '../InlineEditField';

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

/** A mutation with all the info that user is allowed to edit on this page */
const EditTierMutation = gql`
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
        <P fontSize="LeadParagraph" color="black.700" fontWeight="bold" mt={4} mb={3}>
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

    return (
      <Container borderTop="1px solid #E6E8EB">
        {/** ---- Hero / Banner ---- */}
        <Container
          display="flex"
          alignItems="center"
          position="sticky"
          top={0}
          px={[3, 4]}
          height={[70, 90]}
          zIndex={999}
          background="white"
          borderBottom="1px solid #E6E8EB"
        >
          <Container flex="1" maxWidth={1440} m="0 auto">
            <Flex alignItems="center">
              <LinkCollective collective={collective}>
                <Avatar collective={collective} bg="#EBEBEB" border="1px solid #efefef" radius={40} borderRadius={10} />
              </LinkCollective>
              <LinkCollective collective={collective}>
                <H1 color="black.800" fontSize={'H5'} ml={3}>
                  {collective.name || collective.slug}
                </H1>
              </LinkCollective>
            </Flex>
          </Container>
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
              <Container background="white" borderRadius={8} px={[3, 4]} py={[4, 5]}>
                <P fontSize="LeadParagraph" color="#C0C5CC" mb={3}>
                  <FormattedMessage id="TierPage.FinancialGoal" defaultMessage="Financial Goal" />
                </P>
                <H1 textAlign="left" color="black.900" wordBreak="break-word" mb={4} data-cy="TierName">
                  <InlineEditField
                    mutation={EditTierMutation}
                    canEdit={canEdit}
                    values={tier}
                    field="name"
                    placeholder={<FormattedMessage id="TierPage.AddTitle" defaultMessage="Add a title" />}
                  />
                </H1>
                <H3
                  color="black.500"
                  fontSize="H5"
                  mb={4}
                  whiteSpace="pre-line"
                  data-cy="shortDescription"
                  wordBreak="break-word"
                >
                  <InlineEditField
                    mutation={EditTierMutation}
                    canEdit={canEdit}
                    values={tier}
                    field="description"
                    placeholder={
                      <FormattedMessage id="TierPage.AddDescription" defaultMessage="Add a short description" />
                    }
                  />
                </H3>
                <Container display="flex" flexDirection="column-reverse" position="relative" flexWrap="wrap">
                  <div>
                    <TierLongDescription tier={tier} editMutation={EditTierMutation} canEdit={canEdit} />
                  </div>
                  <Container
                    position={['relative', null, null, 'absolute']}
                    right={[null, null, null, -390, -490]}
                    width={['100%', null, null, 380, 472]}
                    mb={[4, 5]}
                    top={0}
                  >
                    <TierVideo tier={tier} editMutation={EditTierMutation} canEdit={canEdit} />
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
              borderTop={['1px solid #E6E8EB', null, 'none']}
              zIndex={9}
              flex="0 1 385px"
              p={['0 16px', '0 24px', null, '60px 32px']}
              boxShadow={['0px -3px 5px rgba(70, 70, 70, 0.15)', null, null, 'none']}
            >
              {/** Tier progress */}
              <Flex flex="0 1 50%" flexDirection="column" justifyContent="center">
                {tier.goal && (
                  <P
                    fontSize={['Caption', 'Paragraph', null, 'H5']}
                    color="black.500"
                    lineHeight={['LeadParagraph', null, null, 'H3']}
                    mb={[0, null, null, 3]}
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
                            abbreviateAmount
                            abbreviateInterval
                            amountStyles={{ fontWeight: 'bold', color: 'black.900' }}
                          />
                        ),
                      }}
                    />
                  </P>
                )}
                <P
                  fontSize={['9px', 'Tiny', 'Paragraph']}
                  color="black.500"
                  lineHeight={['Caption', null, 'LeadParagraph']}
                  mb={[0, null, null, 2]}
                >
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
              </Flex>
              {/** Contribute button */}
              <Flex alignItems="center">
                <Box width={1}>
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
                      <FormattedMessage id="Tier.Contribute" defaultMessage="Contribute" />
                    </StyledButton>
                  </Link>
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
          />
        )}
      </Container>
    );
  }
}

export default withRouter(TierPage);
