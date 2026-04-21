import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { gql, useMutation } from '@apollo/client';
import type { FormikProps } from 'formik';
import { Form } from 'formik';
import { shuffle } from 'lodash';
import { FormattedMessage, useIntl } from 'react-intl';
import { z } from 'zod';

import { suggestSlug } from '@/lib/collective';
import { formatErrorMessage, getErrorFromGraphqlException } from '@/lib/errors';
import { loadGoogleMaps } from '@/lib/google-maps';
import type { CollectiveSignupMutation } from '@/lib/graphql/types/v2/graphql';
import useLoggedInUser from '@/lib/hooks/useLoggedInUser';

import EditTags from '../EditTags';
import { FormField } from '../FormField';
import { FormikZod } from '../FormikZod';
import I18nFormatters, { getI18nLink } from '../I18nFormatters';
import Image from '../Image';
import { Button } from '../ui/Button';
import { Card, CardContent } from '../ui/Card';
import { InputGroup } from '../ui/Input';
import LocationInput from '../ui/LocationInput';
import { toast } from '../ui/useToast';

import type { SignupStepProps } from './common';

const collectiveSignupMutation = gql`
  mutation CollectiveSignup($collective: CollectiveCreateInput!) {
    createCollective(collective: $collective) {
      id
      name
      slug
      description
      legacyId
      type
    }
  }
`;

const createCollectiveSchema = z.object({
  collective: z
    .object({
      name: z.string().min(5).max(255),
      slug: z.string().min(5).max(255),
      description: z.string().min(10).max(255),
      tags: z.array(z.string()).optional().nullable(),
      location: z
        .object({
          name: z.string().optional().nullable(),
          address: z.string().max(255).optional().nullable(),
          country: z.string().length(2).optional().nullable(),
          lat: z.number().optional().nullable(),
          long: z.number().optional().nullable(),
          structured: z.object({}).passthrough().optional().nullable(),
        })
        .optional()
        .nullable(),
      settings: z.object({}).passthrough().optional().nullable(),
    })
    .required(),
});

type CreateCollectiveValuesSchema = z.infer<typeof createCollectiveSchema>;

export function CollectiveForm({ nextStep, setCreatedAccount }: SignupStepProps) {
  const intl = useIntl();
  const formikRef = useRef<FormikProps<CreateCollectiveValuesSchema>>(undefined);
  const { refetchLoggedInUser } = useLoggedInUser();
  const [createCollective] = useMutation<CollectiveSignupMutation>(collectiveSignupMutation);
  const [isLoadingGoogleMaps, setIsLoadingGoogleMaps] = useState(true);
  const [loading, setLoading] = useState(false);
  const suggestedTags = useMemo(
    () => shuffle(['open source', 'association', 'climate', 'mutual aid', 'art', 'meetup', 'community', 'design']),
    [],
  );

  const onSubmit = async (values: CreateCollectiveValuesSchema) => {
    const { collective } = values;
    try {
      setLoading(true);
      const result = await createCollective({
        variables: {
          collective,
        },
      });
      setCreatedAccount(result.data.createCollective);
      toast({
        variant: 'success',
        message: intl.formatMessage({
          id: 'createCollective.form.success',
          defaultMessage: 'Collective created successfully!',
        }),
      });
      // We refetch the logged in user to update their memberships
      await refetchLoggedInUser();
      nextStep();
    } catch (error) {
      setLoading(false);
      const gqlError = getErrorFromGraphqlException(error);
      if (gqlError?.payload?.code?.includes('SLUG')) {
        formikRef.current?.setFieldError('collective.slug', formatErrorMessage(intl, gqlError));
      }
      toast({
        variant: 'error',
        message: formatErrorMessage(intl, gqlError) || 'An error occurred while creating the collective',
      });
    }
  };

  const handleTagUpdate = useCallback(
    tags => {
      if (formikRef.current) {
        formikRef.current.setFieldValue(
          'collective.tags',
          tags.map(t => t.value.toLowerCase()),
        );
      }
    },
    [formikRef],
  );

  useEffect(() => {
    loadGoogleMaps().finally(() => setIsLoadingGoogleMaps(false));
  }, []);

  return (
    <FormikZod<CreateCollectiveValuesSchema>
      schema={createCollectiveSchema}
      onSubmit={onSubmit}
      initialValues={{}}
      innerRef={formikRef}
    >
      {({ touched, setFieldValue, isValid }) => (
        <Form
          className="mb-6 flex max-w-xl grow flex-col items-center gap-8 px-6 sm:mb-20 sm:w-xl sm:px-0"
          data-cy="create-collective-form"
        >
          <Image width={100} height={104} src="/static/images/signup/org.png" alt="Collective" />
          <div className="flex flex-col gap-2 px-3 text-center">
            <React.Fragment>
              <h1 className="text-xl font-bold sm:text-3xl sm:leading-10">
                <FormattedMessage defaultMessage="Create a Collective" id="home.create" />
              </h1>
              <p className="text-sm break-words text-slate-700 sm:text-base">
                <FormattedMessage defaultMessage="Tell us about your Collective, group or project" id="RimT0V" />
              </p>
            </React.Fragment>
          </div>
          <Card className="w-full max-w-lg">
            <CardContent className="flex flex-col gap-4">
              <FormField
                name="collective.name"
                label={<FormattedMessage id="CollectiveName" defaultMessage="Collective's name" />}
                placeholder="e.g. Green Horizon"
                autoComplete="organization"
                onChange={e => {
                  setFieldValue('collective.name', e.target.value);
                  if (!touched.collective?.slug) {
                    setFieldValue('collective.slug', suggestSlug(e.target.value));
                  }
                }}
              />
              <FormField
                name="collective.slug"
                label={<FormattedMessage id="createCollective.form.slugLabel" defaultMessage="Set your profile URL" />}
              >
                {({ field }) => <InputGroup className="w-full" prepend="opencollective.com/" {...field} />}
              </FormField>
              <FormField
                name="collective.description"
                label={
                  <FormattedMessage id="Collective.Description.Label" defaultMessage="What does your collective do?" />
                }
              />
              <FormField
                name="collective.location"
                label={<FormattedMessage defaultMessage="Location" id="SectionLocation.Title" />}
              >
                {({ field }) =>
                  !isLoadingGoogleMaps && (
                    <LocationInput
                      className="w-full"
                      {...field}
                      onChange={location => setFieldValue(field.name, location)}
                    />
                  )
                }
              </FormField>
              <FormField name="collective.tags" label={<FormattedMessage defaultMessage="Tags" id="Tags" />}>
                {({ field }) => (
                  <EditTags
                    {...field}
                    onChange={handleTagUpdate}
                    placeholder={
                      field.value?.length ? null : (
                        <FormattedMessage defaultMessage="Add tags to improve discoverability" id="Tags.Placeholder" />
                      )
                    }
                    suggestedTags={suggestedTags}
                  />
                )}
              </FormField>
            </CardContent>
          </Card>
          <div className="grow sm:hidden" />
          <div className="flex w-full max-w-lg flex-col gap-4">
            <Button type="submit" disabled={!isValid} loading={loading}>
              <FormattedMessage defaultMessage="Create Collective" id="collective.create" />
            </Button>
          </div>
          <div className="grow text-center text-sm text-muted-foreground sm:order-none sm:flex sm:items-end sm:justify-center">
            <p>
              <FormattedMessage
                defaultMessage="By creating an account, you agree to our{newLine}<TOSLink>Terms of Service</TOSLink> and <PrivacyPolicyLink>Privacy Policy</PrivacyPolicyLink>."
                id="signup.individual.tosAgreement"
                values={{
                  ...I18nFormatters,
                  TOSLink: getI18nLink({
                    href: '/tos',
                    openInNewTab: true,
                    className: 'underline',
                  }),
                  PrivacyPolicyLink: getI18nLink({
                    href: '/privacypolicy',
                    openInNewTab: true,
                    className: 'underline',
                  }),
                }}
              />
            </p>
          </div>
        </Form>
      )}
    </FormikZod>
  );
}
