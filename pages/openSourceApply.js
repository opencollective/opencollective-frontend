import React, { Component } from 'react';
import { FormattedMessage, defineMessages, injectIntl } from 'react-intl';
import PropTypes from 'prop-types';
import { Flex, Box } from '@rebass/grid';
import { URLSearchParams } from 'universal-url';

import Page from '../components/Page';
import Loading from '../components/Loading';
import Container from '../components/Container';
import { withUser } from '../components/UserProvider';
import { addCreateCollectiveFromGithubMutation } from '../lib/graphql/mutations';
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
import { getWebsiteUrl, getErrorFromGraphqlException } from '../lib/utils';
import { LOCAL_STORAGE_KEYS, getFromLocalStorage } from '../lib/local-storage';

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
    refetchLoggedInUser: PropTypes.func,
    createCollectiveFromGithub: PropTypes.func,
    intl: PropTypes.object.isRequired,
  };

  constructor(props) {
    super(props);
    this.messages = defineMessages({
      guidelines: { id: 'openSourceApply.guidelines', defaultMessage: 'guidelines' },
    });
  }

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
      const repositories = await getGithubRepos(token);
      if (repositories.length !== 0) {
        this.setState({ repositories, loadingRepos: false, result: {} });
      } else {
        this.setState({
          loadingRepos: false,
          result: {
            type: 'info',
            mesg: "We couldn't find any repositories (with >= 100 stars) linked to this account",
          },
        });
      }
    } catch (error) {
      this.setState({
        loadingRepos: false,
        result: { type: 'error', mesg: error.toString() },
      });
    }
  }

  renderContent() {
    const { token, LoggedInUser } = this.props;
    const { repositories } = this.state;

    if (!LoggedInUser) {
      return <SignInOrJoinFree />;
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
      await this.props.refetchLoggedInUser();
      Router.pushRoute('collective', {
        slug: collective.slug,
        status: 'collectiveCreated',
      });
    } catch (err) {
      console.error('>>> createCollective error: ', JSON.stringify(err)); // TODO - Remove
      const errorMsg = getErrorFromGraphqlException(err).message;
      this.setState({
        creatingCollective: false,
        result: { type: 'error', mesg: errorMsg },
      });
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
              defaultMessage="Select the project you wish to create a Collective for. Only repositories with at least 100 stars are eligible."
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

  getGithubConnectUrl() {
    const urlParams = new URLSearchParams({ redirect: `${getWebsiteUrl()}/opensource/apply` });
    const accessToken = getFromLocalStorage(LOCAL_STORAGE_KEYS.ACCESS_TOKEN);

    if (accessToken) {
      urlParams.set('access_token', accessToken);
    }

    return `/api/connected-accounts/github?${urlParams.toString()}`;
  }

  renderConnectGithubButton() {
    const { intl } = this.props;
    return (
      <StyledCard minWidth={400} maxWidth={500} border="none" minHeight={350} p={4} textAlign="center">
        <H3 mb={2}>
          <FormattedMessage id="openSourceApply.title" defaultMessage="For Open Source Projects" />
        </H3>
        <P mb={4}>
          <FormattedMessage
            id="openSourceApply.description.p1"
            defaultMessage="You're creating software. You don't want to worry about creating a legal entity or seperate bank account, paying taxes, or providing invoices to sponsors. Let us take care of all that, so you can stay focused on your project."
          />
        </P>
        <P mb={4}>
          <FormattedMessage
            id="openSourceApply.description.p2"
            defaultMessage="We have created the {osclink}, a non-profit umbrella organization, to serve the open source community. To join, you need at least 100 stars on Github (or other equivilant evidence of your project's validity), and to respect our {communityguidelineslink}."
            values={{
              osclink: <a href="https://opencollective.com/opensource">Open Source Collective 501c6</a>,
              communityguidelineslink: (
                <a href="https://docs.opencollective.com/help/the-open-collective-way/community-guidelines">
                  {intl.formatMessage(this.messages['guidelines'])}
                </a>
              ),
            }}
          />
        </P>
        <P mb={4}>
          <FormattedMessage
            id="openSourceApply.description.p3"
            defaultMessage="Fees: 10% of funds raised. Half goes to Open Collective Inc to continue improving the software platform, and half to the Open Source Collective to cover its legal and financial services."
          />
        </P>
        <P mb={4}>
          <FormattedMessage id="openSourceApply.description.p4" defaultMessage="Join us!" />
        </P>
        <StyledButton
          textAlign="center"
          buttonSize="large"
          buttonStyle="primary"
          onClick={() => {
            window.location.replace(this.getGithubConnectUrl());
          }}
          loading={this.state.loadingRepos}
          disabled={this.state.loadingRepos}
        >
          <FormattedMessage id="openSourceApply.GetStarted" defaultMessage="Get started" />
        </StyledButton>
      </StyledCard>
    );
  }

  render() {
    const { loadingLoggedInUser } = this.props;
    const { result } = this.state;
    return (
      <Page title="Sign up GitHub repository">
        <Flex alignItems="center" flexDirection="column" mx="auto" pt={4} my={4}>
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

export default injectIntl(withUser(addCreateCollectiveFromGithubMutation(OpenSourceApplyPage)));
