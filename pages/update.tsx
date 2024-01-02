import React, { useState } from 'react';
import { get, pick } from 'lodash';
import type { InferGetServerSidePropsType } from 'next';
import { useRouter } from 'next/router';

import { getSSRQueryHelpers } from '../lib/apollo-client';
import { shouldIndexAccountOnSearchEngines } from '../lib/collective';
import { ERROR } from '../lib/errors';
import { API_V2_CONTEXT, gql } from '../lib/graphql/helpers';
import useLoggedInUser from '../lib/hooks/useLoggedInUser';
import { stripHTML } from '../lib/html';
import { addParentToURLIfMissing, getCollectivePageCanonicalURL } from '../lib/url-helpers';

import CollectiveNavbar from '../components/collective-navbar';
import { NAVBAR_CATEGORIES } from '../components/collective-navbar/constants';
import { collectiveNavbarFieldsFragment } from '../components/collective-page/graphql/fragments';
import Container from '../components/Container';
import CommentForm from '../components/conversations/CommentForm';
import { commentFieldsFragment } from '../components/conversations/graphql';
import Thread from '../components/conversations/Thread';
import ErrorPage from '../components/ErrorPage';
import { Box, Flex } from '../components/Grid';
import CommentIcon from '../components/icons/CommentIcon';
import Page from '../components/Page';
import StyledUpdate from '../components/StyledUpdate';

const updatePageQuery = gql`
  query UpdatePage($collectiveSlug: String, $updateSlug: String!, $offset: Int) {
    account(slug: $collectiveSlug, throwIfMissing: false) {
      id
      legacyId
      slug
      name
      type
      description
      settings
      imageUrl
      isFrozen
      twitterHandle
      ... on AccountWithHost {
        host {
          id
          slug
          name
          features {
            id
            CONTACT_FORM
          }
        }
      }
      features {
        id
        ...NavbarFields
      }
      conversationsTags {
        id
        tag
      }
      ... on Collective {
        isApproved
      }
      ... on AccountWithParent {
        parent {
          id
          slug
          name
          imageUrl
        }
      }
    }
    update(slug: $updateSlug, account: { slug: $collectiveSlug }) {
      id
      slug
      title
      createdAt
      publishedAt
      html
      summary
      isPrivate
      isChangelog
      makePublicOn
      userCanSeeUpdate
      userCanPublishUpdate
      reactions
      userReactions
      notificationAudience
      account {
        id
        slug
        type
        name
        isHost
      }
      fromAccount {
        id
        slug
        type
        name
      }
      comments(limit: 100, offset: $offset) {
        totalCount
        nodes {
          id
          ...CommentFields
        }
      }
    }
  }
  ${commentFieldsFragment}
  ${collectiveNavbarFieldsFragment}
`;

type UpdatePageArgs = {
  collectiveSlug: string;
  updateSlug: string;
};

const updatePageSSRQueryHelpers = getSSRQueryHelpers({
  query: updatePageQuery,
  getPropsFromContext: ctx => pick(ctx.query, ['collectiveSlug', 'updateSlug']) as UpdatePageArgs,
  getVariablesFromContext: (ctx, props) => props,
  context: API_V2_CONTEXT,
});

export const getServerSideProps = updatePageSSRQueryHelpers.getServerSideProps;

export default function UpdatePage(props: InferGetServerSidePropsType<typeof getServerSideProps>) {
  const { LoggedInUser } = useLoggedInUser();
  const queryResult = updatePageSSRQueryHelpers.useQuery(props);
  const router = useRouter();
  const { updateSlug, collectiveSlug } = props;

  const { account, update } = queryResult?.data || {};
  const comments = get(update, 'comments.nodes', []);
  const totalCommentsCount = get(update, 'comments.totalCount', 0);
  const [replyingToComment, setReplyingToComment] = useState(null);

  React.useEffect(() => {
    if (LoggedInUser) {
      queryResult.refetch();
    }
  }, [LoggedInUser, update]);

  React.useEffect(() => {
    addParentToURLIfMissing(router, account, `/updates/${updateSlug}`);
  });

  const fetchMoreComments = async () => {
    await queryResult.fetchMore({
      variables: { collectiveSlug, updateSlug, offset: get(update, 'comments.nodes', []).length },
      updateQuery: (prev, { fetchMoreResult }) => {
        if (!fetchMoreResult) {
          return prev;
        }

        const newValues = {};

        newValues['update'] = {
          ...prev.update,
          comments: {
            ...fetchMoreResult.update.comments,
            nodes: [...prev.update.comments.nodes, ...fetchMoreResult.update.comments.nodes],
          },
        };

        return Object.assign({}, prev, newValues);
      },
    });
  };

  if (!account) {
    return <ErrorPage data={props} />;
  } else if (!update) {
    return <ErrorPage error={{ type: ERROR.NOT_FOUND }} />;
  }

  return (
    <Page
      collective={account}
      title={update.title}
      description={stripHTML(update.summary)}
      canonicalURL={`${getCollectivePageCanonicalURL(account)}/updates/${updateSlug}`}
      metaTitle={`${update.title} - ${account.name}`}
      noRobots={!shouldIndexAccountOnSearchEngines(account)}
    >
      <CollectiveNavbar
        collective={account}
        isAdmin={LoggedInUser && LoggedInUser.isAdminOfCollective(account)}
        selectedCategory={NAVBAR_CATEGORIES.CONNECT}
      />

      <Container py={4} maxWidth={1260} m="0 auto" px={[0, null, null, 4]}>
        <StyledUpdate
          key={update.id}
          collective={account}
          update={update}
          reactions={update.reactions}
          editable={Boolean(LoggedInUser?.isAdminOfCollective(account))}
          LoggedInUser={LoggedInUser}
          compact={false}
          isReloadingData={queryResult.loading}
        />
        {update.userCanSeeUpdate && (
          <Box pl={[0, 5]}>
            {comments.length > 0 && (
              <Container mb={3} pt={3} maxWidth={700} borderTop="1px solid #eee">
                <Thread
                  collective={account}
                  hasMore={comments.length < totalCommentsCount}
                  fetchMore={fetchMoreComments}
                  items={comments}
                  onCommentDeleted={() => queryResult.refetch()}
                  getClickedComment={setReplyingToComment}
                />
              </Container>
            )}
            {update.publishedAt && (
              <Flex mt="40px" maxWidth={700}>
                <Box display={['none', null, 'block']} flex="0 0" p={3}>
                  <CommentIcon size={24} color="lightgrey" />
                </Box>
                <Box flex="1 1" maxWidth={[null, null, 'calc(100% - 56px)']}>
                  <CommentForm
                    id="new-update"
                    replyingToComment={replyingToComment}
                    UpdateId={update.id}
                    onSuccess={() => queryResult.refetch()}
                  />
                </Box>
              </Flex>
            )}
          </Box>
        )}
      </Container>
    </Page>
  );
}
