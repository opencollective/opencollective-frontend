import React from 'react';
import { gql, useMutation } from '@apollo/client';
import { Form, FormikProps } from 'formik';
import { isEmpty, isNil, omit, omitBy, pick, remove } from 'lodash';
import { FileText } from 'lucide-react';
import { useIntl } from 'react-intl';
import { z } from 'zod';

import { mergeName } from '../../../../lib/collective';
import { LoggedInUser } from '../../../../lib/custom_typings/LoggedInUser';
import { i18nGraphqlException } from '../../../../lib/errors';
import { API_V2_CONTEXT } from '../../../../lib/graphql/helpers';
import useLoggedInUser from '../../../../lib/hooks/useLoggedInUser';

import { FocusFirstFormikError } from '../../../FocusFirstFormikError';
import { FormikZod, getAllFieldsFromZodSchema } from '../../../FormikZod';
import { OnChange } from '../../../OnChange';
import { SignatureInput } from '../../../SignatureInput';
import StyledInputFormikField from '../../../StyledInputFormikField';
import { Button } from '../../../ui/Button';
import { useToast } from '../../../ui/useToast';
import WarnIfUnsavedChanges from '../../../WarnIfUnsavedChanges';

import { BaseFormSchema, BaseFormValues, TaxFormType } from './common';
import { AccountFromTaxInformationQuery } from './queries';
import { TaxFormPreview } from './TaxFormPreview';
import { TaxFormPreviewModal } from './TaxFormPreviewModal';
import { TaxFormTypeSelectFields } from './TaxFormTypeSelectFields';
import { getInitialValuesForW8BenE, W8BenETaxFormFields, W8BenETaxFormValuesSchema } from './W8BenEForm';
import { getInitialValuesForW8Ben, W8BenTaxFormFields, W8BenTaxFormValuesSchema } from './W8BenForm';
import { getInitialValuesForW9, getW9TaxFormValuesSchema, W9TaxFormFields } from './W9Form';

const submitLegalDocumentMutation = gql`
  mutation SubmitLegalDocument($account: AccountReferenceInput!, $type: LegalDocumentType!, $formData: JSON!) {
    submitLegalDocument(account: $account, type: $type, formData: $formData) {
      id
      type
      status
    }
  }
`;

interface TaxFormDefinition<ZodSchema extends z.ZodType<any, any, any>> {
  component: React.ComponentType<{
    formik: FormikProps<z.infer<ZodSchema>>;
  }>;
  getSchema: (baseValues: BaseFormValues) => ZodSchema;
  valuesToResetOnBaseFormChange?: string[];
  getInitialValues: (
    schema: ZodSchema,
    user: LoggedInUser,
    account: AccountFromTaxInformationQuery,
    baseValues: BaseFormValues,
  ) => z.infer<ZodSchema>;
}

const FORMS: Record<TaxFormType, TaxFormDefinition<any>> = {
  W9: {
    component: W9TaxFormFields,
    getSchema: getW9TaxFormValuesSchema,
    getInitialValues: getInitialValuesForW9,
    valuesToResetOnBaseFormChange: ['federalTaxClassification'],
  } as TaxFormDefinition<ReturnType<typeof getW9TaxFormValuesSchema>>,
  W8_BEN: {
    component: W8BenTaxFormFields,
    getSchema: () => W8BenTaxFormValuesSchema,
    getInitialValues: getInitialValuesForW8Ben,
  } as TaxFormDefinition<any>,
  W8_BEN_E: {
    component: W8BenETaxFormFields,
    getSchema: () => W8BenETaxFormValuesSchema,
    getInitialValues: getInitialValuesForW8BenE,
  } as TaxFormDefinition<any>,
};

const FORM_CONFIG = {
  useRequiredLabel: true,
  requiredIndicator: 'label',
  hintPosition: 'above',
} as const;

/**
 * This Form is not internationalized on purpose, because:
 * 1. It's meant to interact with a US government form, which is in English.
 * 2. The IRS requires us to use the exact wording they provide, we can't guarantee that (community based) translations are accurate.
 */
export const TaxInformationForm = ({ account, setFormDirty }) => {
  const intl = useIntl();
  const { toast } = useToast();
  const [submitLegalDocument] = useMutation(submitLegalDocumentMutation, { context: API_V2_CONTEXT });
  const { LoggedInUser } = useLoggedInUser();
  const [hasPreviewModal, setHasPreviewModal] = React.useState(false);
  const [schema, setSchema] = React.useState(BaseFormSchema);
  const initialValues = React.useMemo(
    () => ({
      type: null,
      isUSPersonOrEntity: null,
      submitterType: null,
      email: LoggedInUser.email,
      isSigned: false,
    }),
    [LoggedInUser],
  );

  return (
    <FormikZod
      schema={schema}
      initialValues={initialValues}
      config={FORM_CONFIG}
      onSubmit={async values => {
        try {
          await submitLegalDocument({
            variables: {
              account: { id: account.id },
              type: 'US_TAX_FORM',
              formData: values,
            },
          });

          toast({
            variant: 'success',
            message: 'Your tax form has been submitted successfully',
          });
        } catch (e) {
          toast({
            variant: 'error',
            title: 'Submission failed',
            message: i18nGraphqlException(intl, e),
          });
        }
      }}
    >
      {(formik: FormikProps<BaseFormValues>) => {
        const form = FORMS[formik.values.formType];
        const hasCompletedBaseForm = !isNil(formik.values.isUSPersonOrEntity) && !isNil(formik.values.submitterType);
        return (
          <WarnIfUnsavedChanges hasUnsavedChanges={formik.dirty}>
            <FocusFirstFormikError>
              <OnChange value={formik.dirty} onChange={setFormDirty}>
                <div className="flex gap-[5vw]">
                  {/** Form */}
                  <Form className="flex-1">
                    <TaxFormTypeSelectFields
                      values={formik.values}
                      onChange={values => {
                        const form = FORMS[values.formType];
                        if (!form) {
                          setSchema(BaseFormSchema);
                          formik.resetForm({ values: { ...formik.values, ...values } });
                        } else {
                          const newSchema = form.getSchema(values);
                          setSchema(newSchema);

                          const initialValues = form.getInitialValues(newSchema, LoggedInUser, account, values);
                          const fieldsToKeep = getAllFieldsFromZodSchema(newSchema);
                          if (form.valuesToResetOnBaseFormChange) {
                            remove(fieldsToKeep, field => form.valuesToResetOnBaseFormChange.includes(field));
                          }

                          const valuesToKeep = pick(formik.values, fieldsToKeep);
                          const formState = { ...initialValues, ...omitBy(valuesToKeep, isEmpty), ...values };
                          formik.resetForm({ values: formState });
                        }
                      }}
                    />
                    {form && hasCompletedBaseForm && (
                      <div className="mt-6 flex flex-col gap-y-4">
                        <StyledInputFormikField
                          name="email"
                          label="Email"
                          hint={
                            'The email address of the person who will sign the form. A copy of the form will be sent to this email address.'
                          }
                        />
                        <form.component formik={formik} />
                        <div className="mt-5">
                          <StyledInputFormikField name="isSigned">
                            {({ field }) => (
                              <SignatureInput
                                isSigned={field.value}
                                error={field.error}
                                onChange={isSigned => formik.setFieldValue('isSigned', isSigned)}
                                signerName={mergeName(formik.values.signer)}
                                values={omit(formik.values, ['isSigned'])}
                              />
                            )}
                          </StyledInputFormikField>
                          <p className="mb-4 mt-3 text-sm text-neutral-700">
                            {
                              'I agree to be legally bound by the document, and agree to the Open Collective Terms and Privacy Policy. Click on "I agree" to sign this document.'
                            }
                          </p>
                          <div className="mt-12 flex flex-wrap gap-4 text-nowrap">
                            <Button
                              className="flex-1"
                              type="button"
                              variant="outline"
                              size="lg"
                              onClick={() => setHasPreviewModal(true)}
                              disabled={formik.isSubmitting}
                            >
                              <FileText className="mr-2 inline-block" size={16} />
                              Preview Document
                            </Button>
                            <Button className="flex-1" size="lg" type="submit" loading={formik.isSubmitting}>
                              Submit
                            </Button>
                          </div>
                        </div>
                        {hasPreviewModal && (
                          <TaxFormPreviewModal
                            type={formik.values.formType}
                            values={formik.values}
                            onOpenChange={setHasPreviewModal}
                          />
                        )}
                      </div>
                    )}
                  </Form>
                  {/** PDF preview */}
                  {form && hasCompletedBaseForm && (
                    <div className="hidden max-w-[min(65%,1200px)] flex-1 flex-grow-[1.5] animate-in fade-in-0 md:block">
                      <div className="sticky top-[90px] h-[calc(100vh-120px)] w-full overflow-y-scroll rounded-xl shadow-2xl">
                        <TaxFormPreview type={formik.values.formType} values={formik.values} />
                      </div>
                    </div>
                  )}
                </div>
              </OnChange>
            </FocusFirstFormikError>
          </WarnIfUnsavedChanges>
        );
      }}
    </FormikZod>
  );
};
