import React from 'react';
import PropTypes from 'prop-types';
import { gql, useMutation } from '@apollo/client';
import { Form, Formik } from 'formik';
import { FormattedMessage, useIntl } from 'react-intl';

import { stripTime } from '../../lib/date-utils';
import { i18nGraphqlException } from '../../lib/errors';
import { API_V2_CONTEXT } from '../../lib/graphql/helpers';

import { Flex } from '../Grid';
import { getI18nLink } from '../I18nFormatters';
import StyledButton from '../StyledButton';
import StyledInput from '../StyledInput';
import StyledInputFormikField from '../StyledInputFormikField';
import StyledModal, { ModalBody, ModalFooter, ModalHeader } from '../StyledModal';
import StyledSelect from '../StyledSelect';
import { useToast } from '../ui/useToast';

import { getScopesOptions, validatePersonalTokenValues } from './lib';

const createPersonalTokenMutation = gql`
  mutation CreatePersonalToken($personalToken: PersonalTokenCreateInput!) {
    createPersonalToken(personalToken: $personalToken) {
      id
      name
    }
  }
`;

const LABEL_STYLES = { fontWeight: 700, fontSize: '14px', lineHeight: '17px' };

const INITIAL_VALUES = {
  name: '',
  scope: [],
  expiresAt: '',
};

const CreatePersonalTokenModal = ({ account, onSuccess, onClose, ...props }) => {
  const intl = useIntl();
  const { toast } = useToast();
  const [createPersonalToken] = useMutation(createPersonalTokenMutation, {
    context: API_V2_CONTEXT,
    update: cache => {
      const accountCacheId = cache.identify(account);
      cache.modify({ id: accountCacheId, fields: { personalTokens: (_, { DELETE }) => DELETE } });
    },
  });

  return (
    <StyledModal width="576px" onClose={onClose} data-cy="create-personal-token-modal" {...props}>
      <ModalHeader>
        <FormattedMessage defaultMessage="Create Personal token" />
      </ModalHeader>
      <Formik
        initialValues={INITIAL_VALUES}
        validate={values => validatePersonalTokenValues(intl, values)}
        onSubmit={async values => {
          try {
            const tokenInput = {
              ...values,
              account: { id: account.id },
              scope: values.scope.map(scope => scope.value),
              expiresAt: values.expiresAt ? values.expiresAt : null,
            };
            const result = await createPersonalToken({ variables: { personalToken: tokenInput } });
            toast({
              variant: 'success',
              message: intl.formatMessage(
                { defaultMessage: 'Personal token "{name}" created' },
                { name: result.data.createPersonalToken.name },
              ),
            });
            onSuccess(result.data.createPersonalToken, account);
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
                label={intl.formatMessage({ defaultMessage: 'Token Name' })}
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
            </ModalBody>
            <ModalFooter>
              <Flex gap="16px" justifyContent="center">
                <StyledButton type="submit" buttonStyle="primary" buttonSize="small" loading={isSubmitting}>
                  <FormattedMessage defaultMessage="Create token" />
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

CreatePersonalTokenModal.propTypes = {
  onClose: PropTypes.func.isRequired,
  onSuccess: PropTypes.func.isRequired,
  account: PropTypes.object.isRequired,
};

export default CreatePersonalTokenModal;
