import React, { useCallback } from 'react';
import { gql, useMutation, useQuery } from '@apollo/client';
import { ArrowLeft, Eye, Pencil, Trash } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { FormattedMessage, useIntl } from 'react-intl';

import { UpdateNotificationAudienceLabels } from '../../../../lib/constants/updates';
import { getDateFromValue, toIsoDateStr } from '../../../../lib/date-utils';
import { i18nGraphqlException } from '../../../../lib/errors';
import { API_V2_CONTEXT } from '../../../../lib/graphql/helpers';
import { getCollectivePageRoute, getDashboardRoute } from '../../../../lib/url-helpers';
import { formatDate } from '../../../../lib/utils';

import CommentForm from '../../../conversations/CommentForm';
import EmojiReactionPicker from '../../../conversations/EmojiReactionPicker';
import EmojiReactions from '../../../conversations/EmojiReactions';
import Thread from '../../../conversations/Thread';
import HTMLContent from '../../../HTMLContent';
import Link from '../../../Link';
import MessageBoxGraphqlError from '../../../MessageBoxGraphqlError';
import { useModal } from '../../../ModalContext';
import { Button } from '../../../ui/Button';
import { Skeleton } from '../../../ui/Skeleton';
import { useToast } from '../../../ui/useToast';
import { DashboardContext } from '../../DashboardContext';

import { MainColumn, SideColumn, SideColumnItem, TwoColumnContainer, UpdateDate, UpdateStatus } from './common';
import { getRefetchQueries, updateFieldsFragment, updatesViewQuery } from './queries';

const deleteUpdateMutation = gql`
  mutation DashboardDeleteUpdate($id: String!) {
    deleteUpdate(id: $id) {
      id
      ...UpdateFields
    }
  }
  ${updateFieldsFragment}
`;

const LoadingBody = () => (
  <div className="flex flex-col gap-6">
    <Skeleton className="h-5 w-2/3" />
    <Skeleton className="h-24 w-full" />
  </div>
);

const SingleUpdateView = ({ updateId }) => {
  const intl = useIntl();
  const router = useRouter();
  const { toast } = useToast();
  const { showConfirmationModal } = useModal();
  const { account } = React.useContext(DashboardContext);
  const [replyingToComment, setReplyingToComment] = React.useState(null);
  const { data, loading, refetch, error, fetchMore } = useQuery(updatesViewQuery, {
    variables: {
      id: updateId,
    },
    context: API_V2_CONTEXT,
  });

  const [deleteUpdate] = useMutation(deleteUpdateMutation, { context: API_V2_CONTEXT });

  const refetchQueries = getRefetchQueries(account);
  const update = data?.update;
  const isDraft = !update?.publishedAt;
  const comments = update?.comments;

  const handleDelete = useCallback(
    async () =>
      showConfirmationModal({
        title: intl.formatMessage({
          defaultMessage: 'Are you sure you want to delete this update?',
          id: 'hWm9hg',
        }),
        description: intl.formatMessage({
          defaultMessage: 'This action is irreversible. Deleting this update will remove it from the collective page.',
          id: 'update.delete.confirmation',
        }),
        onConfirm: async () => {
          try {
            await deleteUpdate({
              variables: { id: updateId },
              refetchQueries,
              awaitRefetchQueries: true,
            });
            toast({
              variant: 'success',
              message: <FormattedMessage defaultMessage="Update deleted" id="update.deleted" />,
            });
            router.push(getDashboardRoute(account, `updates`));
          } catch (e) {
            toast({ variant: 'error', message: i18nGraphqlException(intl, e) });
          }
        },
        confirmLabel: intl.formatMessage({ defaultMessage: 'Delete Update', id: 'Update.Delete.Title' }),
        variant: 'destructive',
      }),
    [updateId, deleteUpdate, account, router, refetchQueries, intl, showConfirmationModal, toast],
  );

  const handleFetchMoreComments = useCallback(
    () =>
      fetchMore({
        variables: { id: updateId, commentOffset: comments?.nodes?.length },
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
      }),
    [comments, fetchMore, updateId],
  );

  return (
    <div className="flex max-w-screen-lg flex-col-reverse lg:flex-row">
      <div className="flex flex-1 flex-col gap-6">
        <Link className="flex items-center text-sm text-gray-500" href={getDashboardRoute(account, `updates`)}>
          <ArrowLeft size="14px" className="mr-1" />
          <FormattedMessage defaultMessage="Back to updates" id="isPw2F" />
        </Link>
        {loading ? (
          <LoadingBody />
        ) : error ? (
          <MessageBoxGraphqlError error={error} />
        ) : (
          update && (
            <React.Fragment>
              <TwoColumnContainer>
                <MainColumn>
                  <article data-cy="update" className="flex flex-col gap-6">
                    <header>
                      <div className="flex items-start gap-2">
                        <h1 className="mb-2 grow text-2xl font-bold">{update.title}</h1>
                        <UpdateStatus update={update} />
                      </div>
                      <div className="text-sm">
                        <UpdateDate update={update} />
                      </div>
                    </header>
                    <HTMLContent content={update.html} />
                    {!isDraft && (
                      <div className="flex">
                        <EmojiReactions reactions={update.reactions} />
                        <EmojiReactionPicker update={update} />
                      </div>
                    )}
                    <hr />
                    {update.userCanSeeUpdate && (
                      <footer>
                        {comments?.nodes?.length > 0 && (
                          <Thread
                            collective={account}
                            hasMore={comments?.nodes?.length < comments?.totalCount}
                            fetchMore={handleFetchMoreComments}
                            items={comments?.nodes}
                            onCommentDeleted={refetch}
                            getClickedComment={setReplyingToComment}
                          />
                        )}
                        {!isDraft && (
                          <div className="flex">
                            <CommentForm
                              id="new-update"
                              UpdateId={update.id}
                              onSuccess={refetch}
                              replyingToComment={replyingToComment}
                            />
                          </div>
                        )}
                      </footer>
                    )}
                  </article>
                </MainColumn>
                <SideColumn>
                  <div className="flex gap-2 lg:flex-col lg:justify-stretch">
                    <Link className="w-full" href={`${getCollectivePageRoute(account)}/updates/${update.slug}`}>
                      <Button size="sm" variant="outline" className="w-full gap-1.5">
                        <Eye size="16px" />
                        <FormattedMessage defaultMessage="View Update Page" id="6nTLxY" />
                      </Button>
                    </Link>
                    <Link className="w-full" href={getDashboardRoute(account, `updates/edit/${updateId}`)}>
                      <Button size="sm" variant="outline" className="w-full gap-1.5" data-cy="update-edit-btn">
                        <Pencil size="16px" />
                        <FormattedMessage defaultMessage="Edit Update" id="wEQDC6" />
                      </Button>
                    </Link>
                    <Button size="sm" variant="outline" className="w-full gap-1.5" onClick={handleDelete}>
                      <Trash size="16px" />
                      <FormattedMessage defaultMessage="Delete Update" id="Update.Delete.Title" />
                    </Button>
                  </div>
                  <hr />
                  <div className="flex flex-col gap-8 ">
                    <SideColumnItem>
                      <FormattedMessage defaultMessage="Update type" id="jJmze4" />
                      {update.isChangelog ? (
                        <FormattedMessage defaultMessage="Changelog" id="Changelog" />
                      ) : update.isPrivate ? (
                        <FormattedMessage defaultMessage="Private" id="Private" />
                      ) : (
                        <FormattedMessage defaultMessage="Public" id="Public" />
                      )}
                    </SideColumnItem>
                    {update.publishedAt && (
                      <SideColumnItem>
                        <FormattedMessage id="PublishedOn" defaultMessage="Published on" />
                        {formatDate(update.publishedAt, {
                          day: 'numeric',
                          month: 'long',
                          year: 'numeric',
                        })}
                      </SideColumnItem>
                    )}
                    {update.makePublicOn && (
                      <SideColumnItem>
                        <FormattedMessage id="Update.MakePublicOn" defaultMessage="Automatically make public on" />
                        {toIsoDateStr(getDateFromValue(update.makePublicOn))}
                      </SideColumnItem>
                    )}
                    {!update.isChangelog && (
                      <SideColumnItem>
                        {update.isPrivate ? (
                          <FormattedMessage defaultMessage="Who can read this update?" id="/N24Lt" />
                        ) : (
                          <FormattedMessage defaultMessage="Who should be notified?" id="+JC301" />
                        )}
                        {UpdateNotificationAudienceLabels[update.notificationAudience]}
                      </SideColumnItem>
                    )}
                  </div>
                </SideColumn>
              </TwoColumnContainer>
            </React.Fragment>
          )
        )}
      </div>
    </div>
  );
};

export default SingleUpdateView;
