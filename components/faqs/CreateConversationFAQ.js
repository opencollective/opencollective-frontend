import React from 'react';
import PropTypes from 'prop-types';
import { FormattedMessage } from 'react-intl';
import FAQ, { Entry, Title, Content } from './FAQ';

const CreateConversationFAQ = ({ defaultOpen, ...props }) => (
  <FAQ {...props}>
    <Entry open={defaultOpen}>
      <Title>
        <FormattedMessage id="CreateConversationFAQ.target" defaultMessage="Who can see conversations?" />
      </Title>
      <Content>
        <FormattedMessage
          id="CreateConversationFAQ.target.content"
          defaultMessage="All conversations are public. Anyone can see them and respond to them."
        />
      </Content>
    </Entry>
    <Entry open={defaultOpen}>
      <Title>
        <FormattedMessage id="CreateConversationFAQ.moderation" defaultMessage="Who is moderating?" />
      </Title>
      <Content>
        <FormattedMessage
          id="CreateConversationFAQ.moderation.content"
          defaultMessage="The administrators of this collective can remove conversations that are not appropriate for the community. Please be a good citizen of the collective."
        />
      </Content>
    </Entry>
    <Entry open={defaultOpen}>
      <Title>
        <FormattedMessage
          id="CreateConversationFAQ.replies"
          defaultMessage="How can I find out when someone replied?"
        />
      </Title>
      <Content>
        <FormattedMessage
          id="CreateConversationFAQ.replies.content"
          defaultMessage="You will receive an email notification whenever someone replies. You can unsubscribe from those notifications at any time."
        />
      </Content>
    </Entry>
  </FAQ>
);

CreateConversationFAQ.propTypes = {
  defaultOpen: PropTypes.bool,
};

export default CreateConversationFAQ;
