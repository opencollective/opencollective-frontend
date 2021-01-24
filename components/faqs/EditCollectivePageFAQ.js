import React from 'react';
import PropTypes from 'prop-types';
import { FormattedMessage } from 'react-intl';

import FAQ, { Content, Entry, Title } from './FAQ';

const EditCollectivePageFAQ = ({ defaultOpen, ...props }) => (
  <FAQ {...props}>
    <Entry open={defaultOpen}>
      <Title>
        <FormattedMessage id="EditCollectivePageFAQ.Data" defaultMessage="If I disable a section will its content be deleted?" />
      </Title>
      <Content>
        <FormattedMessage
          id="EditCollectivePageFAQ.DataDetails"
          defaultMessage="No, your data is preserved when you disable a section. You can re-enable it any time."
        />
      </Content>
    </Entry>
    <Entry open={defaultOpen}>
      <Title>
        <FormattedMessage id="EditCollectivePageFAQ.EditHidden" defaultMessage="Can I edit a disabled section?" />
      </Title>
      <Content>
        <FormattedMessage
          id="EditCollectivePageFAQ.EditHiddenDetails"
          defaultMessage='No. To edit a section, you need to make it to visible.'
        />
      </Content>
    </Entry>
    <Entry open={defaultOpen}>
      <Title>
        <FormattedMessage id="EditCollectivePageFAQ.Publish" defaultMessage="When will changes be published?" />
      </Title>
      <Content>
        <FormattedMessage
          id="EditCollectivePageFAQ.PublishDetails"
          defaultMessage='As soon as you click "Save".'
        />
      </Content>
    </Entry>
    <Entry open={defaultOpen}>
      <Title>
        <FormattedMessage id="EditCollectivePageFAQ.HideBudget" defaultMessage="Why can't I hide my budget section?" />
      </Title>
      <Content>
        <FormattedMessage
          id="EditCollectivePageFAQ.HideBudgetDetails"
          defaultMessage="Open Collective is all about transparency, and visibility of the budget section is key for this value."
        />
      </Content>
    </Entry>
  </FAQ>
);

EditCollectivePageFAQ.propTypes = {
  defaultOpen: PropTypes.bool,
};

export default EditCollectivePageFAQ;
