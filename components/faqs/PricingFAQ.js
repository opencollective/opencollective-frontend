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
            defaultMessage="A group seeking to raise and spend money transparently using the Open Collective platform, representing a community, project, or initiative."
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
            defaultMessage="A Fiscal Host holds funds on behalf of Collectives, enabling them to operate using the Host's bank account and legal entity."
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
            id="OCFHostApplication.faq.platform.content"
            defaultMessage="Platform Tips support development of the Open Collective software platform. Contributors to Collectives see the option to give a voluntary Platform Tip at checkout."
          />
        </P>
      </Content>
    </Entry>
  </FAQ>
);

export default PricingFAQ;
