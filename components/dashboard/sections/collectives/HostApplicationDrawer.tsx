import React from 'react';
import { gql, useMutation, useQuery } from '@apollo/client';
import { get, isEmpty } from 'lodash-es';
import { AlertTriangle, ChevronDown, ExternalLink } from 'lucide-react';
import { defineMessages, FormattedMessage, useIntl } from 'react-intl';

import type { EcosystemsRepositorySnapshot } from '../../../../lib/ecosystems';
import { i18nGraphqlException } from '../../../../lib/errors';
import type {
  HostApplicationThreadQuery,
  HostApplicationThreadQueryVariables,
} from '../../../../lib/graphql/types/v2/graphql';
import { HostApplicationStatus, ProcessHostApplicationAction } from '../../../../lib/graphql/types/v2/graphql';
import useLoggedInUser from '../../../../lib/hooks/useLoggedInUser';
import { cn } from '@/lib/utils';

import { AccountHoverCard } from '../../../AccountHoverCard';
import Avatar from '../../../Avatar';
import { commentFieldsFragment } from '../../../conversations/graphql';
import Thread from '../../../conversations/Thread';
import { CopyID } from '../../../CopyId';
import DateTime from '../../../DateTime';
import DrawerHeader from '../../../DrawerHeader';
import Link from '../../../Link';
import LinkCollective from '../../../LinkCollective';
import MessageBoxGraphqlError from '../../../MessageBoxGraphqlError';
import { Alert, AlertDescription } from '../../../ui/Alert';
import { Badge } from '../../../ui/Badge';
import { Button } from '../../../ui/Button';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '../../../ui/Collapsible';
import { DataListItem } from '../../../ui/DataList';
import { FormSectionTitle } from '../../../ui/FormSectionTitle';
import { Sheet, SheetContent } from '../../../ui/Sheet';
import { Skeleton } from '../../../ui/Skeleton';
import { Tooltip, TooltipContent, TooltipTrigger } from '../../../ui/Tooltip';
import { type Toast, useToast } from '../../../ui/useToast';

import AcceptRejectButtons from './AcceptRejectButtons';
import { EcosystemsRepositoryInfo, HostApplicationCustomData } from './hostApplicationCustomData';
import { hostApplicationFieldsFragment, processApplicationMutation } from './queries';
import ValidatedRepositoryInfo from './ValidatedRepositoryInfo';

const msg = defineMessages({
  approved: {
    id: 'HostApplication.Approved',
    defaultMessage: '{name} has been approved',
  },
  rejected: {
    id: 'HostApplication.Rejected',
    defaultMessage: '{name} has been rejected',
  },
  viewCollective: {
    id: 'ContributeCard.SeeCollective',
    defaultMessage: 'View Collective',
  },
});

const ACTIONS = ProcessHostApplicationAction;

const renderStatusBadge = (status?: HostApplicationStatus) => {
  switch (status) {
    case HostApplicationStatus.PENDING:
      return (
        <Badge size="sm" type="warning">
          <FormattedMessage id="Pending" defaultMessage="Pending" />
        </Badge>
      );
    case HostApplicationStatus.APPROVED:
      return (
        <Badge size="sm" type="success">
          <FormattedMessage id="PendingApplication.Approved" defaultMessage="Approved" />
        </Badge>
      );
    case HostApplicationStatus.REJECTED:
      return (
        <Badge size="sm" type="error">
          <FormattedMessage id="PendingApplication.Rejected" defaultMessage="Rejected" />
        </Badge>
      );
    case HostApplicationStatus.EXPIRED:
      return (
        <Badge size="sm" type="neutral">
          <FormattedMessage id="HostApplication.Expired" defaultMessage="Expired" />
        </Badge>
      );
    default:
      return <Skeleton className="h-5 w-16" />;
  }
};

const getSuccessToast = (intl, action, collective, result): Toast => {
  if (action === ACTIONS.SEND_PRIVATE_MESSAGE || action === ACTIONS.SEND_PUBLIC_MESSAGE) {
    const conversation = get(result, 'data.processHostApplication.conversation');
    return {
      variant: 'success',
      duration: 10000,
      title: conversation ? (
        <FormattedMessage id="Conversation.created" defaultMessage="Conversation created" />
      ) : (
        <FormattedMessage id="MessageSent" defaultMessage="Message sent" />
      ),
      message: conversation && (
        <Link
          openInNewTab
          href={`/${collective.slug}/conversations/${conversation.slug}-${conversation.id}`}
          className="inline-flex items-center gap-1 text-primary underline-offset-4 hover:underline"
        >
          <FormattedMessage id="Conversation.view" defaultMessage="View Conversation" />
          <ExternalLink size={14} />
        </Link>
      ),
    };
  } else if (action === ACTIONS.APPROVE) {
    return {
      variant: 'success',
      message: intl.formatMessage(msg.approved, { name: collective.name }),
    };
  } else if (action === ACTIONS.REJECT) {
    return {
      variant: 'success',
      message: intl.formatMessage(msg.rejected, { name: collective.name }),
    };
  } else {
    return {
      variant: 'success',
    };
  }
};

type HostApplicationDrawerProps = {
  open: boolean;
  onClose: () => void;
  applicationId: string;
  editCollectiveMutation?: (collective: { id: number; HostCollectiveId?: number }) => Promise<void>;
};

export default function HostApplicationDrawer({
  open,
  onClose,
  applicationId,
  editCollectiveMutation,
}: HostApplicationDrawerProps) {
  const { LoggedInUser } = useLoggedInUser();

  const intl = useIntl();
  const { toast } = useToast();

  const [callProcessApplication, { loading: loadingMutation }] = useMutation(processApplicationMutation);

  const [threadItems, setThreadItems] = React.useState<
    HostApplicationThreadQuery['hostApplication']['threadComments']['nodes']
  >([]);
  const [threadOffset, setThreadOffset] = React.useState(0);
  const [isMessageExpanded, setIsMessageExpanded] = React.useState(true);

  React.useEffect(() => {
    setThreadItems([]);
    setThreadOffset(0);
    setIsMessageExpanded(true);
  }, [applicationId]);

  const onDataComplete = React.useCallback(
    (data: HostApplicationThreadQuery, existingThreadItems = threadItems) => {
      const existingPrevPageData = existingThreadItems.slice(0, data.hostApplication.threadComments.offset);
      const replaced = existingThreadItems.slice(
        data.hostApplication.threadComments.offset,
        data.hostApplication.threadComments.offset + data.hostApplication.threadComments.nodes.length,
      );
      const existingNextPageData = existingThreadItems.slice(
        data.hostApplication.threadComments.offset + replaced.length,
      );

      const newData = [...existingPrevPageData, ...data.hostApplication.threadComments.nodes, ...existingNextPageData];
      setThreadItems(newData);
    },
    [threadItems],
  );

  const applicationQuery = useQuery<HostApplicationThreadQuery, HostApplicationThreadQueryVariables>(
    gql`
      query HostApplicationThread($hostApplication: HostApplicationReferenceInput!, $offset: Int!, $limit: Int!) {
        hostApplication(hostApplication: $hostApplication) {
          ...HostApplicationFields
          threadComments: comments(limit: $limit, offset: $offset, orderBy: { field: CREATED_AT, direction: ASC }) {
            totalCount
            offset
            limit
            nodes {
              ...CommentFields
            }
          }
        }
      }

      ${commentFieldsFragment}
      ${hostApplicationFieldsFragment}
    `,
    {
      fetchPolicy: 'cache-and-network',
      variables: {
        hostApplication: {
          id: applicationId,
        },
        offset: threadOffset,
        limit: 100,
      },
      skip: !open || !applicationId,
      onCompleted: onDataComplete,
    },
  );

  const error = applicationQuery.error;
  const loading = applicationQuery.loading || loadingMutation;
  const application = applicationQuery.data?.hostApplication;
  const account = application?.account;
  const host = application?.host;
  const customData = application?.customData;

  const isHostAdmin = LoggedInUser?.isAdminOfCollective?.(host);

  const requiresMinimumNumberOfAdmins = host?.policies?.COLLECTIVE_MINIMUM_ADMINS?.numberOfAdmins > 1;

  const hasEnoughAdmins =
    requiresMinimumNumberOfAdmins &&
    account?.admins?.totalCount >= host?.policies?.COLLECTIVE_MINIMUM_ADMINS?.numberOfAdmins;
  const hasEnoughInvitedAdmins =
    requiresMinimumNumberOfAdmins &&
    account?.admins?.totalCount + account?.memberInvitations?.length >=
      host?.policies?.COLLECTIVE_MINIMUM_ADMINS?.numberOfAdmins;

  const totalThreadItems = application?.threadComments?.totalCount ?? 0;

  const processApplication = async (action: ProcessHostApplicationAction, message?: string, onSuccess?: () => void) => {
    if (!application) {
      return undefined;
    }

    try {
      const variables = { hostApplication: { id: application.id }, action, message };
      const result = await callProcessApplication({ variables });
      toast(getSuccessToast(intl, action, account, result));

      if (onSuccess) {
        onSuccess();
      }
      return result;
    } catch (e) {
      toast({ variant: 'error', message: i18nGraphqlException(intl, e) });
      return undefined;
    }
  };

  const onFetchMore = React.useCallback(() => {
    setThreadOffset(threadItems.length);
  }, [threadItems]);

  const onCommentDeleted = React.useCallback(
    async comment => {
      const commentIdx = threadItems.findIndex(i => i.id === comment.id);
      setThreadItems([...threadItems].filter(ti => ti.id !== comment.id));
      const { data } = await applicationQuery.refetch({ offset: commentIdx });
      onDataComplete(
        data,
        [...threadItems].filter(ti => ti.id !== comment.id),
      );
    },
    [threadItems, applicationQuery, onDataComplete],
  );

  const actions = React.useMemo(
    () =>
      account
        ? {
            primary: [
              {
                key: 'view-collective',
                label: intl.formatMessage(msg.viewCollective),
                href: `/${account.slug}`,
                openInNewTab: true,
                Icon: ExternalLink,
                'data-cy': 'host-application-view-collective',
              },
            ],
          }
        : {},
    [account, intl],
  );

  const hasLegalEntity = customData?.hasLegalEntity === true;
  const ecosystemsRepository = customData?.ecosystemsRepositoryInfo as EcosystemsRepositorySnapshot | undefined;

  return (
    <Sheet open={open} onOpenChange={isOpen => !isOpen && onClose()}>
      <SheetContent className="flex max-w-2xl flex-col overflow-hidden" data-cy="host-application-drawer">
        <div data-cy={account ? `host-application-header-${account.slug}` : null}>
          <DrawerHeader
            actions={actions}
            closeButtonDataCy="close-drawer"
            entityName={
              <div className="flex items-center gap-1">
                {renderStatusBadge(application?.status)}
                <FormattedMessage id="HostApplication.drawer.title" defaultMessage="Host application" />
              </div>
            }
            entityIdentifier={
              application?.publicId ? (
                <CopyID
                  value={application.publicId}
                  tooltipLabel={
                    <FormattedMessage id="HostApplication.drawer.copyId" defaultMessage="Copy application ID" />
                  }
                >
                  #{application.publicId}
                </CopyID>
              ) : (
                <Skeleton className="h-5 w-24" />
              )
            }
            entityLabel={
              account ? (
                <div className="flex min-w-0 items-center gap-1">
                  <LinkCollective
                    collective={account}
                    className="flex min-w-0 items-center gap-2 font-semibold text-foreground hover:text-primary hover:underline"
                  >
                    <Avatar collective={account} radius={24} />
                    <span className="truncate">{account.name}</span>
                  </LinkCollective>
                </div>
              ) : (
                <Skeleton className="h-6 w-48" />
              )
            }
          />
        </div>

        <div className="grow overflow-y-auto px-8 py-4">
          {error ? (
            <MessageBoxGraphqlError error={error} />
          ) : (
            <div className="flex flex-col gap-4">
              {hasLegalEntity && (
                <Alert className="border-yellow-200 bg-yellow-50">
                  <AlertTriangle className="size-4 text-yellow-600" />
                  <AlertDescription>
                    <span className="font-medium">
                      <FormattedMessage
                        id="HostApplication.customData.existingLegalEntity"
                        defaultMessage="Existing legal entity"
                      />
                    </span>{' '}
                    <FormattedMessage
                      id="HostApplication.customData.existingLegalEntityWarning"
                      defaultMessage="This applicant has an existing legal entity. Review for conflicts of interest and restrictions on expenses before onboarding."
                    />
                  </AlertDescription>
                </Alert>
              )}

              {application?.message && !isEmpty(application.message) && (
                <Collapsible open={isMessageExpanded} onOpenChange={setIsMessageExpanded} className="text-sm">
                  <div className="flex items-center gap-2">
                    <FormSectionTitle className="mb-0 flex-1">
                      <FormattedMessage defaultMessage="Application request" id="VNZT95" />
                    </FormSectionTitle>
                    <CollapsibleTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon-xs"
                        aria-label={intl.formatMessage({ defaultMessage: 'Application Request', id: 'bFSM5Q' })}
                      >
                        <ChevronDown
                          className={cn('h-4 w-4 transition-transform', isMessageExpanded && 'rotate-180')}
                        />
                      </Button>
                    </CollapsibleTrigger>
                  </div>
                  <CollapsibleContent>
                    <div className="pt-2 leading-6 break-words whitespace-pre-line text-muted-foreground">
                      {application?.message || <FormattedMessage id="NoMessage" defaultMessage="No message provided" />}
                    </div>
                  </CollapsibleContent>
                </Collapsible>
              )}

              {application && (
                <section className="text-sm">
                  <FormSectionTitle>
                    <FormattedMessage id="HostApplication.drawer.details" defaultMessage="Application details" />
                  </FormSectionTitle>
                  <HostApplicationCustomData customData={customData}>
                    <DataListItem
                      label={<FormattedMessage defaultMessage="Received in" id="4Nv47+" />}
                      value={
                        application.createdAt && (
                          <DateTime dateStyle="medium" timeStyle="short" value={application.createdAt} />
                        )
                      }
                    />
                    <DataListItem
                      label={
                        <div className="flex items-center gap-2">
                          <FormattedMessage id="Admins" defaultMessage="Admins" />
                          {application.status === HostApplicationStatus.PENDING &&
                            requiresMinimumNumberOfAdmins &&
                            hasEnoughInvitedAdmins &&
                            !hasEnoughAdmins && (
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <span className="inline-flex">
                                    <AlertTriangle size={12} className="text-red-600" />
                                  </span>
                                </TooltipTrigger>
                                <TooltipContent>
                                  <FormattedMessage
                                    defaultMessage="This collective doesn’t satisfy the minimum admin requirements as admin invitations are still pending."
                                    id="Lg6nmh"
                                  />
                                </TooltipContent>
                              </Tooltip>
                            )}
                        </div>
                      }
                      value={
                        account?.admins?.totalCount > 0 ? (
                          <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                            <div className="flex items-center -space-x-1">
                              {account?.admins?.nodes?.slice(0, 3).map(admin => (
                                <AccountHoverCard
                                  key={admin.id}
                                  account={admin.account}
                                  includeAdminMembership={{ accountSlug: account.slug }}
                                  trigger={
                                    <span>
                                      <Avatar collective={admin.account} radius={24} />
                                    </span>
                                  }
                                />
                              ))}
                              {account?.admins?.totalCount > 3 && (
                                <div className="pl-2 text-muted-foreground">+{account.admins.totalCount - 3}</div>
                              )}
                            </div>
                          </div>
                        ) : (
                          <span className="text-muted-foreground">
                            <FormattedMessage id="450Fty" defaultMessage="None" />
                          </span>
                        )
                      }
                    />
                    <DataListItem
                      className="min-w-0"
                      itemClassName="min-w-0 max-w-full"
                      label={<FormattedMessage id="Fields.description" defaultMessage="Description" />}
                      value={
                        <span className="block max-w-full break-words whitespace-pre-line">
                          {account?.description || <FormattedMessage id="450Fty" defaultMessage="None" />}
                        </span>
                      }
                    />
                  </HostApplicationCustomData>
                </section>
              )}

              {customData?.validatedRepositoryInfo && (
                <section className="text-sm">
                  <FormSectionTitle>
                    <FormattedMessage
                      id="PendingApplication.RepoInfo.Header"
                      defaultMessage="Validated repository information"
                    />
                  </FormSectionTitle>
                  <ValidatedRepositoryInfo customData={customData} />
                </section>
              )}

              {ecosystemsRepository && (
                <section className="text-sm">
                  <FormSectionTitle>
                    <FormattedMessage
                      id="HostApplication.customData.ecosystems.title"
                      defaultMessage="Repository information"
                    />
                  </FormSectionTitle>
                  <EcosystemsRepositoryInfo
                    repository={ecosystemsRepository}
                    repositoryUrl={customData?.repositoryUrl}
                  />
                </section>
              )}

              <section>
                <FormSectionTitle>
                  <FormattedMessage defaultMessage="Comments" id="wCgTu5" />
                </FormSectionTitle>
                <Thread
                  canComment
                  canUsePrivateNote={isHostAdmin}
                  variant="small"
                  items={threadItems}
                  collective={host}
                  hasMore={!loading && totalThreadItems > threadItems.length}
                  fetchMore={onFetchMore}
                  onCommentDeleted={onCommentDeleted}
                  loading={loading}
                  CommentEntity={{
                    HostApplicationId: applicationId,
                  }}
                  onCommentCreated={async comment => {
                    setThreadItems([comment, ...threadItems]);
                    const { data } = await applicationQuery.refetch({ offset: 0 });
                    onDataComplete(data, [comment, ...threadItems]);
                  }}
                />
              </section>
            </div>
          )}
        </div>

        {application?.status === HostApplicationStatus.PENDING && account && (
          <div className="flex shrink-0 flex-wrap items-center justify-between gap-2 border-t p-4">
            <AcceptRejectButtons
              collective={account}
              isLoading={loading}
              blockActions={Boolean(
                host && 'platformSubscription' in host && host.platformSubscription?.isAccountOnHold,
              )}
              disabled={requiresMinimumNumberOfAdmins && !hasEnoughInvitedAdmins}
              disabledMessage={
                requiresMinimumNumberOfAdmins &&
                !hasEnoughInvitedAdmins &&
                intl.formatMessage({
                  defaultMessage:
                    'You can not approve this collective as it doesn’t satisfy the minimum admin policy set by you.',
                  id: 'mqX77s',
                })
              }
              onApprove={() => processApplication(ACTIONS.APPROVE)}
              onReject={message => processApplication(ACTIONS.REJECT, message)}
              editCollectiveMutation={editCollectiveMutation}
            />
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}
