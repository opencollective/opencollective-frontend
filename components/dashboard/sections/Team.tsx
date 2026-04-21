import React from 'react';
import { useMutation, useQuery } from '@apollo/client';
import { compact, flatten, orderBy } from 'lodash';
import { Mail, MoreHorizontal, Pencil, PlusIcon } from 'lucide-react';
import { FormattedDate, FormattedMessage, useIntl } from 'react-intl';

import { FEATURES, isFeatureEnabled } from '../../../lib/allowed-features';
import roles from '../../../lib/constants/roles';
import { i18nGraphqlException } from '../../../lib/errors';
import { AccountType } from '../../../lib/graphql/types/v2/graphql';
import formatMemberRole from '../../../lib/i18n/member-role';
import { getCollectivePageRoute } from '../../../lib/url-helpers';
import type { MemberFieldsFragment, TeamSectionQuery } from '@/lib/graphql/types/v2/graphql';

import LinkCollective from '@/components/LinkCollective';
import { DataTable } from '@/components/table/DataTable';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/Tooltip';
import { useToast } from '@/components/ui/useToast';

import Avatar from '../../Avatar';
import EditMemberModal from '../../edit-collective/sections/team/EditMemberModal';
import InviteMemberModal, { inviteMemberMutation } from '../../edit-collective/sections/team/InviteMemberModal';
import { teamSectionQuery } from '../../edit-collective/sections/team/queries';
import { getI18nLink } from '../../I18nFormatters';
import MessageBox from '../../MessageBox';
import { Button } from '../../ui/Button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '../../ui/DropdownMenu';
import { TableActionsButton } from '../../ui/Table';
import DashboardHeader from '../DashboardHeader';
import type { DashboardSectionProps } from '../types';

type MemberTableRecord = (MemberFieldsFragment | TeamSectionQuery['memberInvitations'][number]) & {
  accountContext?: TeamSectionQuery['account'];
};
const MembersTable = ({
  members,
  setShowEditModal,
  loading,
  displayAccount,
  ...props
}: {
  members: Array<MemberTableRecord>;
  setShowEditModal: (unknown) => void;
  loading: boolean;
  displayAccount?: boolean;
}) => {
  const intl = useIntl();
  const { toast } = useToast();
  const [inviteMember] = useMutation(inviteMemberMutation);

  const handleResendInvite = async (member: MemberTableRecord) => {
    try {
      await inviteMember({
        variables: {
          memberAccount: { id: member.account.id },
          account: { id: member.accountContext.id },
          role: member.role,
        },
      });
      toast({
        variant: 'success',
        title: intl.formatMessage({ defaultMessage: 'Invitation resent', id: 'member.invite.success' }),
      });
    } catch (e) {
      toast({
        variant: 'error',
        title: intl.formatMessage({ defaultMessage: 'Cannot send member invitation', id: 'mGnvLd' }),
        message: i18nGraphqlException(intl, e),
      });
    }
  };

  const columns = compact([
    {
      header: () => <FormattedMessage defaultMessage="Member" id="7L86Z5" />,
      accessorKey: 'member',
      cell: ({ row }) => {
        const member = row.original;

        const isInvitation = member.__typename === 'MemberInvitation';
        const memberAccount = member.account;

        const isInherited = member.inherited;
        return (
          <div className="flex items-center">
            <LinkCollective collective={memberAccount} className="flex items-center hover:underline">
              <Avatar collective={memberAccount} radius={32} className="mr-4" />
              {memberAccount.name}
            </LinkCollective>
            {memberAccount.email && <span className="ml-1 text-slate-500">{`<${memberAccount.email}>`}</span>}
            {isInvitation && (
              <span className="ml-2 rounded-sm bg-slate-100 px-2 py-1 text-xs font-medium text-slate-700">
                <FormattedMessage id="Pending" defaultMessage="Pending" />
              </span>
            )}
            {isInherited && (
              <Tooltip>
                <TooltipTrigger>
                  <span className="ml-2 rounded-sm bg-slate-100 px-2 py-1 text-xs font-medium text-slate-700">
                    <FormattedMessage id="Team.InheritedMember" defaultMessage="Inherited" />
                  </span>
                </TooltipTrigger>
                <TooltipContent>
                  <FormattedMessage
                    defaultMessage="This member is inherited from {parentCollectiveName} and cannot be removed."
                    id="Team.InheritedMember.Tooltip"
                    values={{ parentCollectiveName: member.contextAccount?.parent?.name }}
                  />
                </TooltipContent>
              </Tooltip>
            )}
          </div>
        );
      },
    },
    displayAccount && {
      header: () => <FormattedMessage defaultMessage="Account" id="TwyMau" />,
      accessorKey: 'accountContext',
      cell: ({ cell }) => {
        const accountContext = cell.getValue();
        return accountContext?.name || '';
      },
    },
    {
      header: () => <FormattedMessage defaultMessage="Role" id="members.role.label" />,
      accessorKey: 'role',
      cell: ({ cell }) => {
        const role = cell.getValue();
        return formatMemberRole(intl, role);
      },
    },
    {
      header: () => <FormattedMessage defaultMessage="Since" id="user.since.label" />,
      accessorKey: 'since',
      cell: ({ cell }) => {
        const since = cell.getValue();
        return <FormattedDate value={since} />;
      },
    },
    {
      header: '',
      accessorKey: 'actions',
      meta: { className: 'flex justify-end items-center' },
      cell: ({ row }) => {
        const member = row.original;
        const isInvitation = member.__typename === 'MemberInvitation';
        const isInherited = member.inherited;

        return (
          <div className="row flex">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <TableActionsButton data-cy="member-actions-btn">
                  <MoreHorizontal className="relative size-4.5" aria-hidden="true" />
                </TableActionsButton>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem
                  className="cursor-pointer"
                  onClick={() => setShowEditModal(member)}
                  disabled={isInherited}
                >
                  <Pencil className="mr-2" size="16" />
                  <FormattedMessage id="Edit" defaultMessage="Edit" />
                </DropdownMenuItem>
                {isInvitation && (
                  <DropdownMenuItem
                    data-cy="resend-invite-btn"
                    className="cursor-pointer"
                    onClick={() => handleResendInvite(member)}
                  >
                    <Mail className="mr-2" size="16" />
                    <FormattedMessage id="ResendInvite" defaultMessage="Resend invite" />
                  </DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        );
      },
    },
  ]);

  return <DataTable loading={loading} columns={columns} data={members} mobileTableView {...props} />;
};

const roleSorter = (member: MemberTableRecord) => {
  if (member.__typename === 'MemberInvitation') {
    return 1;
  }
  switch (member.role) {
    case roles.ADMIN:
      return 2;
    case roles.ACCOUNTANT:
      return 3;
    case roles.COMMUNITY_MANAGER:
      return 4;
    default:
      return 5;
  }
};

const Team = ({ accountSlug }: DashboardSectionProps) => {
  const [showInviteModal, setShowInviteModal] = React.useState(false);
  const [showEditModal, setShowEditModal] = React.useState<MemberTableRecord | null>(null);
  const intl = useIntl();
  const { loading, data, refetch, error } = useQuery<TeamSectionQuery>(teamSectionQuery, {
    variables: { collectiveSlug: accountSlug, account: { slug: accountSlug } },
  });
  const host = data?.account && 'host' in data.account && data.account.host;
  const injectAccount = account => member => ({ ...member, accountContext: account });
  const members = orderBy(
    [...(data?.account?.members?.nodes || []), ...(data?.memberInvitations || [])].map(injectAccount(data?.account)),
    [roleSorter, 'since'],
    ['asc', 'asc'],
  ) as MemberTableRecord[];
  const nbAdmins = members.filter(m => m.role === roles.ADMIN && m.id).length;
  const childrenAccountsWithMembers =
    data?.account?.childrenAccounts?.nodes?.filter(child => child.members?.nodes?.length > 0) || [];
  const childrenAccountsMembers = flatten(
    childrenAccountsWithMembers.map(child => child.members.nodes.map(injectAccount(child))),
  ) as MemberTableRecord[];
  const isLastAdmin =
    showEditModal &&
    showEditModal.role === roles.ADMIN &&
    showEditModal.id &&
    nbAdmins <= (host?.policies?.COLLECTIVE_MINIMUM_ADMINS?.numberOfAdmins || 1);

  return (
    <div className="flex flex-col gap-4">
      <DashboardHeader
        title={<FormattedMessage id="Team" defaultMessage="Team" />}
        description={
          <FormattedMessage
            id="Team.Description"
            defaultMessage="Manage team members, their roles, and invite new members."
          />
        }
        actions={
          <Button data-cy="invite-member-btn" size="sm" className="gap-1" onClick={() => setShowInviteModal(true)}>
            <span>
              <FormattedMessage defaultMessage="Invite member" id="4h0Zyf" />
            </span>
            <PlusIcon size={20} />
          </Button>
        }
      />

      {error ? (
        <MessageBox type="error" withIcon fontSize="13px">
          {i18nGraphqlException(intl, error)}
        </MessageBox>
      ) : data?.account?.isFrozen ? (
        <MessageBox type="warning" fontSize="13px" withIcon>
          <FormattedMessage
            defaultMessage="This account is currently frozen, its team members therefore cannot be edited."
            id="jcAKng"
          />{' '}
          {isFeatureEnabled(host, FEATURES.CONTACT_FORM) && (
            <FormattedMessage
              defaultMessage="Please <ContactLink>contact</ContactLink> your fiscal host for more details."
              id="KxBiJC"
              values={{ ContactLink: getI18nLink({ href: `${getCollectivePageRoute(host)}/contact` }) }}
            />
          )}
        </MessageBox>
      ) : (
        <React.Fragment>
          <div>
            {[AccountType.COLLECTIVE, AccountType.FUND].includes(data?.account?.type) &&
              Boolean(host?.policies?.COLLECTIVE_MINIMUM_ADMINS?.numberOfAdmins) && (
                <div className="max-w-prose">
                  <FormattedMessage
                    defaultMessage="Your host requires that Collectives have {numberOfAdmins, plural, one {# active administrator} other {# active administrators} }."
                    id="XW00me"
                    values={host.policies.COLLECTIVE_MINIMUM_ADMINS}
                  />
                  {host.policies.COLLECTIVE_MINIMUM_ADMINS.freeze && (
                    <React.Fragment>
                      &nbsp;
                      <FormattedMessage
                        defaultMessage="In case of a shortfall, your collective will be frozen until the minimum required administrators are added."
                        id="kOVj5R"
                      />
                    </React.Fragment>
                  )}
                </div>
              )}
            {host?.policies?.COLLECTIVE_MINIMUM_ADMINS &&
              nbAdmins < host.policies.COLLECTIVE_MINIMUM_ADMINS.numberOfAdmins && (
                <MessageBox type="error" my={3} fontSize="13px">
                  <FormattedMessage
                    defaultMessage="Your collective doesn’t meet the requirements of having a minimum of {numberOfAdmins, plural, one {# administrator} other {# administrators} }. Add more administrators to comply with your host’s policy."
                    id="vuvLi/"
                    values={host.policies.COLLECTIVE_MINIMUM_ADMINS}
                  />
                </MessageBox>
              )}
          </div>

          <MembersTable
            data-cy="members-table"
            members={members}
            setShowEditModal={setShowEditModal}
            loading={loading}
          />
          {childrenAccountsWithMembers.length > 0 && (
            <div className="mt-4 flex flex-col gap-2">
              <div className="flex items-center gap-1.5 text-xl leading-9 font-bold tracking-tight text-foreground">
                <FormattedMessage id="OtherAdmins" defaultMessage="Other Admins" />
              </div>
              <p className="max-w-prose">
                <FormattedMessage
                  defaultMessage="This collective has Events and Projects that hold members with privileged access roles outside your admin team."
                  id="068S+6"
                />
              </p>

              <div>
                <MembersTable
                  data-cy="children-members-table"
                  members={childrenAccountsMembers}
                  setShowEditModal={setShowEditModal}
                  loading={loading}
                  displayAccount
                />
              </div>
            </div>
          )}
          {showInviteModal && (
            <InviteMemberModal
              intl={intl}
              collective={data?.account}
              membersIds={members.map(m => m.id)}
              cancelHandler={() => setShowInviteModal(false)}
            />
          )}
          {showEditModal && (
            <EditMemberModal
              intl={intl}
              member={showEditModal}
              collective={showEditModal.accountContext || data?.account}
              cancelHandler={() => setShowEditModal(null)}
              onEdit={refetch}
              isLastAdmin={isLastAdmin}
              canRemove={!isLastAdmin}
            />
          )}
        </React.Fragment>
      )}
    </div>
  );
};

export default Team;
