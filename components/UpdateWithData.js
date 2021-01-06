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
    LoggedInUser: PropTypes.object,
  };

  constructor(props) {
    super(props);
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
      return <div />;
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
        />
        {comments.length > 0 && (
          <Box mb={3} pt={3}>
            <Thread collective={collective} items={comments} onCommentDeleted={this.onCommentDeleted} />
          </Box>
        )}
        <Flex mt="40px">
          <Box display={['none', null, 'block']} flex="0 0" p={3}>
            <CommentIcon size={24} color="lightgrey" />
          </Box>
          <Box flex="1 1" maxWidth={[null, null, 'calc(100% - 56px)']}>
            <CommentForm id="new-update" UpdateId={update.id} onSuccess={this.onCommentAdded} />
          </Box>
        </Flex>
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
    update(updateSlug: $updateSlug) {
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
      }
      fromAccount {
        id
        slug
        type
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
