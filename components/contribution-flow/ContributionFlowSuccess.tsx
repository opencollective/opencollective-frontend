import React, { Fragment, useCallback, useEffect, useRef, useState } from 'react';
import { useQuery } from '@apollo/client';
import { get, uniqBy } from 'lodash-es';
import { useRouter } from 'next/router';
import { defineMessages, FormattedMessage, useIntl } from 'react-intl';
import { styled } from 'styled-components';

import { AnalyticsEvent } from '../../lib/analytics/events';
import { track } from '../../lib/analytics/plausible';
import { AnalyticsProperty } from '../../lib/analytics/properties';
import { getIntervalFromGQLV2Frequency } from '../../lib/constants/intervals';
import { ORDER_STATUS } from '../../lib/constants/order-status';
import { isOscTipExperiment } from '../../lib/experiments/experiments';
import { gql } from '../../lib/graphql/helpers';
import { SocialLinkType } from '../../lib/graphql/types/v2/graphql';
import useLoggedInUser from '../../lib/hooks/useLoggedInUser';
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

import { getI18nLink, I18nBold } from '../../components/I18nFormatters';
import Image from '../../components/Image';
import Loading from '../../components/Loading';
import MessageBox from '../../components/MessageBox';
import StyledLink from '../../components/StyledLink';

import { isValidExternalRedirect } from '../../pages/external-redirect';
import Avatar from '../Avatar';
import Link from '../Link';
import { CustomPaymentMethodInstructions } from '../manual-payment-provider/CustomPaymentMethodInstructions';
import { getManualPaymentProviderIconComponent } from '../manual-payment-provider/ManualPaymentProviderIcon';
import { Survey, SURVEY_KEY } from '../Survey';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import { toast } from '../ui/useToast';

import { orderSuccessFragment } from './graphql/fragments';
import PublicMessageForm from './ContributionFlowPublicMessage';
import ContributorCardWithTier from './ContributorCardWithTier';
import SuccessCTA, { SUCCESS_CTA_TYPE } from './SuccessCTA';

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

const orderSuccessQuery = gql`
  query NewContributionFlowOrderSuccess($order: OrderReferenceInput!) {
    order(order: $order) {
      id
      ...OrderSuccessFragment
    }
  }
  ${orderSuccessFragment}
`;

const getQueryStringParam = (param: string | string[] | undefined): string | undefined =>
  Array.isArray(param) ? param[0] : param;

const isAccountFediverse = account => {
  return (
    account &&
    (account.tags?.includes('mastodon') ||
      account.tags?.includes('fediverse') ||
      (account.socialLinks || []).map(el => el.type).includes('MASTODON'))
  );
};

const getShareProperties = (service, url, text) => {
  switch (service) {
    case SocialLinkType.TWITTER:
      return {
        name: 'X',
        Icon: iconForSocialLinkType(SocialLinkType.TWITTER),
        url: tweetURL({ url, text }),
      };
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

const ContributionFlowSuccess = ({ collective, isEmbed }) => {
  const router = useRouter();
  const intl = useIntl();
  const { LoggedInUser } = useLoggedInUser();
  const orderId = getQueryStringParam(router.query.OrderId);

  const { data, loading } = useQuery(orderSuccessQuery, {
    variables: { order: { id: orderId } },
    skip: !orderId,
  });

  const order = data?.order;
  const [paymentIntentResult, setPaymentIntentResult] = useState(null);
  const [loaded, setLoaded] = useState(false);
  const [surveyShown, setSurveyShown] = useState(false);
  const successTrackedRef = useRef(false);

  const trackSuccess = useCallback(() => {
    if (successTrackedRef.current || !order) {
      return;
    }

    track(AnalyticsEvent.CONTRIBUTION_SUCCESS, {
      props: {
        [AnalyticsProperty.CONTRIBUTION_PLATFORM_TIP_VARIANT]: order.data?.isNewPlatformTipFlow ? 'new' : 'old',
        [AnalyticsProperty.CONTRIBUTION_PLATFORM_TIP_ENABLED]: Boolean(order.platformTipEligible),
        [AnalyticsProperty.CONTRIBUTION_IS_OSC_TIP_EXPERIMENT]: isOscTipExperiment(order.toAccount, order.tier),
        [AnalyticsProperty.CONTRIBUTION_HOST_SLUG]: get(order, 'toAccount.host.slug'),
      },
    });
    successTrackedRef.current = true;
  }, [order]);

  useEffect(() => {
    trackSuccess();
  }, [trackSuccess]);

  useEffect(() => {
    let cancelled = false;

    const loadPaymentIntent = async () => {
      const clientSecret = getQueryStringParam(router.query.payment_intent_client_secret);
      if (clientSecret) {
        const stripeAccount = getQueryStringParam(router.query.stripeAccount);
        const stripe = await getStripe(null, stripeAccount);
        const result = await stripe.retrievePaymentIntent(clientSecret);
        if (!cancelled) {
          setPaymentIntentResult(result);
        }
      }

      if (!cancelled) {
        setLoaded(true);
      }
    };

    loadPaymentIntent();

    return () => {
      cancelled = true;
    };
  }, [router.query.payment_intent_client_secret, router.query.stripeAccount]);

  useEffect(() => {
    if (LoggedInUser && order && order.status !== ORDER_STATUS.PENDING && !surveyShown) {
      setSurveyShown(true);
      toast({
        message: <Survey surveyKey={SURVEY_KEY.CONTRIBUTION_COMPLETED} />,
        duration: 20000,
      });
    }
  }, [LoggedInUser, order, surveyShown]);

  useEffect(() => {
    if (!order || !paymentIntentResult) {
      return;
    }

    const stripeErrorMessage = paymentIntentResult.error
      ? paymentIntentResult.error.message
      : !['succeeded', 'processing'].includes(paymentIntentResult.paymentIntent.status)
        ? (paymentIntentResult.paymentIntent.last_payment_error?.message ??
          intl.formatMessage({ defaultMessage: 'An unknown error has occurred', id: 'UZEPLR' }))
        : null;

    if (!stripeErrorMessage) {
      return;
    }

    const tierSlug = order.tier?.slug;
    const path = tierSlug
      ? `/${order.toAccount.slug}/contribute/${tierSlug}-${order.tier.legacyId}/checkout/payment`
      : `/${order.toAccount.slug}/donate/payment`;

    const url = new URL(path, window.location.origin);
    url.searchParams.set('error', stripeErrorMessage);
    url.searchParams.set('interval', getIntervalFromGQLV2Frequency(order.frequency));
    url.searchParams.set('amount', order.amount.value.toString());
    url.searchParams.set('contributeAs', order.fromAccount.slug);

    const redirect = getQueryStringParam(router.query.redirect);
    if (redirect) {
      url.searchParams.set('redirect', redirect);
      url.searchParams.set(
        'shouldRedirectParent',
        parseToBoolean(getQueryStringParam(router.query.shouldRedirectParent)) ? 'true' : 'false',
      );
    }

    router.push(url.toString());
  }, [order, paymentIntentResult, intl, router]);

  useEffect(() => {
    const redirect = getQueryStringParam(router.query.redirect);
    if (order && redirect && isValidExternalRedirect(redirect)) {
      followOrderRedirectUrl(router, collective, order, redirect, {
        shouldRedirectParent: parseToBoolean(getQueryStringParam(router.query.shouldRedirectParent)),
      });
    }
  }, [order, router, collective]);

  const email = getQueryStringParam(router.query.email) ?? null;

  const getShareSuccessMessage = () => {
    const toAccount = order?.toAccount;
    if (!toAccount) {
      return null;
    }
    return intl.formatMessage(toAccount.type === 'EVENT' ? successMsgs.event : successMsgs.default, {
      collective: toAccount.name,
      event: toAccount.name,
    });
  };

  const renderCallsToAction = () => {
    const callsToAction = [];
    const isGuest = get(order, 'fromAccount.isGuest');

    if (!isEmbed) {
      if (!LoggedInUser) {
        if (isGuest) {
          callsToAction.unshift(SUCCESS_CTA_TYPE.JOIN, SUCCESS_CTA_TYPE.GO_TO_PROFILE, SUCCESS_CTA_TYPE.NEWSLETTER);
        } else {
          callsToAction.unshift(SUCCESS_CTA_TYPE.SIGN_IN, SUCCESS_CTA_TYPE.GO_TO_PROFILE, SUCCESS_CTA_TYPE.NEWSLETTER);
        }
      } else {
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
          <SuccessCTA key={type} type={type} email={email} account={get(order, 'toAccount')} isPrimary={idx === 0} />
        ))}
      </div>
    );
  };

  const renderPendingView = () => {
    const manualPaymentProvider = order.manualPaymentProvider;
    const amount = order.amount.valueInCents;
    const platformTipAmount = order.platformTipAmount.valueInCents;
    const totalAmount = amount + platformTipAmount;
    const currency = order.amount.currency;
    const IconComponent = manualPaymentProvider && getManualPaymentProviderIconComponent(manualPaymentProvider);

    return (
      <div
        className="relative isolate flex min-h-[calc(100vh-64px)] w-full flex-col items-center justify-center"
        data-cy="order-success"
      >
        <div className="absolute inset-0 -z-10 bg-[url('/static/images/new-contribution-flow/NewContributionFlowSuccessPageBackgroundMobile.png')] bg-cover bg-no-repeat lg:bg-[url('/static/images/new-contribution-flow/NewContributionFlowSuccessPageBackgroundDesktop.png')] lg:bg-cover lg:bg-[position:0%_0%] xl:bg-[position:0%_-60vw] xl:bg-repeat" />
        <div className="flex w-full max-w-xl flex-col items-center px-4 py-6 lg:py-12">
          <div className="mb-5 w-full overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-lg">
            <div className="flex flex-col items-center border-b border-gray-100 bg-gray-50 px-6 py-6">
              <Avatar className="mb-3" collective={order.toAccount} radius={64} />
              <h1 className="mb-1 text-center text-xl font-bold text-gray-900 sm:text-2xl">
                <FormattedMessage defaultMessage="Contribution request received" id="pd8V15" />
              </h1>
              <p className="mb-4 text-center text-sm text-gray-600">
                <FormattedMessage
                  defaultMessage="Please follow the instructions below to complete your payment. These instructions have also been sent to your email. We’ll notify you once your contribution has been received, processed, and credited to {collective}."
                  id="n5a/81"
                  values={{ collective: <strong>{order.toAccount.name}</strong> }}
                />
              </p>
            </div>

            {manualPaymentProvider && (
              <div className="px-2 py-8 sm:px-4 lg:px-6">
                <div className="mb-5 flex w-full flex-col items-center gap-1 px-1 lg:flex-row lg:justify-between">
                  <h2 className="flex items-center text-lg font-semibold text-gray-900">
                    <FormattedMessage
                      id="NewContributionFlow.PaymentInstructions"
                      defaultMessage="Payment instructions"
                    />
                  </h2>
                  <Badge>
                    <IconComponent className="mr-1 h-4 w-4" /> <span>{manualPaymentProvider.name}</span>
                  </Badge>
                </div>
                <div>
                  <CustomPaymentMethodInstructions
                    instructions={manualPaymentProvider.instructions}
                    values={{
                      amount: { valueInCents: totalAmount, currency },
                      collectiveSlug: get(order, 'toAccount.slug', ''),
                      OrderId: get(order, 'legacyId', 0),
                      accountDetails: manualPaymentProvider.accountDetails,
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
  };

  const shareURL = `${getWebsiteUrl()}/${collective.slug}`;
  const isProcessing = order?.status === ORDER_STATUS.PROCESSING;
  const isPendingManualContribution = order?.status === ORDER_STATUS.PENDING && !order.paymentMethod;
  const isLoading = loading || !loaded;

  if (!loading && !order) {
    return (
      <div className="flex justify-center py-5 sm:py-6">
        <MessageBox type="warning" withIcon>
          <FormattedMessage id="Order.NotFound" defaultMessage="This contribution doesn't exist" />
        </MessageBox>
      </div>
    );
  }

  if (!isLoading && isPendingManualContribution) {
    return renderPendingView();
  }

  return (
    <Fragment>
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
        className="flex h-full min-h-[calc(100vh-64px)] w-full flex-col md:justify-center lg:flex-row"
        data-cy="order-success"
      >
        {isLoading ? (
          <div className="flex items-center justify-center">
            <Loading />
          </div>
        ) : (
          <Fragment>
            <div
              className="relative flex w-full shrink-0 items-center justify-center max-lg:mb-4 lg:w-1/2"
              data-cy={`contribution-id-${order.legacyId}`}
            >
              <div className="absolute inset-0 bg-[url('/static/images/new-contribution-flow/NewContributionFlowSuccessPageBackgroundMobile.png')] bg-[length:100%_auto] bg-top bg-no-repeat lg:bg-[url('/static/images/new-contribution-flow/NewContributionFlowSuccessPageBackgroundDesktop.png')] lg:bg-cover lg:bg-left lg:bg-no-repeat" />
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
                  {getSocialLinksForAccount(order.toAccount, shareURL, getShareSuccessMessage()).map(shareLink => (
                    <ShareLink key={shareLink.url} href={shareLink.url} className="mx-2 mb-2">
                      <shareLink.Icon size={16} />
                      <FormattedMessage
                        defaultMessage="Share on {serviceName}"
                        id="45jyHl"
                        values={{ serviceName: shareLink.name }}
                      />
                    </ShareLink>
                  ))}
                </div>
                {LoggedInUser && (
                  <div className="px-1">
                    <PublicMessageForm order={order} publicMessage={get(order, 'membership.publicMessage')} />
                  </div>
                )}
              </div>
            </div>
            <div className="z-10 flex w-full flex-col items-center justify-center px-3 shadow-[0_-35px_5px_0px_#fff] sm:shadow-[-15px_0_15px_-15px_#fff]">
              {renderCallsToAction()}
            </div>
          </Fragment>
        )}
      </div>
    </Fragment>
  );
};

export default ContributionFlowSuccess;
