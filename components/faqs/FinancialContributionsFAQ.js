import React from 'react';
import { FormattedMessage } from 'react-intl';

import { Box } from '../Grid';
import StyledLink from '../StyledLink';

import FAQ, { Content, Entry, Title } from './FAQ';

const supportEmail = 'support@opencollective.com';

const FinancialContributionsFAQ = props => (
  <FAQ {...props}>
    <Entry>
      <Title>
        <FormattedMessage id="paymentMethods.manual.HowDoesItWork" defaultMessage="How does it work?" />
      </Title>
      <Content>
        <FormattedMessage
          id="acceptContributions.FAQ.howDoesItWorkDetails"
          defaultMessage="Payment instructions are automatically sent to contributors via email. Once the funds are received, the admin can confirm the transaction and the amount will be credited to the budget."
        />
      </Content>
    </Entry>
    <Entry>
      <Title>
        <FormattedMessage
          id="acceptContributions.FAQ.moneyNotReceived"
          defaultMessage="What happens if the money is never received?"
        />
      </Title>
      <Content>
        <FormattedMessage
          id="acceptContributions.FAQ.moneyNotReceivedDetails"
          defaultMessage="Nothing happens if the funds are never confirmed as received. The transaction will stay pending and not be added to the budget. Admins can mark pending transactions as expired to cancel them if it\'s not likely the money will ever arrive."
        />
      </Content>
    </Entry>
    <Entry>
      <Title>
        <FormattedMessage
          id="acceptContributions.FAQ.idNotIncluded"
          defaultMessage="What happens if the reference ID is not included?"
        />
      </Title>
      <Content>
        <FormattedMessage
          id="acceptContributions.FAQ.idNotIncludedDetails"
          defaultMessage="If the unique ID is not included, it can be hard to find and confirm a transaction. If you sent the money but it has not been confirmed, contact {email} and we will help track it down."
          values={{ email: <a href={`mailto:${supportEmail}`}>{supportEmail}</a> }}
        />
      </Content>
    </Entry>
    <Box mt={2}>
      <StyledLink
        as={StyledLink}
        href="https://docs.opencollective.com/help/fiscal-hosts/become-a-fiscal-host"
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

export default FinancialContributionsFAQ;
