import React from 'react';
import PropTypes from 'prop-types';
import { graphql, withApollo } from '@apollo/client/react/hoc';
import { cloneDeep, get, isEmpty, uniqBy, update } from 'lodash';
import { withRouter } from 'next/router';
import { FormattedMessage } from 'react-intl';

import hasFeature, { FEATURES } from '../lib/allowed-features';
import { NAVBAR_CATEGORIES } from '../lib/collective-sections';
import { generateNotFoundError } from '../lib/errors';
import { API_V2_CONTEXT, gqlV2 } from '../lib/graphql/helpers';

import CollectiveNavbar from '../components/collective-navbar';
import { Sections } from '../components/collective-page/_constants';
import { collectiveNavbarFieldsFragment } from '../components/collective-page/graphql/fragments';
import CollectiveThemeProvider from '../components/CollectiveThemeProvider';
import Container from '../components/Container';
import Comment from '../components/conversations/Comment';
import CommentForm from '../components/conversations/CommentForm';
import FollowConversationButton from '../components/conversations/FollowConversationButton';
import FollowersAvatars from '../components/conversations/FollowersAvatars';
import { commentFieldsFragment, isUserFollowingConversationQuery } from '../components/conversations/graphql';
import Thread from '../components/conversations/Thread';
import ErrorPage from '../components/ErrorPage';
import { Box, Flex } from '../components/Grid';
import CommentIcon from '../components/icons/CommentIcon';
import InlineEditField from '../components/InlineEditField';
import Link from '../components/Link';
import Loading from '../components/Loading';
import MessageBox from '../components/MessageBox';
import Page from '../components/Page';
import PageFeatureNotSupported from '../components/PageFeatureNotSupported';
import StyledButton from '../components/StyledButton';
import StyledInputTags from '../components/StyledInputTags';
import StyledLink from '../components/StyledLink';
import StyledTag from '../components/StyledTag';
import { H2, H4 } from '../components/Text';
import { withUser } from '../components/UserProvider';

const conversationPageQuery = gqlV2/* GraphQL */ `
  query ConversationPage($collectiveSlug: String!, $id: String!) {
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
    conversation(id: $id) {
      id
      slug
      title
      createdAt
      tags
      body {
        ...CommentFields
      }
      comments {
        nodes {
          ...CommentFields
        }
      }
      followers(limit: 50) {
        totalCount
        nodes {
          id
          slug
          type
          name
          imageUrl(height: 64)
        }
      }
    }
  }
  ${commentFieldsFragment}
  ${collectiveNavbarFieldsFragment}
`;

const editConversationMutation = gqlV2/* GraphQL */ `
  mutation EditConversation($id: String!, $title: String!, $tags: [String]) {
    editConversation(id: $id, title: $title, tags: $tags) {
      id
      title
      tags
    }
  }
`;

/**
 * The main page to display collectives. Wrap route parameters and GraphQL query
 * to render `components/collective-page` with everything needed.
 */
class ConversationPage extends React.Component {
  static getInitialProps({ query: { collectiveSlug, id } }) {
    return { collectiveSlug, id };
  }

  static propTypes = {
    /** @ignore from getInitialProps */
    collectiveSlug: PropTypes.string.isRequired,
    /** @ignore from getInitialProps */
    id: PropTypes.string.isRequired,
    /** @ignore from withApollo */
    client: PropTypes.object.isRequired,
    /** @ignore from withUser */
    LoggedInUser: PropTypes.object,
    /** @ignore from apollo */
    data: PropTypes.shape({
      loading: PropTypes.bool,
      error: PropTypes.any,
      account: PropTypes.shape({
        name: PropTypes.string.isRequired,
        description: PropTypes.string,
        type: PropTypes.string.isRequired,
        twitterHandle: PropTypes.string,
        imageUrl: PropTypes.string,
        conversationsTags: PropTypes.arrayOf(
          PropTypes.shape({
            id: PropTypes.string,
            tag: PropTypes.string,
          }),
        ),
      }),
      conversation: PropTypes.shape({
        id: PropTypes.string.isRequired,
        title: PropTypes.string.isRequired,
        slug: PropTypes.string.isRequired,
        tags: PropTypes.arrayOf(PropTypes.string),
        body: PropTypes.shape({
          id: PropTypes.string,
        }),
        comments: PropTypes.shape({
          nodes: PropTypes.arrayOf(
            PropTypes.shape({
              id: PropTypes.string,
            }),
          ),
        }),
        followers: PropTypes.shape({
          totalCount: PropTypes.number,
          nodes: PropTypes.arrayOf(
            PropTypes.shape({
              id: PropTypes.string,
            }),
          ),
        }),
      }),
    }).isRequired, // from withData
    router: PropTypes.object,
  };

  static MAX_NB_FOLLOWERS_AVATARS = 4;

  getPageMetaData(collective) {
    if (collective) {
      return { title: `${collective.name}'s conversations` };
    } else {
      return { title: 'Conversations' };
    }
  }

  clonePageQueryCacheData() {
    const { client, id, collectiveSlug } = this.props;
    const query = conversationPageQuery;
    const variables = { collectiveSlug, id };
    const data = cloneDeep(client.readQuery({ query, variables }));
    return [data, query, variables];
  }

  onCommentAdded = comment => {
    // Add comment to cache if not already fetched
    const [data, query, variables] = this.clonePageQueryCacheData();
    update(data, 'conversation.comments.nodes', comments => uniqBy([...comments, comment], 'id'));
    this.props.client.writeQuery({ query, variables, data });

    // Commenting subscribes the user, update Follow button to reflect that
    this.updateLoggedInUserFollowing(true);

    // Add user to the conversation subscribers
    this.onFollowChange(true, comment.fromCollective);
  };

  updateLoggedInUserFollowing = isFollowing => {
    const query = isUserFollowingConversationQuery;
    const variables = { id: this.props.id };
    const userFollowingData = cloneDeep(this.props.client.readQuery({ query, variables }));
    if (userFollowingData && userFollowingData.loggedInAccount) {
      userFollowingData.loggedInAccount.isFollowingConversation = isFollowing;
      this.props.client.writeQuery({ query, variables, data: userFollowingData });
    }
  };

  onCommentDeleted = comment => {
    const [data, query, variables] = this.clonePageQueryCacheData();
    update(data, 'conversation.comments.nodes', comments => comments.filter(c => c.id !== comment.id));
    this.props.client.writeQuery({ query, variables, data });
  };

  onFollowChange = (isFollowing, account) => {
    const [data, query, variables] = this.clonePageQueryCacheData();
    const followersPath = 'conversation.followers.nodes';
    const followersCountPath = 'conversation.followers.totalCount';

    if (!isFollowing) {
      // Remove user
      update(data, followersCountPath, count => count - 1);
      update(data, followersPath, followers => followers.filter(c => c.id !== account.id));
    } else if (get(data, followersPath, []).findIndex(c => c.id === account.id) === -1) {
      // Add user (if not already there)
      update(data, followersCountPath, count => count + 1);
      update(data, followersPath, followers => {
        followers.splice(ConversationPage.MAX_NB_FOLLOWERS_AVATARS - 1, 0, account);
        return followers;
      });
    } else {
      return;
    }

    this.props.client.writeQuery({ query, variables, data });
  };

  onConversationDeleted = () => {
    return this.props.router.push(`/${this.props.collectiveSlug}/conversations`);
  };

  getSuggestedTags(collective) {
    const tagsStats = (collective && collective.conversationsTags) || null;
    return tagsStats && tagsStats.map(({ tag }) => tag);
  }

  handleTagsChange = (options, setValue) => {
    if (isEmpty(options)) {
      setValue([]);
    } else {
      setValue(options.map(i => i.value));
    }
  };

  render() {
    const { collectiveSlug, data, LoggedInUser } = this.props;

    if (!data.loading) {
      if (!data || data.error) {
        return <ErrorPage data={data} />;
      } else if (!data.account) {
        return <ErrorPage error={generateNotFoundError(collectiveSlug)} log={false} />;
      } else if (!hasFeature(data.account, FEATURES.CONVERSATIONS)) {
        return <PageFeatureNotSupported />;
      }
    }

    const collective = data && data.account;
    const conversation = data && data.conversation;
    const body = conversation && conversation.body;
    const conversationReactions = get(conversation, 'body.reactions', []);
    const comments = get(conversation, 'comments.nodes', []);
    const followers = get(conversation, 'followers');
    const hasFollowers = followers && followers.nodes && followers.nodes.length > 0;
    const canEdit = LoggedInUser && body && LoggedInUser.canEditComment(body);
    const canDelete = canEdit || (LoggedInUser && LoggedInUser.canEditCollective(collective));
    return (
      <Page collective={collective} {...this.getPageMetaData(collective)}>
        {data.loading ? (
          <Container>
            <Loading />
          </Container>
        ) : (
          <CollectiveThemeProvider collective={collective}>
            <Container data-cy="conversation-page">
              <CollectiveNavbar
                collective={collective}
                selected={Sections.CONVERSATIONS}
                selectedCategory={NAVBAR_CATEGORIES.CONNECT}
              />
              <Box maxWidth={1160} m="0 auto" px={2} py={[4, 5]}>
                <StyledLink as={Link} color="black.600" href={`/${collectiveSlug}/conversations`}>
                  &larr; <FormattedMessage id="Conversations.GoBack" defaultMessage="Back to conversations" />
                </StyledLink>
                <Box mt={4}>
                  {!conversation || !body ? (
                    <MessageBox type="error" withIcon>
                      <FormattedMessage
                        id="conversation.notFound"
                        defaultMessage="This conversation doesn't exist or has been removed."
                      />
                    </MessageBox>
                  ) : (
                    <Flex flexDirection={['column', null, null, 'row']} justifyContent="space-between">
                      <Box flex="1 1 50%" maxWidth={700} mb={5}>
                        <Container borderBottom="1px solid" borderColor="black.300" pb={3}>
                          <H2 fontSize="24px" lineHeight="32px" mb={4} wordBreak="break-word">
                            <InlineEditField
                              mutation={editConversationMutation}
                              mutationOptions={{ context: API_V2_CONTEXT }}
                              canEdit={canEdit}
                              values={conversation}
                              field="title"
                              maxLength={255}
                              placeholder={
                                <FormattedMessage
                                  id="CreateConversation.Title.Placeholder"
                                  defaultMessage="Start with a title for your conversation here"
                                />
                              }
                            />
                          </H2>
                          <Comment
                            comment={body}
                            reactions={conversationReactions}
                            canEdit={canEdit}
                            canDelete={canDelete}
                            onDelete={this.onConversationDeleted}
                            canReply={Boolean(LoggedInUser)}
                            isConversationRoot
                          />
                        </Container>
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
                            <CommentForm
                              id="new-comment"
                              ConversationId={conversation.id}
                              onSuccess={this.onCommentAdded}
                            />
                          </Box>
                        </Flex>
                      </Box>
                      <Box display={['none', null, 'block']} flex="0 0 330px" ml={[null, null, null, 4, 5]} mb={4}>
                        <Box my={2} mx={2}>
                          <Link href={`/${collectiveSlug}/conversations/new`}>
                            <StyledButton buttonStyle="primary" width="100%" minWidth={170}>
                              <FormattedMessage id="conversations.create" defaultMessage="Create a Conversation" />
                            </StyledButton>
                          </Link>
                        </Box>

                        <Box mt={4}>
                          <H4 px={2} mb={3} fontWeight="normal">
                            <FormattedMessage id="Conversation.Followers" defaultMessage="Conversation followers" />
                          </H4>
                          <Flex mb={3} alignItems="center">
                            {hasFollowers && (
                              <Box mr={3}>
                                <FollowersAvatars
                                  followers={followers.nodes}
                                  totalCount={followers.totalCount}
                                  maxNbDisplayed={ConversationPage.MAX_NB_FOLLOWERS_AVATARS}
                                  avatarRadius={32}
                                />
                              </Box>
                            )}
                            <Box flex="1">
                              <FollowConversationButton
                                conversationId={conversation.id}
                                onChange={this.onFollowChange}
                                isCompact={hasFollowers && followers.nodes.length > 2}
                              />
                            </Box>
                          </Flex>
                        </Box>
                        {!(isEmpty(conversation.tags) && !canEdit) && (
                          <Box mt={4}>
                            <InlineEditField
                              topEdit={2}
                              field="tags"
                              buttonsMinWidth={145}
                              canEdit={canEdit}
                              values={conversation}
                              mutation={editConversationMutation}
                              mutationOptions={{ context: API_V2_CONTEXT }}
                              prepareVariables={(value, draft) => ({
                                ...value,
                                tags: draft,
                              })}
                            >
                              {({ isEditing, setValue }) => (
                                <React.Fragment>
                                  <H4 px={2} mb={2} fontWeight="normal">
                                    <FormattedMessage id="Tags" defaultMessage="Tags" />
                                  </H4>
                                  {!isEditing ? (
                                    !isEmpty(conversation.tags) && (
                                      <Flex flexWrap="wrap" mx={2}>
                                        {conversation.tags.map(tag => (
                                          <StyledTag key={tag} variant="rounded-right" mb="4px" mr="4px">
                                            {tag}
                                          </StyledTag>
                                        ))}
                                      </Flex>
                                    )
                                  ) : (
                                    <Box mx={2}>
                                      <StyledInputTags
                                        suggestedTags={this.getSuggestedTags(collective)}
                                        defaultValue={conversation.tags}
                                        onChange={options => this.handleTagsChange(options, setValue)}
                                      />
                                    </Box>
                                  )}
                                </React.Fragment>
                              )}
                            </InlineEditField>
                          </Box>
                        )}
                      </Box>
                    </Flex>
                  )}
                </Box>
              </Box>
            </Container>
          </CollectiveThemeProvider>
        )}
      </Page>
    );
  }
}

const getData = graphql(conversationPageQuery, {
  options: {
    pollInterval: 60000, // Will refresh the data every 60s to get new comments
    context: API_V2_CONTEXT,
  },
});

export default withUser(getData(withRouter(withApollo(ConversationPage))));
