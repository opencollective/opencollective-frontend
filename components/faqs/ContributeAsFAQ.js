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
              defaultMessage="Looking to make an anonymous contribution?"
            />
          </Title>
          <Content>
            <FormattedMessage
              id="contributeAs.faq.anonymous.content"
              defaultMessage="Please log out and create a new account with another email address and don't provide any personal information."
            />
          </Content>
        </Entry>
      </Container>
    )}
  </FAQ>
);

export default ContributeAsFAQ;
