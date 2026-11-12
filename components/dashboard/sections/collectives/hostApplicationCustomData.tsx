import React from 'react';
import { ExternalLink, LinkIcon } from 'lucide-react';
import type { IntlShape } from 'react-intl';
import { FormattedMessage, useIntl } from 'react-intl';
import spdxLicenses from 'spdx-license-list';

import { i18nLabels } from '../../../../lib/i18n/custom-application-form';

import FormattedMoneyAmount from '../../../FormattedMoneyAmount';
import Link from '../../../Link';
import { Badge } from '../../../ui/Badge';
import { DataList, DataListItem } from '../../../ui/DataList';

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
