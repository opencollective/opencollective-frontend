import React from 'react';
import PropTypes from 'prop-types';
import { FormattedMessage } from 'react-intl';

import FAQ, { Content, Entry, Title } from './FAQ';

const CreateUpdateFAQ = ({ defaultOpen, ...props }) => (
  <FAQ {...props}>
    <Entry open={defaultOpen}>
      <Title>
        <FormattedMessage id="CreateUpdateFAQ.target" defaultMessage="Who can see Updates?" />
      </Title>
      <Content>
        <FormattedMessage
          id="CreateUpdateFAQ.target.content"
          defaultMessage="Updates can be public or private. Private Updates are only visible to contributors."
        />
      </Content>
    </Entry>
    <Entry open={defaultOpen}>
      <Title>
        <FormattedMessage id="CreateUpdateFAQ.notification" defaultMessage="Who gets notificatied of Updates?" />
      </Title>
      <Content>
        <FormattedMessage
          id="CreateUpdateFAQ.notification.content"
          defaultMessage="All contributors will receive an email notification by default. They can easily unsubscribe with one click."
        />
      </Content>
    </Entry>
    <Entry open={defaultOpen}>
      <Title>
        <FormattedMessage id="CreateUpdateFAQ.moderation" defaultMessage="Who can post an Update?" />
      </Title>
      <Content>
        <FormattedMessage id="CreateUpdateFAQ.moderation.content" defaultMessage="Only the admins can post Updates." />
      </Content>
    </Entry>
    <Entry open={defaultOpen}>
      <Title>
        <FormattedMessage id="CreateUpdateFAQ.replies" defaultMessage="What should we use Updates for?" />
      </Title>
      <Content>
        <FormattedMessage
          id="CreateUpdateFAQ.whatfor.content"
          defaultMessage="Let your community know what you're doing, engage supporters to keep contributing, and report back to funders. Share your triumphs, ask for help, and tellyour story."
        />
      </Content>
    </Entry>
  </FAQ>
);

CreateUpdateFAQ.propTypes = {
  defaultOpen: PropTypes.bool,
};

export default CreateUpdateFAQ;
