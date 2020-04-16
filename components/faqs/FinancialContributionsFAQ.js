import React from 'react';
import { FormattedMessage } from 'react-intl';
import FAQ, { Entry, Title, Content } from './FAQ';
import StyledLink from '../StyledLink';
import ExternalLink from '../ExternalLink';
import { Box } from '../Grid';

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
          defaultMessage="The instructions for the wire transfer are sent to contributors via email with a unique transaction identifier. Once the money has been received in the Host's bank account, the admin of the Host will be able to mark the transaction as received in the Host Dashboard and the funds will be added to the Collective's budget."
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
          defaultMessage="Hosts will only add funds in your Collective when they clear in their bank account. The donation will show as pending until then."
        />
      </Content>
    </Entry>
    <Entry>
      <Title>
        <FormattedMessage
          id="acceptContributions.FAQ.idNotIncluded"
          defaultMessage="What happens if the ID is not included in the transaction?"
        />
      </Title>
      <Content>
        <FormattedMessage
          id="acceptContributions.FAQ.idNotIncludedDetails"
          defaultMessage="If the ID is not included in the transaction, we can't match it to the donation and it won't show up in the Collective. Please contact {email} if you sent a donation that is not showing up on the Collective so we can trace it."
          values={{ email: <a href={`mailto:${supportEmail}`}>{supportEmail}</a> }}
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
