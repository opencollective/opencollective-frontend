import React from 'react';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import { unescape } from 'lodash-es';
import { LinkIcon } from 'lucide-react';
import type { MessageDescriptor } from 'react-intl';
import { defineMessages, FormattedMessage, useIntl } from 'react-intl';

import type { EcosystemsRepositorySnapshot } from '../../../../lib/ecosystems';
import { stripHTML } from '../../../../lib/html';
import { i18nLabels } from '../../../../lib/i18n/custom-application-form';

import DateTime from '../../../DateTime';
import Link from '../../../Link';
import { Badge } from '../../../ui/Badge';
import { DataList, DataListItem } from '../../../ui/DataList';

import { formatSpdxLicense } from './hostApplicationCustomData';

dayjs.extend(relativeTime);

type ValidatedField<T = unknown> = {
  value: T;
  isValid: boolean;
};

type ValidatedRepositoryInfoData = {
  allValidationsPassed?: boolean;
  fields?: Partial<{
    lastCommitDate: ValidatedField<string>;
    collaboratorsCount: ValidatedField<number>;
    starsCount: ValidatedField<number>;
    isFork: ValidatedField<boolean>;
    isOwnedByOrg: ValidatedField<boolean>;
    licenseSpdxId: ValidatedField<string>;
  }>;
};

type RepositoryInformationProps = {
  customData: {
    repositoryUrl?: string | null;
    licenseSpdxId?: string | null;
    ecosystemsRepositoryInfo?: EcosystemsRepositorySnapshot | null;
    validatedRepositoryInfo?: ValidatedRepositoryInfoData | null;
  } | null;
};

type RepositoryInfoRow = {
  key: string;
  label: React.ReactNode;
  value: React.ReactNode;
};

const msg: Record<string, MessageDescriptor> = defineMessages({
  repository: {
    id: 'HostApplication.customData.ecosystems.repository',
    defaultMessage: 'Repository',
  },
  owner: {
    id: 'HostApplication.customData.ecosystems.owner',
    defaultMessage: 'Owner',
  },
  description: {
    id: 'HostApplication.customData.ecosystems.description',
    defaultMessage: 'Repository description',
  },
  stars: {
    id: 'HostApplication.customData.ecosystems.stars',
    defaultMessage: 'Stars',
  },
  forks: {
    id: 'HostApplication.customData.ecosystems.forks',
    defaultMessage: 'Forks',
  },
  licenseManually: {
    id: 'PendingApplication.RepoInfo.LicenseManually',
    defaultMessage: '(user specified "{license}" manually)',
  },
  createdAt: {
    id: 'HostApplication.customData.ecosystems.createdAt',
    defaultMessage: 'Created',
  },
  firstCommitAt: {
    id: 'HostApplication.customData.ecosystems.firstCommitAt',
    defaultMessage: 'First commit',
  },
  lastCommitAt: {
    id: 'HostApplication.customData.ecosystems.lastCommitAt',
    defaultMessage: 'Last commit',
  },
  commits: {
    id: 'HostApplication.customData.ecosystems.commits',
    defaultMessage: 'Commits',
  },
  contributors: {
    id: 'Contributors',
    defaultMessage: 'Contributors',
  },
  contributorsWithBots: {
    id: 'HostApplication.customData.ecosystems.contributorsWithBots',
    defaultMessage: '{human} human contributors, {bots} bot contributors',
  },
  contributorCount: {
    id: 'PendingApplication.RepoInfo.CollaboratorsCount',
    defaultMessage: '{count} collaborators',
  },
  applicantContributor: {
    id: 'HostApplication.customData.ecosystems.applicantContributor',
    defaultMessage: 'Applicant contributor',
  },
  pastYearCommits: {
    id: 'HostApplication.customData.ecosystems.pastYearCommits',
    defaultMessage: '{count, plural, one {# commit in the past year} other {# commits in the past year}}',
  },
  status: {
    id: 'Fields.status',
    defaultMessage: 'Status',
  },
  fork: {
    id: 'HostApplication.customData.ecosystems.fork',
    defaultMessage: 'Fork',
  },
  isFork: {
    id: 'PendingApplication.RepoInfo.IsFork',
    defaultMessage: 'This is a fork',
  },
  isNotFork: {
    id: 'PendingApplication.RepoInfo.IsNotFork',
    defaultMessage: 'This is not a fork',
  },
  packages: {
    id: 'HostApplication.customData.ecosystems.packages',
    defaultMessage: 'Packages',
  },
  orgAccount: {
    id: 'PendingApplication.RepoInfo.OrgAccount',
    defaultMessage: 'Organization account',
  },
  personalAccount: {
    id: 'PendingApplication.RepoInfo.PersonalAccount',
    defaultMessage: 'Personal account',
  },
  notFound: {
    id: 'notFound',
    defaultMessage: 'Not found',
  },
});

const RelativeDate = ({ value }: { value: string }) => (
  <div className="flex flex-wrap items-center gap-2">
    <DateTime value={value} dateStyle="medium" />
    <span className="text-muted-foreground">({dayjs(value).fromNow()})</span>
  </div>
);

/**
 * Repository information for the host application drawer. The ecosyste.ms data stored as
 * `applicationData.ecosystemsRepositoryInfo` is the reference; the legacy
 * `validatedRepositoryInfo` fields fill the gaps for older applications.
 */
export default function RepositoryInformation({ customData }: RepositoryInformationProps) {
  const intl = useIntl();
  const repository = customData?.ecosystemsRepositoryInfo;
  const fields = customData?.validatedRepositoryInfo?.fields;

  if (!repository && !fields) {
    return null;
  }

  const rows: RepositoryInfoRow[] = [];
  const addRow = (row: RepositoryInfoRow) => rows.push(row);

  if (repository?.fullName) {
    addRow({
      key: 'repository',
      label: intl.formatMessage(msg.repository),
      value: customData?.repositoryUrl ? (
        <Link
          href={customData.repositoryUrl}
          openInNewTab
          className="inline-flex max-w-full items-center gap-1 text-primary underline-offset-4 hover:underline"
        >
          <LinkIcon size={14} className="shrink-0" />
          <span className="truncate">{repository.fullName}</span>
        </Link>
      ) : (
        <span>{repository.fullName}</span>
      ),
    });
  }

  const ownerField = fields?.isOwnedByOrg;
  if (repository?.owner || ownerField) {
    const isOrganization = repository?.ownerKind ? repository.ownerKind === 'organization' : ownerField?.value;
    addRow({
      key: 'owner',
      label: intl.formatMessage(msg.owner),
      value: (
        <div className="flex flex-wrap items-center gap-2">
          {repository?.owner && <span>{repository.owner}</span>}
          {isOrganization === false && (
            <Badge size="xs" type="warning">
              <FormattedMessage {...msg.personalAccount} />
            </Badge>
          )}
          {isOrganization === true && (
            <Badge size="xs" type="success">
              <FormattedMessage {...msg.orgAccount} />
            </Badge>
          )}
        </div>
      ),
    });
  }

  if (repository?.description) {
    addRow({
      key: 'description',
      label: intl.formatMessage(msg.description),
      value: <span className="break-words whitespace-pre-line">{unescape(stripHTML(repository.description))}</span>,
    });
  }

  const stars = repository?.stars ?? fields?.starsCount?.value ?? null;
  if (stars !== null && stars !== undefined) {
    addRow({
      key: 'stars',
      label: intl.formatMessage(msg.stars),
      value: <span>{intl.formatNumber(stars)}</span>,
    });
  }

  if (repository?.forks !== null && repository?.forks !== undefined) {
    addRow({
      key: 'forks',
      label: intl.formatMessage(msg.forks),
      value: <span>{intl.formatNumber(repository.forks)}</span>,
    });
  }

  const licenseField = fields?.licenseSpdxId;
  const license = repository?.license ?? licenseField?.value ?? null;
  if (license || licenseField) {
    const hasLicense = Boolean(license && license !== 'NOASSERTION');
    addRow({
      key: 'license',
      label: intl.formatMessage(i18nLabels.repositoryLicense),
      value: (
        <div className="flex flex-wrap items-center gap-2">
          <span>{hasLicense ? `${license} (${formatSpdxLicense(license)})` : intl.formatMessage(msg.notFound)}</span>
          {customData?.licenseSpdxId && license && customData.licenseSpdxId.toLowerCase() !== license.toLowerCase() && (
            <span className="text-muted-foreground">
              {intl.formatMessage(msg.licenseManually, { license: customData.licenseSpdxId })}
            </span>
          )}
        </div>
      ),
    });
  }

  if (repository?.createdAt) {
    addRow({
      key: 'createdAt',
      label: intl.formatMessage(msg.createdAt),
      value: <RelativeDate value={repository.createdAt} />,
    });
  }

  if (repository?.firstCommitAt) {
    addRow({
      key: 'firstCommitAt',
      label: intl.formatMessage(msg.firstCommitAt),
      value: <RelativeDate value={repository.firstCommitAt} />,
    });
  }

  const lastCommitAt = repository?.lastCommitAt ?? fields?.lastCommitDate?.value ?? null;
  if (lastCommitAt) {
    addRow({
      key: 'lastCommitAt',
      label: intl.formatMessage(msg.lastCommitAt),
      value: <RelativeDate value={lastCommitAt} />,
    });
  }

  if (repository?.commitStats) {
    addRow({
      key: 'commits',
      label: intl.formatMessage(msg.commits),
      value: <span>{intl.formatNumber(repository.commitStats.totalCommits)}</span>,
    });
    addRow({
      key: 'contributors',
      label: intl.formatMessage(msg.contributors),
      value:
        typeof repository.commitStats.botCommitters === 'number' ? (
          <FormattedMessage
            {...msg.contributorsWithBots}
            values={{
              human: intl.formatNumber(repository.commitStats.totalCommitters),
              bots: intl.formatNumber(repository.commitStats.botCommitters),
            }}
          />
        ) : (
          <FormattedMessage
            {...msg.contributorCount}
            values={{ count: intl.formatNumber(repository.commitStats.totalCommitters) }}
          />
        ),
    });
  } else if (fields?.collaboratorsCount) {
    addRow({
      key: 'contributors',
      label: intl.formatMessage(msg.contributors),
      value: (
        <FormattedMessage
          {...msg.contributorCount}
          values={{ count: intl.formatNumber(fields.collaboratorsCount.value) }}
        />
      ),
    });
  }

  if (repository?.applicantIsContributor !== undefined) {
    addRow({
      key: 'applicantContributor',
      label: intl.formatMessage(msg.applicantContributor),
      value: (
        <div className="flex flex-wrap items-center gap-2">
          <Badge size="xs" type={repository.applicantIsContributor ? 'success' : 'neutral'}>
            {repository.applicantIsContributor ? (
              <FormattedMessage id="a5msuh" defaultMessage="Yes" />
            ) : (
              <FormattedMessage id="oUWADl" defaultMessage="No" />
            )}
          </Badge>
          {repository.applicantContribution && (
            <span className="text-muted-foreground">
              {repository.applicantContribution.name ||
                repository.applicantContribution.login ||
                repository.applicantContribution.email}
              {typeof repository.applicantContribution.count === 'number' && (
                <React.Fragment>
                  {' · '}
                  <FormattedMessage
                    {...msg.pastYearCommits}
                    values={{ count: repository.applicantContribution.count }}
                  />
                </React.Fragment>
              )}
            </span>
          )}
        </div>
      ),
    });
  }

  const isFork = repository?.isFork ?? fields?.isFork?.value ?? null;
  if (isFork !== null && isFork !== undefined) {
    addRow({
      key: 'fork',
      label: intl.formatMessage(msg.fork),
      value: <FormattedMessage {...(isFork ? msg.isFork : msg.isNotFork)} />,
    });
  }

  if (repository?.archived) {
    addRow({
      key: 'archived',
      label: intl.formatMessage(msg.status),
      value: (
        <Badge size="xs" type="warning">
          <FormattedMessage id="Archived" defaultMessage="Archived" />
        </Badge>
      ),
    });
  }

  if (repository?.packages && repository.packages.length > 0) {
    addRow({
      key: 'packages',
      label: intl.formatMessage(msg.packages),
      value: (
        <div className="flex flex-wrap items-center gap-1">
          {repository.packages.map(pkg => (
            <Badge key={`${pkg.ecosystem}-${pkg.name}`} size="xs" type="outline">
              <span>{pkg.name}</span>
              <span className="text-muted-foreground">{pkg.ecosystem}</span>
            </Badge>
          ))}
        </div>
      ),
    });
  }

  if (rows.length === 0) {
    return null;
  }

  return (
    <DataList>
      {rows.map(row => (
        <DataListItem key={row.key} label={row.label} value={row.value} />
      ))}
    </DataList>
  );
}
