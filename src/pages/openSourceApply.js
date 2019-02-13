import React, { Component } from 'react';
import { FormattedMessage } from 'react-intl';
import PropTypes from 'prop-types';
import { Flex, Box } from '@rebass/grid';

import Page from '../components/Page';
import Loading from '../components/Loading';
import Container from '../components/Container';
import { withUser } from '../components/UserProvider';
import withIntl from '../lib/withIntl';
import { addCreateCollectiveFromGithubMutation } from '../graphql/mutations';
import StyledCard from '../components/StyledCard';
import { H3, P, H2 } from '../components/Text';
import StyledButton from '../components/StyledButton';
import GithubRepositories from '../components/GithubRepositories';
import StyledInputField from '../components/StyledInputField';
import MessageBox from '../components/MessageBox';
import SignInOrJoinFree from '../components/SignInOrJoinFree';
import GithubRepositoriesFAQ from '../components/faqs/GithubRepositoriesFAQ';
import { Router } from '../server/pages';

import { getGithubRepos } from '../lib/api';
import { getBrowserWebsiteUrl } from '../lib/utils';

const MIN_REPO_STARS = 100;

class OpenSourceApplyPage extends Component {
  static async getInitialProps({ query }) {
    return {
      token: query && query.token,
    };
  }

  static propTypes = {
    token: PropTypes.string,
    loadingLoggedInUser: PropTypes.bool,
    LoggedInUser: PropTypes.object,
    createCollectiveFromGithub: PropTypes.func,
  };

  state = {
    result: {},
    loadingRepos: false,
    repositories: [],
    creatingCollective: false,
  };

  async componentDidMount() {
    const { token } = this.props;
    if (!token) {
      return;
    }
    this.setState({ loadingRepos: true });

    try {
      const repositories = await getGithubRepos(token).then(repositories =>
        repositories.filter(repo => repo.stargazers_count >= MIN_REPO_STARS),
      );
      if (repositories.length !== 0) {
        this.setState({ repositories, loadingRepos: false, result: {} });
      } else {
        this.setState({
          loadingRepos: false,
          result: { type: 'info', mesg: 'Info: No Repository found' },
        });
      }
    } catch (error) {
      this.setState({
        loadingRepos: false,
        result: { type: 'error', mesg: 'Error: An unknown error occured' },
      });
    }
  }

  renderContent() {
    const { token, LoggedInUser } = this.props;
    const { repositories } = this.state;

    if (!LoggedInUser) {
      return <SignInOrJoinFree redirect={Router.asPath} />;
    } else if (!token || repositories.length === 0) {
      return this.renderConnectGithubButton();
    } else {
      return this.renderGithubRepos();
    }
  }

  async createCollectives(collectiveInputType) {
    collectiveInputType.type = 'COLLECTIVE';
    try {
      const res = await this.props.createCollectiveFromGithub(collectiveInputType);
      const collective = res.data.createCollectiveFromGithub;
      Router.pushRoute('collective', {
        slug: collective.slug,
        status: 'collectiveCreated',
      });
    } catch (err) {
      console.error('>>> createCollective error: ', JSON.stringify(err)); // TODO - Remove
      const errorMsg = err.graphQLErrors && err.graphQLErrors[0] ? err.graphQLErrors[0].message : err.message;
      this.setState({
        creatingCollective: false,
        result: { type: 'error', mesg: errorMsg },
      });
      // throw new Error(errorMsg);
    }
  }

  renderGithubRepos() {
    const { repositories, creatingCollective } = this.state;
    if (repositories.length !== 0) {
      return (
        <Container maxWidth={500} mb={4} mr={4}>
          <H2 textAlign="center" mb={3} fontSize="3.2rem">
            <FormattedMessage id="openSourceApply.GithubRepositories.title" defaultMessage="Pick a repository" />
          </H2>
          <P textAlign="center" fontSize="1.6rem" mb={4} color="black.400">
            <FormattedMessage
              id="openSourceApply.GithubRepositories.description"
              defaultMessage="Select a project you wish to create a collective for. Only repositories with at least 100 stars are eligible."
            />
          </P>
          <Container display="flex">
            <StyledInputField htmlFor="collective">
              {fieldProps => (
                <GithubRepositories
                  {...fieldProps}
                  repositories={repositories}
                  creatingCollective={creatingCollective}
                  onCreateCollective={data => {
                    this.setState({ creatingCollective: true });
                    this.createCollectives(data);
                  }}
                />
              )}
            </StyledInputField>
            <Container ml={4}>
              <GithubRepositoriesFAQ mt={4} display={['none', null, 'block']} width={1 / 5} minWidth="335px" />
            </Container>
          </Container>
        </Container>
      );
    }
  }

  renderConnectGithubButton() {
    const connectUrl = `/api/connected-accounts/github?redirect=${getBrowserWebsiteUrl()}/opensource/apply`;
    return (
      <StyledCard minWidth={400} maxWidth={500} border="none" minHeight={350} p={4} textAlign="center">
        <H3 mb={2}>
          <FormattedMessage id="openSourceApply.title" defaultMessage="For Open Source projects" />
        </H3>
        <P mb={4}>
          <FormattedMessage
            id="openSourceApply.description"
            defaultMessage="You need a Github account and a repository with over 100 stars. If you run into trouble, file an issue in our
            Github Issues section."
          />
        </P>
        <StyledButton
          textAlign="center"
          buttonSize="large"
          buttonStyle="primary"
          onClick={() => {
            window.location.replace(connectUrl);
          }}
          loading={this.state.loadingRepos}
          disabled={this.state.loadingRepos}
        >
          Get started
        </StyledButton>
      </StyledCard>
    );
  }

  render() {
    const { loadingLoggedInUser } = this.props;
    const { result } = this.state;
    return (
      <Page title="Sign up GitHub repository">
        <Flex alignItems="center" flexDirection="column" mx="auto" maxWidth={500} pt={4} my={4}>
          {result.mesg && (
            <Box mb={2}>
              <MessageBox withIcon type={result.type}>
                {result.mesg}
              </MessageBox>
            </Box>
          )}
          {loadingLoggedInUser ? <Loading /> : this.renderContent()}
        </Flex>
      </Page>
    );
  }
}

export default withIntl(withUser(addCreateCollectiveFromGithubMutation(OpenSourceApplyPage)));
