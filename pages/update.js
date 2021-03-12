import React from 'react';
import PropTypes from 'prop-types';
import { graphql, withApollo } from '@apollo/client/react/hoc';
import { cloneDeep, get, uniqBy, update } from 'lodash';

import { NAVBAR_CATEGORIES } from '../lib/collective-sections';
import { API_V2_CONTEXT, gqlV2 } from '../lib/graphql/helpers';

import CollectiveNavbar from '../components/collective-navbar';
import { Sections } from '../components/collective-page/_constants';
import { collectiveNavbarFieldsFragment } from '../components/collective-page/graphql/fragments';
import Container from '../components/Container';
import CommentForm from '../components/conversations/CommentForm';
import { commentFieldsFragment } from '../components/conversations/graphql';
import Thread from '../components/conversations/Thread';
import ErrorPage from '../components/ErrorPage';
import { Box, Flex } from '../components/Grid';
import CommentIcon from '../components/icons/CommentIcon';
import NotFound from '../components/NotFound';
import Page from '../components/Page';
import StyledUpdate from '../components/StyledUpdate';
import { withUser } from '../components/UserProvider';
import { stripHTML } from '../lib/utils';

class UpdatePage extends React.Component {
  static getInitialProps({ query: { collectiveSlug, updateSlug } }) {
    return { collectiveSlug, updateSlug };
  }

  static propTypes = {
    collectiveSlug: PropTypes.string, // for addCollectiveCoverData
    updateSlug: PropTypes.string,
    LoggedInUser: PropTypes.object, // from withUser
    client: PropTypes.object, // from withApollo
    data: PropTypes.shape({
      account: PropTypes.object,
      update: PropTypes.object,
      refetch: PropTypes.func,
    }).isRequired, // from withData
  };

  state = { isReloadingData: false };

  async componentDidUpdate(oldProps) {
    // Refetch data when use logs in
    if (oldProps.LoggedInUser !== this.props.LoggedInUser && !this.state.isReloadingData) {
      this.setState({ isReloadingData: true });
      try {
        await this.props.data.refetch();
      } finally {
        this.setState({ isReloadingData: false });
      }
    }
  }

  clonePageQueryCacheData() {
    const { client, updateSlug, collectiveSlug } = this.props;
    const variables = { collectiveSlug, updateSlug };
    const data = cloneDeep(client.readQuery({ query: updateQuery, variables }));
    return [data, updateQuery, variables];
  }

  onCommentAdded = comment => {
    // Add comment to cache if not already fetched
    const [data, query, variables] = this.clonePageQueryCacheData();
    update(data, 'update.comments.nodes', comments => uniqBy([...comments, comment], 'id'));
    this.props.client.writeQuery({ query, variables, data });
  };

  onCommentDeleted = comment => {
    const [data, query, variables] = this.clonePageQueryCacheData();
    update(data, 'update.comments.nodes', comments => comments.filter(c => c.id !== comment.id));
    this.props.client.writeQuery({ query, variables, data });
  };

  render() {
    const { data, LoggedInUser } = this.props;

    if (!data?.account) {
      return <ErrorPage data={data} />;
    } else if (!data.update) {
      return <NotFound />;
    }

    const { account, update } = data;
    const comments = get(update, 'comments.nodes', []);
    return (
      <Page collective={account}>
        <CollectiveNavbar
          collective={account}
          isAdmin={LoggedInUser && LoggedInUser.canEditCollective(account)}
          selected={Sections.UPDATES}
          selectedCategory={NAVBAR_CATEGORIES.CONNECT}
        />

        <Container py={4} maxWidth={1260} m="0 auto" px={[0, null, null, 4]}>
          <StyledUpdate
            key={update.id}
            collective={account}
            update={update}
            editable={Boolean(LoggedInUser?.canEditCollective(account))}
            LoggedInUser={LoggedInUser}
            compact={false}
            isReloadingData={this.state.isReloadingData}
          />
          {update.userCanSeeUpdate && (
            <Box pl={[0, 5]}>
              {comments.length > 0 && (
                <Container mb={3} pt={3} maxWidth={700} borderTop="1px solid #eee">
                  <Thread collective={account} items={comments} onCommentDeleted={this.onCommentDeleted} />
                </Container>
              )}
              {update.publishedAt && (
                <Flex mt="40px" maxWidth={700}>
                  <Box display={['none', null, 'block']} flex="0 0" p={3}>
                    <CommentIcon size={24} color="lightgrey" />
                  </Box>
                  <Box flex="1 1" maxWidth={[null, null, 'calc(100% - 56px)']}>
                    <CommentForm id="new-update" UpdateId={update.id} onSuccess={this.onCommentAdded} />
                  </Box>
                </Flex>
              )}
            </Box>
          )}
        </Container>
      </Page>
    );
  }
}

const updateQuery = gqlV2/* GraphQL */ `
  query Update($collectiveSlug: String, $updateSlug: String!) {
    account(slug: $collectiveSlug, throwIfMissing: false) {
      id
      slug
      name
      type
      description
      settings
      imageUrl
      twitterHandle
      features {
        ...NavbarFields
      }
      conversationsTags {
        id
        tag
      }
      ... on Collective {
        isApproved
      }
    }
    update(slug: $updateSlug, account: { slug: $collectiveSlug }) {
      id
      title
      createdAt
      publishedAt
      html
      summary
      isPrivate
      makePublicOn
      userCanSeeUpdate
      userCanPublishUpdate
      account {
        id
        slug
        type
        name
      }
      fromAccount {
        id
        slug
        type
        name
      }
      comments {
        nodes {
          ...CommentFields
        }
      }
    }
  }
  ${commentFieldsFragment}
  ${collectiveNavbarFieldsFragment}
`;

const getUpdate = graphql(updateQuery, {
  options: {
    context: API_V2_CONTEXT,
  },
});

export default withUser(getUpdate(withApollo(UpdatePage)));
