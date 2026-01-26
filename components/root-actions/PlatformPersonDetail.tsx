import React from 'react';
import { useQuery } from '@apollo/client';
import { capitalize, compact } from 'lodash';
import { ArrowLeft, Dot, Mail } from 'lucide-react';

import { getFlagEmoji } from '@/lib/i18n/countries';

import Avatar from '../Avatar';
import { CopyID } from '../CopyId';
import HeroSocialLinks from '../crowdfunding-redesign/SocialLinks';
import DateTime from '../DateTime';
import Link from '../Link';
import LinkCollective from '../LinkCollective';
import LocationAddress from '../LocationAddress';
import MessageBoxGraphqlError from '../MessageBoxGraphqlError';
import { DataTable } from '../table/DataTable';
import { Button } from '../ui/Button';
import { InfoList, InfoListItem } from '../ui/InfoList';
import { Skeleton } from '../ui/Skeleton';

import { platformAccountDetailQuery } from './queries';

interface PlatformPersonDetailProps {
  accountId: string;
  onClose: () => void;
}

const ACCOUNT_TYPE_LABELS: Record<string, string> = {
  INDIVIDUAL: 'Individual',
  USER: 'User',
  ORGANIZATION: 'Organization',
  COLLECTIVE: 'Collective',
  FUND: 'Fund',
  EVENT: 'Event',
  PROJECT: 'Project',
  BOT: 'Bot',
  VENDOR: 'Vendor',
};

const getMemberTableColumns = () =>
  compact([
    {
      accessorKey: 'account',
      header: 'Account',
      meta: {
        className: 'max-w-48',
      },
      cell: ({ row }) => {
        const { account } = row.original;
        const legalName = account.legalName !== account.name && account.legalName;
        return (
          <div className="flex items-center text-nowrap">
            <LinkCollective collective={account} className="flex min-w-0 items-center gap-1 overflow-hidden" withHoverCard>
              <Avatar size={24} collective={account} mr={2} />
              <span className="truncate">{account.name || account.slug}</span>
              {legalName && <span className="ml-1 truncate text-muted-foreground">{`(${legalName})`}</span>}
            </LinkCollective>
          </div>
        );
      },
    },
    {
      accessorKey: 'role',
      header: 'Role',
      cell: ({ row }) => {
        return (
          <div className="inline-flex items-center gap-0.5 rounded-md bg-transparent px-2 py-1 align-middle text-xs font-medium text-nowrap text-muted-foreground ring-1 ring-slate-300 ring-inset">
            {capitalize(row.original.role.replace('_', ' ').toLowerCase())}
          </div>
        );
      },
    },
    {
      accessorKey: 'createdAt',
      header: 'Member Since',
      cell: ({ row }) => {
        const date = row.original.createdAt;
        return date ? <DateTime value={date} dateStyle="medium" /> : <span className="text-muted-foreground">-</span>;
      },
    },
  ]);

const getMemberOfTableColumns = () =>
  compact([
    {
      accessorKey: 'account',
      header: 'Account',
      meta: {
        className: 'max-w-48',
      },
      cell: ({ row }) => {
        const { account } = row.original;
        return (
          <div className="flex items-center text-nowrap">
            <LinkCollective collective={account} className="flex min-w-0 items-center gap-1 overflow-hidden" withHoverCard>
              <Avatar size={24} collective={account} mr={2} />
              <span className="truncate">{account.name || account.slug}</span>
            </LinkCollective>
          </div>
        );
      },
    },
    {
      accessorKey: 'role',
      header: 'Role',
      cell: ({ row }) => {
        return (
          <div className="inline-flex items-center gap-0.5 rounded-md bg-transparent px-2 py-1 align-middle text-xs font-medium text-nowrap text-muted-foreground ring-1 ring-slate-300 ring-inset">
            {capitalize(row.original.role.replace('_', ' ').toLowerCase())}
          </div>
        );
      },
    },
    {
      accessorKey: 'host',
      header: 'Fiscal Host',
      cell: ({ row }) => {
        const host = row.original.account?.host;
        if (!host) {
          return <span className="text-muted-foreground">-</span>;
        }
        return (
          <div className="flex items-center text-nowrap">
            <LinkCollective collective={host} className="flex min-w-0 items-center gap-1 overflow-hidden" withHoverCard>
              <Avatar size={20} collective={host} mr={1} />
              <span className="truncate text-sm">{host.name}</span>
            </LinkCollective>
          </div>
        );
      },
    },
  ]);

const PlatformPersonDetail = ({ accountId, onClose }: PlatformPersonDetailProps) => {
  const { data, loading, error } = useQuery(platformAccountDetailQuery, {
    variables: { accountId },
  });

  const account = data?.account;
  const memberColumns = React.useMemo(() => getMemberTableColumns(), []);
  const memberOfColumns = React.useMemo(() => getMemberOfTableColumns(), []);

  // Get unique hosts from memberOf relationships
  interface HostInfo {
    id: string;
    slug: string;
    name: string;
    type: string;
    imageUrl?: string;
  }
  const associatedHosts = React.useMemo((): HostInfo[] => {
    if (!account?.memberOf?.nodes) {
      return [];
    }
    const hosts: HostInfo[] = [];
    const seenIds = new Set<string>();
    for (const m of account.memberOf.nodes) {
      const host = m.account?.host;
      if (host && !seenIds.has(host.id)) {
        seenIds.add(host.id);
        hosts.push(host as HostInfo);
      }
    }
    return hosts;
  }, [account?.memberOf?.nodes]);

  if (error) {
    return (
      <div className="flex flex-col gap-4">
        <Button variant="ghost" size="sm" onClick={onClose} className="w-fit">
          <ArrowLeft size={16} className="mr-1" />
          Back
        </Button>
        <MessageBoxGraphqlError error={error} />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <Button variant="ghost" size="sm" onClick={onClose} className="w-fit">
        <ArrowLeft size={16} className="mr-1" />
        Back
      </Button>

      {loading ? (
        <div className="flex flex-col gap-4">
          <div className="flex items-center gap-4">
            <Skeleton className="h-16 w-16 rounded-full" />
            <div className="flex flex-col gap-2">
              <Skeleton className="h-6 w-48" />
              <Skeleton className="h-4 w-32" />
            </div>
          </div>
          <Skeleton className="h-40 w-full" />
        </div>
      ) : (
        <React.Fragment>
          {/* Header */}
          <div className="flex items-start gap-4">
            <Avatar collective={account} radius={64} />
            <div className="flex flex-col gap-1">
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-semibold">{account.name}</h2>
                {account.legalName && account.legalName !== account.name && (
                  <span className="text-muted-foreground">({account.legalName})</span>
                )}
              </div>
              <div className="flex items-center text-sm text-muted-foreground">
                <span>@{account.slug}</span>
                <Dot size={16} />
                <span>{ACCOUNT_TYPE_LABELS[account.type] || account.type}</span>
              </div>
              {account.socialLinks?.length > 0 && (
                <HeroSocialLinks socialLinks={account.socialLinks} className="mt-2" />
              )}
            </div>
          </div>

          {/* Account Info */}
          <div className="rounded-lg border p-4">
            <h3 className="mb-4 font-medium">Account Information</h3>
            <InfoList>
              {account.email && (
                <InfoListItem
                  title="Email"
                  value={
                    <div className="flex items-center gap-2">
                      <Mail size={14} className="text-muted-foreground" />
                      <span>{account.email}</span>
                      <CopyID value={account.email} tooltipLabel={<span>Copy email</span>} toastOnCopy />
                    </div>
                  }
                />
              )}
              {account.location?.country && (
                <InfoListItem
                  title="Country"
                  value={
                    <span>
                      {getFlagEmoji(account.location.country)} {account.location.country}
                    </span>
                  }
                />
              )}
              {account.location?.address && (
                <InfoListItem title="Address" value={<LocationAddress location={account.location} />} />
              )}
              <InfoListItem title="Created" value={<DateTime value={account.createdAt} dateStyle="long" />} />
              <InfoListItem
                title="Account ID"
                value={
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-sm">{account.id}</span>
                    <CopyID value={account.id} toastOnCopy />
                  </div>
                }
              />
              {account.legacyId && (
                <InfoListItem title="Legacy ID" value={<span className="font-mono text-sm">{account.legacyId}</span>} />
              )}
            </InfoList>
          </div>

          {/* Associated Hosts */}
          {associatedHosts.length > 0 && (
            <div className="rounded-lg border p-4">
              <h3 className="mb-4 font-medium">Associated Fiscal Hosts</h3>
              <div className="flex flex-wrap gap-2">
                {associatedHosts.map(host => (
                  <Link
                    key={host.id}
                    href={`/dashboard/${host.slug}/people`}
                    className="inline-flex items-center gap-2 rounded-md border px-3 py-2 text-sm hover:bg-muted"
                  >
                    <Avatar size={24} collective={host} />
                    <span>{host.name}</span>
                  </Link>
                ))}
              </div>
              <p className="mt-2 text-xs text-muted-foreground">
                Click on a host to view detailed community stats for this person in that host's context.
              </p>
            </div>
          )}

          {/* Team Members */}
          {account.members?.nodes?.length > 0 && (
            <div className="rounded-lg border p-4">
              <h3 className="mb-4 font-medium">Team Members</h3>
              <DataTable columns={memberColumns} data={account.members.nodes} />
            </div>
          )}

          {/* Member Of */}
          {account.memberOf?.nodes?.length > 0 && (
            <div className="rounded-lg border p-4">
              <h3 className="mb-4 font-medium">Member Of</h3>
              <DataTable columns={memberOfColumns} data={account.memberOf.nodes} />
            </div>
          )}
        </React.Fragment>
      )}
    </div>
  );
};

export default PlatformPersonDetail;
