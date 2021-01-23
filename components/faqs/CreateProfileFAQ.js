import React from 'react';
import { FormattedMessage } from 'react-intl';

import FAQ, { Content, Entry, Title } from './FAQ';

/**
 * FAQ associated to the `CreateProfile` component. Explains differences between
 * account types (perso. vs org.) as well as incognito contributions.
 */
const CreateProfileFAQ = props => (
  <FAQ {...props}>
    <Entry>
      <Title>
        <FormattedMessage
          id="createProfile.faq.persoVSOrg.title"
          defaultMessage="What's the difference between an individual and an organization profile?"
        />
      </Title>
      <Content>
        <FormattedMessage
          id="createProfile.faq.persoVsOrg.content"
          defaultMessage="Organizations represent a company or entity, while individual profiles represent a person. Organization profiles can have multiple team members (individual profiles) who have access to edit it and make financial contributions in its name. If a contribution or expense is for a company, it\'s important to use an organization profile so the correct billing information shows up on receipts and invoices. Organizations can also issue gift cards."
        />
      </Content>
    </Entry>

    <Entry>
      <Title>
        <FormattedMessage id="createProfile.faq.email.title" defaultMessage="Who can see my email address?" />
      </Title>
      <Content>
        <FormattedMessage
          id="createProfile.faq.email.content"
          defaultMessage="The admins of the Collective and its Fiscal Host will have access to your email address. We do not share emails with anyone else and we don't use it for any type of marketing. We hate spam as much as you do."
        />
      </Content>
    </Entry>

    <Entry>
      <Title>
        <FormattedMessage id="createProfile.faq.privacy.title" defaultMessage="What about privacy?" />
      </Title>
      <Content>
        <FormattedMessage
          id="createProfile.faq.privacy.content"
          defaultMessage="We care about privacy. We don't use cookies, Google Analytics, or any kind of tracking. We collect certain personal information because it\'s required for regulatory reasons that the entity receiving money from you know who you are (KYC - Know Your Customer). You can choose to make an incognito contribution if you don't want your identity to be public."
        />
      </Content>
    </Entry>

    <Entry>
      <Title>
        <FormattedMessage
          id="createProfile.faq.anonymous.title"
          defaultMessage="Can I make an anonymous contribution?"
        />
      </Title>
      <Content>
        <FormattedMessage
          id="createProfile.faq.anonymous.content"
          defaultMessage="Yes you can! Select the 'incognito' option to make your contribution anonymous to the public. However, the admins will still be able to see your profile and identity privately."
        />
      </Content>
    </Entry>
  </FAQ>
);

export default CreateProfileFAQ;
