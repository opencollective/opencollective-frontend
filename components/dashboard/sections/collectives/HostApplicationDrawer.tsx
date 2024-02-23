import React from 'react';
import PropTypes from 'prop-types';
import { useMutation } from '@apollo/client';
import { get, isEmpty } from 'lodash';
import { AlertTriangle, ExternalLink, LinkIcon, Mail, MessageSquare, ShieldCheck } from 'lucide-react';
import { defineMessages, FormattedMessage, useIntl } from 'react-intl';

import { i18nGraphqlException } from '../../../../lib/errors';
import { API_V2_CONTEXT } from '../../../../lib/graphql/helpers';
import type {
  Account,
  Host,
  HostApplication as GraphQLHostApplication,
  MemberCollection,
} from '../../../../lib/graphql/types/v2/graphql';
import { HostApplicationStatus, ProcessHostApplicationAction } from '../../../../lib/graphql/types/v2/graphql';
import { i18nCustomApplicationFormLabel } from '../../../../lib/i18n/custom-application-form';

import Avatar from '../../../Avatar';
import { Drawer, DrawerActions, DrawerHeader } from '../../../Drawer';
import { Flex } from '../../../Grid';
import AcceptRejectButtons from '../../../host-dashboard/AcceptRejectButtons';
import ApplicationMessageModal from '../../../host-dashboard/ApplicationMessageModal';
import ValidatedRepositoryInfo from '../../../host-dashboard/ValidatedRepositoryInfo';
import Link from '../../../Link';
import LinkCollective from '../../../LinkCollective';
import { APPLICATION_DATA_AMOUNT_FIELDS } from '../../../ocf-host-application/ApplicationForm';
import StyledLink from '../../../StyledLink';
import StyledRoundButton from '../../../StyledRoundButton';
import StyledTag from '../../../StyledTag';
import StyledTooltip from '../../../StyledTooltip';
import { InfoList, InfoListItem } from '../../../ui/InfoList';
import { type Toast, useToast } from '../../../ui/useToast';

import { hostApplicationsMetadataQuery, hostApplicationsQuery, processApplicationMutation } from './queries';

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

const StatusTag = ({ status }) => {
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

StatusTag.propTypes = {
  status: PropTypes.oneOf(['PENDING', 'REJECTED', 'APPROVED']),
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
  const { toast } = useToast();
  const account = application.account as Account & {
    admins: MemberCollection;
  };
  const [callProcessApplication, { loading }] = useMutation(processApplicationMutation, {
    context: API_V2_CONTEXT,
    refetchQueries: [hostApplicationsQuery, hostApplicationsMetadataQuery],
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
      toast(getSuccessToast(intl, action, account, result));

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

  return (
    <React.Fragment>
      <div>
        <DrawerHeader
          onClose={onClose}
          data-cy={`host-application-header-${account.slug}`}
          title={
            <FormattedMessage
              defaultMessage="Application <ApplicationId></ApplicationId> to <HostCollectiveName></HostCollectiveName>"
              values={{
                ApplicationId: () => (
                  <StyledTag display="inline-block" verticalAlign="middle" mx={1} fontSize="12px">
                    #{application.id.split('-')[0]}
                  </StyledTag>
                ),
                HostCollectiveName: () => (
                  <LinkCollective className="text-inherit hover:underline" collective={host}>
                    {host.name}
                  </LinkCollective>
                ),
              }}
            />
          }
          statusTag={<StatusTag status={status} />}
        />

        <InfoList className="sm:grid-cols-2">
          <InfoListItem
            title={<FormattedMessage defaultMessage="Account" />}
            value={
              <LinkCollective
                collective={application.account}
                className="flex items-center gap-2 font-medium text-slate-700 hover:text-slate-700 hover:underline"
                withHoverCard
              >
                <Avatar collective={application.account} radius={24} />
                {application.account.name}
              </LinkCollective>
            }
          />
          <InfoListItem
            title={<FormattedMessage id="Fields.description" defaultMessage="Description" />}
            value={application.account.description}
          />
          <InfoListItem
            className="sm:col-span-2"
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
                      withHoverCard
                      hoverCardProps={{ includeAdminMembership: { accountSlug: application.account.slug } }}
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
        </InfoList>
      </div>
      <DrawerActions>
        <div className="flex w-full justify-between">
          <Flex alignItems="center" gap="10px">
            <StyledRoundButton onClick={() => setShowContactModal(true)}>
              <Mail size={16} color="#4E5052" />
            </StyledRoundButton>
          </Flex>
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
        </div>
      </DrawerActions>

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
  onClose,
  application,
  host,
}: {
  open: boolean;
  onClose: () => void;
  application: GraphQLHostApplication;
  host: Host;
}) {
  return (
    <Drawer open={open} onClose={onClose} showActionsContainer className="max-w-2xl" data-cy="host-application-drawer">
      <HostApplication onClose={onClose} application={application} host={host} />
    </Drawer>
  );
}
