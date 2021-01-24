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
          defaultMessage="Open Collective doesn't store any credit card number, we're instead relying on our partner Stripe - a secure solution that is widely adopted by the industry. If our systems are compromised, we can't loose your credit card number because we simply don't have it. <LearnMoreLink>Learn more</LearnMoreLink> about the security of Open Collective."
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
            defaultMessage="Does {name} has a contribution policy?"
            values={{ name: collective.name }}
          />
        </Title>
        <Content>
          <HTMLContent fontSize="13px" content={collective.contributionPolicy} />
        </Content>
      </Entry>
    )}
    {collective.type === 'COLLECTIVE' && collective.host.contributionPolicy && (
      <Entry>
        <Title>
          <FormattedMessage
            id="ContributeFAQ.Policy.Title"
            defaultMessage="Does {name} has a contribution policy?"
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
          defaultMessage="What's the difference between a personal and an organization profile?"
        />
      </Title>
      <Content>
        <FormattedMessage
          id="createProfile.faq.persoVsOrg.content"
          defaultMessage="Create an organization profile if you want to make a financial contribution in the name of your company or organization. An organization profile allows you to enable other members of your organization to make financial contributions within certain limits that you can define. Organizations can also issue gift cards."
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
            'If you chose to contribute as "incognito", your financial contribution will show up publicly as an incognito donation and it won\'t link to your public profile. However, in the effort of being transparent and compliant with KYC regulations (Know Your Customer), the fiscal host and the administrators of the collective can export a list of all the financial contributors with their personal information.'
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
    type: PropTypes.string,
    host: PropTypes.shape({
      name: PropTypes.string,
      contributionPolicy: PropTypes.string,
    }),
  }),
};

export default ContributeFAQ;
