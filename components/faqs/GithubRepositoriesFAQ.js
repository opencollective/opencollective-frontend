import React from 'react';
import { ArrowRight2 } from '@styled-icons/icomoon/ArrowRight2';
import { FormattedMessage } from 'react-intl';

import { Box } from '../Grid';
import StyledLink from '../StyledLink';

import FAQ, { Content, Entry, Title } from './FAQ';

/**
 * FAQ associated to the `GithubRepositories` component.
 */
const GithubRepositoriesFAQ = props => (
  <FAQ withBorderLeft withNewButtons {...props} titleProps={{ fontSize: '16px', mb: 2 }}>
    <Entry>
      <Title>
        <FormattedMessage
          id="GithubRepositories.faq.host.title"
          defaultMessage="Who will hold money for my Collective?"
        />
      </Title>
      <Content>
        <FormattedMessage
          id="GithubRepositories.faq.host.content"
          defaultMessage="Open Source Collective 501(c)(6) is a US non-profit that was created to serve as Fiscal Host (aka fiscal sponsor) to open source projects using Doohi Collective. Learn more about OSC at https://oscollective.org."
        />
      </Content>
    </Entry>
    <Entry>
      <Title>
        <FormattedMessage id="GithubRepositories.faq.cost.title" defaultMessage="What is the cost?" />
      </Title>
      <Content>
        <FormattedMessage
          id="GithubRepositories.faq.cost.content"
          defaultMessage="The fee is 10% of funds raised. This fee covers overheads like accounting, banking, legal, admin, and liability, so you don't have to set up your own foundation or take risk on personally."
        />
      </Content>
    </Entry>
    <Box mt={3}>
      <StyledLink
        href="https://docs.oscollective.org/faq"
        background="#f3f1fe"
        padding="8px 16px"
        borderRadius="100px"
        fontWeight="500"
        openInNewTab
        color="#6F5AFA"
      >
        <FormattedMessage id="moreInfo" defaultMessage="More info" /> <ArrowRight2 size="13px" />
      </StyledLink>
    </Box>
  </FAQ>
);

export default GithubRepositoriesFAQ;
