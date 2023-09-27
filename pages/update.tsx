import React, { useState } from 'react';
import { gql, useLazyQuery } from '@apollo/client';
import { get } from 'lodash';
import type { GetServerSideProps, InferGetServerSidePropsType } from 'next';
import { useRouter } from 'next/router';

import { initClient } from '../lib/apollo-client';
import { shouldIndexAccountOnSearchEngines } from '../lib/collective.lib';
import { ERROR } from '../lib/errors';
import { API_V2_CONTEXT } from '../lib/graphql/helpers';
import useLoggedInUser from '../lib/hooks/useLoggedInUser';
import { addParentToURLIfMissing, getCollectivePageCanonicalURL } from '../lib/url-helpers';
import { stripHTML } from '../lib/utils';

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
      type
      ... on AccountWithParent {
        parent {
          id
          slug
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

export const getServerSideProps: GetServerSideProps<UpdatePageArgs> = async ctx => {
  const query = ctx.query as UpdatePageArgs;
  const client = initClient();
  const { data, error } = await client.query({
    query: updatePageQuery,
    variables: query,
    context: API_V2_CONTEXT,
    fetchPolicy: 'network-only',
    errorPolicy: 'ignore',
  });

  return {
    props: { ...query, ...data, error: error || null }, // will be passed to the page component as props
  };
};

export default function UpdatePage(props: InferGetServerSidePropsType<typeof getServerSideProps>) {
  const { collectiveSlug, updateSlug } = props;
  const { LoggedInUser } = useLoggedInUser();
  const [fetchData, query] = useLazyQuery(updatePageQuery, {
    variables: { collectiveSlug, updateSlug },
    context: API_V2_CONTEXT,
  });
  const router = useRouter();

  const { account, update } = query?.data || props;
  const comments = get(update, 'comments.nodes', []);
  const totalCommentsCount = get(update, 'comments.totalCount', 0);
  const [replyingToComment, setReplyingToComment] = useState(null);

  React.useEffect(() => {
    if (LoggedInUser) {
      fetchData();
    }
  }, [LoggedInUser]);

  React.useEffect(() => {
    addParentToURLIfMissing(router, account, `/updates/${updateSlug}`);
  });

  const fetchMore = async () => {
    await query.fetchMore({
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
          isReloadingData={query.loading}
        />
        {update.userCanSeeUpdate && (
          <Box pl={[0, 5]}>
            {comments.length > 0 && (
              <Container mb={3} pt={3} maxWidth={700} borderTop="1px solid #eee">
                <Thread
                  collective={account}
                  hasMore={comments.length < totalCommentsCount}
                  fetchMore={fetchMore}
                  items={comments}
                  onCommentDeleted={() => query.refetch()}
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
                    onSuccess={() => query.refetch()}
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
