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
              id="GithubRepositories.faq.host.title"
              defaultMessage="Where is my collective going to be hosted (fiscal sponsored)?"
            />
          </Title>
          <Content>
            <FormattedMessage
              id="GithubRepositories.faq.host.content"
              defaultMessage="We have created a non profit, the Open Source Collective 501c6 in the United States to act as a fiscal sponsor to host all open source projects. This makes it easy for companies to donate to your project since they can receive one consolidated invoice."
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
              defaultMessage="The Open Source Collective 501c6 is taking 5% of all donation received (on top of the 5% for the Open Collective platform). This is to cover the administrative overhead, accounting, legal. That way you never have to worry about all that boring stuff and you can focus on your project."
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
              defaultMessage="In order to provide fiscal sponsorship to a project, we need to ensure that there is a community around that repo. If you already have a legal entity (or know a legal entity that could host your collective), then you could directly host your collective independently. Please use this form to create a self hosted collective: opencollective.com/create and select 'Other'. Note that in that case you will be responsible for doing the accounting as well as facilitating payments from sponsors."
            />
          </Content>
        </Entry>
      </Container>
    )}
  </FAQ>
);

export default GithubRepositoriesFAQ;
