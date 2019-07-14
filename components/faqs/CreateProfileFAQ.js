import React from 'react';
import { FormattedMessage } from 'react-intl';
import FAQ from './FAQ';

/**
 * FAQ associated to the `CreateProfile` component. Explains differences between
 * account types (perso. vs org.) as well as anonymous contributions.
 */
const CreateProfileFAQ = props => (
  <FAQ {...props}>
    {({ Container, Entry, Title, Content }) => (
      <Container>
        <Entry>
          <Title>
            <FormattedMessage
              id="createProfile.faq.persoVSOrg.title"
              defaultMessage="Contributions: Personal vs Organization profile"
            />
          </Title>
          <Content>
            <FormattedMessage
              id="createProfile.faq.persoVsOrg.content"
              defaultMessage="Create an organization profile if you want to sponsor projects in the name of your company."
            />
          </Content>
        </Entry>
        <Entry>
          <Title>
            <FormattedMessage
              id="createProfile.faq.anonymous.title"
              defaultMessage="Looking to make an anonymous contribution?"
            />
          </Title>
          <Content>
            <FormattedMessage
              id="createProfile.faq.anonymous.content"
              defaultMessage="You can do so! However, in the effort of being transparent and compliant with KYC (Know Your Customer) regulations, anonymous contributions still require you to create an Open Collective account."
            />
          </Content>
        </Entry>
      </Container>
    )}
  </FAQ>
);

export default CreateProfileFAQ;
