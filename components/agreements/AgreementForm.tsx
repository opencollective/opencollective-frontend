import React from 'react';
import { useMutation } from '@apollo/client';
import { Form, Formik } from 'formik';
import { cloneDeep, omit, pick } from 'lodash';
import { createPortal } from 'react-dom';
import { FormattedMessage, useIntl } from 'react-intl';

import { getAccountReferenceInput } from '../../lib/collective';
import { stripTime } from '../../lib/date-utils';
import { i18nGraphqlException } from '../../lib/errors';
import { requireFields } from '../../lib/form-utils';
import { API_V2_CONTEXT, gql } from '../../lib/graphql/helpers';
import type { Account, Agreement } from '../../lib/graphql/types/v2/graphql';

import AttachedFilesForm from '../attached-files/AttachedFilesForm';
import CollectivePickerAsync from '../CollectivePickerAsync';
import { useDrawerActionsContainer } from '../Drawer';
import { Flex } from '../Grid';
import StyledButton from '../StyledButton';
import StyledInput from '../StyledInput';
import StyledInputFormikField from '../StyledInputFormikField';
import StyledTextarea from '../StyledTextarea';
import { H4 } from '../Text';
import { useToast } from '../ui/useToast';

import { AGREEMENT_VIEW_FIELDS_FRAGMENT } from './fragments';

const FIELD_LABEL_PROPS = { fontSize: 16, fontWeight: 700 };

const AGREEMENT_MUTATION_FIELDS_FRAGMENT = gql`
  fragment AgreementMutationFields on Agreement {
    id
    ...AgreementViewFields
    account {
      id
      ... on AccountWithHost {
        # Refetch account agreements count to update the cache
        hostAgreements {
          totalCount
        }
      }
    }
  }
  ${AGREEMENT_VIEW_FIELDS_FRAGMENT}
`;

const ADD_AGREEMENT_MUTATION = gql`
  mutation AddAgreement(
    $host: AccountReferenceInput!
    $account: AccountReferenceInput!
    $attachment: Upload
    $title: NonEmptyString!
    $notes: String
    $expiresAt: DateTime
  ) {
    addAgreement(
      host: $host
      title: $title
      account: $account
      attachment: $attachment
      expiresAt: $expiresAt
      notes: $notes
    ) {
      id
      ...AgreementMutationFields
    }
  }
  ${AGREEMENT_MUTATION_FIELDS_FRAGMENT}
`;

const EDIT_AGREEMENT_MUTATION = gql`
  mutation EditAgreement(
    $agreement: AgreementReferenceInput!
    $title: NonEmptyString!
    $expiresAt: DateTime
    $notes: String
    $attachment: Upload
  ) {
    editAgreement(agreement: $agreement, title: $title, expiresAt: $expiresAt, notes: $notes, attachment: $attachment) {
      id
      ...AgreementMutationFields
    }
  }
  ${AGREEMENT_MUTATION_FIELDS_FRAGMENT}
`;

const ActionButtons = ({ formik, onCancel }) => (
  <Flex justifyContent="flex-end" width="100%">
    <StyledButton type="button" minWidth={120} mr={2} onClick={onCancel}>
      <FormattedMessage id="actions.cancel" defaultMessage="Cancel" />
    </StyledButton>
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
        <FormattedMessage defaultMessage="Save Changes" />
      ) : (
        <FormattedMessage defaultMessage="Create Agreement" />
      )}
    </StyledButton>
  </Flex>
);

const validateAgreement = data => {
  return requireFields(data, ['account', 'title']);
};

export type AgreementFormProps = {
  hostLegacyId: number;
  onCreate: (Agreement) => void;
  onEdit?: (Agreement) => void;
  onCancel: () => void;
  agreement?: Agreement;
  account?: Pick<Account, 'id' | 'slug' | 'name' | 'imageUrl'>;
  openFileViewer?: (fileUrl: string) => void;
  disableDrawerActions?: boolean;
};

const AgreementForm = ({
  hostLegacyId,
  agreement,
  account,
  onCreate,
  onEdit,
  onCancel,
  openFileViewer,
  disableDrawerActions,
}: AgreementFormProps) => {
  const intl = useIntl();
  const { toast } = useToast();
  const initialValues = cloneDeep(agreement || { account });
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
              const editableFields = ['title', 'expiresAt', 'notes', 'attachment'];
              const variables = { agreement: { id: agreement.id }, ...pick(values, editableFields) };

              if (variables['attachment']?.id) {
                // If the attachment is not changed, we don't want to send it to the API
                delete variables['attachment'];
              }

              const result = await submitAgreement({ variables });
              onEdit?.(result.data.editAgreement);
              toast({
                variant: 'success',
                message: intl.formatMessage({ defaultMessage: 'Agreement updated' }),
              });
            } else {
              const account = getAccountReferenceInput(values.account);
              const variables = { ...values, account, host: { legacyId: hostLegacyId } };
              const result = await submitAgreement({ variables });
              onCreate?.(result.data.addAgreement);
              toast({
                variant: 'success',
                message: intl.formatMessage({ defaultMessage: 'Agreement created' }),
              });
            }
          } catch (e) {
            toast({
              variant: 'error',
              message: i18nGraphqlException(intl, e),
            });
          }
        }}
      >
        {formik => {
          return (
            <Form data-cy="agreement-form">
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
                    disabled={isEditing || account}
                    onChange={({ value }) => {
                      formik.setFieldValue('account', value);
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
                onChange={file => formik.setFieldValue('attachment', file)}
                defaultValue={formik.values.attachment || undefined}
                openFileViewer={openFileViewer}
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
                    {...omit(field, ['value', 'onChange', 'onBlur'])}
                    type="date"
                    width="100%"
                    maxLength={60}
                    defaultValue={stripTime(formik.values.expiresAt)}
                    onChange={e => {
                      // Consider date input as UTC
                      formik.setFieldValue('expiresAt', e.target.value ? `${e.target.value}T00:00:00.000Z` : null);
                    }}
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
                  defaultMessage: 'Private note for the host admins.',
                })}
              >
                {({ field }) => <StyledTextarea {...field} width="100%" minHeight={125} maxLength={3000} showCount />}
              </StyledInputFormikField>
              {drawerActionsContainer && !disableDrawerActions ? (
                createPortal(<ActionButtons formik={formik} onCancel={onCancel} />, drawerActionsContainer)
              ) : (
                <ActionButtons formik={formik} onCancel={onCancel} />
              )}
            </Form>
          );
        }}
      </Formik>
    </div>
  );
};

export default AgreementForm;
