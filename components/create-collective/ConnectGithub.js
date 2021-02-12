import React from 'react';
import PropTypes from 'prop-types';
import themeGet from '@styled-system/theme-get';
import NextLink from 'next/link';
import { withRouter } from 'next/router';
import { FormattedMessage } from 'react-intl';
import styled from 'styled-components';

import { getGithubRepos } from '../../lib/api';

import GithubRepositoriesFAQ from '../faqs/GithubRepositoriesFAQ';
import { Box, Flex } from '../Grid';
import Loading from '../Loading';
import MessageBox from '../MessageBox';
import StyledButton from '../StyledButton';
import StyledInputField from '../StyledInputField';
import StyledLink from '../StyledLink';
import { H1, P } from '../Text';

import GithubRepositories from './GithubRepositories';

const BackButton = styled(StyledButton)`
  color: ${themeGet('colors.black.600')};
  font-size: 14px;
`;

class ConnectGithub extends React.Component {
  static propTypes = {
    router: PropTypes.object.isRequired,
    updateGithubInfo: PropTypes.func.isRequired,
  };

  constructor(props) {
    super(props);

    this.state = {
      loadingRepos: false,
      repositories: [],
      error: null,
    };
  }

  async componentDidMount() {
    this.setState({ loadingRepos: true });

    try {
      const repositories = await getGithubRepos(this.props.router.query.token);
      if (repositories.length !== 0) {
        this.setState({ repositories, loadingRepos: false });
      } else {
        this.setState({
          loadingRepos: false,
          error: "We couldn't find any repositories with at least 100 stars linked to this account",
        });
      }
    } catch (error) {
      this.setState({
        loadingRepos: false,
        error: error.toString(),
      });
    }
  }

  changeRoute = async params => {
    params = {
      ...params,
      verb: this.props.router.query.verb,
      hostCollectiveSlug: this.props.router.query.hostCollectiveSlug || undefined,
    };
    await this.props.router.push({ pathname: 'create-collective', query: params });
    window.scrollTo(0, 0);
  };

  render() {
    const { repositories, loadingRepos, error } = this.state;

    return (
      <Flex flexDirection="column" m={[3, 0]} mb={4}>
        <Flex flexDirection="column" my={[2, 4]}>
          <Box textAlign="left" minHeight="32px" marginLeft={['none', '224px']}>
            <BackButton asLink onClick={() => window && window.history.back()}>
              ←&nbsp;
              <FormattedMessage id="Back" defaultMessage="Back" />
            </BackButton>
          </Box>
          <Box mb={[2, 3]}>
            <H1
              fontSize={['20px', '32px']}
              lineHeight={['24px', '36px']}
              fontWeight="bold"
              textAlign="center"
              color="black.900"
              data-cy="connect-github-header"
            >
              <FormattedMessage id="openSourceApply.GithubRepositories.title" defaultMessage="Pick a repository" />
            </H1>
          </Box>
          <Box textAlign="center" minHeight="24px">
            <P fontSize="16px" color="black.600" mb={2}>
              <FormattedMessage
                id="collective.subtitle.seeRepo"
                defaultMessage="Don't see the repository you're looking for? {helplink}."
                values={{
                  helplink: (
                    <StyledLink href="https://docs.opencollective.com/help/collectives/osc-verification" openInNewTab>
                      <FormattedMessage id="getHelp" defaultMessage="Get help" />
                    </StyledLink>
                  ),
                }}
              />
            </P>
            <P fontSize="16px" color="black.600" mb={2}>
              <FormattedMessage
                id="collective.subtitle.altVerification"
                defaultMessage="Want to apply using {altverification}? {applylink}."
                values={{
                  applylink: (
                    <NextLink href={{ pathname: `opensource/apply/form`, query: { hostTos: true } }}>
                      <FormattedMessage id="clickHere" defaultMessage="Click here" />
                    </NextLink>
                  ),
                  altverification: (
                    <StyledLink href="https://www.oscollective.org/#criteria" openInNewTab>
                      <FormattedMessage
                        id="alternativeVerificationCriteria"
                        defaultMessage="alternative verification criteria"
                      />
                    </StyledLink>
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
                    submitGithubInfo={githubInfo => {
                      this.props.updateGithubInfo(githubInfo);
                      this.changeRoute({ category: 'opensource', step: 'form' });
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
      </Flex>
    );
  }
}

export default withRouter(ConnectGithub);
