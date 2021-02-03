import React from 'react';
import PropTypes from 'prop-types';
import { FormattedMessage } from 'react-intl';

import FAQ, { Content, Entry, Title } from './FAQ';

const CreateConversationFAQ = ({ defaultOpen, ...props }) => (
  <FAQ {...props}>
    <Entry open={defaultOpen}>
      <Title>
        <FormattedMessage id="CreateConversationFAQ.target" defaultMessage="Who can see Conversations?" />
      </Title>
      <Content>
        <FormattedMessage
          id="CreateConversationFAQ.target.content"
          defaultMessage="All Conversations are public. Anyone can see and respond to them."
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
          defaultMessage="Admins can remove Conversations that are not appropriate for the community."
        />
      </Content>
    </Entry>
    <Entry open={defaultOpen}>
      <Title>
        <FormattedMessage id="CreateConversationFAQ.replies" defaultMessage="Will I be notified of replies?" />
      </Title>
      <Content>
        <FormattedMessage
          id="CreateConversationFAQ.replies.content"
          defaultMessage="Yes, you will be notified by email. You can unsubscribe at any time."
        />
      </Content>
    </Entry>
  </FAQ>
);

CreateConversationFAQ.propTypes = {
  defaultOpen: PropTypes.bool,
};

export default CreateConversationFAQ;
