import React, { Component } from 'react';
import { graphql } from '@apollo/client/react/hoc';
import type { Router } from 'next/router';
import { withRouter } from 'next/router';
import type { IntlShape } from 'react-intl';
import { FormattedMessage } from 'react-intl';

import { IGNORED_TAGS } from '../../lib/constants/collectives';
import { i18nGraphqlException } from '../../lib/errors';
import { gql } from '../../lib/graphql/helpers';
import { compose } from '../../lib/utils';
import injectIntl from '@/lib/injectIntl';

import { Box, Flex } from '../Grid';
import MessageBox from '../MessageBox';
import SignInOrJoinFree from '../SignInOrJoinFree';
import { H1 } from '../Text';
import { withUser } from '../UserProvider';

import CollectiveCategoryPicker from './CollectiveCategoryPicker';
import CreateCollectiveForm from './CreateCollectiveForm';

type CreateCollectiveHost = {
  slug: string;
  name?: string;
  isOpenToApplications?: boolean;
};

type CreateCollectiveValues = {
  name: string;
  description: string;
  slug: string;
  tags?: string[];
  location?: unknown;
  message?: string;
  inviteMembers?: Array<{ memberAccount: { id: number | string } }>;
};

type CreateCollectiveProps = {
  host?: CreateCollectiveHost;
  /** @ignore from injectIntl */
  intl?: IntlShape;
  /** from withUser */
  LoggedInUser?: Record<string, unknown>;
  /** from withUser */
  refetchLoggedInUser?: () => Promise<unknown>;
  /** from withRouter */
  router: Router;
  /** addCreateCollectiveMutation */
  createCollective?: (options: {
    variables: {
      collective: CreateCollectiveValues;
      host: { slug: string } | null;
      message?: string;
      inviteMembers?: Array<{ memberAccount: { legacyId: number | string } }>;
    };
  }) => Promise<{ data: { createCollective: { slug: string; legacyId: number } } }>;
  /** from addTagStatsQuery */
  data?: { tagStats?: { nodes?: Array<{ tag: string }> } };
};

type CreateCollectiveState = {
  error: string | null;
  creating: boolean;
};

class CreateCollective extends Component<CreateCollectiveProps, CreateCollectiveState> {
  constructor(props: CreateCollectiveProps) {
    super(props);

    this.state = {
      error: null,
      creating: false,
    };

    this.createCollective = this.createCollective.bind(this);
  }

  async createCollective({
    collective,
    message,
    inviteMembers,
  }: {
    collective: CreateCollectiveValues;
    message?: string;
    inviteMembers?: Array<{ memberAccount: { id: number | string } }>;
  }) {
    // set state to loading
    this.setState({ creating: true });

    // prepare object
    const category = this.props.router.query.category as string;
    collective.tags = collective.tags ? [...collective.tags, category] : [category];

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
    const tags = data?.tagStats?.nodes?.filter(node => !(IGNORED_TAGS as readonly string[]).includes(node.tag));
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
        // TODO: `handleChange` is not defined on this component (always `undefined`, see PLAN.md findings)
        onChange={undefined}
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

const createCollectiveTagStatsQuery = gql`
  query CreateCollectiveTagStats($host: AccountReferenceInput) {
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
});

const addTagStatsQuery = graphql(createCollectiveTagStatsQuery, {
  options: (props: { host?: CreateCollectiveHost }) => {
    return {
      variables: {
        host: props.host ? { slug: props.host.slug } : undefined,
      },
    };
  },
});

const addGraphql = compose(addCreateCollectiveMutation, addTagStatsQuery);

export default withRouter(withUser(addGraphql(injectIntl(CreateCollective))));
