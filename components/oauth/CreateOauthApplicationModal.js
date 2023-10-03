import React from 'react';
import PropTypes from 'prop-types';
import { gql, useMutation } from '@apollo/client';
import { Form, Formik } from 'formik';
import { FormattedMessage, useIntl } from 'react-intl';

import { i18nGraphqlException } from '../../lib/errors';
import { API_V2_CONTEXT } from '../../lib/graphql/helpers';

import { Flex } from '../Grid';
import StyledButton from '../StyledButton';
import StyledInput from '../StyledInput';
import StyledInputFormikField from '../StyledInputFormikField';
import StyledModal, { ModalBody, ModalFooter, ModalHeader } from '../StyledModal';
import StyledTextarea from '../StyledTextarea';
import { useToast } from '../ui/useToast';

import { validateOauthApplicationValues } from './lib';

const createApplicationMutation = gql`
  mutation CreateApplication($application: ApplicationCreateInput!) {
    createApplication(application: $application) {
      id
      name
    }
  }
`;

const LABEL_STYLES = { fontWeight: 700, fontSize: '14px', lineHeight: '17px' };

const INITIAL_VALUES = {
  name: '',
  description: '',
  redirectUri: '',
};

const CreateOauthApplicationModal = ({ account, onSuccess, onClose, ...props }) => {
  const intl = useIntl();
  const { toast } = useToast();
  const [createApplication] = useMutation(createApplicationMutation, {
    context: API_V2_CONTEXT,
    update: cache => {
      const accountCacheId = cache.identify(account);
      cache.modify({ id: accountCacheId, fields: { oAuthApplications: (_, { DELETE }) => DELETE } });
    },
  });

  return (
    <StyledModal width="576px" onClose={onClose} data-cy="create-oauth-app-modal" {...props}>
      <ModalHeader>
        <FormattedMessage defaultMessage="Create OAuth app" />
      </ModalHeader>
      <Formik
        initialValues={INITIAL_VALUES}
        validate={values => validateOauthApplicationValues(intl, values)}
        onSubmit={async values => {
          try {
            const appInput = { ...values, account: { id: account.id } };
            const result = await createApplication({ variables: { application: appInput } });
            toast({
              variant: 'success',
              message: intl.formatMessage(
                { defaultMessage: 'Application "{name}" created' },
                { name: result.data.createApplication.name },
              ),
            });
            onSuccess(result.data.createApplication, account);
          } catch (e) {
            toast({ variant: 'error', message: i18nGraphqlException(intl, e) });
          }
        }}
      >
        {({ isSubmitting }) => (
          <Form>
            <ModalBody mt="36px">
              <StyledInputFormikField
                name="name"
                label={intl.formatMessage({ defaultMessage: 'Name of the app' })}
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
                label={intl.formatMessage({ defaultMessage: 'Callback URL' })}
                labelProps={LABEL_STYLES}
                mt={20}
                required
              >
                {({ field }) => <StyledInput {...field} type="url" placeholder="http://example.com/path" />}
              </StyledInputFormikField>
            </ModalBody>
            <ModalFooter>
              <Flex gap="16px" justifyContent="center">
                <StyledButton type="submit" buttonStyle="primary" buttonSize="small" loading={isSubmitting}>
                  <FormattedMessage defaultMessage="Create app" />
                </StyledButton>
                <StyledButton
                  type="button"
                  buttonStyle="secondary"
                  buttonSize="small"
                  disabled={isSubmitting}
                  onClick={() => onClose()}
                >
                  <FormattedMessage id="actions.cancel" defaultMessage="Cancel" />
                </StyledButton>
              </Flex>
            </ModalFooter>
          </Form>
        )}
      </Formik>
    </StyledModal>
  );
};

CreateOauthApplicationModal.propTypes = {
  onClose: PropTypes.func.isRequired,
  onSuccess: PropTypes.func.isRequired,
  account: PropTypes.object.isRequired,
};

export default CreateOauthApplicationModal;
