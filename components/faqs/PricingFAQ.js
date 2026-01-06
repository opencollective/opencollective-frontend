import React from 'react';
import { FormattedMessage } from 'react-intl';

import { H4, P } from '../Text';

import FAQ, { Content, Entry, Separator, Title } from './FAQ';

const PricingFAQ = props => (
  <FAQ
    withNewButtons
    {...props}
    title="FAQ's"
    titleProps={{
      color: '#0C2D66',
      fontSize: '28px',
      fontWeight: '500',
      lineHeight: '36px',
      letterSpacing: '-0.008em',
      marginBottom: '32px',
    }}
    width="100%"
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
          <FormattedMessage id="pricing.faq.organization.title" defaultMessage="What is an Organization?" />
        </H4>
      </Title>
      <Content>
        <P fontSize="14px" lineHeight="20px" fontWeight="400" color="black.800">
          <FormattedMessage
            id="OCFHostApplication.faq.organization.content"
            defaultMessage="An Organization is a legal entity, such as a non-profit, cooperative, or company, that can manage funds for itself and/or act as a Fiscal Host by receiving and holding contributions on behalf of Collectives using its legal entity and bank account."
          />
        </P>
      </Content>
    </Entry>
    <Separator />
    <Entry>
      <Title>
        <H4 fontWeight="500" fontSize="20px" lineHeight="28px" letterSpacing="-0.008em">
          <FormattedMessage id="pricing.faq.platform.title" defaultMessage="How do platform tips work?" />
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
