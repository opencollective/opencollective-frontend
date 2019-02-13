import React from 'react';
import { FormattedMessage } from 'react-intl';
import FAQ from './FAQ';

/**
 * FAQ associated to the `GithubRepositories` component.
 */
const GithubRepositoriesFAQ = props => (
  <FAQ {...props}>
    {({ Container, Entry, Title, Content }) => (
      <Container>
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
              defaultMessage="In order to provide fiscal sponsorship to a project, we need to ensure that there is a community around that repo.  If your project doesn't need a fiscal sponsor (host) and has it's own bank account then, the you don't need 100 stars."
            />
          </Content>
        </Entry>
      </Container>
    )}
  </FAQ>
);

export default GithubRepositoriesFAQ;
