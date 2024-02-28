import React from 'react';
import PropTypes from 'prop-types';
import { defineMessages, FormattedMessage, useIntl } from 'react-intl';

import { FEATURES } from '../../lib/allowed-features';
import { canContributeRecurring } from '../../lib/collective';
import { isTierExpired } from '../../lib/tier-utils';
import { getCollectivePageRoute, getDashboardRoute } from '../../lib/url-helpers';

import Container from '../Container';
import { Flex } from '../Grid';
import { getI18nLink } from '../I18nFormatters';
import Link from '../Link';
import MessageBox from '../MessageBox';
import StyledButton from '../StyledButton';
import { P } from '../Text';

export const CONTRIBUTION_BLOCKER = {
  DISABLED: 'DISABLED',
  NO_HOST: 'NO_HOST',
  NOT_ACTIVE: 'NOT_ACTIVE',
  NO_PAYMENT_PROVIDER: 'NO_PAYMENT_PROVIDER',
  TIER_EMPTY: 'TIER_EMPTY',
  TIER_MISSING: 'TIER_MISSING',
  TIER_EXPIRED: 'TIER_EXPIRED',
  NO_CUSTOM_CONTRIBUTION: 'NO_CUSTOM_CONTRIBUTION',
};

const msg = defineMessages({
  [CONTRIBUTION_BLOCKER.DISABLED]: {
    defaultMessage: 'This account cannot receive financial contributions at this time',
  },
  [CONTRIBUTION_BLOCKER.NO_HOST]: {
    id: 'createOrder.missingHost',
    defaultMessage: "This collective doesn't have a host and can't accept financial contributions",
  },
  [CONTRIBUTION_BLOCKER.NOT_ACTIVE]: {
    id: 'createOrder.inactiveCollective',
    defaultMessage: "This collective is not active and can't accept financial contributions",
  },
  [CONTRIBUTION_BLOCKER.TIER_MISSING]: {
    id: 'createOrder.missingTier',
    defaultMessage: "Oops! This tier doesn't exist or has been removed by the collective admins.",
  },
  [CONTRIBUTION_BLOCKER.TIER_EXPIRED]: {
    id: 'Tier.Past',
    defaultMessage: 'This tier is not active anymore.',
  },
  [CONTRIBUTION_BLOCKER.TIER_EMPTY]: {
    id: 'Tier.empty',
    defaultMessage: 'There are no more {type, select, TICKET {tickets} other {units}} for {name}',
  },
  [CONTRIBUTION_BLOCKER.NO_CUSTOM_CONTRIBUTION]: {
    id: 'Tier.disableCustomContribution',
    defaultMessage: 'This collective requires you to select a tier to contribute.',
  },
});

const tierHasFixedInterval = tier => tier?.interval && tier.interval !== 'flexible';

/**
 * From received params, see if there's anything preventing the contribution
 */
export const getContributionBlocker = (loggedInUser, account, tier, shouldHaveTier) => {
  if (!account.host) {
    return { reason: CONTRIBUTION_BLOCKER.NO_HOST };
  } else if (!account.isActive) {
    return { reason: CONTRIBUTION_BLOCKER.NOT_ACTIVE };
  } else if (account.features[FEATURES.RECEIVE_FINANCIAL_CONTRIBUTIONS] === 'DISABLED') {
    return { reason: CONTRIBUTION_BLOCKER.DISABLED };
  } else if (tier?.availableQuantity === 0) {
    const intlParams = { type: tier.type, name: <q>{tier.name}</q> };
    return { reason: CONTRIBUTION_BLOCKER.TIER_EMPTY, intlParams, showOtherWaysToContribute: true };
  } else if (shouldHaveTier && !tier) {
    return { reason: CONTRIBUTION_BLOCKER.TIER_MISSING, type: 'warning', showOtherWaysToContribute: true };
  } else if (tier && isTierExpired(tier)) {
    return { reason: CONTRIBUTION_BLOCKER.TIER_EXPIRED, type: 'warning', showOtherWaysToContribute: true };
  } else if (
    !account.host.supportedPaymentMethods?.length ||
    (tierHasFixedInterval(tier) && !canContributeRecurring(account, loggedInUser))
  ) {
    return {
      reason: CONTRIBUTION_BLOCKER.NO_PAYMENT_PROVIDER,
      type: 'warning',
      showOtherWaysToContribute: true,
      content: paymentMethodUnavailableWarning(loggedInUser, account, tier),
    };
  } else {
    return null;
  }
};

const paymentMethodUnavailableWarning = (loggedInUser, account, tier) => {
  return (
    <React.Fragment>
      <strong>
        <FormattedMessage
          id="ContributionFlow.noSupportedPaymentMethods"
          defaultMessage="There is no payment provider available"
        />
      </strong>
      <br />
      {loggedInUser?.isHostAdmin(account) && (
        <Container maxWidth="400px" mt={3}>
          {account.host.supportedPaymentMethods?.length &&
          tierHasFixedInterval(tier) &&
          !canContributeRecurring(account, loggedInUser) ? (
            <P lineHeight="18px">
              <FormattedMessage
                defaultMessage="None of the payment providers currently active on your account supports recurring contributions. You can enable them by connecting Stripe or PayPal. Alternatively, you can remove the ability to contribute recurringly from the <TiersLink>tiers settings</TiersLink>."
                values={{
                  TiersLink: getI18nLink({
                    as: Link,
                    href: `${getDashboardRoute(account, 'tiers')}`,
                  }),
                }}
              />
            </P>
          ) : (
            <Container textAlign="center">
              <Link href={`/${account.slug}/accept-financial-contributions/organization`}>
                <StyledButton buttonStyle="primary" mt={3}>
                  <FormattedMessage id="contributions.startAccepting" defaultMessage="Start accepting contributions" />
                </StyledButton>
              </Link>
            </Container>
          )}
        </Container>
      )}
    </React.Fragment>
  );
};

const ContributionBlocker = ({ account, blocker }) => {
  const intl = useIntl();
  return (
    <Flex flexDirection="column" alignItems="center" py={[5, null, 6]}>
      <MessageBox type={blocker.type || 'info'} withIcon maxWidth={800}>
        {blocker.content ||
          (msg[blocker.reason] && intl.formatMessage(msg[blocker.reason], blocker.intlParams)) ||
          blocker.reason}
      </MessageBox>
      {blocker.showOtherWaysToContribute && account && (
        <Link href={`${getCollectivePageRoute(account)}/contribute`}>
          <StyledButton buttonStyle="primary" buttonSize="large" mt={5}>
            <FormattedMessage id="createOrder.backToTier" defaultMessage="View all the other ways to contribute" />
          </StyledButton>
        </Link>
      )}
    </Flex>
  );
};

ContributionBlocker.propTypes = {
  blocker: PropTypes.shape({
    reason: PropTypes.oneOf(Object.values(CONTRIBUTION_BLOCKER)).isRequired,
    intlParams: PropTypes.object,
    /** To override the default message.  */
    content: PropTypes.node,
    type: PropTypes.string,
    showOtherWaysToContribute: PropTypes.bool,
  }).isRequired,
  account: PropTypes.object,
};

export default ContributionBlocker;
