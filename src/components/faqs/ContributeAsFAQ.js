import React from 'react';
import { FormattedMessage } from 'react-intl';
import FAQ from './FAQ';

/**
 * FAQ associated to the `SelectProfile` component.
 */
const ContributeAsFAQ = props => (
  <FAQ {...props}>
    {({ Container, Entry, Title, Content }) => (
      <Container>
        <Entry>
          <Title>
            <FormattedMessage
              id="contributeAs.faq.anonymous.title"
              defaultMessage="Can I make an anonymous contribution?"
            />
          </Title>
          <Content>
            <FormattedMessage
              id="contributeAs.faq.anonymous.content"
              defaultMessage="Yes you can! However, in the effort of being transparent and compliant with KYC regulations (Know Your Customer), the fiscal sponsor need to know where the money is coming from. However, we give you full control on how your information is being shown publicly. That's why you can create an anonymous or pseudonymous profile linked to your Open Collective account."
            />
          </Content>
        </Entry>
      </Container>
    )}
  </FAQ>
);

export default ContributeAsFAQ;
