import React from 'react';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import { Ban, Check } from 'lucide-react';
import type { MessageDescriptor } from 'react-intl';
import { defineMessages, useIntl } from 'react-intl';

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
    isAdmin: ValidatedField<boolean>;
    licenseSpdxId: ValidatedField<string>;
  }>;
};

type ValidatedRepositoryInfoProps = {
  customData: {
    licenseSpdxId?: string | null;
    validatedRepositoryInfo?: ValidatedRepositoryInfoData | null;
  } | null;
};

const FieldWithValidationBadge = <T,>({
  field,
  children,
}: {
  field: ValidatedField<T>;
  children: (props: { field: ValidatedField<T> }) => React.ReactNode;
}) => {
  return (
    <div className="flex items-center gap-2">
      {field.isValid ? (
        <Check size={14} className="shrink-0 text-green-600" />
      ) : (
        <Ban size={14} className="shrink-0 text-red-600" />
      )}
      <div className="text-sm text-muted-foreground">{children({ field })}</div>
    </div>
  );
};

const msg: Record<string, MessageDescriptor> = defineMessages({
  license: {
    id: 'PendingApplication.RepoInfo.License',
    defaultMessage: 'License: {license}',
  },
  licenseManually: {
    id: 'PendingApplication.RepoInfo.LicenseManually',
    defaultMessage: '(user specified "{license}" manually)',
  },
  lastCommitTimeAgo: {
    id: 'PendingApplication.RepoInfo.LastCommitTimeAgo',
    defaultMessage: 'Last commit {timeAgo}',
  },
  orgAccount: {
    id: 'PendingApplication.RepoInfo.OrgAccount',
    defaultMessage: 'Organization account',
  },
  personalAccount: {
    id: 'PendingApplication.RepoInfo.PersonalAccount',
    defaultMessage: 'Personal account',
  },
  isFork: {
    id: 'PendingApplication.RepoInfo.IsFork',
    defaultMessage: 'This is a fork',
  },
  isNotFork: {
    id: 'PendingApplication.RepoInfo.IsNotFork',
    defaultMessage: 'This is not a fork',
  },
  collaboratorsCount: {
    id: 'PendingApplication.RepoInfo.CollaboratorsCount',
    defaultMessage: '{count} collaborators',
  },
  starsCount: {
    id: 'PendingApplication.RepoInfo.StarsCount',
    defaultMessage: '{count} stars',
  },
  isRepoAdmin: {
    id: 'PendingApplication.RepoInfo.IsRepoAdmin',
    defaultMessage: 'User is admin of the repository',
  },
  isNotRepoAdmin: {
    id: 'PendingApplication.RepoInfo.IsNotRepoAdmin',
    defaultMessage: 'User is not admin of the repository',
  },
});

export default function ValidatedRepositoryInfo({ customData }: ValidatedRepositoryInfoProps) {
  const intl = useIntl();
  const { licenseSpdxId, validatedRepositoryInfo } = customData || {};
  const fields = validatedRepositoryInfo?.fields;

  if (!fields) {
    return null;
  }

  return (
    <div className="flex flex-col gap-1.5">
      {fields.licenseSpdxId && (
        <FieldWithValidationBadge field={fields.licenseSpdxId}>
          {({ field }) => (
            <React.Fragment>
              <span>
                {intl.formatMessage(msg.license, {
                  license:
                    !field.value || field.value === 'NOASSERTION'
                      ? 'Not found'
                      : `${field.value} (${formatSpdxLicense(String(field.value)) || 'Unknown'})`,
                })}
              </span>{' '}
              {licenseSpdxId && licenseSpdxId !== field.value && (
                <span className="text-muted-foreground">
                  {intl.formatMessage(msg.licenseManually, { license: licenseSpdxId })}
                </span>
              )}
            </React.Fragment>
          )}
        </FieldWithValidationBadge>
      )}
      {fields.lastCommitDate && (
        <FieldWithValidationBadge field={fields.lastCommitDate}>
          {({ field }) =>
            intl.formatMessage(msg.lastCommitTimeAgo, {
              timeAgo: field.value ? dayjs(field.value).fromNow() : 'not found',
            })
          }
        </FieldWithValidationBadge>
      )}
      {fields.isOwnedByOrg && (
        <FieldWithValidationBadge field={fields.isOwnedByOrg}>
          {({ field }) => (field.value ? intl.formatMessage(msg.orgAccount) : intl.formatMessage(msg.personalAccount))}
        </FieldWithValidationBadge>
      )}
      {fields.isFork && (
        <FieldWithValidationBadge field={fields.isFork}>
          {({ field }) => (field.value ? intl.formatMessage(msg.isFork) : intl.formatMessage(msg.isNotFork))}
        </FieldWithValidationBadge>
      )}
      {fields.collaboratorsCount && (
        <FieldWithValidationBadge field={fields.collaboratorsCount}>
          {({ field }) => intl.formatMessage(msg.collaboratorsCount, { count: field.value })}
        </FieldWithValidationBadge>
      )}
      {fields.starsCount && (
        <FieldWithValidationBadge field={fields.starsCount}>
          {({ field }) => intl.formatMessage(msg.starsCount, { count: field.value })}
        </FieldWithValidationBadge>
      )}
      {fields.isAdmin && (
        <FieldWithValidationBadge field={fields.isAdmin}>
          {({ field }) => (field.value ? intl.formatMessage(msg.isRepoAdmin) : intl.formatMessage(msg.isNotRepoAdmin))}
        </FieldWithValidationBadge>
      )}
    </div>
  );
}
