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
          defaultMessage="Why can\'t I see my gift card?"
        />
      </Title>
      <Content>
        <FormattedMessage
          id="createProfile.faq.giftsCardsWithIncognito.content"
          defaultMessage="Gifts cards cannot be used for incognito contributions. This is for security reasons, ensuring profiles are not linked to incognito transactions in a way that could compromise anonymity."
        />
      </Content>
    </Entry>
  </FAQ>
);

export default ContributePaymentFAQ;
