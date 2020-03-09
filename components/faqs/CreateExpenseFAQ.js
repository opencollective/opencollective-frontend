import React from 'react';
import PropTypes from 'prop-types';
import { FormattedMessage } from 'react-intl';
import FAQ, { Entry, Title, Content } from './FAQ';
import StyledLink from '../StyledLink';
import ExternalLink from '../ExternalLink';
import { Box } from '@rebass/grid';

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
          defaultMessage="Collective admins are notified when an expense is submitted and they can approve or reject it."
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
          defaultMessage="No. Only the expense amount and description are public. Attachments, payment info, and other private data is only visible to you and the admins."
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
          defaultMessage="Payments are processed by the Collective's fiscal host, the organization that hold funds on their behalf. Many fiscal hosts pay expenses weekly, but each one is different."
        />
      </Content>
    </Entry>
    <Box mt={2} pl={2}>
      <StyledLink
        as={ExternalLink}
        href="https://docs.opencollective.com/help/expenses-and-getting-paid/submitting-expenses"
        openInNewTab
        fontSize="Caption"
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
