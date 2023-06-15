import React from 'react';
import { gql, useMutation } from '@apollo/client';
import { is } from 'cypress/types/bluebird';
import { Form, Formik } from 'formik';
import { cloneDeep, pick } from 'lodash';
import { createPortal } from 'react-dom';
import { FormattedMessage, useIntl } from 'react-intl';

import { i18nGraphqlException } from '../../lib/errors';
import { requireFields } from '../../lib/form-utils';
import { API_V2_CONTEXT } from '../../lib/graphql/helpers';
import { Agreement } from '../../lib/graphql/types/v2/graphql';

import AttachedFilesForm from '../attached-files/AttachedFilesForm';
import CollectivePickerAsync from '../CollectivePickerAsync';
import { useDrawerActionsContainer } from '../Drawer';
import { Flex } from '../Grid';
import StyledButton from '../StyledButton';
import StyledInput from '../StyledInput';
import StyledInputFormikField from '../StyledInputFormikField';
import StyledTextarea from '../StyledTextarea';
import { H4 } from '../Text';
import { TOAST_TYPE, useToasts } from '../ToastProvider';

const FIELD_LABEL_PROPS = { fontSize: 16, fontWeight: 700 };

const AGREEMENT_FIELDS_FRAGMENT = gql`
  fragment AgreementFields on Agreement {
    id
    title
    expiresAt
    account {
      id
      legacyId
      slug
      imageUrl
      name
    }
    attachment {
      id
      url
    }
  }
`;

const ADD_AGREEMENT_MUTATION = gql`
  mutation AddAgreement(
    $host: AccountReferenceInput!
    $account: AccountReferenceInput!
    $attachment: Upload
    $title: NonEmptyString!
    $expiresAt: DateTime
  ) {
    addAgreement(host: $host, title: $title, account: $account, attachment: $attachment, expiresAt: $expiresAt) {
      id
      ...AgreementFields
    }
  }
  ${AGREEMENT_FIELDS_FRAGMENT}
`;

const EDIT_AGREEMENT_MUTATION = gql`
  mutation EditAgreement($agreement: AgreementReferenceInput!, $title: NonEmptyString!, $expiresAt: DateTime) {
    editAgreement(agreement: $agreement, title: $title, expiresAt: $expiresAt) {
      id
      ...AgreementFields
    }
  }
  ${AGREEMENT_FIELDS_FRAGMENT}
`;

const ActionButtons = ({ formik }) => (
  <Flex justifyContent="flex-end" width="100%">
    <StyledButton
      type="submit"
      minWidth={120}
      whiteSpace="nowrap"
      buttonStyle="primary"
      loading={formik.isSubmitting}
      onClick={e => {
        e.preventDefault();
        formik.handleSubmit();
      }}
    >
      {formik.values.id ? (
        <FormattedMessage defaultMessage="Edit Agreement" />
      ) : (
        <FormattedMessage defaultMessage="Save Changes" />
      )}
    </StyledButton>
  </Flex>
);

const validateAgreement = data => {
  return requireFields(data, ['account', 'title']);
};

type AgreementFormProps = {
  hostLegacyId: number;
  onCreate: (Agreement) => void;
  onEdit: (Agreement) => void;
  agreement: Agreement;
};

const AgreementForm = ({ hostLegacyId, agreement, onCreate, onEdit }: AgreementFormProps) => {
  const intl = useIntl();
  const { addToast } = useToasts();
  const initialValues = cloneDeep(agreement || {});
  const drawerActionsContainer = useDrawerActionsContainer();
  const isEditing = Boolean(agreement);
  const mutation = isEditing ? EDIT_AGREEMENT_MUTATION : ADD_AGREEMENT_MUTATION;
  const [submitAgreement] = useMutation(mutation, { context: API_V2_CONTEXT });
  return (
    <div>
      <H4 mb={32}>
        {isEditing ? (
          <FormattedMessage defaultMessage="Edit Agreement" />
        ) : (
          <FormattedMessage defaultMessage="Add Agreement" />
        )}
      </H4>
      <Formik
        initialValues={initialValues}
        validate={validateAgreement}
        onSubmit={async values => {
          try {
            if (isEditing) {
              const variables = { agreement: { id: agreement.id }, ...pick(values, ['title', 'expiresAt']) };
              const result = await submitAgreement({ variables });
              onEdit?.(result.data.editAgreement);
              addToast({
                type: TOAST_TYPE.SUCCESS,
                message: intl.formatMessage({ defaultMessage: 'Agreement updated' }),
              });
            } else {
              const variables = { ...values, host: { legacyId: hostLegacyId } };
              const result = await submitAgreement({ variables });
              onCreate?.(result.data.addAgreement);
              addToast({
                type: TOAST_TYPE.SUCCESS,
                message: intl.formatMessage({ defaultMessage: 'Agreement created' }),
              });
            }
          } catch (e) {
            addToast({
              type: TOAST_TYPE.ERROR,
              message: i18nGraphqlException(intl, e),
            });
          }
        }}
      >
        {formik => {
          return (
            <Form>
              <StyledInputFormikField
                name="account"
                label={intl.formatMessage({ id: 'Collective', defaultMessage: 'Collective' })}
                labelProps={FIELD_LABEL_PROPS}
                mt={3}
              >
                {({ field }) => (
                  <CollectivePickerAsync
                    inputId={field.id}
                    isSearchable
                    error={field.error}
                    hostCollectiveIds={[hostLegacyId]}
                    collective={formik.values.account}
                    onChange={({ value }) => {
                      formik.setFieldValue('account', { slug: value.slug });
                    }}
                  />
                )}
              </StyledInputFormikField>
              <StyledInputFormikField
                name="title"
                label={intl.formatMessage({ id: 'Title', defaultMessage: 'Title' })}
                labelProps={FIELD_LABEL_PROPS}
                mt={3}
              >
                {({ field }) => (
                  <StyledInput
                    {...field}
                    width="100%"
                    maxWidth={500}
                    maxLength={60}
                    onChange={e => formik.setFieldValue('title', e.target.value)}
                  />
                )}
              </StyledInputFormikField>
              <AttachedFilesForm
                title={<FormattedMessage defaultMessage="Agreement file" />}
                name="attachment"
                kind="AGREEMENT_ATTACHMENT"
                isMulti={false}
                onChange={file => formik.setFieldValue('attachment', file.url)}
                defaultValue={formik.values.attachment ? [formik.values.attachment] : undefined}
              />
              <StyledInputFormikField
                name="expiresAt"
                label={intl.formatMessage({ defaultMessage: 'Expiration date' })}
                labelProps={FIELD_LABEL_PROPS}
                mt={3}
                required={false}
              >
                {({ field }) => (
                  <StyledInput
                    {...field}
                    type="datetime-local"
                    width="100%"
                    maxLength={60}
                    onChange={e => formik.setFieldValue('expiresAt', e.target.value)}
                  />
                )}
              </StyledInputFormikField>
              <StyledInputFormikField
                mt={3}
                name="notes"
                required={false}
                label={intl.formatMessage({ id: 'expense.notes', defaultMessage: 'Notes' })}
                labelProps={FIELD_LABEL_PROPS}
                hint={intl.formatMessage({
                  defaultMessage: 'Private note to the admins that will be displayed as a comment.',
                })}
              >
                {({ field }) => <StyledTextarea {...field} width="100%" minHeight={125} maxLength={3000} showCount />}
              </StyledInputFormikField>
              {drawerActionsContainer ? (
                createPortal(<ActionButtons formik={formik} />, drawerActionsContainer)
              ) : (
                <ActionButtons formik={formik} />
              )}
            </Form>
          );
        }}
      </Formik>
    </div>
  );
};

export default AgreementForm;
