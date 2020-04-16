import React from 'react';
import { FormattedMessage } from 'react-intl';
import FAQ, { Entry, Title, Content } from './FAQ';
import StyledLink from '../StyledLink';
import ExternalLink from '../ExternalLink';
import { Box } from '@rebass/grid';

const FinancialContributionsFAQ = props => (
  <FAQ {...props}>
    <Entry>
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
    <Entry>
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
    <Box mt={2}>
      <StyledLink
        as={ExternalLink}
        href="https://docs.opencollective.com/help/fiscal-hosts/become-a-fiscal-host"
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

export default FinancialContributionsFAQ;
