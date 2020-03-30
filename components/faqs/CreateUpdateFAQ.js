import React from 'react';
import PropTypes from 'prop-types';
import { FormattedMessage } from 'react-intl';
import FAQ, { Entry, Title, Content } from './FAQ';

const CreateUpdateFAQ = ({ defaultOpen, ...props }) => (
  <FAQ {...props}>
    <Entry open={defaultOpen}>
      <Title>
        <FormattedMessage id="CreateUpdateFAQ.target" defaultMessage="Who can see updates?" />
      </Title>
      <Content>
        <FormattedMessage
          id="CreateUpdateFAQ.target.content"
          defaultMessage="Updates can be public or private in which case only the contributors of the collective can see them. Whenever you post a new update, you can define whether it should be public or private."
        />
      </Content>
    </Entry>
    <Entry open={defaultOpen}>
      <Title>
        <FormattedMessage
          id="CreateUpdateFAQ.notification"
          defaultMessage="Who gets a notification whenever there is a new update?"
        />
      </Title>
      <Content>
        <FormattedMessage
          id="CreateUpdateFAQ.notification.content"
          defaultMessage="All contributors of the collective will receive a notification by default. They can easily unsubscribe with one click."
        />
      </Content>
    </Entry>
    <Entry open={defaultOpen}>
      <Title>
        <FormattedMessage id="CreateUpdateFAQ.moderation" defaultMessage="Who can post an update?" />
      </Title>
      <Content>
        <FormattedMessage
          id="CreateUpdateFAQ.moderation.content"
          defaultMessage="Only the administrators of this collective can post updates."
        />
      </Content>
    </Entry>
    <Entry open={defaultOpen}>
      <Title>
        <FormattedMessage id="CreateUpdateFAQ.replies" defaultMessage="What should we use updates for?" />
      </Title>
      <Content>
        <FormattedMessage
          id="CreateUpdateFAQ.whatfor.content"
          defaultMessage="Updates are great to keep your community of contributors up to date with what you do. They should preferably be low volume (at least once a month, ideally no more than once a week). If your contributors hear regularly from you, they will more likely engage, help you and continue to support you. Updates are also great for your fiscal sponsor and for writing reports for grants that you may have."
        />
      </Content>
    </Entry>
  </FAQ>
);

CreateUpdateFAQ.propTypes = {
  defaultOpen: PropTypes.bool,
};

export default CreateUpdateFAQ;
