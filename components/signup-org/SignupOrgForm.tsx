import React, { useEffect, useRef, useState } from 'react';
import { gql, useMutation } from '@apollo/client';
import type { FormikProps } from 'formik';
import { Form } from 'formik';
import { max, omit, pick, set } from 'lodash';
import { FormattedMessage, useIntl } from 'react-intl';
import { z } from 'zod';

import { suggestSlug } from '@/lib/collective';
import { API_V2_CONTEXT } from '@/lib/graphql/helpers';
import { CountryIso } from '@/lib/graphql/types/v2/graphql';
import useLoggedInUser from '@/lib/hooks/useLoggedInUser';
import { getCountryDisplayName } from '@/lib/i18n/countries';
import { cn } from '@/lib/utils';

import Avatar from '../Avatar';
import Captcha, { isCaptchaEnabled } from '../Captcha';
import { FormField } from '../FormField';
import { FormikZod } from '../FormikZod';
import { getI18nLink } from '../I18nFormatters';
import { PasswordStrengthBar } from '../PasswordStrengthBar';
import { Button } from '../ui/Button';
import { Card, CardContent } from '../ui/Card';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '../ui/Command';
import { Input, InputGroup } from '../ui/Input';
import { RadioGroup, RadioGroupCard } from '../ui/RadioGroup';
import { Select, SelectContent, SelectTrigger } from '../ui/Select';
import { toast } from '../ui/useToast';

import SignInPopUp from './SginInPopUp';

const createOrganizationMutation = gql`
  mutation SignupWithOrganization(
    $individual: IndividualCreateInput!
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
  countryISO: z.string().min(2).max(2),
  name: z.string().min(5).max(255),
  slug: z.string().min(5).max(255),
  legalName: z.string().min(5).max(255),
  description: z.string().min(10).max(255),
  website: z.string().url().optional(),
  individual: z.union([
    z.object({
      name: z.string().min(3),
      legalName: z.string().min(5),
      email: z.string().email(),
      password: z.string().min(8).optional(),
      passwordConfirmation: z.string().min(8).optional(),
    }),
    z.object({ id: z.number() }),
  ]),
  roleDescription: z.string().max(255).optional(),
  invitedAdmins: z.array(z.string().email()).optional(),
});

type FormValuesSchema = z.infer<typeof formSchema>;

const SignupOrgForm = () => {
  const intl = useIntl();
  const formikRef = useRef<FormikProps<FormValuesSchema>>();
  const { LoggedInUser } = useLoggedInUser();
  const [createOrganization, { loading }] = useMutation(createOrganizationMutation, { context: API_V2_CONTEXT });
  const [userForm, setUserForm] = useState<'LOGIN' | 'NEW_USER' | string>('NEW_USER');
  const [showSignInPopup, setShowSignInPopup] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState(0);
  const [invitedAdminsLength, setInvitedAdminsLength] = useState(1);
  const [showCountrySelect, setShowCountrySelect] = useState(false);
  const [captchaResult, setCaptchaResult] = React.useState(null);

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
    if (userForm === 'LOGIN' && !LoggedInUser) {
      setShowSignInPopup(true);
    } else {
      setShowSignInPopup(false);
    }
  }, [userForm, LoggedInUser]);

  const validate = (values: FormValuesSchema) => {
    const errors: Record<string, string> = {};
    if (values.individual) {
      if (
        userForm === 'NEW_USER' &&
        'password' in values.individual &&
        values.individual?.password !== values.individual?.passwordConfirmation
      ) {
        set(errors, 'individual.passwordConfirmation', 'Passwords do not match');
      }

      if ('password' in values.individual && passwordStrength < 3) {
        set(errors, 'individual.password', 'Password is too weak');
      }
    }
    return errors;
  };

  const onSubmit = async (values: FormValuesSchema) => {
    console.debug('Submitting SignupOrgForm with values:', values);
    const { individual, invitedAdmins, roleDescription, ...organization } = values;
    try {
      await createOrganization({
        variables: {
          individual: omit(individual, ['passwordConfirmation']),
          organization,
          inviteMembers:
            invitedAdmins?.length && invitedAdmins.map(email => ({ memberInfo: { email }, role: 'ADMIN' })),
          captcha: captchaResult,
          roleDescription,
        },
      });
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
                      label={<FormattedMessage id="Name" defaultMessage="Display Name" />}
                      placeholder="e.g. John"
                    />
                    <FormField
                      name="individual.legalName"
                      label={<FormattedMessage id="FullLegalName" defaultMessage="Full Legal Name" />}
                      placeholder="e.g. John Doe"
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
                    <div>
                      <FormField
                        name="individual.password"
                        label={<FormattedMessage id="Password" defaultMessage="Password" />}
                        type="password"
                        hint={
                          <FormattedMessage
                            defaultMessage="Strong password recommended. Short or weak one restricted. <link>The strength of a password is a function of length, complexity, and unpredictability.</link>"
                            id="qaIW32"
                            values={{
                              link: getI18nLink({
                                href: 'https://en.wikipedia.org/wiki/Password_strength',
                                openInNewTab: true,
                              }),
                            }}
                          />
                        }
                      />
                      <div className="mx-2 mt-2 text-muted-foreground" data-cy="password-strength-bar">
                        <PasswordStrengthBar
                          password={
                            (values.individual && 'password' in values.individual && values.individual.password) || ''
                          }
                          scoreWordStyle={{ fontSize: '0.75rem' }}
                          onChangeScore={setPasswordStrength}
                        />
                      </div>
                    </div>
                    <FormField
                      name="individual.passwordConfirmation"
                      label={<FormattedMessage id="RepeatPassword" defaultMessage="Repeat Password" />}
                      type="password"
                    />
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
                  name="countryISO"
                  label={
                    <FormattedMessage id="createCollective.form.country" defaultMessage="Country of Incorporation" />
                  }
                >
                  {({ field }) => (
                    <Select value={field.value} open={showCountrySelect} onOpenChange={setShowCountrySelect}>
                      <SelectTrigger className={cn(!field.value && 'text-muted-foreground')}>
                        {field.value ? getCountryDisplayName(intl, field.value) : 'Select Country'}
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
                              {Object.keys(CountryIso).map(code => (
                                <CommandItem
                                  key={code}
                                  onSelect={() => {
                                    setFieldValue('countryISO', code as CountryIso);
                                    setShowCountrySelect(false);
                                  }}
                                >
                                  <span>{getCountryDisplayName(intl, code)}</span>
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
                  name="legalName"
                  label={<FormattedMessage id="LegalName" defaultMessage="Legal Name" />}
                  placeholder="e.g. Open Collective Inc., Open Finance Consortium Inc."
                />
                <FormField
                  name="name"
                  label={<FormattedMessage id="PublicName" defaultMessage="Public Name" />}
                  placeholder="e.g. Open Collective, OFiCo"
                  onChange={e => {
                    setFieldValue('name', e.target.value);
                    if (!touched.slug) {
                      setFieldValue('slug', suggestSlug(e.target.value));
                    }
                  }}
                />
                <FormField
                  name="slug"
                  label={
                    <FormattedMessage id="createCollective.form.slugLabel" defaultMessage="Set your profile URL" />
                  }
                >
                  {({ field }) => <InputGroup className="w-full" prepend="opencollective.com/" {...field} />}
                </FormField>
                <FormField
                  name="description"
                  label={
                    <FormattedMessage
                      id="ExpenseForm.inviteeOrgDescriptionLabel"
                      defaultMessage="What does your organization do?"
                    />
                  }
                />
                <FormField name="website" label={<FormattedMessage id="Website" defaultMessage="Website" />} />
              </CardContent>
            </Card>

            <Card>
              <CardContent className="flex flex-col gap-4 pt-6">
                <header>
                  <h3 className="text-lg font-medium">
                    <FormattedMessage id="AdditionalAdministrators" defaultMessage="Additional Administrators" />
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    <FormattedMessage
                      id="AdditionalAdministratorsDescription"
                      defaultMessage="Invite members of your team"
                    />
                  </p>
                </header>
                {Array.from({ length: invitedAdminsLength }).map((_, index) => (
                  <FormField
                    // eslint-disable-next-line react/no-array-index-key
                    key={index}
                    name={`invitedAdmins.${index}`}
                    label={
                      <React.Fragment>
                        <FormattedMessage id="Email" defaultMessage="Email" /> #{index + 1}
                      </React.Fragment>
                    }
                    type="email"
                  >
                    {({ field }) => (
                      <div className="flex gap-1">
                        <Input {...field} />
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => {
                            setFieldValue(
                              'invitedAdmins',
                              values.invitedAdmins?.filter((_, i) => i !== index),
                            );
                            setInvitedAdminsLength(max([invitedAdminsLength - 1, 0]));
                          }}
                          className="ml-2"
                        >
                          <FormattedMessage id="SignupOrgForm.removeAdmin" defaultMessage="Remove" />
                        </Button>
                      </div>
                    )}
                  </FormField>
                ))}
                <Button
                  type="button"
                  variant="outline"
                  className="w-full"
                  onClick={() => setInvitedAdminsLength(invitedAdminsLength + 1)}
                  disabled={invitedAdminsLength >= 5}
                >
                  <FormattedMessage id="SignupOrgForm.addAdmin" defaultMessage="Add another administrator" />
                </Button>
              </CardContent>
            </Card>
            {isCaptchaEnabled() && (
              <div className="flex justify-center">
                <Captcha onVerify={setCaptchaResult} />
              </div>
            )}
            <Button type="submit" disabled={!isValid || (isCaptchaEnabled() && !captchaResult)} loading={loading}>
              <FormattedMessage defaultMessage="Create Organization" id="JqYRWE" />
            </Button>
          </Form>
        )}
      </FormikZod>
      {showSignInPopup && (
        <SignInPopUp
          open={showSignInPopup}
          setOpen={() => setUserForm('NEW_USER')}
          // email={values.admin?.user?.email}
        />
      )}
    </div>
  );
};

export default SignupOrgForm;
