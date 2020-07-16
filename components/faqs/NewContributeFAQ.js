import React from 'react';
import { FormattedMessage } from 'react-intl';

import { Box } from '../Grid';
import StyledLink from '../StyledLink';

import FAQ, { Content, Entry, Title } from './FAQ';

/**
 * FAQ associated to the new contribution flow.
 */
const ContributeAsFAQ = props => (
  <FAQ {...props}>
    <Entry>
      <Title>
        <FormattedMessage id="NewContributionFlow.FAQ.Secure.Title" defaultMessage="Is my contribution secure?" />
      </Title>
      <Content>
        <FormattedMessage
          id="CreateExpenseFAQ.isItPublicDetails"
          defaultMessage="No. Only the expense amount and description are public. Attachments, payment info, emails and addresses are only visible to you and the admins."
        />
      </Content>
    </Entry>
    <Entry>
      <Title>
        <FormattedMessage
          id="NewContributionFlow.FAQ.ContributeAsOrg.Title"
          defaultMessage="What do I do if I want to contribute as an organization?"
        />
      </Title>
      <Content>
        <FormattedMessage
          id="CreateExpenseFAQ.isItPublicDetails"
          defaultMessage="No. Only the expense amount and description are public. Attachments, payment info, emails and addresses are only visible to you and the admins."
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
    <Entry>
      <Title>
        <FormattedMessage
          id="NewContributionFlow.FAQ.ReceiveContribution.Title"
          defaultMessage="When will the Collective receive my contribution?"
        />
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
        as={StyledLink}
        href="https://www.opencollective.com"
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

export default ContributeAsFAQ;
