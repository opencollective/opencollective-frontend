import React from 'react';
import PropTypes from 'prop-types';
import { FormattedMessage } from 'react-intl';

import { Box } from '../Grid';
import StyledLink from '../StyledLink';

import FAQ, { Content, Entry, Title } from './FAQ';

const CreateExpenseFAQ = ({ defaultOpen, ...props }) => (
  <FAQ {...props}>
    <Entry open={defaultOpen}>
      <Title>
        <FormattedMessage id="CreateExpenseFAQ.getPaid" defaultMessage="How do I get paid from a Collective?" />
      </Title>
      <Content>
        <FormattedMessage
          id="CreateExpenseFAQ.getPaidDetails"
          defaultMessage="Submit an expense and provide your payment information."
        />
      </Content>
    </Entry>
    <Entry open={defaultOpen}>
      <Title>
        <FormattedMessage id="CreateExpenseFAQ.howAreApproved" defaultMessage="How are expenses approved?" />
      </Title>
      <Content>
        <FormattedMessage
          id="CreateExpenseFAQ.howAreApprovedDetails"
          defaultMessage="Collective admins are notified when an expense is submitted, and they can approve or reject it."
        />
      </Content>
    </Entry>
    <Entry open={defaultOpen}>
      <Title>
        <FormattedMessage id="CreateExpenseFAQ.isItPublic" defaultMessage="Is my private data made public?" />
      </Title>
      <Content>
        <FormattedMessage
          id="CreateExpenseFAQ.isItPublicDetails"
          defaultMessage="No. Only the expense amount and description are public. Attachments, payment info, emails and addresses are only visible to you and the admins."
        />
      </Content>
    </Entry>
    <Entry open={defaultOpen}>
      <Title>
        <FormattedMessage id="CreateExpenseFAQ.whenPaid" defaultMessage="When will I get paid?" />
      </Title>
      <Content>
        <FormattedMessage
          id="CreateExpenseFAQ.whenPaidDetails"
          defaultMessage="Payments are processed by the Collective's Fiscal Host, the organization that hold funds on their behalf. Many Fiscal Hosts pay expenses weekly, but each one is different."
        />
      </Content>
    </Entry>
    <Box mt={2} pl={2}>
      <StyledLink
        as={StyledLink}
        href="https://docs.opencollective.com/help/expenses-and-getting-paid/submitting-expenses"
        openInNewTab
        fontSize="12px"
        color="black.700"
      >
        <FormattedMessage id="moreInfo" defaultMessage="More info" />
        &nbsp;&rarr;
      </StyledLink>
    </Box>
  </FAQ>
);

CreateExpenseFAQ.propTypes = {
  defaultOpen: PropTypes.bool,
};

export default CreateExpenseFAQ;
