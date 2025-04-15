import React from 'react';
import { gql, useMutation, useQuery } from '@apollo/client';
import { get, isEmpty } from 'lodash';
import { AlertTriangle, ExternalLink, LinkIcon, ShieldCheck } from 'lucide-react';
import { defineMessages, FormattedMessage, useIntl } from 'react-intl';

import { i18nGraphqlException } from '../../../../lib/errors';
import { API_V2_CONTEXT } from '../../../../lib/graphql/helpers';
import type {
  HostApplicationThreadQuery,
  HostApplicationThreadQueryVariables,
} from '../../../../lib/graphql/types/v2/graphql';
import { HostApplicationStatus, ProcessHostApplicationAction } from '../../../../lib/graphql/types/v2/schema';
import useLoggedInUser from '../../../../lib/hooks/useLoggedInUser';
import { i18nCustomApplicationFormLabel } from '../../../../lib/i18n/custom-application-form';

import { AccountHoverCard } from '../../../AccountHoverCard';
import Avatar from '../../../Avatar';
import { commentFieldsFragment } from '../../../conversations/graphql';
import Thread from '../../../conversations/Thread';
import DateTime from '../../../DateTime';
import { Drawer, DrawerActions, DrawerHeader } from '../../../Drawer';
import Link from '../../../Link';
import LinkCollective from '../../../LinkCollective';
import LoadingPlaceholder from '../../../LoadingPlaceholder';
import MessageBoxGraphqlError from '../../../MessageBoxGraphqlError';
import StyledLink from '../../../StyledLink';
import StyledTag from '../../../StyledTag';
import StyledTooltip from '../../../StyledTooltip';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '../../../ui/Accordion';
import { InfoList, InfoListItem } from '../../../ui/InfoList';
import { type Toast, useToast } from '../../../ui/useToast';

import AcceptRejectButtons from './AcceptRejectButtons';
import { HostApplicationFields, processApplicationMutation } from './queries';
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
});

const APPLICATION_DATA_AMOUNT_FIELDS = ['totalAmountRaised', 'totalAmountToBeRaised'];

const ACTIONS = ProcessHostApplicationAction;

interface StatusTagProps {
  status?: "PENDING" | "REJECTED" | "APPROVED";
}

const StatusTag = ({
  status
}: StatusTagProps) => {
  const tagProps = {
    display: 'block',
    textTransform: 'uppercase',
    fontWeight: 700,
    fontSize: '12px',
  };

  switch (status) {
    case 'PENDING':
      return (
        <StyledTag {...tagProps} type="warning">
          <FormattedMessage id="Pending" defaultMessage="Pending" />
        </StyledTag>
      );
    case 'APPROVED':
      return (
        <StyledTag {...tagProps} type="success">
          <FormattedMessage id="PendingApplication.Approved" defaultMessage="Approved" />
        </StyledTag>
      );
    case 'REJECTED':
      return (
        <StyledTag {...tagProps} type="error">
          <FormattedMessage id="PendingApplication.Rejected" defaultMessage="Rejected" />
        </StyledTag>
      );
    default:
      return null;
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
        <StyledLink
          as={Link}
          openInNewTab
          href={`/${collective.slug}/conversations/${conversation.slug}-${conversation.id}`}
        >
          <FormattedMessage id="Conversation.view" defaultMessage="View Conversation" />
          &nbsp;
          <ExternalLink size="1em" style={{ verticalAlign: 'middle' }} />
        </StyledLink>
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

function HostApplication({
  open,
  applicationId,
  onClose,
  editCollectiveMutation,
}: {
  open: boolean;
  onClose: () => void;
  applicationId: string;
  editCollectiveMutation?: (collective: { id: number; HostCollectiveId?: number }) => Promise<void>;
}) {
  const { LoggedInUser } = useLoggedInUser();

  const intl = useIntl();
  const { toast } = useToast();

  const [callProcessApplication, { loading: loadingMutation }] = useMutation(processApplicationMutation, {
    context: API_V2_CONTEXT,
  });

  const [threadItems, setThreadItems] = React.useState<
    HostApplicationThreadQuery['hostApplication']['threadComments']['nodes']
  >([]);
  const [threadOffset, setThreadOffset] = React.useState(0);

  React.useEffect(() => {
    setThreadItems([]);
    setThreadOffset(0);
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
      ${HostApplicationFields}
    `,
    {
      context: API_V2_CONTEXT,
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

  const isHostAdmin = LoggedInUser.isAdminOfCollective(host);

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
    }
  };

  const renderCustomDataContent = key => {
    /** Amount was previously stored as a number in cents */
    if (APPLICATION_DATA_AMOUNT_FIELDS.includes(key) && typeof application.customData[key] === 'number') {
      return `${application.customData[key] / 100}$`;
    } else if (key === 'repositoryUrl') {
      return (
        <StyledLink
          openInNewTabNoFollow
          href={application.customData?.repositoryUrl}
          className="flex items-center gap-2 underline"
        >
          <LinkIcon size={14} />
          {application.customData?.repositoryUrl.split('//')[1]}
        </StyledLink>
      );
    } else {
      return application.customData[key];
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

  return (
    <Drawer
      open={open}
      onClose={onClose}
      showActionsContainer={application?.status === HostApplicationStatus.PENDING}
      className="max-w-2xl"
      data-cy="host-application-drawer"
    >
      <div>
        <DrawerHeader
          onClose={onClose}
          data-cy={account ? `host-application-header-${account.slug}` : null}
          title={
            <FormattedMessage
              defaultMessage="Application <ApplicationId></ApplicationId> to <HostCollectiveName></HostCollectiveName>"
              id="pCDDhq"
              values={{
                ApplicationId: () =>
                  applicationId ? (
                    <StyledTag display="inline-block" verticalAlign="middle" mx={1} fontSize="12px">
                      #{applicationId.split('-')[0]}
                    </StyledTag>
                  ) : (
                    <LoadingPlaceholder className="inline-block" height={20} width={60} />
                  ),
                HostCollectiveName: () =>
                  host ? (
                    <LinkCollective className="text-inherit hover:underline" collective={host}>
                      {host.name}
                    </LinkCollective>
                  ) : (
                    <LoadingPlaceholder className="inline-block" height={20} width={60} />
                  ),
              }}
            />
          }
          statusTag={
            application?.status ? (
              <StatusTag status={application.status} />
            ) : (
              <LoadingPlaceholder height={20} width={60} />
            )
          }
        />

        {error ? (
          <MessageBoxGraphqlError error={error} />
        ) : (
          <React.Fragment>
            <InfoList className="sm:grid-cols-3">
              <InfoListItem
                className="border-none py-2"
                title={<FormattedMessage defaultMessage="Account" id="TwyMau" />}
                value={
                  account ? (
                    <LinkCollective
                      collective={account}
                      className="flex items-center gap-2 font-medium text-slate-700 hover:text-slate-700 hover:underline"
                      withHoverCard
                    >
                      <Avatar collective={account} radius={24} />
                      {account.name}
                    </LinkCollective>
                  ) : (
                    <LoadingPlaceholder width={60} height={20} />
                  )
                }
              />
              {application?.createdAt && (
                <InfoListItem
                  className="border-none py-2"
                  title={<FormattedMessage id="expense.incurredAt" defaultMessage="Date" />}
                  value={<DateTime dateStyle="medium" value={application?.createdAt} />}
                />
              )}
              <InfoListItem
                className="border-none py-2"
                title={
                  <div className="flex items-center gap-2">
                    <FormattedMessage id="Admins" defaultMessage="Admins" />
                    {application &&
                      application.status === HostApplicationStatus.PENDING &&
                      requiresMinimumNumberOfAdmins &&
                      hasEnoughInvitedAdmins &&
                      !hasEnoughAdmins && (
                        <StyledTooltip
                          noArrow
                          content={
                            <FormattedMessage
                              defaultMessage="This collective doesn’t satisfy the minimum admin requirements as admin invitations are still pending."
                              id="Lg6nmh"
                            />
                          }
                        >
                          <div>
                            <AlertTriangle size={12} className="text-red-600" />
                          </div>
                        </StyledTooltip>
                      )}
                  </div>
                }
                value={
                  <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                    <div className="flex items-center -space-x-1">
                      {account?.admins?.nodes &&
                        account.admins.nodes.slice(0, 3).map(admin => (
                          <AccountHoverCard
                            key={admin.id}
                            account={admin.account}
                            includeAdminMembership={{ accountSlug: application.account.slug }}
                            trigger={
                              <span>
                                <Avatar collective={admin.account} radius={24} />
                              </span>
                            }
                          />
                        ))}
                      {account?.admins?.totalCount > 3 && (
                        <div className="pl-2 text-slate-600">+{account?.admins.totalCount - 3}</div>
                      )}
                    </div>
                  </div>
                }
              />

              <Accordion type="single" collapsible className="mt-4 text-sm sm:col-span-3">
                <AccordionItem value="description" className="rounded border px-4">
                  <AccordionTrigger>
                    <div className="leading-6 font-medium text-slate-900">
                      <FormattedMessage id="Fields.description" defaultMessage="Description" />
                    </div>
                  </AccordionTrigger>
                  <AccordionContent>
                    <div className="mt-1 leading-6 text-slate-700 sm:mt-2">
                      {account ? account.description : <LoadingPlaceholder width={60} height={20} />}
                    </div>
                  </AccordionContent>
                </AccordionItem>
              </Accordion>

              {application?.customData?.validatedRepositoryInfo && (
                <InfoListItem
                  title={
                    <div className="flex items-center gap-1.5">
                      <ShieldCheck size={16} className="text-slate-700" />
                      <FormattedMessage
                        id="PendingApplication.RepoInfo.Header"
                        defaultMessage="Validated repository information"
                      />
                    </div>
                  }
                  value={<ValidatedRepositoryInfo customData={application?.customData} />}
                />
              )}

              {application?.customData &&
                Object.keys(application.customData).map(key => {
                  // Don't show repository info twice as it is displayed on top in a special component
                  if (
                    key === 'validatedRepositoryInfo' ||
                    (key === 'licenseSpdxId' && application.customData.validatedRepositoryInfo) ||
                    (key === 'useGithubValidation' && application.customData.validatedRepositoryInfo) ||
                    (key === 'typeOfProject' && application.customData.validatedRepositoryInfo)
                  ) {
                    return null;
                  }

                  // Don't show empty fields
                  if (isEmpty(application.customData[key])) {
                    return null;
                  }

                  return (
                    <InfoListItem
                      key={key}
                      title={i18nCustomApplicationFormLabel(intl, key)}
                      value={renderCustomDataContent(key)}
                    />
                  );
                })}

              <Accordion type="single" collapsible className="mt-4 text-sm sm:col-span-3">
                <AccordionItem value="message" className="rounded border px-4">
                  <AccordionTrigger>
                    <div className="leading-6 font-medium text-slate-900">
                      <FormattedMessage defaultMessage="Application Request" id="bFSM5Q" />
                    </div>
                  </AccordionTrigger>
                  <AccordionContent>
                    <div className="mt-1 leading-6 text-slate-700 sm:mt-2">
                      {application?.message || (
                        <p className="whitespace-pre-line">
                          <FormattedMessage id="NoMessage" defaultMessage="No message provided" />
                        </p>
                      )}
                    </div>
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </InfoList>

            <div className="my-5 border-t border-slate-100" />
            <div className="mb-5 text-sm leading-3 text-[#344256]">
              <span className="font-bold">
                <FormattedMessage defaultMessage="Comments" id="wCgTu5" />
              </span>
            </div>

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
          </React.Fragment>
        )}
      </div>
      {application?.status === HostApplicationStatus.PENDING && (
        <DrawerActions>
          <div className="flex w-full justify-between">
            <AcceptRejectButtons
              collective={account}
              isLoading={loading}
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
        </DrawerActions>
      )}
    </Drawer>
  );
}

export default function HostApplicationDrawer({
  open,
  onClose,
  applicationId,
  editCollectiveMutation,
}: {
  open: boolean;
  onClose: () => void;
  applicationId: string;
  editCollectiveMutation?: (collective: { id: number; HostCollectiveId?: number }) => Promise<void>;
}) {
  return (
    <HostApplication
      open={open}
      onClose={onClose}
      applicationId={applicationId}
      editCollectiveMutation={editCollectiveMutation}
    />
  );
}
