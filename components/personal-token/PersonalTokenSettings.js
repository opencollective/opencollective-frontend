import React from 'react';
import PropTypes from 'prop-types';
import { useMutation, useQuery } from '@apollo/client';
import { Form, Formik } from 'formik';
import { pick } from 'lodash';
import { AlertTriangle } from 'lucide-react';
import { useRouter } from 'next/router';
import { FormattedMessage, useIntl } from 'react-intl';
import styled from 'styled-components';

import { stripTime } from '../../lib/date-utils';
import { i18nGraphqlException } from '../../lib/errors';
import { API_V2_CONTEXT, gql } from '../../lib/graphql/helpers';

import { Flex } from '../Grid';
import { getI18nLink } from '../I18nFormatters';
import Link from '../Link';
import LoadingPlaceholder from '../LoadingPlaceholder';
import MessageBoxGraphqlError from '../MessageBoxGraphqlError';
import StyledButton from '../StyledButton';
import StyledCard from '../StyledCard';
import StyledHr from '../StyledHr';
import StyledInput from '../StyledInput';
import StyledInputFormikField from '../StyledInputFormikField';
import StyledLink from '../StyledLink';
import StyledSelect from '../StyledSelect';
import { H3, H4, P, Span } from '../Text';
import { Checkbox } from '../ui/Checkbox';
import { useToast } from '../ui/useToast';
import WarnIfUnsavedChanges from '../WarnIfUnsavedChanges';

import DeletePersonalTokenModal from './DeletePersonalTokenModal';
import { getScopesOptions, validatePersonalTokenValues } from './lib';

const personalTokenSettingsFragment = gql`
  fragment PersonalTokenSettings on PersonalToken {
    id
    name
    scope
    expiresAt
    preAuthorize2FA
    token
  }
`;

const personalTokenQuery = gql`
  query PersonalToken($id: String!) {
    personalToken(id: $id) {
      id
      ...PersonalTokenSettings
    }
  }
  ${personalTokenSettingsFragment}
`;

const updatePersonalTokenMutation = gql`
  mutation UpdatePersonalToken($personalToken: PersonalTokenUpdateInput!) {
    updatePersonalToken(personalToken: $personalToken) {
      id
      ...PersonalTokenSettings
    }
  }
  ${personalTokenSettingsFragment}
`;

const CodeContainer = styled(Span)`
  overflow-wrap: anywhere;
  user-select: all;
  margin-right: 8px;
`;

const ObfuscatedClientSecret = ({ secret }) => {
  const [show, setShow] = React.useState(false);
  return (
    <P>
      {show && <CodeContainer data-cy="unhidden-secret">{secret}</CodeContainer>}
      <StyledLink data-cy="show-secret-btn" as="button" color="blue.600" onClick={() => setShow(!show)}>
        {show ? <FormattedMessage id="Hide" defaultMessage="Hide" /> : <FormattedMessage defaultMessage="Show" />}
      </StyledLink>
    </P>
  );
};

ObfuscatedClientSecret.propTypes = {
  secret: PropTypes.string,
};

const LABEL_STYLES = { fontWeight: 700, fontSize: '16px', lineHeight: '24px' };

const PersonalTokenSettings = ({ backPath, id }) => {
  const intl = useIntl();
  const router = useRouter();
  const { toast } = useToast();
  const [showDeleteModal, setShowDeleteModal] = React.useState(false);
  const { data, loading, error } = useQuery(personalTokenQuery, { variables: { id }, context: API_V2_CONTEXT });
  const [updateToken] = useMutation(updatePersonalTokenMutation, { context: API_V2_CONTEXT });

  return (
    <div data-cy="personal-token-settings">
      <P mt={3} mb={4}>
        <StyledLink data-cy="go-back-link" as={Link} color="black.800" href={backPath}>
          &larr; <FormattedMessage defaultMessage="Go back to all your tokens" />
        </StyledLink>
      </P>
      {loading ? (
        <LoadingPlaceholder height={300} />
      ) : error ? (
        <MessageBoxGraphqlError error={error} />
      ) : (
        <div>
          <Flex width="100%" alignItems="center">
            <H3 fontSize="18px" fontWeight="700">
              {data.personalToken.name}
            </H3>
            <StyledHr ml={2} flex="1" borderColor="black.400" />
          </Flex>
          <StyledCard maxWidth="600px" p={3} mt={4}>
            <H4 fontSize="16px" lineHeight="24px" fontWeight="700" color="black.800" mb="20px">
              <FormattedMessage defaultMessage="Personal Token" />
            </H4>
            <Flex flexWrap="wrap" justifyContent="space-between">
              <Flex flexDirection="column" width="100%" data-cy="personalToken-token">
                <ObfuscatedClientSecret secret={data.personalToken.token} />
              </Flex>
            </Flex>
          </StyledCard>
          <P mb={4} mt="10px" fontSize={12} color="black.700" letter-spacing="-0.4px">
            {intl.formatMessage(
              {
                id: 'token.docs',
                defaultMessage:
                  'Pass this code as Personal-Token HTTP header or personalToken query parameter in the URL. <Link>More info</Link>.',
              },
              {
                Link: getI18nLink({
                  href: 'https://docs.opencollective.com/help/developers/personal-tokens',
                  openInNewTab: true,
                }),
              },
            )}
          </P>
          <Formik
            initialValues={{
              ...data.personalToken,
              name: data.personalToken.name || '',
              expiresAt: data.personalToken.expiresAt ? stripTime(data.personalToken.expiresAt) : '',
              scope: (data.personalToken.scope || []).map(scope => ({ value: scope, label: scope })),
            }}
            validate={values => validatePersonalTokenValues(intl, values)}
            onSubmit={async (values, { resetForm }) => {
              try {
                const filteredValue = pick(values, ['name', 'scope', 'expiresAt', 'preAuthorize2FA']);
                const personalToken = {
                  ...filteredValue,
                  id,
                  scope: filteredValue.scope.map(s => s.value),
                  expiresAt: filteredValue.expiresAt ? filteredValue.expiresAt : null,
                };
                const result = await updateToken({ variables: { personalToken } });
                toast({
                  variant: 'success',
                  message: intl.formatMessage(
                    { defaultMessage: 'Personal token "{name}" updated' },
                    { name: result.data.updatePersonalToken.name },
                  ),
                });
                resetForm({
                  values: {
                    ...result.data.updatePersonalToken,
                    expiresAt: stripTime(result.data.updatePersonalToken.expiresAt),
                  },
                });
              } catch (e) {
                toast({ variant: 'error', message: i18nGraphqlException(intl, e) });
              }
            }}
          >
            {({ isSubmitting, dirty }) => (
              <Form>
                <WarnIfUnsavedChanges hasUnsavedChanges={dirty && !showDeleteModal} />
                <StyledInputFormikField
                  name="name"
                  label={intl.formatMessage({ defaultMessage: 'Token name' })}
                  labelProps={LABEL_STYLES}
                  required
                >
                  {({ field }) => (
                    <StyledInput
                      {...field}
                      placeholder={intl.formatMessage(
                        { id: 'examples', defaultMessage: 'e.g., {examples}' },
                        { examples: 'Back Your Stack' },
                      )}
                    />
                  )}
                </StyledInputFormikField>

                <StyledInputFormikField
                  name="scope"
                  label="Scopes"
                  labelProps={LABEL_STYLES}
                  mt={20}
                  hint={intl.formatMessage(
                    {
                      defaultMessage: 'Scopes define the access for personal tokens. <Link>More info</Link>.',
                    },
                    {
                      Link: getI18nLink({
                        href: 'https://docs.opencollective.com/help/developers/oauth#text-available-scopes',
                        openInNewTab: true,
                      }),
                    },
                  )}
                >
                  {({ form, field }) => (
                    <StyledSelect
                      options={getScopesOptions()}
                      inputId={field.id}
                      error={field.error}
                      name={field.name}
                      defaultValue={field.value}
                      onBlur={() => form.setFieldTouched(field.name, true)}
                      onChange={value => form.setFieldValue(field.name, value)}
                      isMulti
                      data-cy="personal-token-scope"
                    />
                  )}
                </StyledInputFormikField>

                <StyledInputFormikField
                  name="preAuthorize2FA"
                  mt={20}
                  labelProps={LABEL_STYLES}
                  label={
                    <div className="flex items-center">
                      <AlertTriangle className="mr-2 inline-block" size={16} />
                      <span>
                        {intl.formatMessage({ id: 'token.advancedPrivileges', defaultMessage: 'Advanced privileges' })}
                      </span>
                    </div>
                  }
                >
                  {({ form, field }) => {
                    return (
                      <div className="my-1 flex items-center">
                        <Checkbox
                          id="preAuthorize2FA-checkbox"
                          checked={field.value}
                          onCheckedChange={value => form.setFieldValue(field.name, value)}
                        />
                        <label htmlFor="preAuthorize2FA-checkbox" className="ml-2 text-xs font-normal leading-none">
                          <FormattedMessage defaultMessage="Allow this token to directly use operations that would normally require 2FA" />
                        </label>
                      </div>
                    );
                  }}
                </StyledInputFormikField>

                <StyledInputFormikField
                  name="expiresAt"
                  label={intl.formatMessage({ defaultMessage: 'Expiration date' })}
                  labelProps={LABEL_STYLES}
                  mt={20}
                  hint={intl.formatMessage({
                    defaultMessage: 'Personal tokens can expire after a certain date.',
                  })}
                >
                  {({ field }) => {
                    return <StyledInput {...field} type="date" min={stripTime(new Date())} />;
                  }}
                </StyledInputFormikField>
                <Flex gap="16px" justifyContent="space-between" mt={4}>
                  <StyledButton
                    type="submit"
                    buttonStyle="primary"
                    buttonSize="small"
                    loading={isSubmitting}
                    disabled={!dirty}
                    minWidth="125px"
                  >
                    <FormattedMessage defaultMessage="Update token" />
                  </StyledButton>
                  <StyledButton
                    type="button"
                    buttonStyle="dangerSecondary"
                    buttonSize="small"
                    disabled={isSubmitting}
                    onClick={() => setShowDeleteModal(true)}
                    data-cy="personalToken-delete"
                  >
                    <FormattedMessage defaultMessage="Delete token" />
                  </StyledButton>
                </Flex>
              </Form>
            )}
          </Formik>
          {showDeleteModal && (
            <DeletePersonalTokenModal
              personalToken={data.personalToken}
              onClose={() => setShowDeleteModal(false)}
              onDelete={() => router.push(backPath)}
            />
          )}
        </div>
      )}
    </div>
  );
};

PersonalTokenSettings.propTypes = {
  id: PropTypes.string.isRequired,
  backPath: PropTypes.string.isRequired,
};

export default PersonalTokenSettings;
