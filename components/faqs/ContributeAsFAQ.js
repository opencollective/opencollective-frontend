import React from 'react';
import { FormattedMessage } from 'react-intl';

import FAQ, { Content, Entry, Title } from './FAQ';

/**
 * FAQ associated to the `SelectProfile` component.
 */
const ContributeAsFAQ = props => (
  <FAQ {...props}>
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
  </FAQ>
);

export default ContributeAsFAQ;
