import React from 'react';
import { FormattedMessage } from 'react-intl';

import { H4, P } from '../Text';

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
        <H4 fontWeight="500" fontSize="20px" lineHeight="28px" letterSpacing="-0.008em">
          <FormattedMessage id="pricing.faq.collective.title" defaultMessage="What is a Collective?" />
        </H4>
      </Title>
      <Content>
        <P fontSize="14px" lineHeight="20px" fontWeight="400" color="black.800">
          <FormattedMessage
            id="OCFHostApplication.faq.collective.content"
            defaultMessage="Community is about trust and sharing. Open Collective lets you manage your finances so everyone can see where money comes from and where it goes. Collect and spend money transparently."
          />
        </P>
      </Content>
    </Entry>
    <Separator />
    <Entry>
      <Title>
        <H4 fontWeight="500" fontSize="20px" lineHeight="28px" letterSpacing="-0.008em">
          <FormattedMessage id="pricing.faq.fiscalHost.title" defaultMessage="What is a Fiscal Host?" />
        </H4>
      </Title>
      <Content>
        <P fontSize="14px" lineHeight="20px" fontWeight="400" color="black.800">
          <FormattedMessage
            id="OCFHostApplication.faq.fiscalHost.content"
            defaultMessage="Fiscal hosting enables Collectives to transact financially without needing to legally incorporate. In other contexts, this is sometimes called fiscal sponsorship. "
          />
        </P>
      </Content>
    </Entry>
    <Separator />
    <Entry>
      <Title>
        <H4 fontWeight="500" fontSize="20px" lineHeight="28px" letterSpacing="-0.008em">
          <FormattedMessage id="pricing.faq.platform.title" defaultMessage="How does platform tips work?" />
        </H4>
      </Title>
      <Content>
        <P fontSize="14px" lineHeight="20px" fontWeight="400" color="black.800">
          <FormattedMessage
            id="OCFHostApplication.faq.collective.content"
            defaultMessage="Community is about trust and sharing. Open Collective lets you manage your finances so everyone can see where money comes from and where it goes. Collect and spend money transparently."
          />
        </P>
      </Content>
    </Entry>
  </FAQ>
);

export default PricingFAQ;
