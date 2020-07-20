import React from 'react';
import { FormattedMessage } from 'react-intl';

import { Box } from '../Grid';
import StyledLink from '../StyledLink';

import FAQ, { Content, Entry, Title } from './FAQ';

/**
 * FAQ associated to the new contribution flow.
 */
const ContributeAsFAQ = props => (
  <FAQ withBorderLeft withNewButtons {...props}>
    <Entry>
      <Title>
        <FormattedMessage id="NewContributionFlow.FAQ.Secure.Title" defaultMessage="Is my contribution secure?" />
      </Title>
      <Content>
        Quam nemo umquam voluptatem appellavit, appellat; Sin te auctoritas commovebat, nobisne omnibus et Platoni ipsi
        nescio quem illum anteponebas?
      </Content>
    </Entry>
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
        href="https://www.opencollective.com"
        openInNewTab
        fontSize="Caption"
        color="black.700"
      >
        <FormattedMessage id="moreInfo" defaultMessage="More info" />
        &nbsp;&rarr;
      </StyledLink>
    </Box>
  </FAQ>
);

export default ContributeAsFAQ;
