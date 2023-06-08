import React from 'react';
import { Field, Formik } from 'formik';
import { isEmpty } from 'lodash';
import { createPortal } from 'react-dom';
import { defineMessages, FormattedMessage, useIntl } from 'react-intl';

import AttachedFilesForm from '../attached-files/AttachedFilesForm';
import CollectivePickerAsync from '../CollectivePickerAsync';
import { useDrawerActionsContainer } from '../Drawer';
import StyledButton from '../StyledButton';
import StyledInput from '../StyledInput';
import StyledInputField from '../StyledInputField';
import { H4 } from '../Text';

const msg = defineMessages({
  collectiveLabel: {
    id: `AgreementForm.collectiveLabel`,
    defaultMessage: 'Collective',
  },
  titleLabel: {
    id: `AgreementForm.titleLabel`,
    defaultMessage: 'Title',
  },
});

const AgreementForm = ({ onSubmit, hostLegacyId }) => {
  const intl = useIntl();
  const initialValues = {};
  const drawerActionsContainer = useDrawerActionsContainer();

  // TODO: add validation
  const validate = data => {
    const errors = {};
    return errors;
  };

  return (
    <div>
      <H4>Add Agreement</H4>
      <Formik
        initialValues={initialValues}
        validate={validate}
        onSubmit={async (values, formik) => {
          const errors = validate(values);
          if (!isEmpty(errors)) {
            formik.setErrors(errors);
          } else {
            return onSubmit(values);
          }
        }}
      >
        {formik => {
          const { values, errors, handleSubmit } = formik;

          const actionButtons = (
            <StyledButton
              type="submit"
              width={['100%', 'auto']}
              whiteSpace="nowrap"
              buttonStyle="primary"
              disabled={!formik.isValid}
              loading={formik.isSubmitting}
            >
              <FormattedMessage id="Submit" defaultMessage="Submit" />
            </StyledButton>
          );

          return (
            <form onSubmit={handleSubmit}>
              <Field name="account">
                {({ field }) => (
                  <StyledInputField
                    name={field.name}
                    label={intl.formatMessage(msg.collectiveLabel)}
                    labelFontSize="13px"
                    flex="1"
                    mt={3}
                  >
                    {({ id }) => (
                      <CollectivePickerAsync
                        inputId={id}
                        isSearchable
                        hostCollectiveIds={[hostLegacyId]}
                        collective={values.account}
                        onChange={({ value }) => {
                          formik.setFieldValue('account', { slug: value.slug });
                        }}
                        styles={{
                          menu: {
                            borderRadius: '16px',
                          },
                          menuList: {
                            padding: '8px',
                          },
                        }}
                        excludeAdminFields
                      />
                    )}
                  </StyledInputField>
                )}
              </Field>
              <Field name="title">
                {({ field }) => (
                  <StyledInputField
                    name={field.name}
                    label={intl.formatMessage(msg.titleLabel)}
                    labelFontSize="13px"
                    flex="1"
                    mt={3}
                  >
                    {inputProps => (
                      <StyledInput
                        {...inputProps}
                        width="100%"
                        maxWidth={500}
                        maxLength={60}
                        onChange={e => formik.setFieldValue('title', e.target.value)}
                      />
                    )}
                  </StyledInputField>
                )}
              </Field>
              <AttachedFilesForm
                title={<FormattedMessage id="UploadAgreement" defaultMessage="Upload agreement" />}
                name="fileUrl"
                kind="AGREEMENT_ATTACHMENT"
                isMulti={false}
                onChange={file => formik.setFieldValue('fileUrl', file.url)}
                defaultValue={values.fileUrl ? [values.fileUrl] : undefined}
              />
              {drawerActionsContainer ? (
                createPortal(actionButtons, drawerActionsContainer)
              ) : (
                <div>{actionButtons}</div>
              )}
            </form>
          );
        }}
      </Formik>
    </div>
  );
};

export default AgreementForm;
