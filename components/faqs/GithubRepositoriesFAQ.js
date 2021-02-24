import React from 'react';
import { FormattedMessage } from 'react-intl';

import Link from '../Link';
import StyledLink from '../StyledLink';

import FAQ, { Content, Entry, Title } from './FAQ';

/**
 * FAQ associated to the `GithubRepositories` component.
 */
const GithubRepositoriesFAQ = props => (
  <FAQ {...props}>
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
          defaultMessage="Open Source Collective 501(c)(6) is a US non-profit that was created to serve as Fiscal Host (aka fiscal sponsor) to open source projects using Open Collective. Learn more about OSC at https://oscollective.org."
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
    <Entry>
      <Title>
        <FormattedMessage
          id="GithubRepositories.faq.repoStar.title"
          defaultMessage="Why only repos with at least 100 stars?"
        />
      </Title>
      <Content>
        <FormattedMessage
          id="GithubRepositories.faq.repoStar.content"
          defaultMessage="We need to ensure that your project is legitimate and has a community around it. If you don't fit the 100 star requirement, we can consider your application using <criteria-link>alternative criteria.</criteria-link> - select the 'Request manual verification' option instead of verifying through Github."
          values={{
            'criteria-link': function CriteriaLink(msg) {
              return (
                <StyledLink href="https://www.oscollective.org#criteria" openInNewTab>
                  {msg}
                </StyledLink>
              );
            },
            'for-any-community': function CommunityLink(msg) {
              return <Link href="/create/community">{msg}</Link>;
            },
            'open-source': function OpenSourceLink(msg) {
              return <Link href="/create/opensource">{msg}</Link>;
            },
          }}
        />
      </Content>
    </Entry>
  </FAQ>
);

export default GithubRepositoriesFAQ;
