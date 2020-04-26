import React from 'react';
import { FormattedMessage } from 'react-intl';

import FAQ, { Content, Entry, Title } from './FAQ';

/**
 * FAQ associated to the `StepPayment` component.
 */
const ContributePaymentFAQ = props => (
  <FAQ {...props}>
    <Entry>
      <Title>
        <FormattedMessage
          id="createProfile.faq.giftsCardsWithIncognito.title"
          defaultMessage="Why can't I see my gift card?"
        />
      </Title>
      <Content>
        <FormattedMessage
          id="createProfile.faq.giftsCardsWithIncognito.content"
          defaultMessage="Unfortunately, gifts cards cannot be used with incognito profiles. Allowing this could allow malicious users to find out what your main profile is. The protection of your personal information is too important for us to take this risk!"
        />
      </Content>
    </Entry>
  </FAQ>
);

export default ContributePaymentFAQ;
