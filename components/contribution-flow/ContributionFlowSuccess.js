import React, { Fragment } from 'react';
import PropTypes from 'prop-types';
import { gql } from '@apollo/client';
import { graphql } from '@apollo/client/react/hoc';
import { Facebook } from '@styled-icons/fa-brands/Facebook';
import { Mastodon } from '@styled-icons/fa-brands/Mastodon';
import { Twitter } from '@styled-icons/fa-brands/Twitter';
import { themeGet } from '@styled-system/theme-get';
import { get } from 'lodash';
import { withRouter } from 'next/router';
import { defineMessages, FormattedMessage, injectIntl } from 'react-intl';
import styled from 'styled-components';

import { ORDER_STATUS } from '../../lib/constants/order-status';
import { formatCurrency } from '../../lib/currency-utils';
import { API_V2_CONTEXT } from '../../lib/graphql/helpers';
import { formatManualInstructions } from '../../lib/payment-method-utils';
import {
  facebookShareURL,
  followOrderRedirectUrl,
  getCollectivePageRoute,
  mastodonShareURL,
  tweetURL,
} from '../../lib/url-helpers';
import { getWebsiteUrl } from '../../lib/utils';

import Container from '../../components/Container';
import { formatAccountDetails } from '../../components/edit-collective/utils';
import { Box, Flex } from '../../components/Grid';
import I18nFormatters, { getI18nLink, I18nBold } from '../../components/I18nFormatters';
import Loading from '../../components/Loading';
import MessageBox from '../../components/MessageBox';
import StyledLink from '../../components/StyledLink';
import { H3, P } from '../../components/Text';
import { withUser } from '../../components/UserProvider';

import { isValidExternalRedirect } from '../../pages/external-redirect';
import Link from '../Link';

import { orderSuccessFragment } from './graphql/fragments';
import PublicMessageForm from './ContributionFlowPublicMessage';
import ContributorCardWithTier from './ContributorCardWithTier';
import successIllustrationUrl from './success-illustration.jpg';
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

const SuccessIllustration = styled.img.attrs({ src: successIllustrationUrl })`
  max-width: 100%;
  width: 216px;
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
    loadingLoggedInUser: PropTypes.bool,
    router: PropTypes.object,
    isEmbed: PropTypes.bool,
    data: PropTypes.object,
  };

  componentDidUpdate() {
    const {
      router: { query: queryParams },
      data: { order },
    } = this.props;
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
        {callsToAction.length <= 2 && <SuccessIllustration alt="" />}
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
    const formattedAmount = formatCurrency(totalAmount, currency, { locale: this.props.intl.locale });

    const formatValues = {
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
              <Flex style={{ whiteSpace: 'pre-wrap' }}>{formatManualInstructions(instructions, formatValues)}</Flex>
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

  render() {
    const { LoggedInUser, collective, data, intl, isEmbed } = this.props;
    const { order } = data;
    const shareURL = `${getWebsiteUrl()}/${collective.slug}`;
    const isProcessing = order?.status === ORDER_STATUS.PROCESSING;
    const isFediverse = order && (isAccountFediverse(order.toAccount) || isAccountFediverse(order.toAccount.parent));

    if (!data.loading && !order) {
      return (
        <Flex justifyContent="center" py={[5, 6]}>
          <MessageBox type="warning" withIcon>
            <FormattedMessage id="Order.NotFound" defaultMessage="This order doesn't exist" />
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
              <FormattedMessage defaultMessage="Your Contribution is processing!" />
            </P>
            <Box mt={1} maxWidth="672px">
              <P fontWeight="400" fontSize="14px" lineHeight="20px" textAlign="center">
                <FormattedMessage defaultMessage="Your contribution will remain in processing state until it is completed from the payment processor's end. You will receive an email when it goes through successfully. No further action is required from your end." />
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
              <FormattedMessage defaultMessage="View Contribution!" />
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
                width={['100%', null, null, '50%', '762px']}
                mb={[4, null, 0]}
                flexShrink={0}
              >
                <Flex flexDirection="column" alignItems="center" justifyContent="center" my={4} width={1}>
                  <H3 mb={3}>
                    <FormattedMessage id="NewContributionFlow.Success.Header" defaultMessage="Thank you! 🎉" />
                  </H3>
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
                  <Flex justifyContent="center" mt={3}>
                    <ShareLink
                      href={tweetURL({
                        url: shareURL,
                        text: intl.formatMessage(
                          order.toAccount.type === 'EVENT' ? successMsgs.event : successMsgs.default,
                          { collective: order.toAccount.name, event: order.toAccount.name },
                        ),
                      })}
                    >
                      <Twitter size="1.2em" color="#4E5052" />
                      <FormattedMessage id="tweetIt" defaultMessage="Tweet it" />
                    </ShareLink>
                    {!isFediverse && (
                      <ShareLink href={facebookShareURL({ u: shareURL })}>
                        <Facebook size="1.2em" color="#4E5052" />
                        <FormattedMessage id="shareIt" defaultMessage="Share it" />
                      </ShareLink>
                    )}
                    {isFediverse && (
                      <ShareLink
                        href={mastodonShareURL({
                          text:
                            // eslint-disable-next-line prefer-template
                            intl.formatMessage(
                              order.toAccount.type === 'EVENT' ? successMsgs.event : successMsgs.default,
                              {
                                collective: order.toAccount.name,
                                event: order.toAccount.name,
                              },
                            ) + ` ${shareURL}`,
                        })}
                      >
                        <Mastodon size="1.2em" color="#4E5052" />
                        <FormattedMessage id="shareOnMastodon" defaultMessage="Share on Mastodon" />
                      </ShareLink>
                    )}
                  </Flex>
                  {LoggedInUser && (
                    <Box px={1}>
                      <PublicMessageForm order={order} publicMessage={get(order, 'membership.publicMessage')} />
                    </Box>
                  )}
                </Flex>
              </ContainerWithImage>
              <Flex flexDirection="column" alignItems="center" justifyContent="center" width={1}>
                {this.renderInfoByPaymentMethod()}
              </Flex>
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
