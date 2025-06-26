import React, { useEffect, useMemo, useRef, useState } from 'react';
import { gql, useMutation } from '@apollo/client';
import type { FormikProps } from 'formik';
import { Form } from 'formik';
import { isEmpty, max, omit, orderBy, pick, set } from 'lodash';
import { FormattedMessage, useIntl } from 'react-intl';
import { z } from 'zod';

import { suggestSlug } from '@/lib/collective';
import { API_V2_CONTEXT } from '@/lib/graphql/helpers';
import type { OrganizationSignupMutation } from '@/lib/graphql/types/v2/graphql';
import { CountryIso } from '@/lib/graphql/types/v2/graphql';
import useLoggedInUser from '@/lib/hooks/useLoggedInUser';
import { i18nCountryName } from '@/lib/i18n';
import { getCountryCodeFromLocalBrowserLanguage } from '@/lib/i18n/countries';
import { cn } from '@/lib/utils';

import Avatar from '../Avatar';
import Captcha, { isCaptchaEnabled } from '../Captcha';
import { FormField } from '../FormField';
import { FormikZod } from '../FormikZod';
import { getI18nLink } from '../I18nFormatters';
import { Button } from '../ui/Button';
import { Card, CardContent } from '../ui/Card';
import { Checkbox } from '../ui/Checkbox';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '../ui/Command';
import { Input, InputGroup } from '../ui/Input';
import { RadioGroup, RadioGroupCard } from '../ui/RadioGroup';
import { Select, SelectContent, SelectTrigger } from '../ui/Select';
import { toast } from '../ui/useToast';

import SignInPopUp from './SignInPopUp';

const createOrganizationMutation = gql`
  mutation OrganizationSignup(
    $individual: IndividualCreateInput
    $organization: OrganizationCreateInput!
    $inviteMembers: [InviteMemberInput]
    $captcha: CaptchaInputType
    $roleDescription: String
  ) {
    createOrganization(
      individual: $individual
      organization: $organization
      inviteMembers: $inviteMembers
      captcha: $captcha
      roleDescription: $roleDescription
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

const formSchema = z.object({
  organization: z.object({
    countryISO: z.string().min(2).max(2),
    name: z.string().min(5).max(255),
    slug: z.string().min(5).max(255),
    legalName: z.string().min(5).max(255),
    description: z.string().min(10).max(255),
    website: z.string().url().optional(),
  }),
  individual: z.union([
    z.object({
      name: z.string(),
      legalName: z.string().optional(),
      email: z.string().email(),
    }),
    z.object({ id: z.number() }),
  ]),
  TOSAgreement: z.boolean().optional(),
  roleDescription: z.string().max(255).optional(),
  invitedAdmins: z.array(z.string().email()).optional(),
});

type FormValuesSchema = z.infer<typeof formSchema>;

export type OrganizationFormProps = {
  onSuccess?: (organization: OrganizationSignupMutation['createOrganization']) => void;
};

const OrganizationForm = ({ onSuccess }: OrganizationFormProps) => {
  const intl = useIntl();
  const formikRef = useRef<FormikProps<FormValuesSchema>>(undefined);
  const { LoggedInUser } = useLoggedInUser();
  const [createOrganization, { loading }] = useMutation(createOrganizationMutation, { context: API_V2_CONTEXT });
  const [userForm, setUserForm] = useState<'LOGIN' | 'NEW_USER' | string>('NEW_USER');
  const [showSignInPopup, setShowSignInPopup] = useState(false);
  const [showCountrySelect, setShowCountrySelect] = useState(false);
  const [captchaResult, setCaptchaResult] = useState(null);
  const countryOptions = useMemo(
    () =>
      orderBy(
        Object.keys(CountryIso).map(code => ({
          value: code,
          label: i18nCountryName(intl, code),
        })),
        ['label'],
        ['asc'],
      ),
    [intl],
  );

  useEffect(() => {
    if (formikRef.current) {
      const formik = formikRef.current;
      if (LoggedInUser) {
        setUserForm(LoggedInUser.id.toString());
        formik.setFieldValue('individual', pick(LoggedInUser, ['id']));
      } else if (!LoggedInUser && formik.values.individual && 'id' in formik.values.individual) {
        formik.setFieldValue('individual', null);
        setUserForm('NEW_USER');
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
        }
      }
    }
  }, [formikRef]);

  useEffect(() => {
    if (userForm === 'LOGIN' && !LoggedInUser) {
      setShowSignInPopup(true);
    } else {
      setShowSignInPopup(false);
    }
  }, [userForm, LoggedInUser]);

  const validate = (values: FormValuesSchema) => {
    const errors: Record<string, string> = {};
    if (values.individual) {
      if (userForm === 'NEW_USER' && !values.TOSAgreement) {
        set(errors, 'TOSAgreement', 'You must agree to the Terms of Service');
      }
    }
    return errors;
  };

  const onSubmit = async (values: FormValuesSchema) => {
    const { individual, invitedAdmins, roleDescription, organization } = values;
    try {
      const result = await createOrganization({
        variables: {
          individual: 'id' in individual ? null : omit(individual, ['passwordConfirmation']),
          organization: organization,
          inviteMembers: invitedAdmins?.length
            ? invitedAdmins.map(email => ({ memberInfo: { email }, role: 'ADMIN' }))
            : undefined,
          captcha: captchaResult,
          roleDescription,
        },
      });
      onSuccess?.(result.data.createOrganization);
      toast({
        variant: 'success',
        message: intl.formatMessage({
          id: 'createCollective.form.success',
          defaultMessage: 'Organization created successfully!',
        }),
      });
    } catch (error) {
      toast({
        variant: 'error',
        message: error.message || 'An error occurred while creating the organization',
      });
    }
  };

  return (
    <div>
      <FormikZod<FormValuesSchema>
        schema={formSchema}
        onSubmit={onSubmit}
        validate={validate}
        initialValues={{}}
        innerRef={formikRef}
      >
        {({ touched, values, setFieldValue, isValid }) => (
          <Form className="flex flex-col gap-8">
            <Card>
              <CardContent className="flex flex-col gap-4 pt-6">
                <header>
                  <h3 className="text-lg font-medium">
                    <FormattedMessage id="firstAdmin" defaultMessage="Personal Information" />
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    <FormattedMessage
                      id="personalInfoDescription"
                      defaultMessage="Tell us about yourself and your role in the organization"
                    />
                  </p>
                </header>
                <RadioGroup
                  value={userForm}
                  onValueChange={(value: 'NEW_USER' | 'LOGIN' | string) => setUserForm(value)}
                  className="flex w-full flex-col"
                >
                  {LoggedInUser && values.individual && 'id' in values.individual && (
                    <React.Fragment>
                      <RadioGroupCard value={LoggedInUser.id.toString()} className="grow">
                        <Avatar collective={LoggedInUser.collective} radius={32} />
                        <div className="flex flex-col">
                          <p className="font-medium">{LoggedInUser.collective.name}</p>
                          <p className="text-xs text-muted-foreground">{LoggedInUser.email}</p>
                        </div>
                      </RadioGroupCard>
                      <FormField
                        name="roleDescription"
                        label={<FormattedMessage id="RoleDescription" defaultMessage="Role in the Organization" />}
                        placeholder="General Manager, Founder, etc."
                      />{' '}
                    </React.Fragment>
                  )}
                  {!LoggedInUser && (
                    <React.Fragment>
                      <RadioGroupCard value={'NEW_USER'} disabled={!!LoggedInUser}>
                        <div className="flex flex-col">
                          <p className="font-medium">
                            <FormattedMessage id="SingupOrg.NewUser" defaultMessage="I am a new user" />
                          </p>
                          <p className="text-xs text-muted-foreground">
                            <FormattedMessage
                              id="SingupOrg.NewUser.description"
                              defaultMessage="Create a new Open Collective account"
                            />
                          </p>
                        </div>
                      </RadioGroupCard>
                      <RadioGroupCard value={'LOGIN'}>
                        <div className="flex flex-col">
                          <p className="font-medium">
                            <FormattedMessage id="SingupOrg.Login" defaultMessage="I have an Open Collective account" />
                          </p>
                          <p className="text-xs text-muted-foreground">
                            <FormattedMessage
                              id="SingupOrg.Login.description"
                              defaultMessage="Sign in with my existing user account"
                            />
                          </p>
                        </div>
                      </RadioGroupCard>
                    </React.Fragment>
                  )}
                </RadioGroup>
                {userForm === 'NEW_USER' && (
                  <React.Fragment>
                    <FormField
                      name="individual.name"
                      label={<FormattedMessage defaultMessage="Your name" id="vlKhIl" />}
                      placeholder="e.g. Thomas Anderson"
                    />
                    <FormField
                      name="individual.legalName"
                      label={<FormattedMessage defaultMessage="Legal name" id="OozR1Y" />}
                      placeholder={
                        values.individual && 'name' in values.individual && values.individual.name
                          ? values.individual.name
                          : 'e.g. Thomas Alan Anderson'
                      }
                      hint={
                        <FormattedMessage
                          defaultMessage="Your full legal name is required if different from name."
                          id="Hs/7w7"
                        />
                      }
                    />
                    <FormField
                      name="individual.email"
                      label={<FormattedMessage id="Email" defaultMessage="Email" />}
                      placeholder="e.g. doe@johns.com"
                      type="email"
                    />
                    <FormField
                      name="roleDescription"
                      label={<FormattedMessage id="RoleDescription" defaultMessage="Role in the Organization" />}
                      placeholder="General Manager, Founder, etc."
                    />
                    <FormField
                      label={<FormattedMessage defaultMessage="Terms of Service" id="32rBNK" />}
                      name="TOSAgreement"
                      required
                    >
                      {({ field }) => (
                        <label className="ml-2 flex cursor-pointer items-center gap-2 text-sm leading-normal font-normal">
                          <Checkbox checked={field.value} onCheckedChange={value => setFieldValue(field.name, value)} />
                          <div>
                            <FormattedMessage
                              defaultMessage="I agree with the <TOSLink>terms of service</TOSLink> of Open Collective"
                              id="SE0Wpk"
                              values={{
                                TOSLink: getI18nLink({
                                  href: '/tos',
                                  openInNewTabNoFollow: true,
                                  onClick: e => e.stopPropagation(), // don't check the checkbox when clicking on the link
                                }),
                              }}
                            />
                          </div>
                        </label>
                      )}
                    </FormField>
                  </React.Fragment>
                )}
              </CardContent>
            </Card>
            <Card>
              <CardContent className="flex flex-col gap-4 pt-6">
                <header>
                  <h3 className="text-lg font-medium">
                    <FormattedMessage defaultMessage="Organization Information" id="o0606E" />
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    <FormattedMessage defaultMessage="Tell us about your organization" id="GliZXP" />
                  </p>
                </header>
                <FormField
                  name="organization.countryISO"
                  label={
                    <FormattedMessage id="createCollective.form.country" defaultMessage="Country of Incorporation" />
                  }
                >
                  {({ field }) => (
                    <Select value={field.value} open={showCountrySelect} onOpenChange={setShowCountrySelect}>
                      <SelectTrigger className={cn(!field.value && 'text-muted-foreground')}>
                        {field.value ? i18nCountryName(intl, field.value) : 'Select Country'}
                      </SelectTrigger>
                      <SelectContent className="max-h-[50vh]">
                        <Command>
                          <CommandInput
                            placeholder={intl.formatMessage({ defaultMessage: 'Search countries...', id: '37zpJw' })}
                          />
                          <CommandList>
                            <CommandEmpty>
                              <FormattedMessage defaultMessage="No country found." id="OotY1c" />
                            </CommandEmpty>
                            <CommandGroup>
                              {countryOptions.map(({ value, label }) => (
                                <CommandItem
                                  key={value}
                                  onSelect={() => {
                                    setFieldValue(field.name, value as CountryIso);
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
                  name="organization.legalName"
                  label={<FormattedMessage defaultMessage="Legal name" id="OozR1Y" />}
                  hint={<FormattedMessage defaultMessage="As registered with legal entities" id="jQOxmT" />}
                  placeholder="e.g. Open Collective Inc., Open Finance Consortium Inc."
                />
                <FormField
                  name="organization.name"
                  label={<FormattedMessage id="PublicName" defaultMessage="Public name" />}
                  placeholder="e.g. Open Collective, OFiCo"
                  onChange={e => {
                    setFieldValue('organization.name', e.target.value);
                    if (!touched.organization?.slug) {
                      setFieldValue('organization.slug', suggestSlug(e.target.value));
                    }
                  }}
                />
                <FormField
                  name="organization.slug"
                  label={
                    <FormattedMessage id="createCollective.form.slugLabel" defaultMessage="Set your profile URL" />
                  }
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
                />
              </CardContent>
            </Card>

            <Card>
              <CardContent className="flex flex-col gap-4 pt-6">
                <header>
                  <h3 className="text-lg font-medium">
                    <FormattedMessage id="InviteTeamMembers" defaultMessage="Invite Team Members" />
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    <FormattedMessage
                      id="InviteTeamMembersDescription"
                      defaultMessage="Invite other administrators to help manage your organization."
                    />
                  </p>
                </header>
                {Array.from({ length: max([1, values.invitedAdmins?.filter(v => !isEmpty(v)).length + 1]) }).map(
                  (_, index) => (
                    <FormField
                      // eslint-disable-next-line react/no-array-index-key
                      key={`invitedAdmins.${index}`}
                      name={`invitedAdmins.${index}`}
                      label={<FormattedMessage id="Email" defaultMessage="Email" />}
                      type="email"
                    >
                      {({ field }) => (
                        <div className="flex gap-1">
                          <Input
                            {...field}
                            onChange={e => {
                              const value = e.target.value;
                              if (isEmpty(value)) {
                                setFieldValue(
                                  'invitedAdmins',
                                  values.invitedAdmins.filter((_, i) => i !== index),
                                );
                              } else {
                                setFieldValue(`invitedAdmins.${index}`, e.target.value);
                              }
                            }}
                          />
                        </div>
                      )}
                    </FormField>
                  ),
                )}
              </CardContent>
            </Card>
            {isCaptchaEnabled() && (
              <div className="flex justify-center">
                <Captcha onVerify={setCaptchaResult} />
              </div>
            )}
            <Button type="submit" disabled={!isValid || (isCaptchaEnabled() && !captchaResult)} loading={loading}>
              <FormattedMessage defaultMessage="Create Organization" id="organization.create" />
            </Button>
          </Form>
        )}
      </FormikZod>
      {showSignInPopup && <SignInPopUp open={showSignInPopup} setOpen={() => setUserForm('NEW_USER')} />}
    </div>
  );
};

export default OrganizationForm;
