import React from 'react';
import { FormattedMessage } from 'react-intl';

import FAQ, { Content, Entry, Separator, Title } from './FAQ';

const PricingFAQ = props => (
  <FAQ
    withNewButtons
    {...props}
    title="FAQ's"
    width={['288px', '564px', '796px']}
    titleProps={{
      color: '#1153D6',
      fontSize: '28px',
      fontWeight: '500',
      lineHeight: '36px',
      letterSpacing: '-0.008em',
      marginBottom: '32px',
    }}
  >
    <Entry>
      <Title>
        <FormattedMessage id="pricing.faq.collective.title" defaultMessage="What is a Collective?" />
      </Title>
      <Content>
        <FormattedMessage
          id="OCFHostApplication.faq.collective.content"
          defaultMessage="Community is about trust and sharing. Open Collective lets you manage your finances so everyone can see where money comes from and where it goes. Collect and spend money transparently."
        />
      </Content>
    </Entry>
    <Separator />
    <Entry>
      <Title>
        <FormattedMessage id="pricing.faq.fiscalHost.title" defaultMessage="What is a Fiscal Host?" />
      </Title>
      <Content>
        <FormattedMessage
          id="pricing.faq.fiscalHost.content"
          defaultMessage="Community is about trust and sharing. Open Collective lets you manage your finances so everyone can see where money comes from and where it goes. Collect and spend money transparently."
        />
      </Content>
    </Entry>
    <Separator />
    <Entry>
      <Title>
        <FormattedMessage id="pricing.faq.platform.title" defaultMessage="How does platform tips work?" />
      </Title>
      <Content>
        <FormattedMessage
          id="pricing.faq.fiscalHost.content"
          defaultMessage="Community is about trust and sharing. Open Collective lets you manage your finances so everyone can see where money comes from and where it goes. Collect and spend money transparently."
        />
      </Content>
    </Entry>
  </FAQ>
);

export default PricingFAQ;
