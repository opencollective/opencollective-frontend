import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { gql, useMutation } from '@apollo/client';
import type { FormikProps } from 'formik';
import { Form } from 'formik';
import { omit, orderBy, pick } from 'lodash';
import { Plus, X } from 'lucide-react';
import { useRouter } from 'next/router';
import { FormattedMessage, useIntl } from 'react-intl';
import { z } from 'zod';

import { suggestSlug } from '@/lib/collective';
import { getCurrencyForCountry } from '@/lib/currency-utils';
import { formatErrorMessage, getErrorFromGraphqlException } from '@/lib/errors';
import { CountryIso, Currency } from '@/lib/graphql/types/v2/graphql';
import useLoggedInUser from '@/lib/hooks/useLoggedInUser';
import { i18nCountryName } from '@/lib/i18n';
import { getCountryCodeFromLocalBrowserLanguage, getFlagEmoji } from '@/lib/i18n/countries';
import { cn, parseToBoolean } from '@/lib/utils';

import Captcha, { isCaptchaEnabled } from '../Captcha';
import { FormField } from '../FormField';
import { FormikZod } from '../FormikZod';
import Image from '../Image';
import { Button } from '../ui/Button';
import { Card, CardContent } from '../ui/Card';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '../ui/Command';
import { Input, InputGroup } from '../ui/Input';
import { Select, SelectContent, SelectTrigger } from '../ui/Select';
import { toast } from '../ui/useToast';

import type { SignupStepProps } from './common';

const createOrganizationMutation = gql`
  mutation OrganizationSignup(
    $individual: IndividualCreateInput
    $organization: OrganizationCreateInput!
    $captcha: CaptchaInputType
    $roleDescription: String
    $hasMoneyManagement: Boolean
    $hasHosting: Boolean
  ) {
    createOrganization(
      individual: $individual
      organization: $organization
      captcha: $captcha
      roleDescription: $roleDescription
      hasMoneyManagement: $hasMoneyManagement
      hasHosting: $hasHosting
    ) {
      id
      name
      slug
      description
      website
      legacyId
    }
  }
`;

const inviteOrganizationAdminsMutation = gql`
  mutation InviteOrganizationAdmins($organization: AccountReferenceInput!, $inviteMembers: [InviteMemberInput!]!) {
    inviteOrganizationAdmins(organization: $organization, inviteMembers: $inviteMembers) {
      id
      slug
      name
    }
  }
`;

const createOrganizationSchema = z.object({
  organization: z.object({
    countryISO: z.string().min(2).max(2),
    name: z.string().min(5).max(255),
    slug: z.string().min(5).max(255),
    legalName: z.string().min(5).max(255),
    description: z.string().max(255).optional(),
    website: z.string().url().optional(),
    currency: z.string().length(3),
  }),
  individual: z.object({ id: z.number() }),
  roleDescription: z.string().max(255).optional(),
});

type CreateOrganizationValuesSchema = z.infer<typeof createOrganizationSchema>;

export function OrganizationForm({ nextStep, setCreatedOrganization }: SignupStepProps) {
  const intl = useIntl();
  const formikRef = useRef<FormikProps<CreateOrganizationValuesSchema>>(undefined);
  const countryInputRef = useRef<HTMLInputElement>(null);
  const currencyInputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();
  const [loading, setLoading] = React.useState(false);
  const { LoggedInUser, refetchLoggedInUser } = useLoggedInUser();
  const [createOrganization] = useMutation(createOrganizationMutation);
  const [showCountrySelect, setShowCountrySelect] = useState(false);
  const [showCurrencySelect, setShowCurrencySelect] = useState(false);
  const [captchaResult, setCaptchaResult] = useState(null);
  const getCountryLabel = useCallback(
    (countryISO: string) => `${getFlagEmoji(countryISO)} ${i18nCountryName(intl, countryISO)}`,
    [intl],
  );
  const countryOptions = useMemo(
    () =>
      orderBy(
        Object.keys(CountryIso).map(code => ({
          value: code,
          label: getCountryLabel(code),
        })),
        ['label'],
        ['asc'],
      ),
    [getCountryLabel],
  );
  const currencyOptions = useMemo(
    () =>
      Object.keys(Currency).map(code => ({
        value: code,
        label: code,
      })),
    [],
  );
  const handleOpenCountrySelect = useCallback(
    open => {
      setShowCountrySelect(open);
      if (open) {
        setTimeout(() => {
          countryInputRef.current?.focus();
        }, 100);
      }
    },
    [countryInputRef],
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

  useEffect(() => {
    if (formikRef.current) {
      const formik = formikRef.current;
      if (LoggedInUser) {
        formik.setFieldValue('individual', pick(LoggedInUser, ['id']));
      }
    }
  }, [LoggedInUser]);

  useEffect(() => {
    if (formikRef.current) {
      const formik = formikRef.current;
      if (!formik.values.organization?.countryISO) {
        const countryCode = getCountryCodeFromLocalBrowserLanguage();
        const countryISO = countryCode && CountryIso[countryCode];
        if (countryISO) {
          formik.setFieldValue('organization.countryISO', countryISO);
          formik.setFieldValue('organization.currency', getCurrencyForCountry(countryISO));
        }
      }
    }
  }, [formikRef]);

  const onSubmit = async (values: CreateOrganizationValuesSchema) => {
    const { individual, roleDescription, organization } = values;
    try {
      setLoading(true);
      const result = await createOrganization({
        variables: {
          individual: 'id' in individual ? null : omit(individual, ['passwordConfirmation']),
          organization: organization,
          captcha: captchaResult,
          roleDescription,
          hasMoneyManagement: parseToBoolean(router.query?.active) || parseToBoolean(router.query?.hasMoneyManagement),
          hasHosting: parseToBoolean(router.query?.host) || parseToBoolean(router.query?.hasHosting),
        },
      });

      setCreatedOrganization(result.data.createOrganization);
      toast({
        variant: 'success',
        message: intl.formatMessage({
          id: 'createCollective.form.success',
          defaultMessage: 'Organization created successfully!',
        }),
      });
      // We refetch the logged in user to update their memberships
      await refetchLoggedInUser();
      nextStep();
    } catch (error) {
      setLoading(false);
      const gqlError = getErrorFromGraphqlException(error);
      if (gqlError?.payload?.code?.includes('SLUG')) {
        formikRef.current?.setFieldError('organization.slug', formatErrorMessage(intl, gqlError));
      }
      toast({
        variant: 'error',
        message: formatErrorMessage(intl, gqlError) || 'An error occurred while creating the organization',
      });
    }
  };

  return (
    <FormikZod<CreateOrganizationValuesSchema>
      schema={createOrganizationSchema}
      onSubmit={onSubmit}
      initialValues={{}}
      innerRef={formikRef}
    >
      {({ touched, setFieldValue, isValid }) => (
        <Form
          className="mb-6 flex max-w-xl grow flex-col items-center gap-8 px-6 sm:mb-20 sm:px-0"
          data-cy="create-organization-form"
        >
          <Image width={100} height={104} src="/static/images/signup/org.png" alt="Organization" />
          <div className="flex flex-col gap-2 px-3 text-center">
            <React.Fragment>
              <h1 className="text-xl font-bold sm:text-3xl sm:leading-10">
                <FormattedMessage defaultMessage="Create an organization" id="signup.createOrganization.title" />
              </h1>
              <p className="text-sm break-words text-slate-700 sm:text-base">
                <FormattedMessage defaultMessage="Tell us about your organization" id="GliZXP" />
              </p>
            </React.Fragment>
          </div>
          <Card className="w-full max-w-lg">
            <CardContent className="flex flex-col gap-4">
              <FormField
                name="organization.countryISO"
                label={
                  <FormattedMessage id="createCollective.form.country" defaultMessage="Country of Incorporation" />
                }
              >
                {({ field }) => (
                  <Select value={field.value} open={showCountrySelect} onOpenChange={handleOpenCountrySelect}>
                    <SelectTrigger
                      className={cn(!field.value && 'text-muted-foreground')}
                      data-cy="organization-country-trigger"
                    >
                      {field.value ? getCountryLabel(field.value) : 'Select Country'}
                    </SelectTrigger>
                    <SelectContent className="max-h-[50vh]">
                      <Command>
                        <CommandInput
                          placeholder={intl.formatMessage({ defaultMessage: 'Search countries...', id: '37zpJw' })}
                          data-cy="organization-country-search"
                          ref={countryInputRef}
                        />
                        <CommandList data-cy="organization-country-list">
                          <CommandEmpty>
                            <FormattedMessage defaultMessage="No country found." id="OotY1c" />
                          </CommandEmpty>
                          <CommandGroup>
                            {countryOptions.map(({ value, label }) => (
                              <CommandItem
                                key={value}
                                data-cy={`organization-country-${value}`}
                                onSelect={() => {
                                  setFieldValue(field.name, value as CountryIso);
                                  if (!touched.organization?.currency) {
                                    setFieldValue('organization.currency', getCurrencyForCountry(value as CountryIso));
                                  }
                                  setShowCountrySelect(false);
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
                name="organization.currency"
                label={<FormattedMessage id="Currency" defaultMessage="Currency" />}
                hint={
                  <FormattedMessage
                    defaultMessage="Select the main currency for your organization's financial transactions and reporting."
                    id="currency.hint"
                  />
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
              <FormField
                name="organization.legalName"
                label={<FormattedMessage defaultMessage="Legal name" id="OozR1Y" />}
                hint={
                  <FormattedMessage defaultMessage="Official name as registered with legal authorities." id="jQOxmT" />
                }
                placeholder="e.g. Green Horizon Foundation, Inc."
                autoComplete="organization"
                autoFocus
              />
              <FormField
                name="organization.name"
                label={<FormattedMessage id="PublicName" defaultMessage="Public name" />}
                hint={
                  <FormattedMessage
                    defaultMessage="Displayed publicly. Can be different from legal name."
                    id="publicName.hint"
                  />
                }
                placeholder="e.g. Green Horizon"
                autoComplete="organization"
                onChange={e => {
                  setFieldValue('organization.name', e.target.value);
                  if (!touched.organization?.slug) {
                    setFieldValue('organization.slug', suggestSlug(e.target.value));
                  }
                }}
              />
              <FormField
                name="roleDescription"
                label={<FormattedMessage id="RoleDescription" defaultMessage="Your role in the Organization" />}
                placeholder="General Manager, Founder, etc."
                autoComplete="organization-title organization"
              />
              <FormField
                name="organization.slug"
                label={<FormattedMessage id="createCollective.form.slugLabel" defaultMessage="Set your profile URL" />}
              >
                {({ field }) => <InputGroup className="w-full" prepend="opencollective.com/" {...field} />}
              </FormField>
              <FormField
                name="organization.description"
                label={
                  <FormattedMessage
                    id="ExpenseForm.inviteeOrgDescriptionLabel"
                    defaultMessage="What does your organization do?"
                  />
                }
              />
              <FormField
                name="organization.website"
                label={<FormattedMessage id="Fields.website" defaultMessage="Website" />}
                autoComplete="organization url"
              />
              {isCaptchaEnabled() && (
                <FormField name="captcha" className="flex items-center">
                  {() => <Captcha onVerify={setCaptchaResult} />}
                </FormField>
              )}
            </CardContent>
          </Card>
          <div className="grow sm:hidden" />
          <div className="flex w-full max-w-lg flex-col gap-4">
            <Button type="submit" disabled={!isValid || (isCaptchaEnabled() && !captchaResult)} loading={loading}>
              <FormattedMessage defaultMessage="Create Organization" id="organization.create" />
            </Button>
          </div>
        </Form>
      )}
    </FormikZod>
  );
}

const inviteAdminsSchema = z.object({
  invitedAdmins: z
    .array(
      z.object({
        email: z.string().email(),
        name: z.string().min(1),
      }),
    )
    .optional(),
});

type InviteAdminsValuesSchema = z.infer<typeof inviteAdminsSchema>;

const invitedAdminToMember = ({ email, name }) => {
  return { memberInfo: { email, name }, role: 'ADMIN' };
};

export function InviteAdminForm({ nextStep, createdOrganization }: SignupStepProps) {
  const intl = useIntl();
  const formikRef = useRef<FormikProps<InviteAdminsValuesSchema>>(undefined);
  const [inviteFieldsCount, setInviteFieldsCount] = useState(0);
  const [inviteOrganizationAdmins] = useMutation(inviteOrganizationAdminsMutation);
  const [loading, setLoading] = React.useState(false);

  const onSubmit = async (values: InviteAdminsValuesSchema) => {
    const { invitedAdmins } = values;
    try {
      if (!createdOrganization) {
        throw new Error('Organization not found');
      }
      setLoading(true);
      const inviteMembers = (invitedAdmins || []).map(invitedAdminToMember);
      await inviteOrganizationAdmins({
        variables: {
          organization: { slug: createdOrganization.slug },
          inviteMembers,
        },
      });
      toast({
        variant: 'success',
        message: <FormattedMessage id="signup.inviteAdmins.success" defaultMessage="Invites sent!" />,
      });
      nextStep();
    } catch (error) {
      setLoading(false);
      const gqlError = getErrorFromGraphqlException(error);
      if (gqlError?.payload?.code?.includes('SLUG')) {
        formikRef.current?.setFieldError('organization.slug', formatErrorMessage(intl, gqlError));
      }
      toast({
        variant: 'error',
        message: formatErrorMessage(intl, gqlError) || (
          <FormattedMessage
            id="signup.inviteAdmins.error"
            defaultMessage="An error occurred while inviting your team"
          />
        ),
      });
    }
  };

  return (
    <FormikZod<InviteAdminsValuesSchema>
      schema={inviteAdminsSchema}
      onSubmit={onSubmit}
      initialValues={{}}
      innerRef={formikRef}
    >
      {({ values, setFieldValue, isValid }) => (
        <Form
          className="mb-6 flex max-w-xl grow flex-col items-center gap-8 px-6 sm:mb-20 sm:px-0"
          data-cy="invite-admins-form"
        >
          <Image width={80} height={62} src="/static/images/signup/invite.png" alt="Stars" />
          <div className="flex flex-col gap-2 px-3 text-center">
            <React.Fragment>
              <h1 className="text-xl font-bold sm:text-3xl sm:leading-10">
                <FormattedMessage id="signup.inviteAdmins.title" defaultMessage="Invite your team" />
              </h1>
              <p className="text-sm break-words text-slate-700 sm:text-base">
                <FormattedMessage
                  defaultMessage="Having your team helps you share the work, adds accountability to manage finances transparently."
                  id="signup.inviteAdmins.description"
                />
              </p>
            </React.Fragment>
          </div>
          <Card className="w-full max-w-lg">
            <CardContent className="flex flex-col gap-4">
              {inviteFieldsCount > 0 && (
                <div className="flex flex-col gap-4">
                  {Array.from({ length: inviteFieldsCount }).map((_, index) => (
                    <div
                      // eslint-disable-next-line react/no-array-index-key
                      key={`invitedAdmin-${index}`}
                      className="flex items-start gap-2"
                    >
                      <div className="flex flex-1 flex-col gap-4 rounded-lg border border-border p-4">
                        <FormField
                          name={`invitedAdmins.${index}.name`}
                          label={<FormattedMessage defaultMessage="Name" id="Fields.name" />}
                        >
                          {({ field }) => <Input {...field} placeholder="e.g. Jane Smith" />}
                        </FormField>
                        <FormField
                          name={`invitedAdmins.${index}.email`}
                          label={<FormattedMessage id="Email" defaultMessage="Email" />}
                          type="email"
                        >
                          {({ field }) => <Input {...field} placeholder="e.g. jane@example.com" />}
                        </FormField>
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          const newInvitedAdmins = [...(values.invitedAdmins || [])];
                          newInvitedAdmins.splice(index, 1);
                          setFieldValue('invitedAdmins', newInvitedAdmins);
                          setInviteFieldsCount(inviteFieldsCount - 1);
                        }}
                        className="mt-1 h-8 w-8 p-0"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  if (inviteFieldsCount < 5) {
                    setInviteFieldsCount(inviteFieldsCount + 1);
                    const newInvitedAdmins = [...(values.invitedAdmins || [])];
                    newInvitedAdmins.push({ name: '', email: '' });
                    setFieldValue('invitedAdmins', newInvitedAdmins);
                  }
                }}
                disabled={inviteFieldsCount >= 5 || loading}
                className="w-full"
                data-cy="add-team-member"
              >
                <Plus className="h-4 w-4" />
                <FormattedMessage defaultMessage="Add Team Member" id="InviteTeamMember.add" />
              </Button>
            </CardContent>
          </Card>
          <div className="grow sm:hidden" />
          <div className="flex w-full max-w-lg flex-col-reverse gap-4 sm:flex-row sm:justify-between">
            <Button
              type="button"
              variant="outline"
              className="grow"
              disabled={loading}
              onClick={() => nextStep()}
              data-cy="skip-to-dashboard"
            >
              <FormattedMessage defaultMessage="Skip to Dashboard" id="SkipToDashboard" />
            </Button>
            <Button
              type="submit"
              disabled={!isValid}
              loading={loading}
              className="grow aria-hidden:hidden"
              aria-hidden={inviteFieldsCount === 0}
            >
              <FormattedMessage defaultMessage="Send Invite" id="Expense.SendInvite" />
            </Button>
          </div>
        </Form>
      )}
    </FormikZod>
  );
}
