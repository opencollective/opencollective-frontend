import React from 'react';
import { FormattedMessage } from 'react-intl';
import FAQ from './FAQ';

/**
 * FAQ associated to the `ContributeDetails` component.
 */
const ContributeDetailsFAQ = props => (
  <FAQ {...props}>
    {({ Container, Entry, Title, Content }) => (
      <Container>
        <Entry>
          <Title>
            <FormattedMessage
              id="ContributeDetails.faq.frequency.title"
              defaultMessage="When will I be billed next time?"
            />
          </Title>
          <Content>
            <FormattedMessage
              id="ContributeDetails.faq.frequency.content"
              defaultMessage="Subscriptions are charged at the beginning of the chosen period, so monthly donations will be charged on the 1st of each month and yearly donations on the 1st of January."
            />
          </Content>
        </Entry>
      </Container>
    )}
  </FAQ>
);

export default ContributeDetailsFAQ;
