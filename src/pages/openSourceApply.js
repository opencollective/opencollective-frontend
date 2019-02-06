import React from 'react';
import PropTypes from 'prop-types';

import Page from '../components/Page';
import Loading from '../components/Loading';
import { withUser } from '../components/UserProvider';
import { Flex } from '@rebass/grid';
import StyledCard from '../components/StyledCard';
import { H3, P } from '../components/Text';
import StyledLink from '../components/StyledLink';
import GithubRepositories from '../components/GithubRepositories';
import StyledInputField from '../components/StyledInputField';
// import { getGithubRepos } from '../lib/api';

const { WEBSITE_URL } = process.env;

const repositoriesDummy = [
  {
    description: 'Adblock Plus browser extension',
    fork: true,
    full_name: 'flickz/adblockpluschrome',
    name: 'adblockpluschrome',
    owner: { login: 'flickz', type: 'Organization' },
    stargazers_count: 113,
  },
  {
    description:
      'A new form of association, transparent by design. Please report issues there. Feature requests and ideas welcome!',
    fork: true,
    full_name: 'flickz/jobtweets',
    name: 'JobTweets',
    owner: { login: 'flickz', type: 'User' },
    stargazers_count: 103,
  },
];

class OpenSourceApplyPage extends React.Component {
  static async getInitialProps({ query }) {
    return {
      token: query && query.token,
    };
  }

  static propTypes = {
    token: PropTypes.string,
    loadingLoggedInUser: PropTypes.bool,
    LoggedInUser: PropTypes.object,
  };

  state = {
    error: null,
    loadingGithub: false,
    repositories: [],
  };

  componentDidMount() {
    const { token } = this.props;
    if (!token) {
      return;
    }
    this.setState({
      repositories: repositoriesDummy,
    });
    // getGithubRepos(token)
    //   .then(repos => {
    //     console.log(repos);
    //   })
    //   .catch(err => {
    //     console.log(err);
    //   });
  }

  renderContent() {
    const { token, LoggedInUser } = this.props;
    if (!LoggedInUser) {
      return;
    } else if (!token) {
      return this.renderConnectGithubButton();
    } else {
      return this.renderGithubRepos();
    }
  }

  renderGithubRepos() {
    const { repositories } = this.state;
    if (repositories.length !== 0) {
      return (
        <StyledInputField htmlFor="collective">
          {fieldProps => (
            <GithubRepositories
              {...fieldProps}
              repositories={repositories}
              onCreateCollective={data => {
                console.log(data);
              }}
            />
          )}
        </StyledInputField>
      );
    }
  }

  renderConnectGithubButton() {
    const connectUrl = `/api/connected-accounts/github?redirect=${WEBSITE_URL}/opensource/apply`;
    return (
      <StyledCard minWidth={400} maxWidth={500} border="none" minHeight={350} mb={4} mt={4} p={4} textAlign="center">
        <H3 mb={4}>For Open Source projects</H3>
        <P mb={4}>
          You need a Github account and a repository with over 100 stars. If you run into trouble, file an issue in our
          Github Issues section.
        </P>
        <StyledLink href={connectUrl} textAlign="center" buttonSize="large" buttonStyle="primary" my={4}>
          Get started
        </StyledLink>
      </StyledCard>
    );
  }

  render() {
    const { loadingLoggedInUser } = this.props;
    return (
      <Page>
        <Flex alignItems="center" flexDirection="column" mx="auto" width={300} pt={4} mb={4}>
          {loadingLoggedInUser ? <Loading /> : this.renderContent()}
        </Flex>
      </Page>
    );
  }
}

export default withUser(OpenSourceApplyPage);
