import React from 'react';
import PropTypes from 'prop-types';
import { FormattedMessage } from 'react-intl';

import { Box } from '../Grid';
import HTMLContent from '../HTMLContent';
import { getI18nLink } from '../I18nFormatters';
import StyledLink from '../StyledLink';

import FAQ, { Content, Entry, Title } from './FAQ';

/**
 * FAQ associated to the new contribution flow.
 */
const ContributeFAQ = ({ collective, ...props }) => (
  <FAQ withBorderLeft withNewButtons {...props}>
    <Entry>
      <Title>
        <FormattedMessage id="NewContributionFlow.FAQ.Secure.Title" defaultMessage="Is my contribution secure?" />
      </Title>
      <Content>
        <FormattedMessage
          id="ContributeFAQ.Safe"
          defaultMessage="Open Collective doesn't store credit card numbers, instead relying on our payment processor, Stripe, a secure solution that is widely adopted. If our systems are compromised, your credit card information is not at risk, because we simply don't store it. <LearnMoreLink>Learn more</LearnMoreLink>."
          values={{
            LearnMoreLink: getI18nLink({
              openInNewTab: true,
              href: 'https://docs.opencollective.com/help/product/security#payments-security',
            }),
          }}
        />
      </Content>
    </Entry>
    {collective.contributionPolicy && (
      <Entry>
        <Title>
          <FormattedMessage
            id="ContributeFAQ.Policy.Title"
            defaultMessage="Does {name} have a contribution policy?"
            values={{ name: collective.name }}
          />
        </Title>
        <Content>
          <HTMLContent fontSize="13px" content={collective.contributionPolicy} />
        </Content>
      </Entry>
    )}
    {collective.host.contributionPolicy && (
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
          defaultMessage="Organizations represent a company or entity, while individual profiles represent a person. Organization profiles can have multiple team members (individual profiles) who have access to edit it and make financial contributions in its name. If a contribution or expense is for a company, it\'s important to use an organization profile so the correct billing information shows up on receipts and invoices. Organizations can also issue gift cards."
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
            'Publicly, the contribution amount and date will be visible in the transparent budget, but your identity will be obscured, appearing only as "incognito". The contribution will not be linked to your public profile. However, the admins will be able to see your identity privately.'
          }
        />
      </Content>
    </Entry>
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
  }),
};

export default ContributeFAQ;
