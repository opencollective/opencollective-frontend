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
              defaultMessage="Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam."
            />
          </Content>
        </Entry>
      </Container>
    )}
  </FAQ>
);

export default GithubRepositoriesFAQ;
