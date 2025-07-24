import React, { useCallback, useMemo, useRef, useState } from 'react';
import { useMutation, useQuery } from '@apollo/client';
import { getApplicableTaxesForCountry, TaxType } from '@opencollective/taxes';
import type { FormikProps } from 'formik';
import { Form } from 'formik';
import { get, isEqual, isNil, isUndefined } from 'lodash';
import { FormattedMessage, useIntl } from 'react-intl';
import { z } from 'zod';

import { i18nGraphqlException } from '../../../lib/errors';
import { API_V2_CONTEXT, gql } from '../../../lib/graphql/helpers';
import timezones from '@/lib/constants/timezones';
import { VAT_OPTIONS } from '@/lib/constants/vat';
import dayjs from '@/lib/dayjs';
import type { Account, AccountUpdateInput } from '@/lib/graphql/types/v2/schema';
import { AccountType, Currency } from '@/lib/graphql/types/v2/schema';
import { getDashboardRoute } from '@/lib/url-helpers';
import { cn, omitDeepBy } from '@/lib/utils';

import { collectivePageQuery, getCollectivePageQueryVariables } from '@/components/collective-page/graphql/queries';
import EditTags from '@/components/EditTags';
import { FormField } from '@/components/FormField';
import { FormikZod } from '@/components/FormikZod';
import { I18nSupportLink } from '@/components/I18nFormatters';
import { useModal } from '@/components/ModalContext';
import RichTextEditor from '@/components/RichTextEditor';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/Command';
import { InputGroup } from '@/components/ui/Input';
import LocationInput, { UserLocationInput } from '@/components/ui/LocationInput';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/Select';
import { Skeleton } from '@/components/ui/Skeleton';
import { Textarea } from '@/components/ui/Textarea';

import { Button } from '../../ui/Button';
import { useToast } from '../../ui/useToast';
import SocialLinksFormField from '../SocialLinksFormField';

const { COLLECTIVE, FUND, PROJECT, EVENT, ORGANIZATION, INDIVIDUAL } = AccountType;

const editAccountFragment = gql`
  fragment EditAccountFragment on Account {
    legacyId
    name
    slug
    legalName
    description
    longDescription
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

const editAccountQuery = gql`
  query EditAccount($id: String!) {
    account(id: $id) {
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
          type: z.string().max(255).optional(),
          number: z.string().max(255).optional(),
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

const formSchema = z.union([
  z.object({
    type: z.literal(EVENT),
    ...baseInfo.shape,
    startsAt: z.string().datetime({ local: true }).nullable().optional(),
    endsAt: z.string().datetime({ local: true }).nullable().optional(),
    timezone: z.string().optional().nullable(),
    privateInstructions: z.string().max(10000).optional().nullable(),
  }),
  z.object({
    type: z.literal(INDIVIDUAL),
    ...baseInfo.shape,
    company: z.string().max(255).optional().nullable(),
  }),
  z.object({
    type: z.enum([COLLECTIVE, FUND, PROJECT, ORGANIZATION]),
    ...baseInfo.shape,
  }),
]);

type FormValuesSchema = z.infer<typeof formSchema>;

const Info = ({ account: accountFromParent }: { account: Pick<Account, 'id' | 'slug'> }) => {
  const intl = useIntl();
  const { showConfirmationModal } = useModal();
  const formikRef = useRef<FormikProps<FormValuesSchema>>(undefined);
  const currencyInputRef = useRef<HTMLInputElement>(null);
  const timezoneInputRef = useRef<HTMLInputElement>(null);
  const [showTimezoneSelect, setShowTimezoneSelect] = useState(false);
  const [showCurrencySelect, setShowCurrencySelect] = useState(false);
  const { toast } = useToast();
  const { data, loading } = useQuery(editAccountQuery, {
    context: API_V2_CONTEXT,
    variables: { id: accountFromParent.id },
  });
  const [updateAccount, { loading: submitting }] = useMutation(editAccountMutation, {
    context: API_V2_CONTEXT,
    refetchQueries: [
      { query: collectivePageQuery, variables: getCollectivePageQueryVariables(accountFromParent.slug) },
    ],
  });

  const account = data?.account;
  const initialValues = useMemo(
    () =>
      !account
        ? {}
        : {
            ...account,
            privateInstructions: get(account, 'data.privateInstructions'),
            endsAt: account.endsAt && dayjs(account.endsAt).format('YYYY-MM-DDTHH:mm:ss'),
            startsAt: account.startsAt && dayjs(account.startsAt).format('YYYY-MM-DDTHH:mm:ss'),
          },
    [account],
  );

  const currencyOptions = useMemo(
    () =>
      Object.keys(Currency).map(code => ({
        value: code,
        label: code,
      })),
    [],
  );
  const timezoneOptions = useMemo(
    () =>
      timezones.map(tz => ({
        label: tz.replace('_', ' '),
        value: tz,
      })),
    [],
  );

  const openCurrencySelect = useCallback(
    open => {
      setShowCurrencySelect(open);
      if (open) {
        setTimeout(() => {
          currencyInputRef.current?.focus();
        }, 100);
      }
    },
    [currencyInputRef],
  );

  const openTimezoneSelect = useCallback(
    open => {
      setShowTimezoneSelect(open);
      if (open) {
        setTimeout(() => {
          timezoneInputRef.current?.focus();
        }, 100);
      }
    },
    [timezoneInputRef],
  );

  const onSubmit = async (values: FormValuesSchema) => {
    const diff = omitDeepBy(values, (value, key) => isEqual(value, get(account, key)) || isUndefined(value));
    try {
      const parseLocalDateTime = (date: string | null) =>
        isNil(date) ? null : dayjs.tz(date, 'timezone' in values ? values.timezone : 'UTC').toISOString();
      const variables: { account: AccountUpdateInput } = {
        account: {
          id: account.id,
          ...diff,
        },
      };
      if ('endsAt' in values && values.endsAt) {
        variables.account.endsAt = parseLocalDateTime(values.endsAt);
      }
      if ('startsAt' in values && values.endsAt) {
        variables.account.startsAt = parseLocalDateTime(values.startsAt);
      }

      const update = async () => {
        await updateAccount({
          variables,
          context: API_V2_CONTEXT,
        });
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
                  placeholder={
                    <FormattedMessage
                      defaultMessage="Tell your story and explain your purpose."
                      id="SectionAbout.Why"
                    />
                  }
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
                    <Select
                      value={field.value}
                      open={showTimezoneSelect}
                      onOpenChange={openTimezoneSelect}
                      disabled={field.disabled}
                    >
                      <SelectTrigger
                        className={cn(!field.value && 'text-muted-foreground')}
                        data-cy="organization-timezone-trigger"
                      >
                        {field.value ? (
                          timezoneOptions.find(option => option.value === field.value)?.label || field.value
                        ) : (
                          <FormattedMessage defaultMessage="Select timezone" id="collective.timezone.placeholder" />
                        )}
                      </SelectTrigger>
                      <SelectContent className="max-h-[50vh]">
                        <Command>
                          <CommandInput
                            placeholder={intl.formatMessage({ defaultMessage: 'Search timezones...', id: 'VzPJtr' })}
                            data-cy="organization-timezone-search"
                            ref={timezoneInputRef}
                          />
                          <CommandList data-cy="organization-timezone-list">
                            <CommandEmpty>
                              <FormattedMessage defaultMessage="No timezone found." id="GTBZLL" />
                            </CommandEmpty>
                            <CommandGroup>
                              {timezoneOptions.map(({ value, label }) => (
                                <CommandItem
                                  key={value}
                                  data-cy={`organization-country-${value}`}
                                  onSelect={() => {
                                    setFieldValue(field.name, value as Currency);
                                    setShowTimezoneSelect(false);
                                  }}
                                >
                                  <span>{label}</span>
                                </CommandItem>
                              ))}
                            </CommandGroup>
                          </CommandList>
                        </Command>
                      </SelectContent>
                    </Select>
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
                  <LocationInput
                    className="w-full"
                    {...field}
                    onChange={location => setFieldValue(field.name, location)}
                  />
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
                  ) : null
                }
              >
                {({ field }) => (
                  <Select
                    value={field.value}
                    open={showCurrencySelect}
                    onOpenChange={openCurrencySelect}
                    disabled={field.disabled}
                  >
                    <SelectTrigger
                      className={cn(!field.value && 'text-muted-foreground')}
                      data-cy="organization-currency-trigger"
                    >
                      {field.value ? (
                        field.value
                      ) : (
                        <FormattedMessage defaultMessage="Select currency" id="collective.curency.placeholder" />
                      )}
                    </SelectTrigger>
                    <SelectContent className="max-h-[50vh]">
                      <Command>
                        <CommandInput
                          placeholder={intl.formatMessage({ defaultMessage: 'Search currencies...', id: 'fDMc8k' })}
                          data-cy="organization-currency-search"
                          ref={currencyInputRef}
                        />
                        <CommandList data-cy="organization-currency-list">
                          <CommandEmpty>
                            <FormattedMessage defaultMessage="No currency found." id="moOGSq" />
                          </CommandEmpty>
                          <CommandGroup>
                            {currencyOptions.map(({ value, label }) => (
                              <CommandItem
                                key={value}
                                data-cy={`organization-country-${value}`}
                                onSelect={() => {
                                  setFieldValue(field.name, value as Currency);
                                  setShowCurrencySelect(false);
                                }}
                              >
                                <span>{label}</span>
                              </CommandItem>
                            ))}
                          </CommandGroup>
                        </CommandList>
                      </Command>
                    </SelectContent>
                  </Select>
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
                  name="settings.VAT.type"
                  label={<FormattedMessage defaultMessage="VAT settings" id="EditCollective.VAT" />}
                >
                  {({ field }) => (
                    <Select value={field.value} onValueChange={value => setFieldValue(field.name, value)}>
                      <SelectTrigger
                        id={field.name}
                        data-cy="VAT"
                        className={cn('truncate', { 'border-red-500': field.error })}
                      >
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value={null} data-cy="select-option">
                          <FormattedMessage defaultMessage="Not subject to VAT" id="EditCollective.VAT.None" />
                        </SelectItem>
                        <SelectItem value={VAT_OPTIONS.OWN} data-cy="select-option">
                          <FormattedMessage defaultMessage="Use my own VAT number" id="EditCollective.VAT.Own" />
                        </SelectItem>
                        {(!account.isHost || field.value === VAT_OPTIONS.HOST) && (
                          <SelectItem value={VAT_OPTIONS.HOST} data-cy="select-option">
                            <FormattedMessage defaultMessage="Use the host VAT settings" id="EditCollective.VAT.Host" />
                          </SelectItem>
                        )}
                      </SelectContent>
                    </Select>
                  )}
                </FormField>
                <FormField
                  name="settings.VAT.number"
                  label={<FormattedMessage defaultMessage="VAT number" id="EditCollective.VATNumber" />}
                  hint={
                    <FormattedMessage
                      id="EditCollective.VATNumber.Description"
                      defaultMessage="Your European Value Added Tax (VAT) number"
                    />
                  }
                />
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
