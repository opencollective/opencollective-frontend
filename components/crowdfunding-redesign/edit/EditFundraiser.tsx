import React from 'react';
import { useMutation } from '@apollo/client';
import type { FormikProps } from 'formik';
import { Form } from 'formik';
import { FormattedMessage, useIntl } from 'react-intl';

import { i18nGraphqlException } from '../../../lib/errors';
import { API_V2_CONTEXT } from '../../../lib/graphql/helpers';
import { isValidUrl } from '../../../lib/utils';

import { FormikZod } from '../../FormikZod';
import StyledDropzone, { DROPZONE_ACCEPT_IMAGES } from '../../StyledDropzone';
import Tabs from '../../Tabs';
import { Button } from '../../ui/Button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '../../ui/Dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../ui/Select';
import { Separator } from '../../ui/Separator';
import { toast } from '../../ui/useToast';
import type { Fundraiser } from '../helpers';
import { fundraiserSchema, getDefaultFundraiserValues } from '../helpers';

import {
  ColumnSection,
  editCrowdfundingSettingsMutation,
  FormField,
  LongDescriptionForm,
  MainDetailsForm,
} from './common';

const CoverImageForm = ({ schema, initialValues, onSubmit }) => {
  const tabs = React.useMemo(
    () => [
      { id: 'IMAGE', label: 'Upload photo' },
      { id: 'VIDEO', label: 'Embed video' },
    ],
    [],
  );

  return (
    <ColumnSection title="Cover photo" description="Add a cover photo to your fundraiser.">
      <div className="flex flex-col gap-4">
        <FormikZod schema={schema} initialValues={initialValues} onSubmit={values => onSubmit(schema.parse(values))}>
          {(formik: FormikProps<Fundraiser>) => {
            return (
              <Form>
                <div className="flex flex-col items-start gap-4">
                  <div className="w-fit">
                    <Tabs
                      selectedId={formik.values.cover.type}
                      onChange={tab => formik.setFieldValue('cover.type', tab)}
                      tabs={tabs}
                    />
                  </div>
                  {formik.values.cover.type === 'IMAGE' ? (
                    <FormField name="cover">
                      {({ field }) => {
                        const hasValidUrl = field.value && isValidUrl(field.value.url);

                        return (
                          <StyledDropzone
                            name="cover.url"
                            kind="ACCOUNT_BANNER"
                            accept={DROPZONE_ACCEPT_IMAGES}
                            minSize={10e2} // in bytes, =1kB
                            maxSize={10e6} // in bytes, =10MB
                            isMulti={false}
                            showActions
                            size={196}
                            onSuccess={data => {
                              formik.setFieldValue('cover.url', data.url);
                            }}
                            value={hasValidUrl && field.value.url}
                          />
                        );
                      }}
                    </FormField>
                  ) : (
                    <React.Fragment>
                      <FormField name="cover.platform" label="Video platform">
                        {({ field }) => {
                          return (
                            <Select
                              {...field}
                              onValueChange={platform => formik.setFieldValue('cover.platform', platform)}
                              defaultValue="youtube"
                            >
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                {[{ label: 'Youtube', value: 'youtube' }].map(option => (
                                  <SelectItem key={option.value} value={option.value}>
                                    {option.label}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          );
                        }}
                      </FormField>

                      <FormField name="cover.videoUrl" label="Video URL" />
                    </React.Fragment>
                  )}
                  <Button
                    type="submit"
                    loading={formik.isSubmitting}
                    onClick={() => {
                      // Reset the cover values that is not used (IMAGE or VIDEO)
                      // Do it here to avoid resetting any old values before actually saving
                      if (formik.values.cover.type === 'IMAGE') {
                        formik.setFieldValue('cover.platform', undefined);
                        formik.setFieldValue('cover.videoUrl', undefined);
                      } else if (formik.values.cover.type === 'VIDEO') {
                        formik.setFieldValue('cover.url', undefined);
                        formik.setFieldValue('cover.width', undefined);
                        formik.setFieldValue('cover.height', undefined);
                      }
                    }}
                  >
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

export function EditFundraiser({ account }) {
  const [submitEditSettings] = useMutation(editCrowdfundingSettingsMutation, {
    context: API_V2_CONTEXT,
  });

  const intl = useIntl();
  const initialValues = getDefaultFundraiserValues(account);

  const onSubmit = async values => {
    try {
      await submitEditSettings({
        variables: {
          account: { id: account.id },
          value: {
            ...account.settings.crowdfundingRedesign,
            fundraiser: {
              ...initialValues,
              ...values,
            },
          },
        },
      });
      toast({
        variant: 'success',
        message: 'Fundraiser prototype updated',
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
          <DialogTitle className="text-xl">Edit fundraiser prototype</DialogTitle>
          <DialogDescription>This will only affect the prototype and not your actual profile.</DialogDescription>
        </DialogHeader>
        <Separator />
        <ColumnSection title="Main details" description="Choose a title and theme color for your fundraiser.">
          <MainDetailsForm
            schema={fundraiserSchema.pick({ name: true, description: true, primaryColor: true })}
            initialValues={initialValues}
            onSubmit={onSubmit}
          />
        </ColumnSection>
        <Separator />
        <CoverImageForm
          schema={fundraiserSchema.pick({ cover: true })}
          initialValues={initialValues}
          onSubmit={onSubmit}
        />
        <Separator />
        <LongDescriptionForm
          schema={fundraiserSchema.pick({ longDescription: true })}
          initialValues={initialValues}
          onSubmit={onSubmit}
        />
      </DialogContent>
    </Dialog>
  );
}
