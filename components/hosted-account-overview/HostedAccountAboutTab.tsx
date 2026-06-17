import React from 'react';
import { FormattedMessage } from 'react-intl';

import Avatar from '@/components/Avatar';
import HeroSocialLinks from '@/components/collective-page/hero/HeroSocialLinks';
import { DashboardContentCard } from '@/components/dashboard/DashboardContentCard';
import HTMLContent, { isEmptyHTMLValue } from '@/components/HTMLContent';
import I18nCollectiveTags from '@/components/I18nCollectiveTags';
import LinkCollective from '@/components/LinkCollective';
import LocationAddress from '@/components/LocationAddress';
import StyledLink from '@/components/StyledLink';
import { Badge } from '@/components/ui/Badge';
import { DataList, DataListItem } from '@/components/ui/DataList';

import type { HostedAccountProfileData } from './types';

type HostedAccountAboutTabProps = {
  account?: HostedAccountProfileData;
};

export function HostedAccountAboutTab({ account }: HostedAccountAboutTabProps) {
  const admins = account?.members?.nodes || [];
  const hasLongDescription = !isEmptyHTMLValue(account?.longDescription);

  return (
    <div className="flex flex-col gap-4">
      <DashboardContentCard title={<FormattedMessage defaultMessage="About" id="collective.about.title" />}>
        {hasLongDescription ? (
          <HTMLContent content={account?.longDescription} />
        ) : account?.description ? (
          <p className="text-sm text-foreground">{account.description}</p>
        ) : (
          <p className="text-sm text-muted-foreground">
            <FormattedMessage defaultMessage="No description provided" id="NoDescription" />
          </p>
        )}
      </DashboardContentCard>

      <DashboardContentCard title={<FormattedMessage defaultMessage="Details" id="Details" />}>
        <DataList className="text-sm">
          <DataListItem
            label={<FormattedMessage defaultMessage="Name" id="Fields.name" />}
            value={account?.name || account?.slug}
          />
          <DataListItem
            label={<FormattedMessage defaultMessage="Slug" id="Fields.slug" />}
            value={
              account?.slug ? (
                <span className="rounded bg-muted px-1.5 py-0.5 font-mono text-xs text-muted-foreground">
                  @{account.slug}
                </span>
              ) : (
                '—'
              )
            }
          />
          {account?.tags?.length > 0 && (
            <DataListItem
              label={<FormattedMessage defaultMessage="Tags" id="Tags" />}
              value={
                <div className="flex flex-wrap gap-1">
                  {account.tags.map(tag => (
                    <Badge key={tag} size="xs" type="outline">
                      <I18nCollectiveTags tags={tag} />
                    </Badge>
                  ))}
                </div>
              }
            />
          )}
          {account?.website && (
            <DataListItem
              label={<FormattedMessage defaultMessage="Website" id="Fields.website" />}
              value={
                <StyledLink href={account.website} openInNewTab>
                  {account.website}
                </StyledLink>
              }
            />
          )}
          {account?.socialLinks?.length > 0 && (
            <DataListItem
              label={<FormattedMessage defaultMessage="Social Links" id="3bLmoU" />}
              value={
                <div className="flex flex-wrap items-center gap-2">
                  <HeroSocialLinks socialLinks={account.socialLinks} />
                </div>
              }
            />
          )}
          {(account?.location?.address || account?.location?.country) && (
            <DataListItem
              label={<FormattedMessage defaultMessage="Location" id="SectionLocation.Title" />}
              value={<LocationAddress location={account.location} />}
            />
          )}
        </DataList>
      </DashboardContentCard>

      {admins.length > 0 && (
        <DashboardContentCard title={<FormattedMessage defaultMessage="Team" id="Team" />}>
          <div className="flex flex-wrap gap-4">
            {admins.map(admin => (
              <LinkCollective
                key={admin.id}
                collective={admin.account}
                className="flex items-center gap-2 text-sm font-medium text-foreground hover:underline"
                withHoverCard
              >
                <Avatar collective={admin.account} radius={24} /> {admin.account.name}
              </LinkCollective>
            ))}
          </div>
        </DashboardContentCard>
      )}
    </div>
  );
}
