import React, { Fragment } from 'react';
import PropTypes from 'prop-types';
import { graphql } from '@apollo/client/react/hoc';
import { themeGet } from '@styled-system/theme-get';
import { get, uniqBy } from 'lodash';
import { withRouter } from 'next/router';
import { defineMessages, FormattedMessage, injectIntl } from 'react-intl';
import styled from 'styled-components';

import { AnalyticsEvent } from '../../lib/analytics/events';
import { track } from '../../lib/analytics/plausible';
import { getIntervalFromGQLV2Frequency } from '../../lib/constants/intervals';
import { ORDER_STATUS } from '../../lib/constants/order-status';
import { formatCurrency } from '../../lib/currency-utils';
import { API_V2_CONTEXT, gql } from '../../lib/graphql/helpers';
import { SocialLinkType } from '../../lib/graphql/types/v2/schema';
import { formatManualInstructions } from '../../lib/payment-method-utils';
import { iconForSocialLinkType } from '../../lib/social-links';
import { getStripe } from '../../lib/stripe';
import {
  blueSkyShareURL,
  followOrderRedirectUrl,
  getCollectivePageRoute,
  linkedInShareURL,
  mastodonShareURL,
  threadsShareURL,
  tweetURL,
} from '../../lib/url-helpers';
import { getWebsiteUrl } from '../../lib/utils';

import Container from '../../components/Container';
import { Box, Flex } from '../../components/Grid';
import I18nFormatters, { getI18nLink, I18nBold } from '../../components/I18nFormatters';
import Image from '../../components/Image';
import Loading from '../../components/Loading';
import MessageBox from '../../components/MessageBox';
import StyledLink from '../../components/StyledLink';
import { withUser } from '../../components/UserProvider';

import { isValidExternalRedirect } from '../../pages/external-redirect';
import { formatAccountDetails } from '../edit-collective/utils';
import Link from '../Link';
import { Survey, SURVEY_KEY } from '../Survey';
import { H3, P } from '../Text';
import { toast } from '../ui/useToast';

import { orderSuccessFragment } from './graphql/fragments';
import PublicMessageForm from './ContributionFlowPublicMessage';
import ContributorCardWithTier from './ContributorCardWithTier';
import SuccessCTA, { SUCCESS_CTA_TYPE } from './SuccessCTA';

// Styled components
const ContainerWithImage = styled(Container)`
  @media screen and (max-width: 64em) {
    background: url('/static/images/new-contribution-flow/NewContributionFlowSuccessPageBackgroundMobile.png');
    background-position: top;
    background-repeat: no-repeat;
    background-size: 100% auto;
  }

  @media screen and (min-width: 64em) {
    background: url('/static/images/new-contribution-flow/NewContributionFlowSuccessPageBackgroundDesktop.png');
    background-position: left;
    background-repeat: no-repeat;
    background-size: auto 100%;
    background-size: cover;
  }
`;

const ShareLink = styled(StyledLink).attrs({
  buttonStyle: 'standard',
  buttonSize: 'small',
  minWidth: 130,
  mx: 2,
  mb: 2,
  target: '_blank',
})`
  display: flex;
  justify-content: center;
  align-items: center;
  svg {
    margin-right: 8px;
  }
`;

const BankTransferInfoContainer = styled(Container)`
  border: 1px solid ${themeGet('colors.black.400')};
  border-radius: 12px;
  background-color: white;
`;

const SuccessIllustration = styled(Container)`
  max-width: 100%;
  margin: 0 auto;
  margin-bottom: 16px;
`;

const successMsgs = defineMessages({
  default: {
    id: 'order.created.tweet',
    defaultMessage: "I've just contributed to {collective}. Consider supporting them too — every little helps!",
  },
  event: {
    id: 'order.created.tweet.event',
    defaultMessage: "I'm attending {event}. Join me!",
  },
});

const isAccountFediverse = account => {
  return (
    account &&
    (account.tags?.includes('mastodon') ||
      account.tags?.includes('fediverse') ||
      (account.socialLinks || []).map(el => el.type).includes('MASTODON'))
  );
};

/**
 * @returns {object}
 *  - url: A URL to share in the tweet
 *  - Icon: A React component to display the icon
 */
const getShareProperties = (service, url, text) => {
  switch (service) {
    case SocialLinkType.TWITTER:
      return {
        name: 'X',
        Icon: iconForSocialLinkType(SocialLinkType.TWITTER),
        url: tweetURL({ url, text }),
      };
    // Skeeping it as you now need an App id to use sharing: https://developers.facebook.com/docs/sharing/reference/feed-dialog
    // case SocialLinkType.FACEBOOK:
    //   return {
    //     name: 'Facebook',
    //     Icon: iconForSocialLinkType(SocialLinkType.FACEBOOK),
    //     url: facebookShareURL({ u: url, text }),
    //   };
    case SocialLinkType.MASTODON:
      return {
        name: 'Mastodon',
        Icon: iconForSocialLinkType(SocialLinkType.MASTODON),
        url: mastodonShareURL({ text: `${text} ${url}` }),
      };
    case SocialLinkType.BLUESKY:
      return {
        name: 'Bluesky',
        Icon: iconForSocialLinkType(SocialLinkType.BLUESKY),
        url: blueSkyShareURL({ text: `${text} ${url}` }),
      };
    case SocialLinkType.LINKEDIN:
      return {
        name: 'Linkedin',
        Icon: iconForSocialLinkType(SocialLinkType.LINKEDIN),
        url: linkedInShareURL({ text: `${text} ${url}` }),
      };
    case SocialLinkType.THREADS:
      return {
        name: 'Threads',
        Icon: iconForSocialLinkType(SocialLinkType.THREADS),
        url: threadsShareURL({ text: `${text} ${url}` }),
      };
    default:
      return null;
  }
};

const getSocialLinksForAccount = (account, shareURL, shareSuccessMessage) => {
  const allSocialLinks = [...(account?.socialLinks || []), ...(account?.parent?.socialLinks || [])];
  if (isAccountFediverse(account) || isAccountFediverse(account?.parent)) {
    allSocialLinks.push({ type: SocialLinkType.MASTODON });
  }

  const uniqueSocialLinks = uniqBy(allSocialLinks, 'type');
  return uniqueSocialLinks
    .map(socialLink => getShareProperties(socialLink.type, shareURL, shareSuccessMessage))
    .filter(Boolean);
};

const getMainTag = collective => {
  if (collective.host?.slug === 'opensource' || collective.tags?.includes('open source')) {
    return 'open source';
  } else if (collective.tags?.includes('covid-19')) {
    return 'covid-19';
  }
};

class ContributionFlowSuccess extends React.Component {
  static propTypes = {
    collective: PropTypes.object,
    LoggedInUser: PropTypes.object,
    intl: PropTypes.object,
    router: PropTypes.object,
    isEmbed: PropTypes.bool,
    data: PropTypes.object,
  };

  async componentDidMount() {
    track(AnalyticsEvent.CONTRIBUTION_SUCCESS);
    if (this.props.LoggedInUser) {
      toast({
        message: <Survey surveyKey={SURVEY_KEY.CONTRIBUTION_COMPLETED} />,
        duration: 20000,
      });
    }

    const isStripeRedirect = this.props.router.query.payment_intent_client_secret;

    if (isStripeRedirect) {
      const stripe = await getStripe(null, this.props.router.query.stripeAccount);
      const paymentIntentResult = await stripe.retrievePaymentIntent(
        this.props.router.query.payment_intent_client_secret,
      );
      this.setState({
        paymentIntentResult,
      });
    }

    this.setState({
      loaded: true,
    });
  }

  componentDidUpdate() {
    const {
      router: { query: queryParams },
      data: { order },
      intl,
    } = this.props;

    const paymentIntentResult = this.state?.paymentIntentResult;
    if (order && paymentIntentResult) {
      const stripeErrorMessage = paymentIntentResult.error
        ? paymentIntentResult.error.message
        : !['succeeded', 'processing'].includes(paymentIntentResult.paymentIntent.status)
          ? (paymentIntentResult.paymentIntent.last_payment_error?.message ??
            intl.formatMessage({ defaultMessage: 'An unknown error has ocurred', id: 'TGDa6P' }))
          : null;

      if (stripeErrorMessage) {
        const tierSlug = order.tier?.slug;

        const path = tierSlug
          ? `/${order.toAccount.slug}/contribute/${tierSlug}-${order.tier.legacyId}/checkout/payment`
          : `/${order.toAccount.slug}/donate/payment`;

        const url = new URL(path, window.location.origin);
        url.searchParams.set('error', stripeErrorMessage);
        url.searchParams.set('interval', getIntervalFromGQLV2Frequency(order.frequency));
        url.searchParams.set('amount', order.amount.value);
        url.searchParams.set('contributeAs', order.fromAccount.slug);

        if (queryParams.redirect) {
          url.searchParams.set('redirect', queryParams.redirect);
          url.searchParams.set('shouldRedirectParent', queryParams.shouldRedirectParent);
        }

        this.props.router.push(url.toString());
        return;
      }
    }

    if (order && queryParams.redirect) {
      if (isValidExternalRedirect(queryParams.redirect)) {
        followOrderRedirectUrl(this.props.router, this.props.collective, order, queryParams.redirect, {
          shouldRedirectParent: queryParams.shouldRedirectParent,
        });
      }
    }
  }

  renderCallsToAction = () => {
    const { LoggedInUser, data, isEmbed, router } = this.props;
    const callsToAction = [];
    const isGuest = get(data, 'order.fromAccount.isGuest');
    const email = get(router, 'query.email') ? decodeURIComponent(router.query.email) : null;

    if (!isEmbed) {
      if (!LoggedInUser) {
        if (isGuest) {
          callsToAction.unshift(SUCCESS_CTA_TYPE.JOIN, SUCCESS_CTA_TYPE.GO_TO_PROFILE, SUCCESS_CTA_TYPE.NEWSLETTER);
        } else {
          callsToAction.unshift(SUCCESS_CTA_TYPE.SIGN_IN, SUCCESS_CTA_TYPE.GO_TO_PROFILE, SUCCESS_CTA_TYPE.NEWSLETTER);
        }
      } else {
        // all other logged in recurring/one time contributions
        callsToAction.unshift(SUCCESS_CTA_TYPE.GO_TO_PROFILE, SUCCESS_CTA_TYPE.BLOG, SUCCESS_CTA_TYPE.NEWSLETTER);
      }
    }

    return (
      <Flex flexDirection="column" justifyContent="center" p={2}>
        {callsToAction.length >= 2 && (
          <SuccessIllustration>
            <Image alt="" width={216} height={152} src="/static/images/success-illustration.jpg" />
          </SuccessIllustration>
        )}
        {callsToAction.map((type, idx) => (
          <SuccessCTA
            key={type}
            type={type}
            orderId={get(data, 'order.id')}
            email={email}
            account={get(data, 'order.toAccount')}
            isPrimary={idx === 0}
          />
        ))}
      </Flex>
    );
  };

  renderBankTransferInformation = () => {
    const instructions = get(this.props.data, 'order.toAccount.host.settings.paymentMethods.manual.instructions', null);
    const bankAccount = get(this.props.data, 'order.toAccount.host.bankAccount.data', null);

    const amount = get(this.props.data, 'order.amount.valueInCents', 0);
    const platformTipAmount = get(this.props.data, 'order.platformTipAmount.valueInCents', 0);
    const totalAmount = amount + platformTipAmount;
    const currency = get(this.props.data, 'order.amount.currency');
    const formattedAmount = formatCurrency(totalAmount, currency, {
      locale: this.props.intl.locale,
      currencyDisplay: 'code',
    });

    const formattedValues = {
      account: bankAccount ? formatAccountDetails(bankAccount) : '',
      reference: get(this.props.data, 'order.legacyId', null),
      amount: formattedAmount,
      collective: get(this.props.data, 'order.toAccount.name', null),
      // Deprecated but still needed for compatibility
      OrderId: get(this.props.data, 'order.legacyId', null),
    };

    return (
      <Flex flexDirection="column" justifyContent="center" width={[1, 3 / 4]} px={[4, 0]} py={[2, 0]}>
        <MessageBox type="warning" fontSize="12px" mb={2}>
          <FormattedMessage
            id="collective.user.orderProcessing.manual"
            defaultMessage="<strong>Your contribution is pending.</strong> Please follow the payment instructions in the confirmation email to complete your transaction."
            values={I18nFormatters}
          />
        </MessageBox>
        {instructions && (
          <BankTransferInfoContainer my={3} p={4}>
            <H3>
              <FormattedMessage id="NewContributionFlow.PaymentInstructions" defaultMessage="Payment instructions" />
            </H3>
            <Flex mt={2}>
              <Flex style={{ whiteSpace: 'pre-wrap' }}>{formatManualInstructions(instructions, formattedValues)}</Flex>
            </Flex>
          </BankTransferInfoContainer>
        )}
        <Flex px={3} mt={2}>
          <P fontSize="16px" color="black.700">
            <FormattedMessage
              id="NewContributionFlow.InTheMeantime"
              defaultMessage="In the meantime, you can see what {collective} is up to <CollectiveLink>on their Collective page</CollectiveLink>."
              values={{
                collective: this.props.data.order.toAccount.name,
                CollectiveLink: getI18nLink({
                  as: Link,
                  href: `/${this.props.data.order.toAccount.slug}`,
                }),
              }}
            />
          </P>
        </Flex>
      </Flex>
    );
  };

  renderInfoByPaymentMethod() {
    const { data } = this.props;
    const { order } = data;
    const isPendingBankTransfer = order?.status === ORDER_STATUS.PENDING && !order.paymentMethod;
    if (isPendingBankTransfer) {
      return this.renderBankTransferInformation();
    } else {
      return this.renderCallsToAction();
    }
  }

  getShareSuccessMessage = () => {
    const toAccount = this.props.data?.order?.toAccount;
    if (!toAccount) {
      return null;
    }
    return this.props.intl.formatMessage(toAccount.type === 'EVENT' ? successMsgs.event : successMsgs.default, {
      collective: toAccount.name,
      event: toAccount.name,
    });
  };

  render() {
    const { LoggedInUser, collective, data, isEmbed } = this.props;
    const { order } = data;
    const shareURL = `${getWebsiteUrl()}/${collective.slug}`;
    const isProcessing = order?.status === ORDER_STATUS.PROCESSING;

    const loading = data.loading || !this.state?.loaded;

    if (!data.loading && !order) {
      return (
        <Flex justifyContent="center" py={[5, 6]}>
          <MessageBox type="warning" withIcon>
            <FormattedMessage id="Order.NotFound" defaultMessage="This contribution doesn't exist" />
          </MessageBox>
        </Flex>
      );
    }

    return (
      <React.Fragment>
        {!isEmbed && isProcessing && (
          <Flex
            height="120px"
            justifyContent="center"
            alignItems="center"
            backgroundColor="#FFFFC2"
            color="#0C2D66"
            flexDirection="column"
          >
            <P fontWeight="700" fontSize="14px" lineHeight="20px">
              <FormattedMessage defaultMessage="Your Contribution is processing!" id="RTyy4V" />
            </P>
            <Box mt={1} maxWidth="672px">
              <P fontWeight="400" fontSize="14px" lineHeight="20px" textAlign="center">
                <FormattedMessage
                  defaultMessage="Your contribution will remain in processing state until it is completed from the payment processor's end. You will receive an email when it goes through successfully. No further action is required from your end."
                  id="R1RQBD"
                />
              </P>
            </Box>
            <StyledLink
              href={`${getCollectivePageRoute(order.fromAccount)}/transactions`}
              fontWeight="700"
              fontSize="14px"
              lineHeight="20px"
              textDecoration="underline"
              color="#0C2D66"
              mt={1}
            >
              <FormattedMessage defaultMessage="View Contribution!" id="zG2d9i" />
            </StyledLink>
          </Flex>
        )}
        <Flex
          width={1}
          minHeight="calc(100vh - 69px)"
          flexDirection={['column', null, null, 'row']}
          justifyContent={[null, null, 'center']}
          css={{ height: '100%' }}
          data-cy="order-success"
        >
          {loading ? (
            <Container display="flex" alignItems="center" justifyContent="center">
              <Loading />
            </Container>
          ) : (
            <Fragment>
              <ContainerWithImage
                display="flex"
                alignItems="center"
                justifyContent="center"
                width={['100%', null, null, '50%']}
                mb={[4, null, null, 0]}
                flexShrink={0}
                data-cy={`contribution-id-${order.legacyId}`}
              >
                <Flex flexDirection="column" alignItems="center" justifyContent="center" my={4} width={1}>
                  <h3 className="mb-4 text-3xl font-bold">
                    <FormattedMessage id="NewContributionFlow.Success.Header" defaultMessage="Thank you! 🎉" />
                  </h3>
                  <Box mb={3}>
                    <P fontSize="20px" color="black.700" fontWeight={500} textAlign="center">
                      <FormattedMessage
                        id="NewContributionFlow.Success.NowSupporting"
                        defaultMessage="You are now supporting <link>{collective}</link>."
                        values={{
                          collective: order.toAccount.name,
                          link: isEmbed
                            ? I18nBold
                            : getI18nLink({ href: getCollectivePageRoute(order.toAccount), as: Link }),
                        }}
                      />
                    </P>
                  </Box>
                  {isEmbed ? (
                    <ContributorCardWithTier width={250} height={380} contribution={order} my={2} useLink={false} />
                  ) : (
                    <StyledLink as={Link} color="black.800" href={getCollectivePageRoute(order.toAccount)}>
                      <ContributorCardWithTier width={250} height={380} contribution={order} my={2} useLink={false} />
                    </StyledLink>
                  )}
                  {!isEmbed && (
                    <Box my={4}>
                      <Link href={{ pathname: '/search', query: { show: getMainTag(order.toAccount) } }}>
                        <P color="black.800" fontWeight={500} textAlign="center">
                          <FormattedMessage
                            id="NewContributionFlow.Success.DiscoverMore"
                            defaultMessage="Discover more Collectives like {collective}"
                            values={{ collective: order.toAccount.name }}
                          />
                          &nbsp;&rarr;
                        </P>
                      </Link>
                    </Box>
                  )}
                  <Flex justifyContent="center" my={3} maxWidth="500px" flexWrap="wrap">
                    {getSocialLinksForAccount(order.toAccount, shareURL, this.getShareSuccessMessage()).map(
                      shareLink => (
                        <ShareLink key={shareLink.url} href={shareLink.url}>
                          <shareLink.Icon size="1em" />
                          <FormattedMessage
                            defaultMessage="Share on {serviceName}"
                            id="45jyHl"
                            values={{ serviceName: shareLink.name }}
                          />
                        </ShareLink>
                      ),
                    )}
                  </Flex>
                  {LoggedInUser && (
                    <Box px={1}>
                      <PublicMessageForm order={order} publicMessage={get(order, 'membership.publicMessage')} />
                    </Box>
                  )}
                </Flex>
              </ContainerWithImage>
              <Container
                display="flex"
                flexDirection="column"
                alignItems="center"
                justifyContent="center"
                width={1}
                px={3}
                boxShadow={['0 -35px 5px 0px #fff', '-15px 0 15px -15px #fff']}
              >
                {this.renderInfoByPaymentMethod()}
              </Container>
            </Fragment>
          )}
        </Flex>
      </React.Fragment>
    );
  }
}

// GraphQL
const orderSuccessQuery = gql`
  query NewContributionFlowOrderSuccess($order: OrderReferenceInput!) {
    order(order: $order) {
      id
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

export default injectIntl(withUser(withRouter(addOrderSuccessQuery(ContributionFlowSuccess))));
