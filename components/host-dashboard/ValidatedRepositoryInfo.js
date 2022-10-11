import React from 'react';
import { Ban } from '@styled-icons/fa-solid/Ban';
import { Check } from '@styled-icons/fa-solid/Check';
import { CheckShield } from '@styled-icons/boxicons-regular/CheckShield';
import Container from '../Container';
import spdxLicenses from 'spdx-license-list';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import { defineMessages, FormattedMessage } from 'react-intl';

import { Box, Flex } from '../Grid';
import StyledLink from '../StyledLink';
import { P, Span } from '../Text';

import { InfoSectionHeader } from './PendingApplication';

dayjs.extend(relativeTime);

const FieldWithValidationBadge = ({ field, children }) => {
  return (
    <Flex alignItems="center" gridGap="8px">
      {field.isValid ? <Check size="12" color="#256643" /> : <Ban size="12" color="#cc2955" />}
      <P>{children({ field })}</P>
    </Flex>
  );
};

const msg = defineMessages({
  license: {
    id: 'PendingApplication.RepoInfo.License',
    defaultMessage: 'License: {license}',
  },
  licenseManually: {
    id: 'PendingApplication.RepoInfo.LicenseManually',
    defaultMessage: '(user specified {license} manually)',
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

export default function ValidatedRepositoryInfo({
  customData: { repositoryUrl, validatedRepositoryInfo, licenseSpdxId },
}) {
  return (
    <Container>
      <InfoSectionHeader icon={<CheckShield size={16} color="#75777A" />}>
        <FormattedMessage id="PendingApplication.RepoInfo.Header" defaultMessage="Validated repository information" />
      </InfoSectionHeader>
      <Flex flexDirection="column" gridGap={'6px'} mb={4}>
        <P mb={1}>
          <StyledLink href={repositoryUrl}>{repositoryUrl.split('//')[1]}</StyledLink>
        </P>
        <FieldWithValidationBadge field={validatedRepositoryInfo.fields.licenseSpdxId}>
          {({ field }) => (
            <React.Fragment>
              {intl.formatMessage(msg.license, {
                license:
                  field.value === 'NOASSERTION' ? 'Not found' : `${field.value} (${spdxLicenses[field.value].name})`,
              })}{' '}
              {licenseSpdxId !== field.value && (
                <Span color="black.600">{intl.formatMessage(msg.licenseManually, { license: licenseSpdxId })}</Span>
              )}
            </React.Fragment>
          )}
        </FieldWithValidationBadge>
        <FieldWithValidationBadge field={validatedRepositoryInfo.fields.lastCommitDate}>
          {({ field }) =>
            intl.formatMessage(msg.lastCommitTimeAgo, { timeAgo: field ? dayjs(field.value.fromNow()) : 'not found' })
          }
        </FieldWithValidationBadge>
        <FieldWithValidationBadge field={validatedRepositoryInfo.fields.isOwnedByOrg}>
          {({ field }) => (field.value ? intl.formatMessage(msg.orgAccount) : intl.formatMessage(msg.personalAccount))}
        </FieldWithValidationBadge>
        <FieldWithValidationBadge field={validatedRepositoryInfo.fields.isFork}>
          {({ field }) => (field.value ? intl.formatMessage(msg.isFork) : intl.formatMessage(msg.isNotFork))}
        </FieldWithValidationBadge>
        <FieldWithValidationBadge field={validatedRepositoryInfo.fields.collaboratorsCount}>
          {({ field }) => intl.formatMessage(msg.collaboratorsCount, { count: field.value })}
        </FieldWithValidationBadge>
        <FieldWithValidationBadge field={validatedRepositoryInfo.fields.starsCount}>
          {({ field }) => intl.formatMessage(msg.starsCount, { count: field.value })}
        </FieldWithValidationBadge>
        <FieldWithValidationBadge field={validatedRepositoryInfo.fields.isAdmin}>
          {({ field }) => (field.value ? intl.formatMessage(msg.isRepoAdmin) : intl.formatMessage(msg.isNotRepoAdmin))}
        </FieldWithValidationBadge>
      </Flex>
    </Container>
  );
}
