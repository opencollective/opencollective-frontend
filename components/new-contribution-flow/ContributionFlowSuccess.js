import React, { Fragment } from 'react';
import PropTypes from 'prop-types';
import { graphql } from '@apollo/client/react/hoc';
import { Facebook } from '@styled-icons/fa-brands/Facebook';
import { Twitter } from '@styled-icons/fa-brands/Twitter';
import themeGet from '@styled-system/theme-get';
import { get } from 'lodash';
import { withRouter } from 'next/router';
import { defineMessages, FormattedMessage, injectIntl } from 'react-intl';
import styled, { css } from 'styled-components';

import { ORDER_STATUS } from '../../lib/constants/order-status';
import { formatCurrency } from '../../lib/currency-utils';
import { API_V2_CONTEXT, gqlV2 } from '../../lib/graphql/helpers';
import { facebookShareURL, tweetURL } from '../../lib/url_helpers';

import Container from '../../components/Container';
import { formatAccountDetails } from '../../components/edit-collective/utils';
import { Box, Flex } from '../../components/Grid';
import Newsletter from '../../components/home/Newsletter';
import I18nFormatters, { getI18nLink } from '../../components/I18nFormatters';
import Link from '../../components/Link';
import Loading from '../../components/Loading';
import MessageBox from '../../components/MessageBox';
import StyledLink from '../../components/StyledLink';
import { H3, P, Span } from '../../components/Text';
import { withUser } from '../../components/UserProvider';

import PublicMessageForm from './ContributionFlowPublicMessage';
import ContributorCardWithTier from './ContributorCardWithTier';
import { orderSuccessFragment } from './index';

// Styled components
const ContainerWithImage = styled(Container)`
  @media screen and (max-width: 40em) {
    background: url('/static/images/new-contribution-flow/NewContributionFlowSuccessPageBackgroundMobile.png');
    background-position: top;
    background-repeat: no-repeat;
    background-size: 100% auto;
  }

  @media screen and (min-width: 40em) and (max-width: 52em) {
    background: url('/static/images/new-contribution-flow/NewContributionFlowSuccessPageBackgroundDesktop.png');
    background-position: left;
    background-repeat: no-repeat;
    background-size: auto 100%;
  }

  @media screen and (min-width: 52em) {
    background: url('/static/images/new-contribution-flow/NewContributionFlowSuccessPageBackgroundDesktop.png');
    background-position: left;
    background-repeat: no-repeat;
    background-size: cover;
  }
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

const BankTransferInfoContainer = styled(Container)`
  border: 1px solid ${themeGet('colors.black.400')};
  border-radius: 12px;
  background-color: white;
`;

class NewContributionFlowSuccess extends React.Component {
  static propTypes = {
    collective: PropTypes.object,
    LoggedInUser: PropTypes.object,
    intl: PropTypes.object,
    router: PropTypes.object,
    loadingLoggedInUser: PropTypes.bool,
    data: PropTypes.object,
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
    return <PublicMessageForm order={this.props.data.order} publicMessage={publicMessage} />;
  };

  renderInstructions = (instructions, formatValues) => {
    return instructions.replace(/{([\s\S]+?)}/g, (match, p1) => {
      if (p1) {
        const key = p1.toLowerCase();
        if (formatValues[key] !== undefined) {
          return formatValues[key];
        }
      }
      return match;
    });
  };

  renderBankTransferInformation = () => {
    let instructions = get(this.props.data, 'order.toAccount.host.settings.paymentMethods.manual.instructions', null);
    const bankAccount = get(this.props.data, 'order.toAccount.host.payoutMethods[0].data', null);
    const amount =
      (get(this.props.data, 'order.amount.value') + get(this.props.data, 'order.platformContributionAmount.value', 0)) *
      100;
    const currency = get(this.props.data, 'order.amount.currency');
    const formattedAmount = formatCurrency(amount, currency);

    const formatValues = {
      account: formatAccountDetails(bankAccount),
      reference: get(this.props.data, 'order.id', null),
      amount: formattedAmount,
      collective: get(this.props.data, 'order.toAccount.name', null),
    };

    instructions = this.renderInstructions(instructions, formatValues);

    return (
      <Flex flexDirection="column" justifyContent="center" width={[1, 3 / 4]} px={[4, 0]} py={[2, 0]}>
        <MessageBox type="warning" fontSize="12px">
          <FormattedMessage
            id="collective.user.orderProcessing.manual"
            defaultMessage="<strong>Your donation is pending.</strong> Please follow the instructions in the confirmation email to manually pay the host of the collective."
            values={I18nFormatters}
          />
        </MessageBox>
        <BankTransferInfoContainer my={3} p={4}>
          <H3>
            <FormattedMessage id="NewContributionFlow.PaymentInstructions" defaultMessage="Payment instructions" />
          </H3>
          <Flex mt={2}>
            <Flex style={{ whiteSpace: 'pre-wrap' }}>{instructions}</Flex>
          </Flex>
        </BankTransferInfoContainer>
        <Flex px={3}>
          <P fontSize="16px" color="black.700">
            <FormattedMessage
              id="NewContributionFlow.InTheMeantime"
              defaultMessage="In the meantime, you can follow {collective} and see how they are spending the money <CollectiveLink>on their collective page</CollectiveLink>."
              values={{
                collective: this.props.data.order.toAccount.name,
                CollectiveLink: getI18nLink({
                  as: Link,
                  route: 'collective',
                  params: { slug: this.props.data.order.toAccount.slug },
                }),
              }}
            />
          </P>
        </Flex>
      </Flex>
    );
  };

  render() {
    const { LoggedInUser, collective, data } = this.props;
    const { order } = data;
    const shareURL = `${process.env.WEBSITE_URL}${collective.path}`;
    const pendingOrder = order && order.status === ORDER_STATUS.PENDING;

    const getPublicMessage = order => {
      return get(order, 'membership.publicMessage');
    };

    return (
      <Flex justifyContent="center" width={1} minHeight={[400, 800]} flexDirection={['column', 'row']}>
        {data.loading ? (
          <Container display="flex" alignItems="center" justifyContent="center">
            <Loading />
          </Container>
        ) : (
          <Fragment>
            <ContainerWithImage
              display="flex"
              alignItems="center"
              justifyContent="center"
              width={[1, '523px', '762px']}
              flexShrink={0}
            >
              <Flex flexDirection="column" alignItems="center" justifyContent="center" my={4} width={1}>
                <H3 mb={3}>
                  <FormattedMessage id="NewContributionFlow.Success.Header" defaultMessage="Thank you! 🎉" />
                </H3>
                <Box mb={3}>
                  <P fontSize="20px" fontColor="black.700" fontWeight={500} textAlign="center">
                    <FormattedMessage
                      id="NewContributionFlow.Success.NowSupporting"
                      defaultMessage="You are now supporting {collective}."
                      values={{ collective: order.toAccount.name }}
                    />
                  </P>
                </Box>
                <ContributorCardWithTier width={250} height={380} contribution={order} my={2} />
                <Box my={4}>
                  <P fontColor="black.800" fontWeight={500}>
                    <FormattedMessage
                      id="NewContributionFlow.Success.DiscoverMore"
                      defaultMessage="Discover more Collectives like {collective} &rarr;"
                      values={{ collective: order.toAccount.name }}
                    />
                  </P>
                </Box>
                <Flex justifyContent="center" mt={2}>
                  <ShareLink
                    href={tweetURL({
                      url: shareURL,
                      text: `I've just donated to {order.toAccount.name}`,
                    })}
                  >
                    <Twitter size="1.2em" color="#4E5052" />
                    <FormattedMessage id="tweetIt" defaultMessage="Tweet it" />
                  </ShareLink>
                  <ShareLink href={facebookShareURL({ url: shareURL })}>
                    <Facebook size="1.2em" color="#4E5052" />
                    <FormattedMessage id="shareIt" defaultMessage="Share it" />
                  </ShareLink>
                </Flex>
                {this.renderCommentForm(LoggedInUser, getPublicMessage(order))}
              </Flex>
            </ContainerWithImage>
            <Flex flexDirection="column" alignItems="center" justifyContent="center" width={1}>
              {pendingOrder ? this.renderBankTransferInformation() : this.renderCallsToAction()}
            </Flex>
          </Fragment>
        )}
      </Flex>
    );
  }
}

// GraphQL
const orderSuccessQuery = gqlV2/* GraphQL */ `
  query NewContributionFlowOrderSuccess($order: OrderReferenceInput!) {
    order(order: $order) {
      ...OrderSuccessFragment
    }
  }
  ${orderSuccessFragment}
`;

const addOrderSuccessQuery = graphql(orderSuccessQuery, {
  options: props => ({
    context: API_V2_CONTEXT,
    variables: { order: { id: props.router.query.OrderId } },
  }),
});

export default injectIntl(withUser(withRouter(addOrderSuccessQuery(NewContributionFlowSuccess))));
