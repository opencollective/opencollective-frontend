import React from 'react';
import { useMutation } from '@apollo/client';
import type { FormikProps } from 'formik';
import { Form } from 'formik';
import { FormattedMessage, useIntl } from 'react-intl';

import { i18nGraphqlException } from '../../../lib/errors';
import { API_V2_CONTEXT } from '../../../lib/graphql/helpers';
import { isValidUrl } from '../../../lib/utils';

import { FormField } from '../../FormField';
import { FormikZod } from '../../FormikZod';
import StyledDropzone, { DROPZONE_ACCEPT_IMAGES } from '../../StyledDropzone';
import { Button } from '../../ui/Button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '../../ui/Dialog';
import { Separator } from '../../ui/Separator';
import { toast } from '../../ui/useToast';
import type { Fundraiser } from '../helpers';
import { getDefaultProfileValues, profileSchema } from '../helpers';

import { ColumnSection, editCrowdfundingSettingsMutation, LongDescriptionForm, MainDetailsForm } from './common';

const CoverImageForm = ({ schema, initialValues, onSubmit }) => {
  return (
    <ColumnSection title="Cover photo" description="Add a cover photo to your profile.">
      <div className="flex flex-col gap-4">
        <FormikZod schema={schema} initialValues={initialValues} onSubmit={values => onSubmit(schema.parse(values))}>
          {(formik: FormikProps<Fundraiser>) => {
            return (
              <Form>
                <div className="flex flex-col items-start gap-4">
                  <FormField name="cover.url">
                    {({ field }) => {
                      const hasValidUrl = field.value && isValidUrl(field.value);
                      return (
                        <StyledDropzone
                          name={field.name}
                          kind="ACCOUNT_BANNER"
                          accept={DROPZONE_ACCEPT_IMAGES}
                          minSize={10e2} // in bytes, =1kB
                          maxSize={10e6} // in bytes, =10MB
                          isMulti={false}
                          showActions
                          size={196}
                          onSuccess={data => {
                            if (data) {
                              formik.setFieldValue(field.name, data.url);
                            } else {
                              formik.setFieldValue('cover', null);
                            }
                          }}
                          value={hasValidUrl && field.value}
                        />
                      );
                    }}
                  </FormField>

                  <Button type="submit" loading={formik.isSubmitting}>
                    <FormattedMessage defaultMessage="Save" id="save" />
                  </Button>
                </div>
              </Form>
            );
          }}
        </FormikZod>
      </div>
    </ColumnSection>
  );
};

export function EditProfile({ account }) {
  const [submitEditSettings] = useMutation(editCrowdfundingSettingsMutation, {
    context: API_V2_CONTEXT,
  });
  const intl = useIntl();
  const initialValues = getDefaultProfileValues(account);

  const onSubmit = async values => {
    try {
      await submitEditSettings({
        variables: {
          account: { id: account.id },
          value: { ...account.settings.crowdfundingRedesign, profile: { ...initialValues, ...values } },
        },
      });
      toast({
        variant: 'success',
        message: 'Profile prototype updated',
      });
    } catch (e) {
      toast({
        variant: 'error',
        title: 'Failed to edit',
        message: i18nGraphqlException(intl, e),
      });
    }
  };
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button>Edit prototype</Button>
      </DialogTrigger>
      <DialogContent className="gap-6 sm:max-w-screen-lg">
        <DialogHeader>
          <DialogTitle className="text-xl">Edit profile prototype</DialogTitle>
          <DialogDescription>This will only affect the prototype and not your actual profile.</DialogDescription>
        </DialogHeader>
        <Separator />
        <ColumnSection title="Main details" description="Choose a title and theme color for your profile.">
          <MainDetailsForm
            schema={profileSchema.pick({ name: true, description: true, primaryColor: true })}
            initialValues={initialValues}
            onSubmit={onSubmit}
          />
        </ColumnSection>
        <Separator />
        <CoverImageForm
          schema={profileSchema.pick({ cover: true })}
          initialValues={initialValues}
          onSubmit={onSubmit}
        />
        <Separator />
        <LongDescriptionForm
          schema={profileSchema.pick({ longDescription: true })}
          initialValues={initialValues}
          onSubmit={onSubmit}
        />
      </DialogContent>
    </Dialog>
  );
}
