import React from 'react';
import PropTypes from 'prop-types';
import { graphql, withApollo } from '@apollo/client/react/hoc';
import { cloneDeep, get, uniqBy, update } from 'lodash';
import { withRouter } from 'next/router';
import Head from 'next/head';

import { API_V2_CONTEXT, gqlV2 } from '../lib/graphql/helpers';

import { NAVBAR_CATEGORIES } from '../lib/collective-sections';
import { addCollectiveCoverData } from '../lib/graphql/queries';
import { collectiveNavbarFieldsFragment } from '../components/collective-page/graphql/fragments';
import { commentFieldsFragment } from '../components/conversations/graphql';
import CommentForm from '../components/conversations/CommentForm';

import CommentIcon from '../components/icons/CommentIcon';
import Body from '../components/Body';
import CollectiveNavbar from '../components/collective-navbar';
import { Sections } from '../components/collective-page/_constants';
import ErrorPage from '../components/ErrorPage';
import Footer from '../components/Footer';
import Loading from '../components/Loading';
import NotFound from '../components/NotFound';
import { Box, Flex } from '../components/Grid';
import Header from '../components/Header';
import StyledUpdate from '../components/StyledUpdate';
import Thread from '../components/conversations/Thread';
import { withUser } from '../components/UserProvider';

class UpdatePage extends React.Component {
  static getInitialProps({ query: { collectiveSlug, updateSlug } }) {
    return { collectiveSlug, updateSlug };
  }

  static propTypes = {
    collectiveSlug: PropTypes.string, // for addCollectiveCoverData
    updateSlug: PropTypes.string,
    data: PropTypes.object.isRequired, // from withData
    LoggedInUser: PropTypes.object, // from withUser
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
    const { data, LoggedInUser } = this.props;
    console.log(data);
    if (data.loading) {
      return <Loading />;
    }

    if (!data.Collective) {
      return <ErrorPage data={data} />;
    }

    const collectiveData = data.Collective;
    const collective = data && data.account;
    const comments = get(data, 'update.comments.nodes', []);
    const update = data.update;
    if (!update) {
      return <NotFound />;
    }

    return (
      <div className="UpdatePage">
        <Header title={update.title} collective={collectiveData} LoggedInUser={LoggedInUser} />

        <Body>
          <CollectiveNavbar
            collective={collectiveData}
            isAdmin={LoggedInUser && LoggedInUser.canEditCollective(collectiveData)}
            selected={Sections.UPDATES}
            selectedCategory={NAVBAR_CATEGORIES.CONNECT}
          />

          <Box className="content" py={4}>
            <StyledUpdate
              key={update.id}
              collective={collective}
              update={update}
              editable={true}
              LoggedInUser={LoggedInUser}
              compact={false}
              isReloadingData={this.state.isReloadingData}
            />
            {update.userCanSeeUpdate && (
              <Box pl={[0, 5]}>
                {comments.length > 0 && (
                  <Box mb={3} pt={3} maxWidth={700}>
                    <Thread collective={collective} items={comments} onCommentDeleted={this.onCommentDeleted} />
                  </Box>
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
          </Box>
        </Body>

        <Footer />
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

export default withUser(addCollectiveCoverData(getData(withRouter(withApollo(UpdatePage)))));
