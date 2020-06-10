import React from 'react';
import PropTypes from 'prop-types';
import { FormattedMessage } from 'react-intl';

import FAQ, { Content, Entry, Title } from './FAQ';

const EditCollectivePageFAQ = ({ defaultOpen, ...props }) => (
  <FAQ {...props}>
    <Entry open={defaultOpen}>
      <Title>
        <FormattedMessage id="EditCollectivePageFAQ.Data" defaultMessage="Is data preserved when I hide a section?" />
      </Title>
      <Content>
        <FormattedMessage
          id="EditCollectivePageFAQ.DataDetails"
          defaultMessage="Yes, your data is preserved when you hide a section and you'll be able to re-enable it whenever you want"
        />
      </Content>
    </Entry>
    <Entry open={defaultOpen}>
      <Title>
        <FormattedMessage id="EditCollectivePageFAQ.EditHidden" defaultMessage="Can I edit a hidden section?" />
      </Title>
      <Content>
        <FormattedMessage
          id="EditCollectivePageFAQ.EditHiddenDetails"
          defaultMessage='If you untick "Show section", the section will be hidden for everyone - including you - and you will not be able to edit it'
        />
      </Content>
    </Entry>
    <Entry open={defaultOpen}>
      <Title>
        <FormattedMessage id="EditCollectivePageFAQ.Publish" defaultMessage="When will the changes be published?" />
      </Title>
      <Content>
        <FormattedMessage
          id="EditCollectivePageFAQ.PublishDetails"
          defaultMessage='Your changes will be published as soon as you click on "Save"'
        />
      </Content>
    </Entry>
  </FAQ>
);

EditCollectivePageFAQ.propTypes = {
  defaultOpen: PropTypes.bool,
};

export default EditCollectivePageFAQ;
