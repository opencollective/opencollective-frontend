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
              defaultMessage="You will be charged for the first time today. For monthly subscriptions, you will then be charged the 1st of next month, then the 1st of each month. For yearly subscriptions, you will then be charged the 1st of same month next year, then the 1st of same month each year. Warning: you may be charged twice in a short time frame if you are setting up a monthly subscription close to the end of the month."
            />
          </Content>
        </Entry>
      </Container>
    )}
  </FAQ>
);

export default ContributeDetailsFAQ;
