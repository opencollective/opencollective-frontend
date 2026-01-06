import React from 'react';
import type { MutationResult } from '@apollo/client';
import { useMutation } from '@apollo/client';
import { Form } from 'formik';
import type { IntlShape } from 'react-intl';
import { FormattedMessage, useIntl } from 'react-intl';
import { z } from 'zod';

import timezones from '../lib/constants/timezones';
import dayjs from '../lib/dayjs';
import { RICH_ERROR_MESSAGES } from '../lib/form-utils';
import { i18nGraphqlException } from '@/lib/errors';
import { gql } from '@/lib/graphql/helpers';
import type { CreateEventMutation } from '@/lib/graphql/types/v2/graphql';
import type { Account } from '@/lib/graphql/types/v2/schema';

import { Button } from './ui/Button';
import { Input } from './ui/Input';
import LocationInput from './ui/LocationInput';
import { DefaultCommandSelect } from './ui/Select';
import { Textarea } from './ui/Textarea';
import { useToast } from './ui/useToast';
import { FormField } from './FormField';
import { FormikZod } from './FormikZod';

interface EventFormValues {
  settings: Record<string, unknown>;
  name: string;
  description: string;
  startsAt: string;
  endsAt: string;
  timezone: string;
  location: {
    name?: string;
    address?: string;
    country?: string;
    lat?: number;
    long?: number;
    structured?: {
      address1?: string;
      address2?: string;
      postalCode?: string;
      city?: string;
      zone?: string;
    };
  } | null;
  privateInstructions: string;
}

const getSchema = (intl: IntlShape) =>
  z
    .object({
      name: z
        .string()
        .min(1, intl.formatMessage(RICH_ERROR_MESSAGES.requiredValue))
        .max(255, intl.formatMessage(RICH_ERROR_MESSAGES.maxLength, { count: 255 })),
      description: z
        .string()
        .min(3, intl.formatMessage(RICH_ERROR_MESSAGES.minLength, { count: 3 }))
        .max(250, intl.formatMessage(RICH_ERROR_MESSAGES.maxLength, { count: 250 })),
      startsAt: z
        .string()
        .min(1, intl.formatMessage(RICH_ERROR_MESSAGES.requiredValue))
        .refine(
          val => dayjs(val).isValid(),
          intl.formatMessage({ defaultMessage: 'Please enter a valid date', id: '6DCLcI' }),
        ),
      endsAt: z
        .string()
        .min(1, intl.formatMessage(RICH_ERROR_MESSAGES.requiredValue))
        .refine(
          val => dayjs(val).isValid(),
          intl.formatMessage({ defaultMessage: 'Please enter a valid date', id: '6DCLcI' }),
        ),
      timezone: z.string().min(1, intl.formatMessage(RICH_ERROR_MESSAGES.requiredValue)),
      location: z
        .object({
          name: z.string().optional(),
          address: z.string().optional(),
          country: z.string().optional(),
          lat: z.number().optional(),
          long: z.number().optional(),
          structured: z
            .object({
              address1: z.string().optional(),
              address2: z.string().optional(),
              postalCode: z.string().optional(),
              city: z.string().optional(),
              zone: z.string().optional(),
            })
            .optional(),
        })
        .nullable(),
      privateInstructions: z.string().optional().nullable(),
    })
    .refine(
      data => {
        const startDate = dayjs(data.startsAt);
        const endDate = dayjs(data.endsAt);
        return endDate.isAfter(startDate);
      },
      {
        path: ['endsAt'],
        message: intl.formatMessage({
          defaultMessage: 'Must be after start date',
          id: 'event.endDateAfterStart',
        }),
      },
    );

const CREATE_EVENT_MUTATION = gql`
  mutation CreateEvent($event: EventCreateInput!, $account: AccountReferenceInput!) {
    createEvent(event: $event, account: $account) {
      id
      slug
      name
      description
      ... on Event {
        parent {
          id
          slug
        }
      }
    }
  }
`;

export default function CreateEventForm({
  parent,
  loading,
  onSuccess,
}: {
  parent: Pick<Account, 'id' | 'slug' | 'legacyId'>;
  loading: boolean;
  onSuccess: (event: NonNullable<MutationResult<CreateEventMutation>['data']['createEvent']>) => Promise<void>;
}) {
  const { toast } = useToast();
  const intl = useIntl();
  const [createEventMutation, { loading: mutationLoading }] = useMutation(CREATE_EVENT_MUTATION);
  const eventSchema = React.useMemo(() => getSchema(intl), [intl]);
  const timezoneOptions = React.useMemo(
    () =>
      timezones.map(tz => ({
        value: tz,
        label: tz,
      })),
    [],
  );
  const initialValues = React.useMemo(() => {
    const timezone = dayjs.tz.guess();
    return {
      name: '',
      description: '',
      startsAt: dayjs().tz(timezone).set('hour', 19).set('minute', 0).format('YYYY-MM-DDTHH:mm'),
      endsAt: dayjs().tz(timezone).set('hour', 20).set('minute', 0).format('YYYY-MM-DDTHH:mm'),
      timezone: timezone,
      location: null,
      privateInstructions: '',
    };
  }, []);

  const handleSubmit = async (values: EventFormValues) => {
    try {
      // Convert form values to API format
      const result = await createEventMutation({
        variables: {
          account: { id: parent.id },
          event: {
            name: values.name,
            description: values.description,
            startsAt: dayjs.tz(values.startsAt, values.timezone).utc().toISOString(),
            endsAt: dayjs.tz(values.endsAt, values.timezone).utc().toISOString(),
            timezone: values.timezone,
            location: values.location,
            privateInstructions: values.privateInstructions,
            settings: { disableCustomContributions: true },
          },
        },
      });

      if (result.data?.createEvent) {
        await onSuccess(result.data.createEvent);
      }
    } catch (error) {
      toast({
        variant: 'error',
        message: i18nGraphqlException(intl, error),
      });
    }
  };

  return (
    <div>
      <FormikZod
        schema={eventSchema as any}
        initialValues={initialValues}
        onSubmit={handleSubmit}
        enableReinitialize
        validateOnChange
      >
        {({ setValues, values, setFieldValue, isSubmitting, touched }) => {
          // Handle timezone change - convert existing dates to new timezone
          const handleTimezoneChange = (newTimezone: string) => {
            if (values.timezone !== newTimezone) {
              const oldTimezone = values.timezone;
              const startsAt = dayjs.tz(values.startsAt, oldTimezone).tz(newTimezone);
              const endsAt = dayjs.tz(values.endsAt, oldTimezone).tz(newTimezone);
              setValues({
                ...values,
                timezone: newTimezone,
                startsAt: dayjs(startsAt).tz(newTimezone).format('YYYY-MM-DDTHH:mm'),
                endsAt: dayjs(endsAt).tz(newTimezone).format('YYYY-MM-DDTHH:mm'),
              });
            }
          };

          // Auto-set endsAt when startsAt changes (if endsAt hasn't been manually set)
          const handleStartsAtChange = (newStartsAt: string) => {
            setFieldValue('startsAt', newStartsAt);

            // Auto-set endsAt to 1 hour after startsAt if it hasn't been manually modified
            const startDate = dayjs(newStartsAt);
            const currentEndDate = dayjs(values.endsAt);
            const autoEndDate = startDate.add(1, 'hour');

            // Only auto-update if the current end date is close to what we would auto-set
            // (within 5 minutes) or if it's the initial value
            if (!touched.endsAt || Math.abs(currentEndDate.diff(autoEndDate, 'minutes')) <= 5) {
              setFieldValue('endsAt', autoEndDate.format('YYYY-MM-DDTHH:mm'));
            }
          };

          return (
            <Form className="space-y-6">
              {/* Event Name */}
              <FormField name="name" label={<FormattedMessage id="Fields.name" defaultMessage="Name" />} required>
                {({ field, meta }) => (
                  <Input {...field} type="text" placeholder="" maxLength={255} error={meta.error && meta.touched} />
                )}
              </FormField>

              {/* Description */}
              <FormField
                name="description"
                label={<FormattedMessage id="collective.description.label" defaultMessage="Short description" />}
                required
              >
                {({ field, meta }) => (
                  <Input {...field} type="text" placeholder="" maxLength={250} error={meta.error && meta.touched} />
                )}
              </FormField>

              {/* Date and Time Fields */}
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                {/* Start Date */}
                <FormField
                  name="startsAt"
                  className="capitalize"
                  label={<FormattedMessage id="startDateAndTime" defaultMessage="start date and time" />}
                  required
                >
                  {({ field, meta }) => (
                    <Input
                      {...field}
                      type="datetime-local"
                      error={meta.error && meta.touched}
                      onChange={e => {
                        handleStartsAtChange(e.target.value);
                      }}
                    />
                  )}
                </FormField>

                {/* End Date */}
                <FormField
                  name="endsAt"
                  className="capitalize"
                  label={<FormattedMessage id="event.endsAt.label" defaultMessage="end date and time" />}
                  required
                >
                  {({ field, meta }) => <Input {...field} type="datetime-local" error={meta.error && meta.touched} />}
                </FormField>
              </div>

              {/* Timezone */}
              <FormField name="timezone" label={<FormattedMessage defaultMessage="Timezone" id="7nUCu9" />} required>
                {({ field }) => (
                  <DefaultCommandSelect
                    name="timezone"
                    placeholder={intl.formatMessage({
                      defaultMessage: 'Select timezone',
                      id: 'collective.timezone.placeholder',
                    })}
                    searchPlaceholder={intl.formatMessage({
                      defaultMessage: 'Search timezones...',
                      id: 'VzPJtr',
                    })}
                    emptyResultLabel={intl.formatMessage({
                      defaultMessage: 'No timezones found',
                      id: 'noTimezonesFound',
                    })}
                    value={field.value}
                    options={timezoneOptions}
                    setValue={value => {
                      handleTimezoneChange(value);
                    }}
                  />
                )}
              </FormField>

              {/* Location */}
              <FormField
                name="location"
                className="capitalize"
                label={<FormattedMessage id="event.location.label" defaultMessage="location" />}
              >
                {({ field }) => (
                  <LocationInput
                    value={field.value}
                    onChange={location => {
                      setFieldValue('location', location);
                    }}
                    placeholder=""
                  />
                )}
              </FormField>

              {/* Private Instructions */}
              <FormField
                name="privateInstructions"
                label={<FormattedMessage id="event.privateInstructions.label" defaultMessage="Private instructions" />}
                hint={
                  <FormattedMessage
                    id="event.privateInstructions.description"
                    defaultMessage="These instructions will be provided by email to the participants."
                  />
                }
              >
                {({ field, meta }) => (
                  <Textarea
                    {...field}
                    placeholder=""
                    maxLength={10000}
                    showCount
                    error={meta.error && meta.touched}
                    rows={4}
                    className="min-h-[100px]"
                  />
                )}
              </FormField>

              {/* Submit Button */}
              <div className="flex justify-center pt-6">
                <Button
                  type="submit"
                  loading={loading || isSubmitting || mutationLoading}
                  disabled={isSubmitting || mutationLoading}
                  size="lg"
                >
                  <FormattedMessage defaultMessage="Create Event" id="event.create.btn" />
                </Button>
              </div>
            </Form>
          );
        }}
      </FormikZod>
    </div>
  );
}
