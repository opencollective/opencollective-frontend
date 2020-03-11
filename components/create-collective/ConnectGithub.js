import React, { Fragment } from 'react';
import PropTypes from 'prop-types';
import { Flex, Box } from '@rebass/grid';
import { URLSearchParams } from 'universal-url';
import { FormattedMessage, defineMessages, injectIntl } from 'react-intl';
import themeGet from '@styled-system/theme-get';
import styled from 'styled-components';

import StyledButton from '../StyledButton';
import StyledCheckbox from '../StyledCheckbox';
import { P, H1 } from '../Text';
import GithubRepositories from './GithubRepositories';
import StyledInputField from '../StyledInputField';
import Loading from '../Loading';
import GithubRepositoriesFAQ from '../faqs/GithubRepositoriesFAQ';
import { withUser } from '../UserProvider';
import MessageBox from '../MessageBox';
import Link from '../Link';
import ExternalLink from '../ExternalLink';

import { Router } from '../../server/pages';
import { getGithubRepos } from '../../lib/api';
import { getWebsiteUrl } from '../../lib/utils';
import { LOCAL_STORAGE_KEYS, getFromLocalStorage } from '../../lib/local-storage';

const BackButton = styled(StyledButton)`
  color: ${themeGet('colors.black.600')};
  font-size: ${themeGet('fontSizes.Paragraph')}px;
`;

class ConnectGithub extends React.Component {
  static propTypes = {
    query: PropTypes.object,
    token: PropTypes.string,
    loadingLoggedInUser: PropTypes.bool,
    LoggedInUser: PropTypes.object,
    refetchLoggedInUser: PropTypes.func,
    createCollectiveFromGithub: PropTypes.func,
    intl: PropTypes.object.isRequired,
    onChange: PropTypes.func.isRequired,
  };

  constructor(props) {
    super(props);
    this.handleChange = this.handleChange.bind(this);
    this.messages = defineMessages({
      header: { id: 'home.create', defaultMessage: 'Create a Collective' },
      openSourceSubtitle: {
        id: 'collective.subtitle.opensource',
        defaultMessage: 'Open source projects are invited to join the Open Source Collective fiscal host.',
      },
      repoHeader: {
        id: 'openSourceApply.GithubRepositories.title',
        defaultMessage: 'Pick a repository',
      },
      back: {
        id: 'Back',
        defaultMessage: 'Back',
      },
    });
    this.state = {
      loadingRepos: false,
      repositories: [],
      checked: false,
      error: null,
    };
  }

  async componentDidMount() {
    const { token } = this.props;
    if (!token) {
      return;
    }
    this.setState({ loadingRepos: true });

    try {
      const repositories = await getGithubRepos(token);
      if (repositories.length !== 0) {
        this.setState({ repositories, loadingRepos: false });
      } else {
        this.setState({
          loadingRepos: false,
          error: "We couldn't find any repositories (with >= 100 stars) linked to this account",
        });
      }
    } catch (error) {
      this.setState({
        loadingRepos: false,
        error: error.toString(),
      });
    }
  }

  handleChange(fieldname, value) {
    this.props.onChange(fieldname, value);
  }

  changeRoute = async params => {
    params = {
      ...params,
      verb: this.props.query.verb,
      hostCollectiveSlug: this.props.query.hostCollectiveSlug || undefined,
    };
    await Router.pushRoute('new-create-collective', params);
    window.scrollTo(0, 0);
  };

  getGithubConnectUrl() {
    const urlParams = new URLSearchParams({
      context: 'createCollective',
      redirect: `${getWebsiteUrl()}/create/v2/opensource`,
    });
    const accessToken = getFromLocalStorage(LOCAL_STORAGE_KEYS.ACCESS_TOKEN);

    if (accessToken) {
      urlParams.set('access_token', accessToken);
    }

    return `/api/connected-accounts/github?${urlParams.toString()}`;
  }

  render() {
    const { token, intl } = this.props;
    const { repositories, loadingRepos, error } = this.state;

    const FISCAL_SPONSOR_TERMS =
      'https://docs.google.com/document/u/1/d/e/2PACX-1vQbiyK2Fe0jLdh4vb9BfHY4bJ1LCo4Qvy0jg9P29ZkiC8y_vKJ_1fNgIbV0p6UdvbcT8Ql1gVto8bf9/pub';

    return (
      <Flex flexDirection="column" m={[3, 0]} mb={[4]}>
        {token && (
          <Fragment>
            <Flex flexDirection="column" my={[2, 4]}>
              <Box textAlign="left" minHeight={['32px']} marginLeft={['none', '224px']}>
                <BackButton asLink onClick={() => window && window.history.back()}>
                  ←&nbsp;{intl.formatMessage(this.messages.back)}
                </BackButton>
              </Box>
              <Box mb={[2, 3]}>
                <H1
                  fontSize={['H5', 'H3']}
                  lineHeight={['H5', 'H3']}
                  fontWeight="bold"
                  textAlign="center"
                  color="black.900"
                >
                  {intl.formatMessage(this.messages.repoHeader)}
                </H1>
              </Box>
              <Box textAlign="center" minHeight={['24px']}>
                <P fontSize="LeadParagraph" color="black.600" mb={2}>
                  <FormattedMessage
                    id="collective.subtitle.seeRepo"
                    defaultMessage="Don't see the repository you're looking for? {helplink}."
                    values={{
                      helplink: (
                        <ExternalLink
                          href="https://docs.opencollective.com/help/collectives/osc-verification"
                          openInNewTab
                        >
                          <FormattedMessage id="getHelp" defaultMessage="Get help" />
                        </ExternalLink>
                      ),
                    }}
                  />
                </P>
                <P fontSize="LeadParagraph" color="black.600" mb={2}>
                  <FormattedMessage
                    id="collective.subtitle.altVerification"
                    defaultMessage="Want to apply using {altverification}? {applylink}."
                    values={{
                      applylink: (
                        <Link
                          route="new-create-collective"
                          params={{
                            hostCollectiveSlug: 'opensource',
                            verb: 'apply',
                            step: 'form',
                            hostTos: true,
                          }}
                        >
                          <FormattedMessage id="clickHere" defaultMessage="Click here" />
                        </Link>
                      ),
                      altverification: (
                        <ExternalLink href="https://www.oscollective.org/#criteria" openInNewTab>
                          <FormattedMessage
                            id="alternativeVerificationCriteria"
                            defaultMessage="alternative verification criteria"
                          />
                        </ExternalLink>
                      ),
                    }}
                  />
                </P>
              </Box>
            </Flex>
            {error && (
              <Flex alignItems="center" justifyContent="center">
                <MessageBox type="error" withIcon mb={[1, 3]}>
                  {error}
                </MessageBox>
              </Flex>
            )}
            {loadingRepos && <Loading />}
            {repositories.length !== 0 && (
              <Flex justifyContent="center" width={1} mb={4} flexDirection={['column', 'row']}>
                <Box width={1 / 5} display={['none', null, 'block']} />
                <Box maxWidth={[400, 500]} minWidth={[300, 400]} alignSelf={['center', 'none']}>
                  <StyledInputField htmlFor="collective">
                    {fieldProps => (
                      <GithubRepositories
                        {...fieldProps}
                        repositories={repositories}
                        sendRepoInfo={info => {
                          this.handleChange('github', info);
                          this.changeRoute({
                            category: 'opensource',
                            step: 'form',
                          });
                          this.handleChange('category', 'opensource');
                        }}
                      />
                    )}
                  </StyledInputField>
                </Box>
                <GithubRepositoriesFAQ
                  mt={4}
                  ml={[0, 4]}
                  display={['block', null, 'block']}
                  width={[1, 1 / 5]}
                  maxWidth={[250, null, 335]}
                  alignSelf={['center', 'none']}
                />
              </Flex>
            )}
          </Fragment>
        )}
        {!token && (
          <Fragment>
            <Flex flexDirection="column" my={[2, 4]}>
              <Box textAlign="left" minHeight={['32px']} marginLeft={['none', '224px']}>
                <BackButton asLink onClick={() => window && window.history.back()}>
                  ←&nbsp;{intl.formatMessage(this.messages.back)}
                </BackButton>
              </Box>
              <Box mb={[2, 3]}>
                <H1
                  fontSize={['H5', 'H3']}
                  lineHeight={['H5', 'H3']}
                  fontWeight="bold"
                  textAlign="center"
                  color="black.900"
                >
                  {intl.formatMessage(this.messages.header)}
                </H1>
              </Box>
              <Box textAlign="center" minHeight={['24px']}>
                <P fontSize="LeadParagraph" color="black.600" mb={2}>
                  {intl.formatMessage(this.messages.openSourceSubtitle)}
                </P>
              </Box>
            </Flex>
            {error && (
              <Flex alignItems="center" justifyContent="center">
                <MessageBox type="error" withIcon mb={[1, 3]}>
                  {error}
                </MessageBox>
              </Flex>
            )}
            <Flex alignItems="center" justifyContent="center">
              <Box mb={[1, 5]} minWidth={['300px', '576px']} maxWidth={[288, 608, 576]} px={[1, 4]}>
                <P mb={3}>
                  <FormattedMessage
                    id="createcollective.opensource.p1"
                    defaultMessage="You're creating software. You don't want to worry about creating a legal entity or seperate bank account, paying taxes, or providing invoices to sponsors. Let us take care of all that, so you can stay focused on your project."
                  />
                </P>
                <P mb={3}>
                  <FormattedMessage
                    id="createcollective.opensource.p2"
                    defaultMessage="We have created the {osclink}, a non-profit umbrella organization, to serve the open source community. To join, you need at least 100 stars on Github or meet our {criterialink}."
                    values={{
                      osclink: (
                        <ExternalLink href="https://opencollective.com/opensource" openInNewTab>
                          <FormattedMessage
                            id="OpenSourceCollective501c6"
                            defaultMessage="Open Source Collective 501c6"
                          />
                        </ExternalLink>
                      ),
                      criterialink: (
                        <ExternalLink href="https://www.oscollective.org/#criteria" openInNewTab>
                          <FormattedMessage
                            id="alternativeVerificationCriteria"
                            defaultMessage="alternative verification criteria"
                          />
                        </ExternalLink>
                      ),
                    }}
                  />
                </P>
                <P mb={3}>
                  <FormattedMessage id="createcollective.opensource.p3" defaultMessage="Fees: 10% of funds raised." />
                </P>
                <P mb={3}>
                  <FormattedMessage
                    id="createcollective.opensource.p4"
                    defaultMessage="Our fees cover operating costs like accounting, payments, tax reporting, invoices, legal liability, use of the Open Collective Platform, and providing support. We also run a range of initiatives for our mission of supporting a sustainable and healthy open source ecosystem. Learn more on our website. Join us!"
                  />
                </P>

                <Box mx={1} my={4}>
                  <StyledCheckbox
                    name="tos"
                    label={
                      <FormattedMessage
                        id="createcollective.opensourcetos.label"
                        defaultMessage="I agree with the {toslink}."
                        values={{
                          toslink: (
                            <ExternalLink href={FISCAL_SPONSOR_TERMS} openInNewTab>
                              <FormattedMessage id="fiscaltos" defaultMessage="terms of fiscal sponsorship" />
                            </ExternalLink>
                          ),
                        }}
                      />
                    }
                    required
                    checked={this.state.checked}
                    onChange={({ checked }) => {
                      this.setState({ checked });
                    }}
                  />
                </Box>
                <Flex justifyContent="center" alignItems="center" flexDirection={['column', 'row']}>
                  <StyledButton
                    mx={2}
                    mb={[3, 0]}
                    px={[2, 3]}
                    textAlign="center"
                    fontSize="13px"
                    width="196px"
                    buttonStyle="primary"
                    onClick={() => {
                      if (!this.state.checked) {
                        this.setState({ error: 'Please accept the terms of fiscal sponsorship' });
                      } else {
                        window.location.replace(this.getGithubConnectUrl());
                      }
                    }}
                    loading={this.state.loadingRepos}
                    disabled={this.state.loadingRepos}
                  >
                    <FormattedMessage
                      id="createcollective.opensource.VerifyStars"
                      defaultMessage="Verify using GitHub stars"
                    />
                  </StyledButton>
                  <Link
                    route="new-create-collective"
                    params={{
                      hostCollectiveSlug: 'opensource',
                      verb: 'apply',
                      step: 'form',
                      hostTos: true,
                    }}
                    onClick={e => {
                      if (!this.state.checked) {
                        e.preventDefault();
                        this.setState({ error: 'Please accept the terms of fiscal sponsorship' });
                      }
                    }}
                  >
                    <StyledButton
                      textAlign="center"
                      fontSize="13px"
                      width="213px"
                      buttonStyle="secondary"
                      mx={2}
                      px={[2, 3]}
                    >
                      <FormattedMessage
                        id="createcollective.opensource.ManualVerification"
                        defaultMessage="Request manual verification"
                      />
                    </StyledButton>
                  </Link>
                </Flex>
              </Box>
            </Flex>
          </Fragment>
        )}
      </Flex>
    );
  }
}

export default injectIntl(withUser(ConnectGithub));
