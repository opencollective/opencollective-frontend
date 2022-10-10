import { Lock } from '@styled-icons/boxicons-solid/Lock';
import { Ban } from '@styled-icons/fa-solid/Ban';
import { Check } from '@styled-icons/fa-solid/Check';
import { CheckShield } from '@styled-icons/boxicons-regular/CheckShield';
import Container from '../Container';
import spdxLicenses from 'spdx-license-list';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import { defineMessages, FormattedMessage, useIntl } from 'react-intl';
import { Box, Flex } from '../Grid';
import StyledLink from '../StyledLink';
import { P, Span } from '../Text';

dayjs.extend(relativeTime);

import { InfoSectionHeader } from './PendingApplication';

const FieldWithValidationBadge = ({ field, children }) => {
  return (
    <Flex alignItems="center" gridGap="8px">
      {field.isValid ? <Check size="12" color="#256643" /> : <Ban size="12" color="#cc2955" />}
      <P>{children({ field })}</P>
    </Flex>
  );
};

export default function ValidatedRepositoryInfo({ customData: { repositoryUrl, validatorInfo, licenseSpdxId } }) {
  return (
    <Container>
      <InfoSectionHeader icon={<CheckShield size={16} color="#75777A" />}>
        <FormattedMessage id="PendingApplication.ValidatorInfo" defaultMessage="Validated repository information" />
      </InfoSectionHeader>
      <Flex flexDirection="column" gridGap={'6px'} mb={4}>
        <P mb={1}>
          <StyledLink href={repositoryUrl}>{repositoryUrl.split('//')[1]}</StyledLink>
        </P>
        <FieldWithValidationBadge field={validatorInfo.fields.licenseSpdxId}>
          {({ field }) => (
            <>
              License:{' '}
              {field.value === 'NOASSERTION' ? 'Not found' : `${field.value} (${spdxLicenses[field.value].name})`}{' '}
              {licenseSpdxId !== field.value && (
                <Span color="black.600">(user specified "{licenseSpdxId}" manually)</Span>
              )}
            </>
          )}
        </FieldWithValidationBadge>
        <FieldWithValidationBadge field={validatorInfo.fields.lastCommitDate}>
          {({ field }) => <>Last commit {field ? dayjs(field.value).fromNow() : 'not found'}</>}
        </FieldWithValidationBadge>
        <FieldWithValidationBadge field={validatorInfo.fields.isOwnedByOrg}>
          {({ field }) => <>{field.value ? 'Owned by organization account' : 'Owned by personal account'}</>}
        </FieldWithValidationBadge>
        <FieldWithValidationBadge field={validatorInfo.fields.isFork}>
          {({ field }) => <>{field.value ? 'Is a fork' : 'Is not a fork'}</>}
        </FieldWithValidationBadge>
        <FieldWithValidationBadge field={validatorInfo.fields.collaboratorsCount}>
          {({ field }) => <>{field.value} collaborators</>}
        </FieldWithValidationBadge>
        <FieldWithValidationBadge field={validatorInfo.fields.starsCount}>
          {({ field }) => <>{field.value} stars</>}
        </FieldWithValidationBadge>
        <FieldWithValidationBadge field={validatorInfo.fields.isAdmin}>
          {({ field }) => <>{field.value ? 'Admin of repository' : 'Not admin of repository'}</>}
        </FieldWithValidationBadge>
      </Flex>
    </Container>
  );
}
