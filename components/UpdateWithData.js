import React from 'react';
import PropTypes from 'prop-types';
import { graphql, withApollo } from '@apollo/client/react/hoc';
import { cloneDeep, get, uniqBy, update } from 'lodash';
import { withRouter } from 'next/router';

import { API_V2_CONTEXT, gqlV2 } from '../lib/graphql/helpers';

import { collectiveNavbarFieldsFragment } from './collective-page/graphql/fragments';
import CommentForm from './conversations/CommentForm';
import { commentFieldsFragment } from './conversations/graphql';
import Thread from './conversations/Thread';
import CommentIcon from './icons/CommentIcon';
import { Box, Flex } from './Grid';
import Loading from './Loading';
import NotFound from './NotFound';
import StyledUpdate from './StyledUpdate';
import { withUser } from './UserProvider';

class UpdateWithData extends React.Component {
  static propTypes = {
    id: PropTypes.number.isRequired, // update.id
    editable: PropTypes.bool,
    data: PropTypes.object,
    client: PropTypes.object,
    updateSlug: PropTypes.string,
    collectiveSlug: PropTypes.string,
    /** @ignore from withUser */
    LoggedInUser: PropTypes.object,
    loadingLoggedInUser: PropTypes.bool,
  };

  constructor(props) {
    super(props);
    this.state = { isReloadingData: false };
  }

  async componentDidUpdate(oldProps) {
    if (
      oldProps.LoggedInUser !== this.props.LoggedInUser &&
      !get(this.props.data, 'update.userCanSeeUpdate') &&
      !this.state.isReloadingData
    ) {
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
    const { data, editable, LoggedInUser } = this.props;
    const collective = data && data.account;
    const comments = get(data, 'update.comments.nodes', []);
    if (data.loading) {
      return <Loading />;
    }
    const update = data.update;
    if (!update) {
      return <NotFound />;
    }

    return (
      <div className={'UpdateWithData'}>
        <StyledUpdate
          key={update.id}
          collective={collective}
          update={update}
          editable={editable}
          LoggedInUser={LoggedInUser}
          compact={false}
          isReloadingData={this.state.isReloadingData}
        />
        {update.userCanSeeUpdate && (
          <Box pl={[0, 5]}>
            {comments.length > 0 && (
              <Box mb={3} pt={3} maxWidth={800}>
                <Thread collective={collective} items={comments} onCommentDeleted={this.onCommentDeleted} />
              </Box>
            )}
            {update.publishedAt && (
              <Flex mt="40px" maxWidth={800}>
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
      </div>
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
      isPrivate
      makePublicOn
      userCanSeeUpdate
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

const getData = graphql(updateQuery, {
  options: {
    pollInterval: 60000, // Will refresh the data every 60s to get new comments
    context: API_V2_CONTEXT,
  },
});

export default withUser(getData(withRouter(withApollo(UpdateWithData))));
