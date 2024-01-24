import React from 'react';
import PropTypes from 'prop-types';
import { useMutation, useQuery } from '@apollo/client';
import { Form, Formik } from 'formik';
import { pick } from 'lodash';
import { useRouter } from 'next/router';
import { FormattedMessage, useIntl } from 'react-intl';
import styled from 'styled-components';

import { i18nGraphqlException } from '../../lib/errors';
import { API_V2_CONTEXT, gql } from '../../lib/graphql/helpers';

import { Flex } from '../Grid';
import { getI18nLink } from '../I18nFormatters';
import LoadingPlaceholder from '../LoadingPlaceholder';
import MessageBox from '../MessageBox';
import MessageBoxGraphqlError from '../MessageBoxGraphqlError';
import StyledButton from '../StyledButton';
import StyledCard from '../StyledCard';
import StyledHr from '../StyledHr';
import StyledInput from '../StyledInput';
import StyledInputFormikField from '../StyledInputFormikField';
import StyledLink from '../StyledLink';
import StyledTextarea from '../StyledTextarea';
import { H3, H4, P, Span } from '../Text';
import { useToast } from '../ui/useToast';
import WarnIfUnsavedChanges from '../WarnIfUnsavedChanges';

import DeleteOAuthApplicationModal from './DeleteOAuthApplicationModal';
import { validateOauthApplicationValues } from './lib';

const applicationSettingsFragment = gql`
  fragment ApplicationSettings on Application {
    id
    name
    description
    preAuthorize2FA
    redirectUri
    clientId
    clientSecret
  }
`;

const applicationQuery = gql`
  query OAuthApplication($id: String!) {
    application(id: $id) {
      id
      ...ApplicationSettings
    }
  }
  ${applicationSettingsFragment}
`;

const updateApplicationMutation = gql`
  mutation UpdateOAuthApplication($application: ApplicationUpdateInput!) {
    updateApplication(application: $application) {
      id
      ...ApplicationSettings
    }
  }
  ${applicationSettingsFragment}
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
        {show ? (
          <FormattedMessage id="Hide" defaultMessage="Hide" />
        ) : (
          <FormattedMessage defaultMessage="Show" id="K7AkdL" />
        )}
      </StyledLink>
    </P>
  );
};

ObfuscatedClientSecret.propTypes = {
  secret: PropTypes.string,
};

const LABEL_STYLES = { fontWeight: 700, fontSize: '16px', lineHeight: '24px' };

const OAuthApplicationSettings = ({ backPath, id }) => {
  const intl = useIntl();
  const router = useRouter();
  const { toast } = useToast();
  const [showDeleteModal, setShowDeleteModal] = React.useState(false);
  const { data, loading, error } = useQuery(applicationQuery, { variables: { id }, context: API_V2_CONTEXT });
  const [updateApplication] = useMutation(updateApplicationMutation, { context: API_V2_CONTEXT });
  return (
    <div data-cy="oauth-app-settings">
      <P mt={3} mb={4}>
        <StyledLink data-cy="go-back-link" color="black.800" href={backPath}>
          &larr; <FormattedMessage defaultMessage="Go back to all your apps" id="05doZ2" />
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
              {data.application.name}
            </H3>
            <StyledHr ml={2} flex="1" borderColor="black.400" />
          </Flex>
          {data.application.preAuthorize2FA && (
            <MessageBox type="warning" withIcon mt={16}>
              <FormattedMessage
                defaultMessage="This application can directly perform critical operations that would normally require 2FA."
                id="RRq5rD"
              />
            </MessageBox>
          )}
          <StyledCard maxWidth="600px" p={3} mt={4}>
            <H4 fontSize="16px" lineHeight="24px" fontWeight="700" color="black.800" mb="20px">
              <FormattedMessage defaultMessage="Client ID and client secret" id="FJBnaq" />
            </H4>
            <Flex flexWrap="wrap" justifyContent="space-between">
              <Flex flexDirection="column" width="35%">
                <P fontSize="15px" fontWeight="500" color="black.800" mb={2}>
                  <FormattedMessage defaultMessage="Client ID" id="U5+MBC" />
                </P>
                <CodeContainer data-cy="oauth-app-client-id" fontSize="14px" color="black.800" css={{}}>
                  {data.application.clientId}
                </CodeContainer>
              </Flex>
              <Flex flexDirection="column" width="65%">
                <P fontSize="15px" fontWeight="500" color="black.800" mb={2}>
                  <FormattedMessage defaultMessage="Client secret" id="B7p2EC" />
                </P>
                <ObfuscatedClientSecret secret={data.application.clientSecret} />
              </Flex>
            </Flex>
          </StyledCard>
          <P mb={4} mt="10px" fontSize={12} color="black.700" letter-spacing="-0.4px">
            {intl.formatMessage(
              {
                id: 'oauth.docs',
                defaultMessage:
                  'Explore <Link>our documentation</Link> for guidance on authorizing OAuth applications.',
              },
              {
                Link: getI18nLink({
                  href: 'https://docs.opencollective.com/help/developers/oauth',
                  openInNewTab: true,
                }),
              },
            )}
          </P>
          <Formik
            initialValues={data.application}
            validate={values => validateOauthApplicationValues(intl, values)}
            onSubmit={async (values, { resetForm }) => {
              try {
                const filteredValues = pick(values, ['name', 'description', 'redirectUri']);
                const applicationInput = { id: data.application.id, ...filteredValues };
                const result = await updateApplication({ variables: { application: applicationInput } });
                toast({
                  variant: 'success',
                  message: intl.formatMessage(
                    { defaultMessage: 'Application "{name}" updated', id: 'NZ1C9t' },
                    { name: result.data.updateApplication.name },
                  ),
                });
                resetForm({ values: result.data.updateApplication });
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
                  label={intl.formatMessage({ defaultMessage: 'Name of the app', id: 'J7xOu/' })}
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
                  name="description"
                  label={intl.formatMessage({ id: 'Fields.description', defaultMessage: 'Description' })}
                  hint={intl.formatMessage({
                    defaultMessage: 'A short description of your app so users know what it does.',
                    id: 'sZy/sl',
                  })}
                  labelProps={LABEL_STYLES}
                  mt={20}
                >
                  {({ field }) => (
                    <StyledTextarea
                      {...field}
                      height="98px"
                      resize="none"
                      placeholder={intl.formatMessage({
                        id: 'oauthApp.descriptionPlaceholder',
                        defaultMessage:
                          'Discover the Open Source projects your organization is using that need financial support.',
                      })}
                    />
                  )}
                </StyledInputFormikField>
                <StyledInputFormikField
                  name="redirectUri"
                  label={intl.formatMessage({ defaultMessage: 'Callback URL', id: '5nkU0l' })}
                  labelProps={LABEL_STYLES}
                  mt={20}
                  required
                >
                  {({ field }) => <StyledInput {...field} type="url" placeholder="http://example.com/path" />}
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
                    <FormattedMessage defaultMessage="Update app" id="UtDIxu" />
                  </StyledButton>
                  <StyledButton
                    type="button"
                    buttonStyle="dangerSecondary"
                    buttonSize="small"
                    disabled={isSubmitting}
                    onClick={() => setShowDeleteModal(true)}
                  >
                    <FormattedMessage defaultMessage="Delete app" id="3I6uVw" />
                  </StyledButton>
                </Flex>
              </Form>
            )}
          </Formik>
          {showDeleteModal && (
            <DeleteOAuthApplicationModal
              application={data.application}
              onClose={() => setShowDeleteModal(false)}
              onDelete={() => router.push(backPath)}
            />
          )}
        </div>
      )}
    </div>
  );
};

OAuthApplicationSettings.propTypes = {
  id: PropTypes.string.isRequired,
  backPath: PropTypes.string.isRequired,
};

export default OAuthApplicationSettings;
