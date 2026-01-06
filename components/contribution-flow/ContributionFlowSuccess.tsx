import React, { Fragment } from 'react';
import type { QueryResult } from '@apollo/client';
import { graphql } from '@apollo/client/react/hoc';
import type { PaymentIntentResult } from '@stripe/stripe-js';
import { get, uniqBy } from 'lodash';
import { Clock } from 'lucide-react';
import type { NextRouter } from 'next/router';
import { withRouter } from 'next/router';
import type { IntlShape } from 'react-intl';
import { defineMessages, FormattedMessage, injectIntl } from 'react-intl';
import { styled } from 'styled-components';

import { AnalyticsEvent } from '../../lib/analytics/events';
import { track } from '../../lib/analytics/plausible';
import { getIntervalFromGQLV2Frequency } from '../../lib/constants/intervals';
import { ORDER_STATUS } from '../../lib/constants/order-status';
import { gql } from '../../lib/graphql/helpers';
import { SocialLinkType } from '../../lib/graphql/types/v2/schema';
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
import { getWebsiteUrl, parseToBoolean } from '../../lib/utils';
import type { NewContributionFlowOrderSuccessQuery } from '@/lib/graphql/types/v2/graphql';
import type LoggedInUser from '@/lib/LoggedInUser';

import { getI18nLink, I18nBold } from '../../components/I18nFormatters';
import Image from '../../components/Image';
import Loading from '../../components/Loading';
import MessageBox from '../../components/MessageBox';
import StyledLink from '../../components/StyledLink';
import { withUser } from '../../components/UserProvider';

import { isValidExternalRedirect } from '../../pages/external-redirect';
import { getCustomPaymentProviderIconComponent } from '../custom-payment-provider/CustomPaymentProviderIcon';
import { CustomPaymentMethodInstructions } from '../custom-payment-provider/CustomPaymentMethodInstructions';
import Link from '../Link';
import { Survey, SURVEY_KEY } from '../Survey';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import { toast } from '../ui/useToast';

import { orderSuccessFragment } from './graphql/fragments';
import PublicMessageForm from './ContributionFlowPublicMessage';
import ContributorCardWithTier from './ContributorCardWithTier';
import SuccessCTA, { SUCCESS_CTA_TYPE } from './SuccessCTA';

// Styled components
const ShareLink = styled(StyledLink).attrs({
  buttonStyle: 'standard',
  buttonSize: 'small',
  minWidth: 130,
  target: '_blank',
})`
  display: flex;
  justify-content: center;
  align-items: center;
  svg {
    margin-right: 8px;
  }
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

class ContributionFlowSuccess extends React.Component<
  {
    data: QueryResult<NewContributionFlowOrderSuccessQuery>['data'] & { loading: boolean };
    collective: { slug: string };
    router: NextRouter;
    LoggedInUser: LoggedInUser;
    intl: IntlShape;
    isEmbed: boolean;
  },
  {
    paymentIntentResult: PaymentIntentResult;
    loaded: boolean;
  }
> {
  async componentDidMount() {
    track(AnalyticsEvent.CONTRIBUTION_SUCCESS);

    // TODO order may not be loaded yet, move this to componentDidUpdate
    if (this.props.LoggedInUser && this.props.data?.order?.status !== ORDER_STATUS.PENDING) {
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
            intl.formatMessage({ defaultMessage: 'An unknown error has occurred', id: 'UZEPLR' }))
          : null;

      if (stripeErrorMessage) {
        const tierSlug = order.tier?.slug;

        const path = tierSlug
          ? `/${order.toAccount.slug}/contribute/${tierSlug}-${order.tier.legacyId}/checkout/payment`
          : `/${order.toAccount.slug}/donate/payment`;

        const url = new URL(path, window.location.origin);
        url.searchParams.set('error', stripeErrorMessage);
        url.searchParams.set('interval', getIntervalFromGQLV2Frequency(order.frequency));
        url.searchParams.set('amount', order.amount.value.toString());
        url.searchParams.set('contributeAs', order.fromAccount.slug);

        if (queryParams.redirect && !Array.isArray(queryParams.redirect)) {
          url.searchParams.set('redirect', queryParams.redirect);
          url.searchParams.set(
            'shouldRedirectParent',
            parseToBoolean(queryParams.shouldRedirectParent) ? 'true' : 'false',
          );
        }

        this.props.router.push(url.toString());
        return;
      }
    }

    if (order && queryParams.redirect) {
      if (isValidExternalRedirect(queryParams.redirect)) {
        followOrderRedirectUrl(this.props.router, this.props.collective, order, queryParams.redirect, {
          shouldRedirectParent: parseToBoolean(queryParams.shouldRedirectParent),
        });
      }
    }
  }

  getEmailFromQueryParams = () => {
    const { router } = this.props;
    const emailInput = router.query.email;
    return (Array.isArray(emailInput) ? emailInput[0] : emailInput) ?? null;
  };

  renderCallsToAction = () => {
    const { LoggedInUser, data, isEmbed } = this.props;
    const callsToAction = [];
    const isGuest = get(data, 'order.fromAccount.isGuest');
    const email = this.getEmailFromQueryParams();

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
      <div className="flex flex-col justify-center p-2">
        {callsToAction.length >= 2 && (
          <div className="mx-auto mb-4 max-w-full">
            <Image alt="" width={216} height={152} src="/static/images/success-illustration.jpg" />
          </div>
        )}
        {callsToAction.map((type, idx) => (
          <SuccessCTA
            key={type}
            type={type}
            email={email}
            account={get(data, 'order.toAccount')}
            isPrimary={idx === 0}
          />
        ))}
      </div>
    );
  };

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

  renderPendingView() {
    const { data } = this.props;
    const { order } = data;
    const customPaymentProvider = order.customPaymentProvider;
    const amount = order.amount.valueInCents;
    const platformTipAmount = order.platformTipAmount.valueInCents;
    const totalAmount = amount + platformTipAmount;
    const currency = order.amount.currency;
    const IconComponent = customPaymentProvider && getCustomPaymentProviderIconComponent(customPaymentProvider);

    return (
      <div
        className="relative isolate flex min-h-[calc(100vh-69px)] w-full flex-col items-center justify-center"
        data-cy="order-success"
      >
        <div className="absolute inset-0 -z-10 bg-[url('/static/images/new-contribution-flow/NewContributionFlowSuccessPageBackgroundMobile.png')] bg-cover bg-no-repeat lg:bg-[url('/static/images/new-contribution-flow/NewContributionFlowSuccessPageBackgroundDesktop.png')] lg:bg-cover lg:bg-[position:0%_0%] xl:bg-[position:0%_-60vw] xl:bg-repeat" />
        <div className="flex w-full max-w-xl flex-col items-center px-4 py-6 lg:py-12">
          <div className="mb-5 w-full overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-lg">
            <div className="flex flex-col items-center border-b border-gray-100 bg-gray-50 px-6 py-6">
              <div className="flex h-14 w-14 items-center justify-center rounded-full">
                <Clock className="h-7 w-7 text-gray-400" />
              </div>
              <h1 className="mb-1 text-center text-xl font-bold text-gray-900 sm:text-2xl">
                <FormattedMessage
                  id="NewContributionFlow.Pending.Header"
                  defaultMessage="Your contribution is pending"
                />
              </h1>
              <p className="mb-4 text-center text-sm text-gray-600">
                <FormattedMessage
                  defaultMessage="You need to complete the payment to finalize it."
                  id="contribution.finalize"
                />{' '}
                <FormattedMessage
                  id="NewContributionFlow.Pending.EmailNotice"
                  defaultMessage="You will also receive these instructions by email. Once your payment is received, your contribution will be confirmed."
                />
              </p>
            </div>

            {/* Payment instructions */}
            {customPaymentProvider && (
              <div className="px-2 py-8 sm:px-4 lg:px-6">
                <div className="mb-5 flex w-full flex-col items-center gap-1 px-1 lg:flex-row lg:justify-between">
                  <h2 className="flex items-center text-lg font-semibold text-gray-900">
                    <FormattedMessage
                      id="NewContributionFlow.PaymentInstructions"
                      defaultMessage="Payment instructions"
                    />
                  </h2>
                  <Badge>
                    <IconComponent className="mr-1 h-4 w-4" /> <span>{customPaymentProvider.name}</span>
                  </Badge>
                </div>
                <div className="rounded border-l-4 border-blue-400 bg-gray-50 px-5 py-5 text-sm shadow lg:text-base">
                  <CustomPaymentMethodInstructions
                    instructions={customPaymentProvider.instructions}
                    values={{
                      amount: { valueInCents: totalAmount, currency },
                      collectiveSlug: get(data, 'order.toAccount.name', ''),
                      OrderId: get(data, 'order.legacyId', 0),
                    }}
                  />
                </div>
              </div>
            )}
          </div>

          <div className="mt-6 flex justify-center">
            <Link href={getCollectivePageRoute(order.toAccount)}>
              <Button variant="secondary">
                <FormattedMessage
                  id="NewContributionFlow.Pending.VisitCollective"
                  defaultMessage="Visit {collective}'s page"
                  values={{ collective: order.toAccount.name }}
                />
                <span>&rarr;</span>
              </Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  render() {
    const { LoggedInUser, collective, data, isEmbed } = this.props;
    const { order } = data;
    const shareURL = `${getWebsiteUrl()}/${collective.slug}`;
    const isProcessing = order?.status === ORDER_STATUS.PROCESSING;
    const isPendingBankTransfer = order?.status === ORDER_STATUS.PENDING && !order.paymentMethod;

    const loading = data.loading || !this.state?.loaded;

    if (!data.loading && !order) {
      return (
        <div className="flex justify-center py-5 sm:py-6">
          <MessageBox type="warning" withIcon>
            <FormattedMessage id="Order.NotFound" defaultMessage="This contribution doesn't exist" />
          </MessageBox>
        </div>
      );
    }

    // Show dedicated pending layout for bank transfer contributions
    if (!loading && isPendingBankTransfer) {
      return this.renderPendingView();
    }

    return (
      <React.Fragment>
        {!isEmbed && isProcessing && (
          <div className="flex h-[120px] flex-col items-center justify-center bg-[#FFFFC2] text-[#0C2D66]">
            <p className="text-sm leading-5 font-bold">
              <FormattedMessage defaultMessage="Your Contribution is processing!" id="RTyy4V" />
            </p>
            <div className="mt-1 max-w-[672px]">
              <p className="text-center text-sm leading-5 font-normal">
                <FormattedMessage
                  defaultMessage="Your contribution will remain in processing state until it is completed from the payment processor's end. You will receive an email when it goes through successfully. No further action is required from your end."
                  id="R1RQBD"
                />
              </p>
            </div>
            <StyledLink
              href={`${getCollectivePageRoute(order.fromAccount)}/transactions`}
              className="mt-1 text-sm leading-5 font-bold text-[#0C2D66] underline"
            >
              <FormattedMessage defaultMessage="View Contribution!" id="zG2d9i" />
            </StyledLink>
          </div>
        )}
        <div
          className="flex h-full min-h-[calc(100vh-69px)] w-full flex-col md:justify-center lg:flex-row"
          data-cy="order-success"
        >
          {loading ? (
            <div className="flex items-center justify-center">
              <Loading />
            </div>
          ) : (
            <Fragment>
              <div
                className="relative flex w-full shrink-0 items-center justify-center max-lg:mb-4 lg:w-1/2"
                data-cy={`contribution-id-${order.legacyId}`}
              >
                <div
                  className="absolute inset-0 bg-[url('/static/images/new-contribution-flow/NewContributionFlowSuccessPageBackgroundMobile.png')] bg-[length:100%_auto] bg-top bg-no-repeat lg:bg-[url('/static/images/new-contribution-flow/NewContributionFlowSuccessPageBackgroundDesktop.png')] lg:bg-[length:100%_auto] lg:bg-[position:0%_0%] lg:bg-no-repeat"
                  style={{
                    transform: 'rotate(90deg) translateY(-100%)',
                    transformOrigin: 'top left',
                  }}
                />
                <div className="relative z-10 my-4 flex w-full flex-col items-center justify-center">
                  <h3 className="mb-4 text-3xl font-bold">
                    <FormattedMessage id="NewContributionFlow.Success.Header" defaultMessage="Thank you! 🎉" />
                  </h3>
                  <div className="mb-3">
                    <p className="text-center text-xl font-medium text-gray-700">
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
                    </p>
                  </div>
                  {isEmbed ? (
                    <ContributorCardWithTier width={250} height={380} contribution={order} my={2} useLink={false} />
                  ) : (
                    <StyledLink as={Link} color="black.800" href={getCollectivePageRoute(order.toAccount)}>
                      <ContributorCardWithTier width={250} height={380} contribution={order} my={2} useLink={false} />
                    </StyledLink>
                  )}
                  {!isEmbed && (
                    <div className="my-4">
                      <Link href={{ pathname: '/search', query: { show: getMainTag(order.toAccount) } }}>
                        <p className="text-center font-medium text-gray-800">
                          <FormattedMessage
                            id="NewContributionFlow.Success.DiscoverMore"
                            defaultMessage="Discover more Collectives like {collective}"
                            values={{ collective: order.toAccount.name }}
                          />
                          &nbsp;&rarr;
                        </p>
                      </Link>
                    </div>
                  )}
                  <div className="my-3 flex max-w-[500px] flex-wrap justify-center">
                    {getSocialLinksForAccount(order.toAccount, shareURL, this.getShareSuccessMessage()).map(
                      shareLink => (
                        <ShareLink key={shareLink.url} href={shareLink.url} className="mx-2 mb-2">
                          <shareLink.Icon size={16} />
                          <FormattedMessage
                            defaultMessage="Share on {serviceName}"
                            id="45jyHl"
                            values={{ serviceName: shareLink.name }}
                          />
                        </ShareLink>
                      ),
                    )}
                  </div>
                  {LoggedInUser && (
                    <div className="px-1">
                      <PublicMessageForm order={order} publicMessage={get(order, 'membership.publicMessage')} />
                    </div>
                  )}
                </div>
              </div>
              <div className="flex w-full flex-col items-center justify-center px-3 shadow-[0_-35px_5px_0px_#fff] sm:shadow-[-15px_0_15px_-15px_#fff]">
                {this.renderCallsToAction()}
              </div>
            </Fragment>
          )}
        </div>
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

const addOrderSuccessQuery = graphql<{
  router: NextRouter;
}>(orderSuccessQuery, {
  options: props => ({
    variables: { order: { id: props.router.query.OrderId } },
  }),
});

export default withRouter(addOrderSuccessQuery(injectIntl(withUser(ContributionFlowSuccess))));
