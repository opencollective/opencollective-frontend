import React, { Fragment } from 'react';
import PropTypes from 'prop-types';
import { gql } from '@apollo/client';
import { graphql } from '@apollo/client/react/hoc';
import { Facebook } from '@styled-icons/fa-brands/Facebook';
import { Twitter } from '@styled-icons/fa-brands/Twitter';
import themeGet from '@styled-system/theme-get';
import { get } from 'lodash';
import { withRouter } from 'next/router';
import { defineMessages, FormattedMessage, injectIntl } from 'react-intl';
import styled, { css } from 'styled-components';

import { facebookShareURL, tweetURL } from '../../lib/url_helpers';

import Container from '../../components/Container';
import { Box, Flex } from '../../components/Grid';
import Newsletter from '../../components/home/Newsletter';
import Loading from '../../components/Loading';
import StyledLink from '../../components/StyledLink';
import { H3, P, Span } from '../../components/Text';
import { withUser } from '../../components/UserProvider';

import PublicMessageForm from './ContributionFlowPublicMessage';
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

// GraphQL
const orderSuccessMemberQuery = gql`
  query OrderSuccessMember($collectiveId: Int!, $memberCollectiveId: Int!, $tierId: Int) {
    member(CollectiveId: $collectiveId, MemberCollectiveId: $memberCollectiveId, TierId: $tierId) {
      id
      publicMessage
    }
  }
`;

class NewContributionFlowSuccess extends React.Component {
  static propTypes = {
    collective: PropTypes.object,
    LoggedInUser: PropTypes.object,
    intl: PropTypes.object,
    router: PropTypes.object,
    loadingLoggedInUser: PropTypes.bool,
    data: PropTypes.object,
    stepProfile: PropTypes.object,
    contribution: PropTypes.object,
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
        id: 'home.joinUsSection.weNeedUpdate',
        defaultMessage: 'We send updates once a month.',
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
          mx={[3, 0]}
          my={2}
          mb={[4, 0]}
          px={4}
          py={2}
          justifyContent="space-between"
          maxWidth={600}
          hoverable={cta.link}
        >
          <Flex
            flexDirection="column"
            alignItems="left"
            justifyContent="center"
            width={[cta.subscribe ? 1 : 4 / 5, 4 / 5]}
            my={3}
          >
            <H3 mb={3}>{cta.headerText}</H3>
            <P fontSize="14px" lineHeight="24px" fontWeight={300} color="black.700">
              {cta.contentText}
            </P>
            {cta.subscribe && (
              <Box mt={2}>
                <Newsletter />
              </Box>
            )}
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

  renderCommentForm = (LoggedInUser, publicMessage) => {
    if (!LoggedInUser) {
      return null;
    }
    return (
      <PublicMessageForm
        stepProfile={this.props.stepProfile}
        publicMessage={publicMessage}
        collective={this.props.collective}
      />
    );
  };

  render() {
    const { loadingLoggedInUser, LoggedInUser, data, collective, contribution } = this.props;
    const shareURL = `${process.env.WEBSITE_URL}${collective.path}`;
    const publicMessage = data && get(data, 'member.publicMessage', null);

    return loadingLoggedInUser || data.loading ? (
      <Loading />
    ) : (
      <Flex justifyContent="center" width={1} minHeight={[400, 800]} flexDirection={['column', 'row']}>
        <ContainerWithImage display="flex" alignItems="center" justifyContent="center" width={[1, 1 / 2]}>
          <Flex flexDirection="column" alignItems="center" justifyContent="center" my={4} width={1}>
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
              contribution={contribution}
              my={2}
            />
            <Box my={4}>
              <P fontColor="black.800" fontWeight={500}>
                <FormattedMessage
                  id="NewContributionFlow.Success.DiscoverMore"
                  defaultMessage="Discover more Collectives like {collective} &rarr;"
                  values={{ collective: collective.name }}
                />
              </P>
            </Box>
            <Flex justifyContent="center" mt={2}>
              <ShareLink href={tweetURL({ url: shareURL, text: `I've just donated to {collective.name}` })}>
                <Twitter size="1.2em" color="#4E5052" />
                <FormattedMessage id="tweetIt" defaultMessage="Tweet it" />
              </ShareLink>
              <ShareLink href={facebookShareURL({ url: shareURL })}>
                <Facebook size="1.2em" color="#4E5052" />
                <FormattedMessage id="shareIt" defaultMessage="Share it" />
              </ShareLink>
            </Flex>
            {this.renderCommentForm(LoggedInUser, publicMessage)}
          </Flex>
        </ContainerWithImage>
        <Flex flexDirection="column" alignItems="center" justifyContent="center" width={[1, 1 / 2]}>
          {this.renderCallsToAction()}
        </Flex>
      </Flex>
    );
  }
}

const addOrderSuccessMemberData = graphql(orderSuccessMemberQuery, {
  options: () => {
    const variables = { collectiveId: this.props.collective.legacyId, memberCollectiveId: this.props.stepProfile.id };
    return { variables };
  },
});

export default injectIntl(withUser(withRouter(addOrderSuccessMemberData(NewContributionFlowSuccess))));
