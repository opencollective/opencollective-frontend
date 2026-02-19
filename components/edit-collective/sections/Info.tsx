import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useMutation, useQuery } from '@apollo/client';
import { getApplicableTaxesForCountry, TaxType } from '@opencollective/taxes';
import type { FormikProps } from 'formik';
import { Form } from 'formik';
import { get, isEqual, isNil, isUndefined, pick } from 'lodash';
import { FormattedMessage, useIntl } from 'react-intl';
import { z } from 'zod';

import { i18nGraphqlException } from '../../../lib/errors';
import { API_V1_CONTEXT, gql } from '../../../lib/graphql/helpers';
import { Currency as CurrencyOptions } from '@/lib/constants/currency';
import { VAT_OPTIONS } from '@/lib/constants/vat';
import dayjs from '@/lib/dayjs';
import { loadGoogleMaps } from '@/lib/google-maps';
import type { Account, AccountUpdateInput, Currency } from '@/lib/graphql/types/v2/graphql';
import { AccountType } from '@/lib/graphql/types/v2/graphql';
import useLoggedInUser from '@/lib/hooks/useLoggedInUser';
import { getDashboardRoute } from '@/lib/url-helpers';
import { cn, omitDeepBy } from '@/lib/utils';

import { EditAvatar } from '@/components/Avatar';
import { collectivePageQuery, getCollectivePageQueryVariables } from '@/components/collective-page/graphql/queries';
import CurrencyPicker from '@/components/CurrencyPicker';
import EditTags from '@/components/EditTags';
import { FormField } from '@/components/FormField';
import { FormikZod } from '@/components/FormikZod';
import { I18nSupportLink } from '@/components/I18nFormatters';
import { useModal } from '@/components/ModalContext';
import RichTextEditor from '@/components/RichTextEditor';
import { TimezonePicker } from '@/components/TimezonePicker';
import { InputGroup } from '@/components/ui/Input';
import LocationInput, { UserLocationInput } from '@/components/ui/LocationInput';
import { Select, SelectContent, SelectItem, SelectTrigger } from '@/components/ui/Select';
import { Skeleton } from '@/components/ui/Skeleton';
import { Textarea } from '@/components/ui/Textarea';

import { Button } from '../../ui/Button';
import { useToast } from '../../ui/useToast';
import SocialLinksFormField from '../SocialLinksFormField';

const { COLLECTIVE, FUND, PROJECT, EVENT, ORGANIZATION, INDIVIDUAL } = AccountType;

const editAccountFragment = gql`
  fragment EditAccountFragment on Account {
    id
    legacyId
    name
    slug
    legalName
    image: imageUrl
    description
    longDescription
    isActive
    isHost
    tags
    location {
      name
      address
      country
      lat
      long
      structured
    }
    currency
    socialLinks {
      type
      url
    }
    type
    settings
    ... on Individual {
      company
    }
    ... on Event {
      startsAt
      endsAt
      timezone
      privateInstructions
    }
    ... on AccountWithHost {
      host {
        id
        slug
        location {
          country
        }
      }
    }
  }
`;

const editAccountMutation = gql`
  mutation EditAccount($account: AccountUpdateInput!) {
    editAccount(account: $account) {
      id
      ...EditAccountFragment
    }
  }
  ${editAccountFragment}
`;

export const infoSettingsDashboardQuery = gql`
  query InfoSettingsDashboard($id: String!) {
    account(id: $id) {
      id
      ...EditAccountFragment
    }
  }
  ${editAccountFragment}
`;

const baseInfo = z.object({
  name: z.string().max(255),
  slug: z.string().max(255),
  legalName: z.string().min(5).max(255).nullable(),
  description: z.string().max(255).nullable(),
  longDescription: z.string().max(30000).nullable(),
  currency: z.string().max(3).nullable(),
  tags: z.array(z.string()).nullable(),
  image: z.string().url().nullable().optional(),
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
  socialLinks: z
    .array(
      z.object({
        type: z.string().max(255),
        url: z.string().url().optional(),
      }),
    )
    .optional(),
  settings: z
    .object({
      VAT: z
        .object({
          type: z.string().max(255).optional().nullable(),
          number: z.string().max(255).optional().nullable(),
          disabled: z.boolean().optional().nullable(),
        })
        .optional(),
      GST: z
        .object({
          number: z.string().max(255).optional(),
        })
        .optional(),
    })
    .optional()
    .nullable(),
});

const eventShape = z.object({
  type: z.literal(EVENT),
  ...baseInfo.shape,
  startsAt: z.string().datetime({ local: true }).nullable().optional(),
  endsAt: z.string().datetime({ local: true }).nullable().optional(),
  timezone: z.string().optional().nullable(),
  privateInstructions: z.string().max(10000).optional().nullable(),
});

const individualShape = z.object({
  type: z.literal(INDIVIDUAL),
  ...baseInfo.shape,
  company: z.string().max(255).optional().nullable(),
});

const formSchema = z.union([
  eventShape,
  individualShape,
  z.object({
    type: z.enum([COLLECTIVE, FUND, PROJECT, ORGANIZATION]),
    ...baseInfo.shape,
  }),
]);

type FormValuesSchema = z.infer<typeof formSchema>;

const Info = ({ account: accountFromParent }: { account: Pick<Account, 'id' | 'slug'> }) => {
  const intl = useIntl();
  const { showConfirmationModal } = useModal();
  const { refetchLoggedInUser } = useLoggedInUser();
  const formikRef = useRef<FormikProps<FormValuesSchema>>(undefined);
  const [isLoadingGoogleMaps, setIsLoadingGoogleMaps] = useState(true);
  const { toast } = useToast();
  const { data, loading } = useQuery(infoSettingsDashboardQuery, {
    variables: { id: accountFromParent.id },
  });
  const [updateAccount, { loading: submitting }] = useMutation(editAccountMutation, {
    refetchQueries: [
      {
        query: collectivePageQuery,
        context: API_V1_CONTEXT,
        variables: getCollectivePageQueryVariables(accountFromParent.slug),
      },
    ],
  });

  const account = data?.account;

  // Load Google Maps for address autocomplete. Individuals use a simplified location input.
  useEffect(() => {
    if (account && account.type !== INDIVIDUAL) {
      loadGoogleMaps().finally(() => setIsLoadingGoogleMaps(false));
    }
  }, [account]);

  const initialValues = useMemo(
    () =>
      !account
        ? {}
        : {
            ...pick(account, [
              'type',
              'image',
              ...Object.keys(baseInfo.shape),
              ...Object.keys(eventShape.shape),
              ...Object.keys(individualShape.shape),
            ]),
            privateInstructions: get(account, 'data.privateInstructions'),
            endsAt: account.endsAt && dayjs(account.endsAt).format('YYYY-MM-DDTHH:mm:ss'),
            startsAt: account.startsAt && dayjs(account.startsAt).format('YYYY-MM-DDTHH:mm:ss'),
          },
    [account],
  );

  const onSubmit = async (values: FormValuesSchema) => {
    const diff = omitDeepBy(values, (value, key) => isEqual(value, get(account, key)) || isUndefined(value));
    if (diff.settings) {
      diff.settings = pick(diff.settings, ['VAT', 'GST']);
    }

    try {
      const parseLocalDateTime = (date: string | null) =>
        isNil(date)
          ? null
          : dayjs
              .tz(date, values['timezone'] || 'UTC')
              .utc()
              .toISOString();
      const variables: { account: AccountUpdateInput } = {
        account: {
          id: account.id,
          ...diff,
        },
      };
      if ('endsAt' in values && values.endsAt) {
        variables.account.endsAt = parseLocalDateTime(values.endsAt);
      }
      if ('startsAt' in values && values.startsAt) {
        variables.account.startsAt = parseLocalDateTime(values.startsAt);
      }

      const update = async () => {
        await updateAccount({
          variables,
        });
        await refetchLoggedInUser();
        toast({
          variant: 'success',
          message: <FormattedMessage id="Account.Updated" defaultMessage="Account updated." />,
        });
      };

      if (variables.account.slug) {
        showConfirmationModal({
          title: <FormattedMessage defaultMessage="Are you sure you want to change your account handle?" id="cXyqh/" />,
          description: (
            <FormattedMessage
              id="F0ZA/r"
              defaultMessage="Changing the handle from @{previousHandle} to @{newHandle} will break all the links that you previously shared for this profile (i.e., {exampleUrl}). Do you really want to continue?"
              values={{
                previousHandle: account.slug,
                newHandle: variables.account.slug,
                exampleUrl: `https://opencollective.com/${account.slug}`,
              }}
            />
          ),
          onConfirm: async () => {
            await update();
            window.location.href = process.env.WEBSITE_URL + getDashboardRoute(variables.account, 'info');
          },
        });
      } else {
        await update();
      }
    } catch (error) {
      toast({
        variant: 'error',
        title: <FormattedMessage id="Settings.Updated.Fail" defaultMessage="Update failed." />,
        message: i18nGraphqlException(intl, error),
      });
    }
  };

  if (loading) {
    return (
      <div className="mt-6 flex flex-col gap-6">
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-full" />
      </div>
    );
  }

  return (
    <FormikZod<FormValuesSchema>
      schema={formSchema}
      onSubmit={onSubmit}
      initialValues={initialValues}
      innerRef={formikRef}
    >
      {({ setFieldValue, values, dirty }) => {
        const taxes = getApplicableTaxesForCountry(
          values.location?.country || get(account, 'location.country') || get(account, 'host.location.country'),
        );
        return (
          <Form className="flex flex-col gap-4">
            <FormField
              name="image"
              label={
                account.type === INDIVIDUAL ? (
                  <FormattedMessage defaultMessage="Avatar" id="Avatar" />
                ) : (
                  <FormattedMessage defaultMessage="Logo" id="Logo" />
                )
              }
            >
              {({ field, form }) => (
                <EditAvatar
                  size={120}
                  name={values.name}
                  type={account.type}
                  value={field.value}
                  onSuccess={({ url }) => form.setFieldValue(field.name, url)}
                  maxSize={5e3 * 1024}
                />
              )}
            </FormField>
            <FormField
              name="name"
              label={<FormattedMessage defaultMessage="Display name" id="Fields.displayName" />}
              placeholder={
                account.type === INDIVIDUAL ? 'e.g. Miles, John, Ella' : 'e.g. OFiCo, Open Collective, Sentry'
              }
              hint={
                <FormattedMessage
                  defaultMessage="Display names are public and used wherever this profile appears publicly, like contributions, comments on updates, public info on expenses, etc."
                  id="Fields.name.description"
                />
              }
            />
            {([ORGANIZATION, INDIVIDUAL].includes(account.type) || account.isHost) && (
              <FormField
                name="legalName"
                label={<FormattedMessage defaultMessage="Legal name" id="OozR1Y" />}
                placeholder={
                  account.type === INDIVIDUAL
                    ? 'e.g. Miles Davis, John Coltrane, Ella Fitzgerald'
                    : 'e.g. Open Finance Consortium Inc., Functional Software, Inc.'
                }
                hint={
                  <FormattedMessage
                    defaultMessage="Legal names are private and used in receipts, tax forms, payment details on expenses, and other non-public contexts. Legal names are only visible to admins."
                    id="editCollective.legalName.description"
                  />
                }
              />
            )}
            {account.type === INDIVIDUAL && (
              <FormField
                name="company"
                label={<FormattedMessage id="collective.company.label" defaultMessage="Company" />}
                hint={
                  <FormattedMessage
                    id="collective.company.description"
                    defaultMessage="Use this field to publicly display your affiliations. Start with @ to mention an organization registered on Open Collective, e.g., @airbnb."
                  />
                }
              />
            )}
            {account.type !== EVENT && (
              <FormField name="slug" label={<FormattedMessage id="account.slug.label" defaultMessage="Handle" />}>
                {({ field }) => <InputGroup className="w-full" prepend="opencollective.com/" {...field} />}
              </FormField>
            )}
            <FormField
              name="tags"
              label={<FormattedMessage defaultMessage="Tags" id="Tags" />}
              hint={
                <FormattedMessage
                  defaultMessage="Tags help you improve your group’s discoverability and connect with similar initiatives across the world."
                  id="collective.tags.info"
                />
              }
            >
              {({ field }) => (
                <EditTags
                  {...field}
                  onChange={entries =>
                    setFieldValue(
                      field.name,
                      entries.map(e => e.value),
                    )
                  }
                />
              )}
            </FormField>
            <FormField
              name="description"
              label={<FormattedMessage defaultMessage="Short description" id="collective.description.label" />}
            />
            <FormField
              name="longDescription"
              label={<FormattedMessage id="collective.about.title" defaultMessage="About" />}
            >
              {({ field }) => (
                <RichTextEditor
                  kind="ACCOUNT_LONG_DESCRIPTION"
                  {...field}
                  withStickyToolbar
                  toolbarOffsetY={0}
                  defaultValue={field.value}
                  onChange={e => setFieldValue('longDescription', e.target.value)}
                  videoEmbedEnabled
                  withBorders
                  placeholder={intl.formatMessage({
                    defaultMessage: 'Tell your story and explain your purpose.',
                    id: 'SectionAbout.Why',
                  })}
                />
              )}
            </FormField>
            {account.type === EVENT && (
              <React.Fragment>
                <FormField
                  type="datetime-local"
                  name="startsAt"
                  label={<FormattedMessage defaultMessage="Start date" id="n5QvJy" />}
                />
                <FormField
                  type="datetime-local"
                  name="endsAt"
                  label={<FormattedMessage defaultMessage="End date" id="Humfno" />}
                  onChange={e => setFieldValue('endsAt', e.target.value === '' ? null : e.target.value)}
                />
                <FormField
                  name="timezone"
                  label={<FormattedMessage defaultMessage="Timezone" id="7nUCu9" />}
                  hint={
                    <FormattedMessage
                      defaultMessage="The timezone of the event. This is used to display the start and end times in the correct timezone."
                      id="collective.timezone.hint"
                    />
                  }
                >
                  {({ field }) => (
                    <TimezonePicker
                      data-cy="organization-timezone-trigger"
                      value={field.value}
                      disabled={field.disabled}
                      onChange={value => setFieldValue(field.name, value)}
                    />
                  )}
                </FormField>
                <FormField
                  name="privateInstructions"
                  label={
                    <FormattedMessage id="event.privateInstructions.label" defaultMessage="Private instructions" />
                  }
                  hint={
                    <FormattedMessage
                      id="event.privateInstructions.description"
                      defaultMessage="These instructions will be provided by email to the participants."
                    />
                  }
                >
                  {({ field }) => <Textarea maxLength={10000} className="min-h-20" {...field} />}
                </FormField>
              </React.Fragment>
            )}
            <FormField
              name="location"
              label={
                account.type !== INDIVIDUAL ? (
                  <FormattedMessage defaultMessage="Location" id="SectionLocation.Title" />
                ) : null
              }
            >
              {({ field }) =>
                account.type !== INDIVIDUAL ? (
                  isLoadingGoogleMaps ? (
                    <Skeleton className="h-10 w-full" />
                  ) : (
                    <LocationInput
                      className="w-full"
                      {...field}
                      onChange={location => setFieldValue(field.name, location)}
                    />
                  )
                ) : (
                  <UserLocationInput
                    {...field}
                    location={field.value}
                    onChange={location => setFieldValue(field.name, location)}
                  />
                )
              }
            </FormField>
            {![EVENT, PROJECT].includes(account.type) && (
              <FormField
                name="currency"
                disabled={
                  ([COLLECTIVE, FUND].includes(account.type) && account.isActive) || account.isHost ? true : false
                }
                label={<FormattedMessage id="Currency" defaultMessage="Currency" />}
                hint={
                  ([COLLECTIVE, FUND].includes(account.type) && account.isActive) || account.isHost ? (
                    <FormattedMessage
                      id="collective.currency.warning"
                      defaultMessage="Active Collectives, Funds and Fiscal Hosts can't edit their currency. Contact <SupportLink>support</SupportLink> if this is an issue."
                      values={{ SupportLink: I18nSupportLink }}
                    />
                  ) : (
                    <FormattedMessage
                      id="collective.currency.info"
                      defaultMessage="Select the preferred currency used in your profile page."
                    />
                  )
                }
              >
                {({ field }) => (
                  <CurrencyPicker
                    data-cy="organization-currency-trigger"
                    disabled={field.disabled}
                    availableCurrencies={CurrencyOptions}
                    value={field.value}
                    // deepscan-disable-next-line
                    onChange={value => {
                      setFieldValue(field.name, value as Currency);
                    }}
                  />
                )}
              </FormField>
            )}
            <FormField name="socialLinks" label={<FormattedMessage defaultMessage="Social Links" id="3bLmoU" />}>
              {({ field }) => (
                <SocialLinksFormField
                  value={field.value || field.defaultValue}
                  onChange={event => setFieldValue(field.name, event)}
                  touched={field.formModified}
                  useLegacyInput={false}
                />
              )}
            </FormField>
            {taxes.includes(TaxType.VAT) && (
              <React.Fragment>
                <FormField
                  name="settings.VAT"
                  label={<FormattedMessage defaultMessage="VAT settings" id="EditCollective.VAT" />}
                  hint={
                    values.settings?.VAT?.disabled && (
                      <FormattedMessage
                        id="EditCollective.VAT.Disabled.Warning"
                        defaultMessage="Caution: Disabling VAT requires approval from your fiscal host. Please ensure you have discussed this with your host before saving."
                      />
                    )
                  }
                >
                  {({ field }) => {
                    const isDisabled = field.value?.disabled;
                    const currentType = isDisabled ? 'DISABLED' : field.value?.type;
                    // Use 'HOST' to represent using host VAT settings (null in the form field)
                    const displayType = currentType === null ? 'HOST' : currentType;
                    const options = [
                      {
                        value: VAT_OPTIONS.HOST,
                        label: (
                          <FormattedMessage defaultMessage="Use the host VAT settings" id="EditCollective.VAT.Host" />
                        ),
                      },
                      {
                        value: VAT_OPTIONS.OWN,
                        label: (
                          <FormattedMessage
                            defaultMessage="Use my own VAT number"
                            id="EditCollective.VAT.OwnSettings"
                          />
                        ),
                      },
                      {
                        value: 'DISABLED',
                        label: <FormattedMessage defaultMessage="Disable VAT" id="EditCollective.VAT.Disabled" />,
                      },
                    ];
                    return (
                      <Select
                        name="settings.VAT.type"
                        value={displayType}
                        onValueChange={value => {
                          if (value === 'DISABLED') {
                            setFieldValue('settings.VAT.type', VAT_OPTIONS.OWN);
                            setFieldValue('settings.VAT.disabled', true);
                          } else if (value === 'HOST') {
                            setFieldValue('settings.VAT.type', VAT_OPTIONS.HOST);
                            setFieldValue('settings.VAT.disabled', false);
                          } else {
                            setFieldValue('settings.VAT.type', value);
                            setFieldValue('settings.VAT.disabled', false);
                          }
                        }}
                      >
                        <SelectTrigger
                          id={field.name}
                          data-cy="VAT"
                          className={cn('truncate', { 'border-red-500': field.error })}
                        >
                          {options.find(opt => opt.value === displayType)?.label || <span>&nbsp;</span>}
                        </SelectTrigger>
                        <SelectContent>
                          {options.map(opt => (
                            <SelectItem key={opt.value} value={opt.value} data-cy="select-option">
                              {opt.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    );
                  }}
                </FormField>
                {values.settings?.VAT?.type === VAT_OPTIONS.OWN && !values.settings?.VAT?.disabled && (
                  <FormField
                    name="settings.VAT.number"
                    label={<FormattedMessage defaultMessage="VAT number" id="EditCollective.VATNumber" />}
                    required
                    hint={
                      <FormattedMessage
                        id="EditCollective.VATNumber.Description"
                        defaultMessage="Your European Value Added Tax (VAT) number"
                      />
                    }
                  />
                )}
              </React.Fragment>
            )}{' '}
            {taxes.includes(TaxType.GST) && account.isHost && (
              <FormField
                name="settings.GST.number"
                label={<FormattedMessage defaultMessage="GST number" id="EditCollective.GSTNumber" />}
                placeholder="9429037631147"
              />
            )}
            <div className="mt-4 flex flex-col gap-2 sm:justify-stretch">
              <Button data-cy="save" className="grow" type="submit" loading={submitting} disabled={!dirty}>
                <FormattedMessage id="save" defaultMessage="Save" />
              </Button>
            </div>
          </Form>
        );
      }}
    </FormikZod>
  );
};

export default Info;
