import React from 'react';
import PropTypes from 'prop-types';
import { useMutation } from '@apollo/client';
import { get, isEmpty } from 'lodash';
import {
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  ChevronDown,
  ExternalLink,
  LinkIcon,
  Mail,
  MessageSquare,
  MoreHorizontal,
  PanelRightClose,
  ShieldCheck,
  X,
} from 'lucide-react';
import { defineMessages, FormattedMessage, useIntl } from 'react-intl';
import DateTime from '../../DateTime';
import { i18nGraphqlException } from '../../../lib/errors';
import { API_V2_CONTEXT } from '../../../lib/graphql/helpers';
import {
  Account,
  Host,
  HostApplication as GraphQLHostApplication,
  HostApplicationStatus,
  MemberCollection,
  ProcessHostApplicationAction,
} from '../../../lib/graphql/types/v2/graphql';
import { Tooltip, TooltipContent, TooltipTrigger } from '../../ui/Tooltip';
import { i18nCustomApplicationFormLabel } from '../../../lib/i18n/custom-application-form';

import Avatar from '../../Avatar';
import { Drawer, DrawerActions, DrawerHeader } from '../../Drawer';
import { Flex } from '../../Grid';
import Link from '../../Link';
import LinkCollective from '../../LinkCollective';
import { APPLICATION_DATA_AMOUNT_FIELDS } from '../../ocf-host-application/ApplicationForm';
import StyledLink from '../../StyledLink';
import StyledRoundButton from '../../StyledRoundButton';
import StyledTag from '../../StyledTag';
import StyledTooltip from '../../StyledTooltip';
import { TOAST_TYPE, useToasts } from '../../ToastProvider';
import { InfoList, InfoListItem } from '../../ui/InfoList';
import AcceptRejectButtons from '../AcceptRejectButtons';
import ApplicationMessageModal from '../ApplicationMessageModal';
import ValidatedRepositoryInfo from '../ValidatedRepositoryInfo';

import { hostApplicationsQuery, processApplicationMutation } from './queries';

import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetBody,
  SheetTrigger,
} from '../../ui/Sheet';

import { StatusTag } from './HostApplicationsTable';
import { Separator } from '../../ui/Separator';
import { Button } from '../../ui/Button';
import { Badge } from '../../ui/Badge';

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

const ACTIONS = ProcessHostApplicationAction;

const getSuccessToast = (intl, action, collective, result) => {
  if (action === ACTIONS.SEND_PRIVATE_MESSAGE || action === ACTIONS.SEND_PUBLIC_MESSAGE) {
    const conversation = get(result, 'data.processHostApplication.conversation');
    return {
      type: TOAST_TYPE.SUCCESS,
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
      type: TOAST_TYPE.SUCCESS,
      message: intl.formatMessage(msg.approved, { name: collective.name }),
    };
  } else if (action === ACTIONS.REJECT) {
    return {
      type: TOAST_TYPE.SUCCESS,
      message: intl.formatMessage(msg.rejected, { name: collective.name }),
    };
  } else {
    return { type: TOAST_TYPE.SUCCESS };
  }
};

export function HostApplication({
  host,
  application,
  onClose,
}: {
  onClose: () => void;
  application: GraphQLHostApplication;
  host: Host;
}) {
  const intl = useIntl();
  const [status, setStatus] = React.useState(application?.status);
  const [showContactModal, setShowContactModal] = React.useState(false);
  const { addToast } = useToasts();
  const account = application.account as Account & {
    admins: MemberCollection;
  };
  const [callProcessApplication, { loading }] = useMutation(processApplicationMutation, {
    context: API_V2_CONTEXT,
    refetchQueries: [hostApplicationsQuery],
  });
  const hasNothingToShow = !application.message && !application.customData;

  const requiresMinimumNumberOfAdmins = host?.policies?.COLLECTIVE_MINIMUM_ADMINS?.numberOfAdmins > 1;

  const hasEnoughAdmins =
    requiresMinimumNumberOfAdmins &&
    account.admins.totalCount >= host.policies.COLLECTIVE_MINIMUM_ADMINS.numberOfAdmins;
  const hasEnoughInvitedAdmins =
    requiresMinimumNumberOfAdmins &&
    account.admins.totalCount + application.account.memberInvitations.length >=
      host.policies.COLLECTIVE_MINIMUM_ADMINS.numberOfAdmins;

  const processApplication = async (action: ProcessHostApplicationAction, message?: string, onSuccess?: () => void) => {
    try {
      const variables = { host: { id: host.id }, account: { id: account.id }, action, message };
      const result = await callProcessApplication({ variables });

      addToast(getSuccessToast(intl, action, account, result));
      if (action === ACTIONS.APPROVE) {
        setStatus(HostApplicationStatus.APPROVED);
      } else if (action === ACTIONS.REJECT) {
        setStatus(HostApplicationStatus.REJECTED);
      }
      if (onSuccess) {
        onSuccess();
      }
      return result;
    } catch (e) {
      addToast({ type: TOAST_TYPE.ERROR, message: i18nGraphqlException(intl, e) });
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

  console.log({ application });

  return (
    <React.Fragment>
      <SheetHeader>
        <div className="flex w-full items-center justify-between">
          <div className="flex items-center gap-1">
            {/* <Button variant="outline" className="" size={'sm-icon'} onClick={onClose}>
              <X size={16} />
            </Button> */}

            <p className="text-sm font-medium text-muted-foreground">
              Host Applications / <span className="font-normal">#4874</span>
            </p>
          </div>

          <div className="flex items-center gap-1">
            {/* {status === HostApplicationStatus.PENDING && (
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
                  })
                }
                onApprove={() => processApplication(ACTIONS.APPROVE)}
                onReject={message => processApplication(ACTIONS.REJECT, message)}
              />
            )}
            <Button
              variant="outline"
              // rounded
              // className="rounded-full"
              size={'sm-icon'}
              onClick={() => setShowContactModal(true)}
            >
              <MoreHorizontal size={16} />
            </Button> */}
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size={'sm-icon'} onClick={onClose}>
                  <ArrowLeft size={16} />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <FormattedMessage
                  defaultMessage="Previous {k}"
                  values={{
                    k: <span className="ml-1 rounded bg-slate-700 px-1 py-0.5 font-mono text-xs font-normal">k</span>,
                  }}
                />
              </TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size={'sm-icon'} onClick={onClose}>
                  <ArrowRight size={16} />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <FormattedMessage
                  defaultMessage="Next {j}"
                  values={{
                    j: <span className="ml-1 rounded bg-slate-700 px-1 py-0.5 font-mono text-xs font-normal">j</span>,
                  }}
                />
              </TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" className="" size={'sm-icon'} onClick={onClose}>
                  <X size={16} />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <FormattedMessage
                  defaultMessage="Close {esc}"
                  values={{
                    esc: (
                      <span className="ml-1 rounded bg-slate-700 px-1 py-0.5 font-mono text-xs font-normal">Esc</span>
                    ),
                  }}
                />
              </TooltipContent>
            </Tooltip>
          </div>
        </div>
        <div>
          <p className="font-medium text-muted-foreground">
            <LinkCollective className="text-foreground hover:underline" collective={application.account}>
              {application.account.name}
            </LinkCollective>
            {/* <StatusTag status={status} size={'lg'} /> */}
          </p>
        </div>

        <div className="flex items-center justify-between gap-1 pt-1">
          <div className="flex items-center gap-2">
            <StatusTag status={status} />{' '}
            <p className="text-sm text-muted-foreground">
              <span className="cursor-pointer text-foreground hover:underline">
                {account.admins.nodes[0].account.name}
              </span>{' '}
              submitted on{' '}
              <span className="">
                <DateTime formatProps={{ month: 'short', day: '2-digit' }} value={application.createdAt} />
              </span>
            </p>
          </div>
          <div className="flex items-center justify-end gap-1">
            {status === HostApplicationStatus.PENDING && (
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
                  })
                }
                onApprove={() => processApplication(ACTIONS.APPROVE)}
                onReject={message => processApplication(ACTIONS.REJECT, message)}
              />
            )}
            {/* <Button variant="outline" className="" size={'sm'} onClick={onClose}>
              More <ChevronDown size={16} />
            </Button> */}
            {/* {status === HostApplicationStatus.PENDING && (
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
                  })
                }
                onApprove={() => processApplication(ACTIONS.APPROVE)}
                onReject={message => processApplication(ACTIONS.REJECT, message)}
              />
            )} */}
            <Button
              variant="outline"
              // rounded
              // className="rounded-full"
              size={'sm-icon'}
              onClick={() => setShowContactModal(true)}
            >
              <MoreHorizontal size={16} />
            </Button>
          </div>
        </div>
      </SheetHeader>

      <SheetBody>
        <InfoList className="sm:grid-cols-2">
          {/* <InfoListItem title={<FormattedMessage defaultMessage="Status" />} value={<StatusTag status={status} />} /> */}

          {/* <InfoListItem
            className="border-t-0"
            title={<FormattedMessage defaultMessage="Account" />}
            value={
              <LinkCollective
                collective={application.account}
                className="flex items-center gap-2 font-medium text-slate-700 hover:text-slate-700 hover:underline"
              >
                <Avatar collective={application.account} radius={24} />
                {application.account.name}
              </LinkCollective>
            }
          /> */}
          {/* <InfoListItem
            title={<FormattedMessage defaultMessage="Date" />}
            value={<DateTime dateStyle="medium" value={application.createdAt} />}
          /> */}
          <InfoListItem
            className="border-t-0"
            title={<FormattedMessage id="Fields.description" defaultMessage="Description" />}
            value={application.account.description}
          />
          <InfoListItem
            className="border-t-0"
            title={
              <div className="flex items-center gap-2">
                <FormattedMessage id="Admins" defaultMessage="Admins" />
                {status === HostApplicationStatus.PENDING &&
                  requiresMinimumNumberOfAdmins &&
                  hasEnoughInvitedAdmins &&
                  !hasEnoughAdmins && (
                    <StyledTooltip
                      noArrow
                      content={
                        <FormattedMessage defaultMessage="This collective doesn’t satisfy the minimum admin requirements as admin invitations are still pending." />
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
                {account.admins.nodes.slice(0, 10).map((admin, i, a) => (
                  <div className="flex items-center whitespace-nowrap" key={admin.id}>
                    <LinkCollective
                      collective={admin.account}
                      className="flex items-center gap-2 font-medium text-slate-700 hover:text-slate-700 hover:underline"
                    >
                      <Avatar collective={admin.account} radius={24} /> {admin.account.name}
                    </LinkCollective>
                    {i !== a.length - 1 && <span className="text-slate-500">,</span>}
                  </div>
                ))}
                {account.admins.totalCount > 10 && (
                  <span className="text-slate-600">+ {account.admins.totalCount - 10}</span>
                )}
              </div>
            }
          />

          {(application.message || hasNothingToShow) && (
            <InfoListItem
              className="sm:col-span-2"
              title={
                <div className="flex items-center gap-1.5">
                  <MessageSquare size={16} className="text-slate-700" />
                  <FormattedMessage id="PendingApplication.Message" defaultMessage="Message to Fiscal Host" />
                </div>
              }
              value={
                <p className="whitespace-pre-line">
                  {application.message ?? <FormattedMessage id="NoMessage" defaultMessage="No message provided" />}
                </p>
              }
            />
          )}

          {application.customData?.validatedRepositoryInfo && (
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
              value={<ValidatedRepositoryInfo customData={application.customData} />}
            />
          )}

          {application.customData &&
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
        </InfoList>
      </SheetBody>

      {showContactModal && (
        <ApplicationMessageModal
          collective={account}
          onClose={() => setShowContactModal(false)}
          onConfirm={(message, isPrivate, resetMessage) => {
            setShowContactModal(false);
            const action = isPrivate ? ACTIONS.SEND_PRIVATE_MESSAGE : ACTIONS.SEND_PUBLIC_MESSAGE;
            processApplication(action, message, resetMessage);
          }}
        />
      )}
    </React.Fragment>
  );
}

export default function HostApplicationDrawer({
  open,
  setOpen,
  application,
  host,
}: {
  open: boolean;
  setOpen: (open: boolean) => void;
  application: GraphQLHostApplication;
  host: Host;
}) {
  return (
    <Sheet open={open} onOpenChange={setOpen} data-cy="host-application-drawer">
      <SheetContent size="2xl">
        <HostApplication onClose={() => setOpen(false)} application={application} host={host} />
      </SheetContent>
    </Sheet>
  );
}
