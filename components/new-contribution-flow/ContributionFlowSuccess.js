import React, { Fragment } from 'react';
import PropTypes from 'prop-types';
import { Facebook } from '@styled-icons/fa-brands/Facebook';
import { Twitter } from '@styled-icons/fa-brands/Twitter';
import themeGet from '@styled-system/theme-get';
import { withRouter } from 'next/router';
import { defineMessages, FormattedMessage, injectIntl } from 'react-intl';
import styled, { css } from 'styled-components';

import { facebookShareURL, tweetURL } from '../../lib/url_helpers';

import Container from '../../components/Container';
import { Box, Flex } from '../../components/Grid';
import Loading from '../../components/Loading';
import StyledLink from '../../components/StyledLink';
import { H3, P, Span } from '../../components/Text';
import { withUser } from '../../components/UserProvider';

import ContributorCardWithTier from './ContributorCardWithTier';

// Styled components
const ContainerWithImage = styled(Container)`
  background: url('/static/images/new-contribution-flow/NewContributionFlowSuccessPageBackgroundDesktop.png');
  background-repeat: no-repeat;
  background-size: contain;
  background-position: left;
`;

const CTAContainer = styled(Container)`
  border: 1px solid ${themeGet('colors.black.400')};
  border-radius: 10px;
  background-color: white;

  ${props =>
    props.hoverable &&
    css`
      &:hover {
        border: 1px solid ${themeGet('colors.primary.500')};
        cursor: pointer;

        h3,
        span {
          color: ${themeGet('colors.primary.800')};
        }
      }
    `}
`;

const ShareLink = styled(StyledLink)`
  display: flex;
  justify-content: center;
  align-items: center;
  svg {
    margin-right: 8px;
  }
`;

ShareLink.defaultProps = {
  buttonStyle: 'standard',
  buttonSize: 'medium',
  minWidth: 130,
  mx: 2,
  mb: 2,
  target: '_blank',
};

// only meant until page is hooked up to actual success data
const exampleContribution = {
  totalDonations: 5000,
  amount: {
    value: 5000,
    currency: 'USD',
  },
  frequency: 'MONTHLY',
  platformFee: {
    value: 100,
  },
  exampleTier: 'Custom contribution',
};

class NewContributionFlowSuccess extends React.Component {
  static propTypes = {
    collective: PropTypes.object,
    LoggedInUser: PropTypes.object,
    intl: PropTypes.object,
    router: PropTypes.object,
    loadingLoggedInUser: PropTypes.bool,
  };

  constructor(props) {
    super(props);

    this.headerMessages = defineMessages({
      join: {
        id: 'collective.create.join',
        defaultMessage: 'Join Open Collective',
      },
      read: {
        id: 'NewContributionFlow.Success.CTA.Read.Header',
        defaultMessage: 'Read our stories',
      },
      subscribe: {
        id: 'home.joinUsSection.newsletter',
        defaultMessage: 'Subscribe to our newsletter',
      },
    });

    this.contentMessages = defineMessages({
      join: {
        id: 'NewContributionFlow.Success.CTA.Join.Content',
        defaultMessage: 'Create an account and show all your contributions to the community.',
      },
      read: {
        id: 'NewContributionFlow.Success.CTA.Read.Content',
        defaultMessage:
          'Open Collective aims to foster transparency and sustainability in communities around the world. See how you could participate.',
      },
      subscribe: {
        id: 'NewContributionFlow.Success.CTA.Subscribe.Content',
        defaultMessage: 'Give us ur info 👁👄👁',
      },
    });
  }

  renderCallsToAction = () => {
    const joinCallToAction = {
      headerText: this.props.intl.formatMessage(this.headerMessages.join),
      contentText: this.props.intl.formatMessage(this.contentMessages.join),
      subscribe: false,
      link: '/create-account',
    };

    const readCallToAction = {
      headerText: this.props.intl.formatMessage(this.headerMessages.read),
      contentText: this.props.intl.formatMessage(this.contentMessages.read),
      subscribe: false,
      link: 'https://blog.opencollective.com',
    };

    const subscribeCallToAction = {
      headerText: this.props.intl.formatMessage(this.headerMessages.subscribe),
      contentText: this.props.intl.formatMessage(this.contentMessages.subscribe),
      subscribe: true,
    };

    const allCallsToAction = !this.props.LoggedInUser;
    // this is for when we redirect from email for freshly signed up recurring contributions users
    // const readAndSubscribeCallsToAction = !LoggedInUser && this.props.router.query.emailRedirect;
    const readOnlyCallToAction = this.props.LoggedInUser && !this.props.router.query.emailRedirect;

    const callsToAction = [];

    // all guest transactions
    if (allCallsToAction) {
      callsToAction.push(joinCallToAction, readCallToAction, subscribeCallToAction);
    }
    // all other logged in recurring/one time contributions
    else if (readOnlyCallToAction) {
      callsToAction.push(readCallToAction);
    }
    // recurring contributions who have just signed up
    // else if (readAndSubscribeCallsToAction) {
    //   callsToAction.push(readCallToAction, subscribeCallToAction);
    // }

    const innerCTA = cta => {
      return (
        <CTAContainer
          display="flex"
          my={2}
          px={4}
          py={2}
          justifyContent="space-between"
          maxWidth={600}
          hoverable={cta.link}
        >
          <Flex flexDirection="column" alignItems="left" justifyContent="center" width={4 / 5} my={3}>
            <H3 mb={3}>{cta.headerText}</H3>
            <P fontSize="14px" lineHeight="24px" fontWeight={300} color="black.700">
              {cta.contentText}
            </P>
            {/* {cta.subscribe && email form here} */}
          </Flex>
          {!cta.subscribe && (
            <Flex alignItems="center" justifyContent="center">
              <Span fontSize={40}>&rarr;</Span>
            </Flex>
          )}
        </CTAContainer>
      );
    };

    return (
      <Flex flexDirection="column" justifyContent="center">
        {callsToAction.map(cta =>
          cta.link ? (
            <StyledLink href={cta.link} openInNewTab key={cta.headerText} color="black.700">
              {innerCTA(cta)}
            </StyledLink>
          ) : (
            <Fragment>{innerCTA(cta)}</Fragment>
          ),
        )}
      </Flex>
    );
  };

  render() {
    const { collective, loadingLoggedInUser } = this.props;
    const shareURL = `${process.env.WEBSITE_URL}${collective.path}`;

    return loadingLoggedInUser ? (
      <Loading />
    ) : (
      <Flex justifyContent="center" width={1} height={800}>
        <ContainerWithImage display="flex" alignItems="center" justifyContent="center" width={1 / 2}>
          <Flex flexDirection="column" alignItems="center" justifyContent="center" my={4}>
            <H3 mb={3}>
              <FormattedMessage id="NewContributionFlow.Success.Header" defaultMessage="Thank you! 🎉" />
            </H3>
            <Box mb={3}>
              <P fontSize="20px" fontColor="black.700" fontWeight={500}>
                <FormattedMessage
                  id="NewContributionFlow.Success.NowSupporting"
                  defaultMessage="You are now supporting {collective}."
                  values={{ collective: collective.name }}
                />
              </P>
            </Box>
            <ContributorCardWithTier
              width={250}
              height={380}
              collective={collective}
              contribution={exampleContribution}
              my={2}
            />
            <Box mt={3}>
              <P fontColor="black.800" fontWeight={500}>
                <FormattedMessage
                  id="NewContributionFlow.Success.DiscoverMore"
                  defaultMessage="Discover more Collectives like {collective} &rarr;"
                  values={{ collective: collective.name }}
                />
              </P>
            </Box>
            <Flex justifyContent="center" mt={3}>
              <ShareLink href={tweetURL({ url: shareURL, text: `I've just donated to {collective.name}` })}>
                <Twitter size="1.2em" color="#4E5052" />
                <FormattedMessage id="tweetIt" defaultMessage="Tweet it" />
              </ShareLink>
              <ShareLink href={facebookShareURL({ url: shareURL })}>
                <Facebook size="1.2em" color="#4E5052" />
                <FormattedMessage id="shareIt" defaultMessage="Share it" />
              </ShareLink>
            </Flex>
            {/* comment box conditionally rendered here if LoggedInUser */}
          </Flex>
        </ContainerWithImage>
        <Flex flexDirection="column" alignItems="center" justifyContent="center" width={1 / 2}>
          {this.renderCallsToAction()}
        </Flex>
      </Flex>
    );
  }
}

export default injectIntl(withUser(withRouter(NewContributionFlowSuccess)));
