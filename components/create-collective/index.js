import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { gql } from '@apollo/client';
import { graphql } from '@apollo/client/react/hoc';
import { withRouter } from 'next/router';
import { FormattedMessage, injectIntl } from 'react-intl';

import { IGNORED_TAGS } from '../../lib/constants/collectives';
import { i18nGraphqlException } from '../../lib/errors';
import { API_V2_CONTEXT } from '../../lib/graphql/helpers';

import { Box, Flex } from '../Grid';
import MessageBox from '../MessageBox';
import SignInOrJoinFree from '../SignInOrJoinFree';
import { H1 } from '../Text';
import { withUser } from '../UserProvider';

import CollectiveCategoryPicker from './CollectiveCategoryPicker';
import CreateCollectiveForm from './CreateCollectiveForm';

class CreateCollective extends Component {
  static propTypes = {
    host: PropTypes.object,
    intl: PropTypes.object,
    LoggedInUser: PropTypes.object, // from withUser
    refetchLoggedInUser: PropTypes.func.isRequired, // from withUser
    router: PropTypes.object.isRequired, // from withRouter
    createCollective: PropTypes.func.isRequired, // addCreateCollectiveMutation
    data: PropTypes.shape({
      // from addTagStatsQuery
      tagStats: PropTypes.shape({
        nodes: PropTypes.arrayOf(
          PropTypes.shape({
            tag: PropTypes.string,
          }),
        ),
      }),
    }),
  };

  constructor(props) {
    super(props);

    this.state = {
      error: null,
      creating: false,
    };

    this.createCollective = this.createCollective.bind(this);
  }

  async createCollective({ collective, message, inviteMembers }) {
    // set state to loading
    this.setState({ creating: true });

    // prepare object
    collective.tags = collective.tags
      ? [...collective.tags, this.props.router.query.category]
      : [this.props.router.query.category];

    // try mutation
    try {
      const res = await this.props.createCollective({
        variables: {
          collective,
          host: this.props.host ? { slug: this.props.host.slug } : null,
          message,
          inviteMembers: inviteMembers.map(invite => ({
            ...invite,
            memberAccount: { legacyId: invite.memberAccount.id },
          })),
        },
      });
      const newCollective = res.data.createCollective;
      await this.props.refetchLoggedInUser();
      this.props.router
        .push({
          pathname: `/${newCollective.slug}/onboarding`,
          query: {
            CollectiveId: newCollective.legacyId,
          },
        })
        .then(() => window.scrollTo(0, 0));
    } catch (err) {
      const errorMsg = i18nGraphqlException(this.props.intl, err);
      this.setState({ error: errorMsg, creating: false });
    }
  }

  render() {
    const { LoggedInUser, host, router, data } = this.props;
    const { error } = this.state;
    const { category } = router.query;
    const tags = data?.tagStats?.nodes?.filter(node => !IGNORED_TAGS.includes(node.tag));
    const popularTags = tags?.map(value => value.tag);

    if (host && !host.isOpenToApplications) {
      return (
        <Flex flexDirection="column" alignItems="center" mb={5} p={2}>
          <Flex flexDirection="column" p={4} mt={3}>
            <Box mb={3}>
              <H1 fontSize="32px" lineHeight="36px" fontWeight="bold" textAlign="center">
                <FormattedMessage id="home.create" defaultMessage="Create a Collective" />
              </H1>
            </Box>
          </Flex>
          <Flex alignItems="center" justifyContent="center">
            <MessageBox type="warning" withIcon mb={[1, 3]}>
              <FormattedMessage
                id="collectives.create.error.HostNotOpenToApplications"
                defaultMessage="This Fiscal Host is not open to applications"
              />
            </MessageBox>
          </Flex>
        </Flex>
      );
    }

    if (!LoggedInUser) {
      return (
        <Flex flexDirection="column" alignItems="center" mt={5} mb={5}>
          <MessageBox m={4} type="warning" withIcon>
            <FormattedMessage id="mustBeLoggedIn" defaultMessage="You must be logged in to see this page" />
          </MessageBox>
          <SignInOrJoinFree createProfileTabs={['personal']} />
        </Flex>
      );
    }

    if (!host && !category) {
      return <CollectiveCategoryPicker />;
    }

    return (
      <CreateCollectiveForm
        host={host}
        onSubmit={this.createCollective}
        onChange={this.handleChange}
        loading={this.state.creating}
        error={error}
        popularTags={popularTags}
        loggedInUser={LoggedInUser}
      />
    );
  }
}

const createCollectiveMutation = gql`
  mutation CreateCollective(
    $collective: CollectiveCreateInput!
    $host: AccountReferenceInput
    $message: String
    $inviteMembers: [InviteMemberInput]
  ) {
    createCollective(collective: $collective, host: $host, message: $message, inviteMembers: $inviteMembers) {
      id
      name
      slug
      tags
      description
      githubHandle
      repositoryUrl
      legacyId
    }
  }
`;

const tagStatsQuery = gql`
  query TagStatsQuery($host: AccountReferenceInput) {
    tagStats(limit: 6, host: $host) {
      nodes {
        id
        tag
      }
    }
  }
`;

const addCreateCollectiveMutation = graphql(createCollectiveMutation, {
  name: 'createCollective',
  options: { context: API_V2_CONTEXT },
});

const addTagStatsQuery = graphql(tagStatsQuery, {
  options: props => {
    return {
      context: API_V2_CONTEXT,
      variables: {
        host: props.host ? { slug: props.host.slug } : undefined,
      },
    };
  },
});

export default withRouter(withUser(addCreateCollectiveMutation(addTagStatsQuery(injectIntl(CreateCollective)))));
