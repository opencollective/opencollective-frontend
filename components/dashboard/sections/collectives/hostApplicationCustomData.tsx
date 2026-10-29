import React from 'react';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import { unescape } from 'lodash-es';
import { ExternalLink, LinkIcon } from 'lucide-react';
import type { IntlShape } from 'react-intl';
import { FormattedMessage, useIntl } from 'react-intl';
import spdxLicenses from 'spdx-license-list';

import type { EcosystemsRepositorySnapshot } from '../../../../lib/ecosystems';
import { stripHTML } from '../../../../lib/html';
import { i18nLabels } from '../../../../lib/i18n/custom-application-form';

import DateTime from '../../../DateTime';
import FormattedMoneyAmount from '../../../FormattedMoneyAmount';
import Link from '../../../Link';
import { Badge } from '../../../ui/Badge';
import { DataList, DataListItem } from '../../../ui/DataList';

dayjs.extend(relativeTime);

type CustomData = Record<string, unknown>;

type RenderContext = {
  intl: IntlShape;
  customData: CustomData;
};

type CustomDataField = {
  key: string;
  label: React.ReactNode;
  render?: (value: unknown, context: RenderContext) => React.ReactNode;
  /** Rendered in a dedicated section (or internal, not useful for reviewers) */
  hidden?: boolean;
};

const YES_MESSAGE = { id: 'a5msuh', defaultMessage: 'Yes' };
const NO_MESSAGE = { id: 'oUWADl', defaultMessage: 'No' };

const isPresent = (value: unknown): boolean => {
  if (value === null || value === undefined || value === '') {
    return false;
  }
  if (Array.isArray(value)) {
    return value.length > 0;
  }
  if (typeof value === 'object') {
    return Object.keys(value).length > 0;
  }
  return true;
};

const asString = (value: unknown): string | null => (typeof value === 'string' ? value : null);

const humanizeKey = (key: string): string => {
  const label = key
    .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
    .replace(/[_-]+/g, ' ')
    .trim()
    .toLowerCase();
  return label.charAt(0).toUpperCase() + label.slice(1);
};

export const formatSpdxLicense = (licenseId: string): string => {
  const spdxId = Object.keys(spdxLicenses).find(id => id.toLowerCase() === licenseId.toLowerCase());
  return (spdxId && spdxLicenses[spdxId]?.name) || licenseId;
};

const renderText = (value: unknown): React.ReactNode => {
  if (typeof value === 'number') {
    return <span>{value}</span>;
  }

  const text = asString(value);
  return text === null ? null : <span className="break-words whitespace-pre-line">{text}</span>;
};

const renderUrl = (value: unknown): React.ReactNode => {
  const url = asString(value);
  if (!url) {
    return null;
  }

  return (
    <Link
      href={url}
      openInNewTab
      className="inline-flex max-w-full items-center gap-1 text-primary underline-offset-4 hover:underline"
    >
      <LinkIcon size={14} className="shrink-0" />
      <span className="truncate">{url.replace(/^https?:\/\//, '')}</span>
    </Link>
  );
};

const renderSpdxLicense = (value: unknown): React.ReactNode => {
  const licenseId = asString(value);
  return licenseId ? <span>{formatSpdxLicense(licenseId)}</span> : null;
};

const renderProjectType = (value: unknown): React.ReactNode => {
  const projectType = asString(value);
  if (!projectType) {
    return null;
  }

  if (projectType === 'CODE') {
    return <FormattedMessage id="HostApplication.ProjectTypeSelect.code" defaultMessage="Code" />;
  } else if (projectType === 'COMMUNITY') {
    return <FormattedMessage id="community" defaultMessage="Community" />;
  }

  return <span>{humanizeKey(projectType)}</span>;
};

const renderGithubHandle = (value: unknown): React.ReactNode => {
  const handle = asString(value);
  if (!handle) {
    return null;
  }

  const login = handle.replace(/^@/, '');
  return (
    <Link
      href={`https://github.com/${login}`}
      openInNewTab
      className="inline-flex max-w-full items-center gap-1 text-primary underline-offset-4 hover:underline"
    >
      <ExternalLink size={14} className="shrink-0" />
      <span className="truncate">{login}</span>
    </Link>
  );
};

const renderAmount = (value: unknown): React.ReactNode => {
  if (typeof value === 'number') {
    return <FormattedMoneyAmount amount={value} currency="USD" showCurrencyCode precision="auto" />;
  }
  return renderText(value);
};

const renderStringList = (value: unknown): React.ReactNode => {
  if (!Array.isArray(value)) {
    return renderText(value);
  }

  if (value.every(item => typeof item === 'string' || typeof item === 'number')) {
    return <span>{value.join(', ')}</span>;
  }

  return (
    <ul className="list-disc pl-4">
      {value.map(item => {
        const itemKey = typeof item === 'object' ? JSON.stringify(item) : String(item);
        return <li key={itemKey}>{typeof item === 'object' ? JSON.stringify(item) : String(item)}</li>;
      })}
    </ul>
  );
};

const renderRuleConfirmations = (value: unknown): React.ReactNode => {
  if (!Array.isArray(value) || value.length === 0) {
    return null;
  }

  return (
    <ul className="list-disc pl-4">
      {value.map(ruleId => (
        <li key={String(ruleId)}>
          {String(ruleId) === 'copyright' ? (
            <FormattedMessage
              id="HostApplication.customData.copyrightConfirmation"
              defaultMessage="Copyright / binding agreement"
            />
          ) : (
            humanizeKey(String(ruleId))
          )}
        </li>
      ))}
    </ul>
  );
};

const renderDefaultValue = (value: unknown, intl: IntlShape): React.ReactNode => {
  if (typeof value === 'boolean') {
    return (
      <Badge size="xs" type={value ? 'success' : 'neutral'}>
        {intl.formatMessage(value ? YES_MESSAGE : NO_MESSAGE)}
      </Badge>
    );
  }
  if (typeof value === 'number') {
    return <span>{intl.formatNumber(value)}</span>;
  }
  if (typeof value === 'string') {
    return renderText(value);
  }
  if (Array.isArray(value)) {
    return renderStringList(value);
  }
  if (typeof value === 'object') {
    return (
      <pre className="max-h-40 overflow-auto rounded bg-slate-50 p-2 text-xs break-words whitespace-pre-wrap">
        {JSON.stringify(value, null, 2)}
      </pre>
    );
  }
  return String(value);
};

const HOST_APPLICATION_CUSTOM_DATA_FIELDS: CustomDataField[] = [
  {
    key: 'typeOfProject',
    label: <FormattedMessage id="HostApplication.customData.typeOfProject" defaultMessage="Type of project" />,
    render: renderProjectType,
  },
  {
    key: 'repositoryUrl',
    label: <FormattedMessage {...i18nLabels.repositoryUrl} />,
    render: value => renderUrl(value),
  },
  {
    key: 'githubHandle',
    label: <FormattedMessage id="HostApplication.customData.githubHandle" defaultMessage="GitHub handle" />,
    render: value => renderGithubHandle(value),
  },
  {
    key: 'licenseSpdxId',
    label: <FormattedMessage {...i18nLabels.repositoryLicense} />,
    render: value => renderSpdxLicense(value),
  },
  {
    key: 'extraLicenseInfo',
    label: <FormattedMessage {...i18nLabels.extraLicenseInfo} />,
    render: value => renderText(value),
  },
  {
    key: 'amountOfMembers',
    label: <FormattedMessage {...i18nLabels.amountOfMembers} />,
    render: value => renderText(value),
  },
  {
    key: 'linksToPreviousEvents',
    label: <FormattedMessage {...i18nLabels.linksToPreviousEvents} />,
    render: value => renderText(value),
  },
  // Legacy OSC applications used `previousEvents` as a free-text field
  {
    key: 'previousEvents',
    label: <FormattedMessage {...i18nLabels.linksToPreviousEvents} />,
    render: value => renderText(value),
  },
  {
    key: 'linksToLicenses',
    label: <FormattedMessage id="HostApplication.customData.linksToLicenses" defaultMessage="Links to licenses" />,
    render: value => renderText(value),
  },
  {
    key: 'ruleConfirmations',
    label: (
      <FormattedMessage id="HostApplication.customData.ruleConfirmations" defaultMessage="Applicant confirmations" />
    ),
    render: renderRuleConfirmations,
  },
  // OCF legacy form
  { key: 'location', label: <FormattedMessage {...i18nLabels.location} />, render: value => renderText(value) },
  {
    key: 'initiativeDuration',
    label: <FormattedMessage {...i18nLabels.initiativeDuration} />,
    render: value => renderText(value),
  },
  {
    key: 'totalAmountRaised',
    label: <FormattedMessage {...i18nLabels.totalAmountRaised} />,
    render: value => renderAmount(value),
  },
  {
    key: 'totalAmountToBeRaised',
    label: <FormattedMessage {...i18nLabels.totalAmountToBeRaised} />,
    render: value => renderAmount(value),
  },
  {
    key: 'expectedFundingPartner',
    label: <FormattedMessage {...i18nLabels.expectedFundingPartner} />,
    render: value => renderText(value),
  },
  {
    key: 'missionImpactExplanation',
    label: <FormattedMessage {...i18nLabels.missionImpactExplanation} />,
    render: value => renderText(value),
  },
  {
    key: 'websiteAndSocialLinks',
    label: <FormattedMessage {...i18nLabels.websiteAndSocialLinks} />,
    render: value => renderText(value),
  },
  // Rendered in dedicated sections
  { key: 'validatedRepositoryInfo', label: 'validatedRepositoryInfo', hidden: true },
  { key: 'ecosystemsRepositoryInfo', label: 'ecosystemsRepositoryInfo', hidden: true },
  // Internal flags, not useful for reviewers
  { key: 'useGithubValidation', label: 'useGithubValidation', hidden: true },
  { key: 'migration', label: 'migration', hidden: true },
  // Rendered as a flagged callout
  {
    key: 'hasLegalEntity',
    label: (
      <FormattedMessage id="HostApplication.customData.existingLegalEntity" defaultMessage="Existing legal entity" />
    ),
    hidden: true,
  },
];

type CustomDataEntry = {
  key: string;
  label: React.ReactNode;
  value: unknown;
  render?: CustomDataField['render'];
};

function getHostApplicationCustomDataEntries(customData?: CustomData | null): CustomDataEntry[] {
  if (!customData) {
    return [];
  }

  const entries: CustomDataEntry[] = [];
  const knownKeys = new Set(HOST_APPLICATION_CUSTOM_DATA_FIELDS.map(field => field.key));

  for (const field of HOST_APPLICATION_CUSTOM_DATA_FIELDS) {
    if (field.hidden || !isPresent(customData[field.key])) {
      continue;
    }
    entries.push({ key: field.key, label: field.label, value: customData[field.key], render: field.render });
  }

  // Preserve unknown keys (e.g. data written by other clients) with a readable fallback
  for (const [key, value] of Object.entries(customData)) {
    if (knownKeys.has(key) || !isPresent(value)) {
      continue;
    }
    entries.push({ key, label: humanizeKey(key), value });
  }

  return entries;
}

export function HostApplicationCustomData({
  customData,
  children,
}: {
  customData?: CustomData | null;
  children?: React.ReactNode;
}) {
  const intl = useIntl();
  const entries = getHostApplicationCustomDataEntries(customData);

  if (entries.length === 0 && !children) {
    return null;
  }

  return (
    <DataList>
      {children}
      {entries.map(entry => (
        <DataListItem
          key={entry.key}
          label={entry.label}
          value={
            entry.render
              ? entry.render(entry.value, { intl, customData: customData as CustomData })
              : renderDefaultValue(entry.value, intl)
          }
        />
      ))}
    </DataList>
  );
}

type RepositoryInfoRow = {
  key: string;
  label: React.ReactNode;
  value: React.ReactNode;
};

export function EcosystemsRepositoryInfo({
  repository,
  repositoryUrl,
}: {
  repository?: EcosystemsRepositorySnapshot | null;
  repositoryUrl?: string | null;
}) {
  const intl = useIntl();

  if (!repository) {
    return null;
  }

  const rows: RepositoryInfoRow[] = [];

  if (repository.fullName) {
    rows.push({
      key: 'repository',
      label: <FormattedMessage id="HostApplication.customData.ecosystems.repository" defaultMessage="Repository" />,
      value: repositoryUrl ? (
        <Link
          href={repositoryUrl}
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

  if (repository.owner) {
    rows.push({
      key: 'owner',
      label: <FormattedMessage id="HostApplication.customData.ecosystems.owner" defaultMessage="Owner" />,
      value: (
        <div className="flex items-center gap-2">
          <span>{repository.owner}</span>
          {repository.ownerKind === 'user' && (
            <Badge size="xs" type="warning">
              <FormattedMessage id="PendingApplication.RepoInfo.PersonalAccount" defaultMessage="Personal account" />
            </Badge>
          )}
          {repository.ownerKind === 'organization' && (
            <Badge size="xs" type="success">
              <FormattedMessage id="PendingApplication.RepoInfo.OrgAccount" defaultMessage="Organization account" />
            </Badge>
          )}
        </div>
      ),
    });
  }

  if (repository.description) {
    rows.push({
      key: 'description',
      label: (
        <FormattedMessage
          id="HostApplication.customData.ecosystems.description"
          defaultMessage="Repository description"
        />
      ),
      value: <span className="break-words whitespace-pre-line">{unescape(stripHTML(repository.description))}</span>,
    });
  }

  if (repository.stars !== null && repository.stars !== undefined) {
    rows.push({
      key: 'stars',
      label: <FormattedMessage id="HostApplication.customData.ecosystems.stars" defaultMessage="Stars" />,
      value: <span>{intl.formatNumber(repository.stars)}</span>,
    });
  }

  if (repository.forks !== null && repository.forks !== undefined) {
    rows.push({
      key: 'forks',
      label: <FormattedMessage id="HostApplication.customData.ecosystems.forks" defaultMessage="Forks" />,
      value: <span>{intl.formatNumber(repository.forks)}</span>,
    });
  }

  if (repository.license) {
    rows.push({
      key: 'license',
      label: <FormattedMessage {...i18nLabels.repositoryLicense} />,
      value: <span>{formatSpdxLicense(repository.license)}</span>,
    });
  }

  if (repository.createdAt) {
    rows.push({
      key: 'createdAt',
      label: <FormattedMessage id="HostApplication.customData.ecosystems.createdAt" defaultMessage="Created" />,
      value: (
        <div className="flex flex-wrap items-center gap-2">
          <DateTime value={repository.createdAt} dateStyle="medium" />
          <span className="text-muted-foreground">({dayjs(repository.createdAt).fromNow()})</span>
        </div>
      ),
    });
  }

  if (repository.lastCommitAt) {
    rows.push({
      key: 'lastCommitAt',
      label: <FormattedMessage id="HostApplication.customData.ecosystems.lastCommitAt" defaultMessage="Last commit" />,
      value: (
        <div className="flex flex-wrap items-center gap-2">
          <DateTime value={repository.lastCommitAt} dateStyle="medium" />
          <span className="text-muted-foreground">({dayjs(repository.lastCommitAt).fromNow()})</span>
        </div>
      ),
    });
  }

  if (repository.commitStats) {
    rows.push({
      key: 'commits',
      label: <FormattedMessage id="HostApplication.customData.ecosystems.commits" defaultMessage="Commits" />,
      value: <span>{intl.formatNumber(repository.commitStats.totalCommits)}</span>,
    });
    rows.push({
      key: 'contributors',
      label: <FormattedMessage id="Contributors" defaultMessage="Contributors" />,
      value:
        typeof repository.commitStats.botCommitters === 'number' ? (
          <FormattedMessage
            id="HostApplication.customData.ecosystems.contributorsWithBots"
            defaultMessage="{human} human contributors, {bots} bot contributors"
            values={{
              human: intl.formatNumber(repository.commitStats.totalCommitters),
              bots: intl.formatNumber(repository.commitStats.botCommitters),
            }}
          />
        ) : (
          <FormattedMessage
            id="HostApplication.customData.ecosystems.contributors"
            defaultMessage="{human} contributors"
            values={{ human: intl.formatNumber(repository.commitStats.totalCommitters) }}
          />
        ),
    });
  }

  if (repository.applicantIsContributor !== undefined) {
    rows.push({
      key: 'applicantContributor',
      label: (
        <FormattedMessage
          id="HostApplication.customData.ecosystems.applicantContributor"
          defaultMessage="Applicant contributor"
        />
      ),
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
                    id="HostApplication.customData.ecosystems.pastYearCommits"
                    defaultMessage="{count, plural, one {# commit in the past year} other {# commits in the past year}}"
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

  if (repository.archived || repository.isFork) {
    rows.push({
      key: 'status',
      label: <FormattedMessage id="Fields.status" defaultMessage="Status" />,
      value: (
        <div className="flex flex-wrap items-center gap-1">
          {repository.archived && (
            <Badge size="xs" type="warning">
              <FormattedMessage id="Archived" defaultMessage="Archived" />
            </Badge>
          )}
          {repository.isFork && (
            <Badge size="xs" type="neutral">
              <FormattedMessage id="HostApplication.customData.ecosystems.fork" defaultMessage="Fork" />
            </Badge>
          )}
        </div>
      ),
    });
  }

  if (repository.packages && repository.packages.length > 0) {
    rows.push({
      key: 'packages',
      label: <FormattedMessage id="HostApplication.customData.ecosystems.packages" defaultMessage="Packages" />,
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
