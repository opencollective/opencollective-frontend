import React from 'react';
import PropTypes from 'prop-types';
import { FormattedMessage } from 'react-intl';

import { Box } from '../Grid';
import HTMLContent from '../HTMLContent';
import { getI18nLink } from '../I18nFormatters';
import Link from '../Link';
import StyledLink from '../StyledLink';

import FAQ, { Content, Entry, Title } from './FAQ';

/**
 * FAQ associated to the new contribution flow.
 */
const ContributeFAQ = ({ collective, isCrypto, ...props }) => (
  <FAQ withBorderLeft withNewButtons {...props}>
    <Entry>
      <Title>
        <FormattedMessage id="NewContributionFlow.FAQ.Secure.Title" defaultMessage="Is my contribution secure?" />
      </Title>
      <Content>
        {isCrypto ? (
          <FormattedMessage
            id="ContributeFAQ.Safe.Crypto"
            defaultMessage="Open Collective doesn't store any private information about your crypto wallet and relies on Giving Block to manage the crypto payments. If our systems are compromised your information is not at risk since we don't store any. For more information about the data that Giving Block stores please visit their <PrivacyPolicy>privacy policy</PrivacyPolicy>."
            values={{
              PrivacyPolicy: getI18nLink({
                openInNewTab: true,
                href: 'https://www.thegivingblock.com/privacypolicy',
              }),
            }}
          />
        ) : (
          <FormattedMessage
            id="ContributeFAQ.Safe"
            defaultMessage="Open Collective doesn't store sensitive payment data (e.g. Credit Card numbers), instead relying on our payment processor, Stripe, a secure solution that is widely adopted. If our systems are compromised, your payment information is not at risk, because we simply don't store it. <LearnMoreLink>Learn more</LearnMoreLink>."
            values={{
              LearnMoreLink: getI18nLink({
                openInNewTab: true,
                href: 'https://docs.opencollective.com/help/product/security#payments-security',
              }),
            }}
          />
        )}
      </Content>
    </Entry>
    {(collective.contributionPolicy || collective.parent?.contributionPolicy) && (
      <Entry>
        <Title>
          <FormattedMessage
            id="ContributeFAQ.Policy.Title"
            defaultMessage="Does {name} have a contribution policy?"
            values={{ name: collective.name }}
          />
        </Title>
        <Content>
          {collective.contributionPolicy && <HTMLContent fontSize="13px" content={collective.contributionPolicy} />}
          {collective.parent?.contributionPolicy &&
            collective.parent.contributionPolicy !== collective.contributionPolicy && (
              <HTMLContent fontSize="13px" content={collective.parent?.contributionPolicy} />
            )}
        </Content>
      </Entry>
    )}
    {collective.host.contributionPolicy && collective.name !== collective.host.name && (
      <Entry>
        <Title>
          <FormattedMessage
            id="ContributeFAQ.Policy.Title"
            defaultMessage="Does {name} have a contribution policy?"
            values={{ name: collective.host.name }}
          />
        </Title>
        <Content>
          <HTMLContent fontSize="13px" content={collective.host.contributionPolicy} />
        </Content>
      </Entry>
    )}
    <Entry>
      <Title>
        <FormattedMessage
          id="createProfile.faq.persoVSOrg.title"
          defaultMessage="What's the difference between an individual and an organization profile?"
        />
      </Title>
      <Content>
        <FormattedMessage
          id="createProfile.faq.persoVsOrg.content"
          defaultMessage="Organizations represent a company or entity, while individual profiles represent a person. Organization profiles can have multiple team members (individual profiles) who have access to edit it and make financial contributions in its name. If a contribution or expense is for a company, it's important to use an organization profile so the correct billing information shows up on receipts and invoices. Organizations can also issue gift cards."
        />
      </Content>
    </Entry>
    <Entry>
      <Title>
        <FormattedMessage defaultMessage="What information is shared with the Collectives?" />
      </Title>
      <Content>
        <FormattedMessage
          defaultMessage="When you contribute to a Collective we share your email address with the Administrators. If you wish to keep your contribution private choose the ‘incognito’ profile. Read our <PrivacyPolicyLink>privacy policy</PrivacyPolicyLink>."
          values={{ PrivacyPolicyLink: getI18nLink({ href: '/privacypolicy', openInNewTab: true, as: Link }) }}
        />
      </Content>
    </Entry>
    <Entry>
      <Title>
        <FormattedMessage
          id="ContributeDetails.faq.isIncognito.title"
          defaultMessage="What is an incognito contribution?"
        />
      </Title>
      <Content>
        <FormattedMessage
          id="ContributeDetails.faq.isIncognito.content"
          defaultMessage={
            'Publicly, the contribution amount and date will be visible in the transparent budget, but your identity will be obscured, appearing only as "incognito". The contribution will not be linked to your public profile.'
          }
        />
      </Content>
    </Entry>
    {isCrypto && (
      <Entry>
        <Title>
          <FormattedMessage
            id="ContributeDetails.faq.theGivingBlock.title"
            defaultMessage="What is The Giving Block?"
          />
        </Title>
        <Content>
          <FormattedMessage
            id="ContributeDetails.faq.theGivingBlock.content"
            defaultMessage={`We’ve partnered with The Giving Block to enable you to donate using your cryptocurrency.
You will need to send your contribution to the wallet address generated by The Giving Block after filling in the form.
Contributions are immediately settled in the currency of the Collective once confirmed by the ledger.`}
          />
        </Content>
      </Entry>
    )}
    <Box mt={2}>
      <StyledLink
        as={StyledLink}
        href="https://docs.opencollective.com/help/financial-contributors/payments#financial-contribution-flow"
        openInNewTab
        fontSize="12px"
        color="black.700"
      >
        <FormattedMessage id="moreInfo" defaultMessage="More info" />
        &nbsp;&rarr;
      </StyledLink>
    </Box>
  </FAQ>
);

ContributeFAQ.propTypes = {
  collective: PropTypes.shape({
    name: PropTypes.string,
    contributionPolicy: PropTypes.string,
    host: PropTypes.shape({
      name: PropTypes.string,
      contributionPolicy: PropTypes.string,
    }),
    parent: PropTypes.shape({
      name: PropTypes.string,
      contributionPolicy: PropTypes.string,
    }),
  }),
  isCrypto: PropTypes.bool,
};

export default ContributeFAQ;
