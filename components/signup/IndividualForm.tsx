import React from 'react';
import { gql, useMutation, useQuery } from '@apollo/client';
import type { FormikProps } from 'formik';
import { Form } from 'formik';
import { omit, pick } from 'lodash';
import { useRouter } from 'next/router';
import { FormattedMessage, useIntl } from 'react-intl';
import { z } from 'zod';

import { resendOTP, signup, verifyEmail } from '@/lib/api';
import { formatErrorMessage, i18nGraphqlException } from '@/lib/errors';
import useLoggedInUser from '@/lib/hooks/useLoggedInUser';
import { cn } from '@/lib/utils';

import I18nFormatters, { getI18nLink } from '@/components/I18nFormatters';
import Image from '@/components/Image';
import { Card, CardContent } from '@/components/ui/Card';

import { EditAvatar } from '../Avatar';
import Captcha, { isCaptchaEnabled, resetCaptcha } from '../Captcha';
import { FormField } from '../FormField';
import { FormikZod } from '../FormikZod';
import { PasswordInput } from '../PasswordInput';
import { PasswordStrengthBar } from '../PasswordStrengthBar';
import { Button } from '../ui/Button';
import { InputOTP, InputOTPGroup, InputOTPSlot } from '../ui/InputOTP';
import { useToast } from '../ui/useToast';

import type { SignupStepProps } from './common';
import { SignupSteps } from './common';

const emailVerificationFormSchema = z.union([
  z.object({
    email: z.string().email().min(5).max(128),
    captcha: isCaptchaEnabled()
      ? z.object({ token: z.string().nonempty(), provider: z.string().nonempty() })
      : z.undefined(),
  }),
  z.object({
    email: z.string().email().min(5).max(128),
    otp: z.string().min(6).max(6).toUpperCase(),
  }),
]);

type EmailVerificationFormValuesSchema = z.infer<typeof emailVerificationFormSchema>;

const OTP_RESEND_INTERVAL = 30; // seconds

const ResendOTPCodeButton = (props: React.ComponentProps<typeof Button>) => {
  const [start, setStart] = React.useState<number>(new Date().getTime());
  const [secondsLeft, setSecondsLeft] = React.useState(OTP_RESEND_INTERVAL);

  React.useEffect(() => {
    if (secondsLeft <= 0) {
      return;
    }
    const interval = setInterval(() => {
      const now = new Date().getTime();
      const elapsed = Math.floor((now - (start || now)) / 1000);
      const remaining = Math.max(0, OTP_RESEND_INTERVAL - elapsed);
      setSecondsLeft(remaining);
      if (remaining <= 0) {
        clearInterval(interval);
      }
    }, 1000);
    return () => clearInterval(interval);
  }, [secondsLeft, start]);

  const onClick = React.useCallback(
    (e: React.MouseEvent<HTMLButtonElement>) => {
      setStart(new Date().getTime());
      setSecondsLeft(OTP_RESEND_INTERVAL);
      if (props.onClick) {
        props.onClick(e);
      }
    },
    [props],
  );

  return (
    <Button {...props} onClick={onClick} variant="link" disabled={secondsLeft > 0}>
      <FormattedMessage
        defaultMessage="Didn't receive a code? Resend{secondsLeft, select, 0 {} other { ({secondsLeft}s)}}"
        id="signup.individual.resendOTP"
        values={{ secondsLeft }}
      />
    </Button>
  );
};

export function EmailVerificationSteps({ step, nextStep, nextActionFlow }: SignupStepProps) {
  const router = useRouter();
  const intl = useIntl();
  const { toast } = useToast();
  const { login } = useLoggedInUser();
  const formikRef = React.useRef<FormikProps<EmailVerificationFormValuesSchema>>(undefined);
  const [loading, setLoading] = React.useState(false);

  const onSubmit = React.useCallback(
    async (values: EmailVerificationFormValuesSchema) => {
      setLoading(true);
      if (step === SignupSteps.EMAIL_INPUT) {
        const response = await signup(values as Parameters<typeof signup>[0]);
        if (response.success) {
          nextStep(SignupSteps.VERIFY_OTP, {
            email: values.email,
            session: response.sessionId,
          });
        } else {
          resetCaptcha();
          const message =
            formatErrorMessage(intl, response.error) ||
            response.error?.message ||
            'An error occurred while signing up, please try again.';
          toast({ variant: 'error', message });
        }
      } else if (step === SignupSteps.VERIFY_OTP) {
        const sessionId = router.query?.session as string;
        const response = await verifyEmail({ ...pick(values, ['email', 'otp']), sessionId } as Parameters<
          typeof verifyEmail
        >[0]);
        if (response.success) {
          const token = response.token;
          await login(token);
          nextStep();
        } else {
          toast({ variant: 'error', message: formatErrorMessage(intl, response.error) });
        }
      }
      setLoading(false);
    },
    [step, login, nextStep, toast, intl, router.query.session],
  );

  const resendOTPCode = React.useCallback(async () => {
    if (formikRef.current) {
      const sessionId = router.query?.session as string;
      const email = formikRef.current.values.email;
      const response = await resendOTP({ email, sessionId });
      if (response.success) {
        toast({
          variant: 'success',
          message: intl.formatMessage({
            defaultMessage: 'A new OTP code has been sent to your email.',
            id: 'signup.otp.resendSuccess',
          }),
        });
      } else {
        toast({ variant: 'error', message: formatErrorMessage(intl, response.error) });
        if (response.error.type === 'OTP_REQUEST_NOT_FOUND') {
          nextStep(SignupSteps.EMAIL_INPUT);
        }
      }
    }
  }, [intl, nextStep, toast, router.query.session]);

  return (
    <FormikZod<EmailVerificationFormValuesSchema>
      schema={emailVerificationFormSchema}
      onSubmit={onSubmit}
      initialValues={{ email: router.query?.email as string }}
      innerRef={formikRef}
    >
      {({ values, setFieldValue }) => (
        <Form
          className="mb-6 flex w-full max-w-xl grow flex-col items-center gap-8 px-6 sm:mb-20 sm:px-0"
          data-cy="signup-form"
        >
          {step === SignupSteps.VERIFY_OTP ? (
            <Image width={100} height={116} src="/static/images/signup/pidgeon.png" alt="Pidgeon" />
          ) : (
            <Image width={64} height={101} src="/static/images/signup/face.png" alt="Face" />
          )}
          <div className="flex flex-col gap-2 px-3 text-center">
            {step === SignupSteps.VERIFY_OTP ? (
              <React.Fragment>
                <h1 className="text-xl font-bold sm:text-3xl sm:leading-10">
                  <FormattedMessage defaultMessage="Let's verify your email" id="signup.otp.title" />
                </h1>
                <p className="text-sm break-words text-slate-700 sm:text-base">
                  <FormattedMessage
                    defaultMessage="We need to verify your email address to secure your account and ensure you receive important updates."
                    id="signup.otp.description"
                  />
                </p>
              </React.Fragment>
            ) : (
              <React.Fragment>
                <h1 className="text-xl font-bold sm:text-3xl sm:leading-10">
                  {nextActionFlow ? (
                    <FormattedMessage defaultMessage="Create your personal account" id="OkoBON" />
                  ) : (
                    <FormattedMessage defaultMessage="Create your account" id="signup.individual.title" />
                  )}
                </h1>
                <p className="text-sm break-words text-slate-700 sm:text-base">
                  {nextActionFlow ? (
                    <FormattedMessage
                      defaultMessage="You need a personal account to create {type, select, organization {an organization} other {a collective}}. {newLine}Sign in or create one to continue."
                      id="signup.individual.orgFlow.description"
                      values={{ ...I18nFormatters, type: nextActionFlow }}
                    />
                  ) : (
                    <FormattedMessage
                      defaultMessage="Join Open Collective to start contributing, fundraising, or managing your group on a transparent, community powered platform."
                      id="signup.individual.description"
                      values={I18nFormatters}
                    />
                  )}
                </p>
              </React.Fragment>
            )}
          </div>
          <Card className="w-full max-w-lg">
            <CardContent className="flex flex-col gap-4">
              {step === SignupSteps.EMAIL_INPUT && (
                <React.Fragment>
                  <FormField
                    name="email"
                    label={<FormattedMessage id="Email" defaultMessage="Email" />}
                    placeholder="e.g. doe@johns.com"
                    type="email"
                    autoComplete="email"
                    autoFocus
                  />
                  {isCaptchaEnabled() && (
                    <FormField name="captcha" className="flex items-center">
                      {() => <Captcha onVerify={value => setFieldValue('captcha', value)} />}
                    </FormField>
                  )}
                </React.Fragment>
              )}
              {step === SignupSteps.VERIFY_OTP && (
                <React.Fragment>
                  <p className="text-center">
                    <FormattedMessage
                      defaultMessage="Enter the code sent to <strong>{email}</strong>."
                      id="signup.individual.verifyOtp.description"
                      values={{ email: values.email, ...I18nFormatters }}
                    />
                  </p>
                  <div>
                    <FormField name="otp" required autoComplete="one-time-code" showError={false}>
                      {({ field, form }) => (
                        <InputOTP
                          maxLength={6}
                          containerClassName="justify-center"
                          onChange={async value => {
                            form.setFieldValue(field.name, value.toUpperCase());
                          }}
                          onComplete={form.submitForm}
                          autoFocus
                        >
                          <InputOTPGroup>
                            <InputOTPSlot index={0} />
                            <InputOTPSlot index={1} />
                            <InputOTPSlot index={2} />
                            <InputOTPSlot index={3} />
                            <InputOTPSlot index={4} />
                            <InputOTPSlot index={5} />
                          </InputOTPGroup>
                        </InputOTP>
                      )}
                    </FormField>
                  </div>
                  <div className="flex flex-col gap-2">
                    <ResendOTPCodeButton variant="link" onClick={resendOTPCode} />
                  </div>
                </React.Fragment>
              )}
            </CardContent>
          </Card>
          {step === SignupSteps.VERIFY_OTP && <div className="grow sm:hidden" />}
          <div className={cn('flex w-full max-w-lg flex-col gap-4', step === SignupSteps.EMAIL_INPUT && 'grow')}>
            <Button type="submit" variant="default" loading={loading} className="w-full">
              <FormattedMessage id="actions.continue" defaultMessage="Continue" />
            </Button>
            {step === SignupSteps.VERIFY_OTP && (
              <Button
                variant="outline"
                onClick={async () => {
                  // Clear Query
                  await router.replace(router.pathname, undefined, { shallow: true });
                  nextStep(SignupSteps.EMAIL_INPUT);
                }}
                className="w-full"
                disabled={loading}
              >
                <FormattedMessage defaultMessage="Go Back" id="GoBack" />
              </Button>
            )}
            {step === SignupSteps.EMAIL_INPUT && (
              <React.Fragment>
                <div className="text-center text-sm text-muted-foreground">
                  <FormattedMessage
                    defaultMessage="Already have an account? <SignInLink>Sign in</SignInLink>"
                    id="signup.alreadyHaveAccount"
                    values={{
                      SignInLink: getI18nLink({
                        href: '/signin',
                        className: 'text-primary hover:underline',
                      }),
                    }}
                  />
                </div>
                <div className="-order-2 grow text-center text-sm text-muted-foreground sm:order-none sm:flex sm:items-end sm:justify-center">
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
              </React.Fragment>
            )}
          </div>
        </Form>
      )}
    </FormikZod>
  );
}

const completeProfileFormSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(5),
  legalName: z.string().min(8).max(128).optional(),
  image: z.string().url().optional(),
  password: z.string().min(8).max(128).optional(),
});

type CompleteProfileFormValuesSchema = z.infer<typeof completeProfileFormSchema>;

const profileQuery = gql`
  query CompleteProfileInfo {
    me {
      id
      slug
      email
      name
      description
      hasPassword
    }
  }
`;

const completeProfileMutation = gql`
  mutation CompleteProfile($account: AccountUpdateInput!) {
    editAccount(account: $account) {
      id
      legacyId
      name
      slug
      legalName
      imageUrl
    }
  }
`;

const setPasswordMutation = gql`
  mutation CompleteProfileSetPassword($password: String!) {
    setPassword(password: $password) {
      individual {
        id
        hasPassword
      }
      token
    }
  }
`;

export function CompleteProfileSteps({ nextStep }: SignupStepProps) {
  const intl = useIntl();
  const { toast } = useToast();
  const { refetchLoggedInUser, LoggedInUser, login } = useLoggedInUser();
  const formikRef = React.useRef<FormikProps<CompleteProfileFormValuesSchema>>(undefined);
  const { data, refetch: refetchMe } = useQuery(profileQuery, { skip: !LoggedInUser });
  const [updateAccount] = useMutation(completeProfileMutation);
  const [setPassword] = useMutation(setPasswordMutation);
  const [loading, setLoading] = React.useState(false);
  const [passwordScore, setPasswordScore] = React.useState(0);

  const onSubmit = React.useCallback(
    async (values: CompleteProfileFormValuesSchema) => {
      try {
        setLoading(true);
        await updateAccount({ variables: { account: omit(values, ['password']) } });
        if (values.password) {
          const result = await setPassword({ variables: { password: values.password } });
          if (result.data.setPassword.token) {
            await login(result.data.setPassword.token);
          }
        }
        await refetchLoggedInUser();
        nextStep();
      } catch (e) {
        setLoading(false);
        toast({
          variant: 'error',
          title: <FormattedMessage id="signup.completeProfile.error" defaultMessage="Error completing profile" />,
          message: i18nGraphqlException(intl, e),
        });
      }
    },
    [nextStep, updateAccount, intl, refetchLoggedInUser, toast, setPassword, login],
  );

  React.useEffect(() => {
    if (!data?.me && LoggedInUser) {
      refetchMe();
    }
    if (data?.me && !formikRef.current?.values?.id) {
      formikRef.current?.setFieldValue('id', data.me.id);
      if (!formikRef.current?.values?.name && data.me.name) {
        formikRef.current?.setFieldValue('name', data.me.name);
      }
    }
  }, [data, LoggedInUser, refetchMe]);

  const validate = React.useCallback(
    async (values: CompleteProfileFormValuesSchema) => {
      const errors = {} as Record<string, string>;
      if ('password' in values && values.password && passwordScore < 3) {
        errors.password = 'Password is too weak';
      }
      return errors;
    },
    [passwordScore],
  );

  return (
    <FormikZod<CompleteProfileFormValuesSchema>
      schema={completeProfileFormSchema}
      onSubmit={onSubmit}
      initialValues={{}}
      innerRef={formikRef}
      validate={validate}
    >
      {({ values, setValues, setFieldValue }) => (
        <Form
          className="mb-6 flex w-full max-w-xl grow flex-col items-center gap-8 px-6 sm:mb-20 sm:px-0"
          data-cy="complete-profile-form"
        >
          <Image width={80} height={79} src="/static/images/signup/stars.png" alt="Face" />
          <div className="flex flex-col gap-2 px-3 text-center">
            <React.Fragment>
              <h1 className="text-xl font-bold sm:text-3xl sm:leading-10">
                <FormattedMessage defaultMessage="Let's complete your profile" id="signup.completeProfile.title" />
              </h1>
              <p className="text-sm break-words text-slate-700 sm:text-base">
                <FormattedMessage
                  defaultMessage="A well rounded complete profile increases trust."
                  id="signup.completeProfile.description"
                />
              </p>
            </React.Fragment>
          </div>
          <Card className="w-full max-w-lg">
            <CardContent className="flex flex-col gap-4">
              <div className="self-center">
                <FormField name="image">
                  {({ field, form }) => (
                    <EditAvatar
                      size={120}
                      type="INDIVIDUAL"
                      value={field.value}
                      onSuccess={({ url }) => form.setFieldValue(field.name, url)}
                      onReject={() => form.setFieldValue(field.name, null)}
                      minSize={1024}
                      maxSize={5e3 * 1024}
                    />
                  )}
                </FormField>
              </div>
              {/* This hidden input acts as a username cue for password managers */}
              <input type="email" name="email" value={data?.me?.email} className="hidden" disabled />
              <FormField
                name="name"
                label={<FormattedMessage id="DisplayName" defaultMessage="Display Name" />}
                placeholder="e.g. John Doe"
                type="string"
                autoComplete="name nickname"
                autoFocus
              />
              {!data?.me?.hasPassword && (
                <div>
                  <FormField
                    name="password"
                    label={<FormattedMessage id="Password" defaultMessage="Password" />}
                    autoComplete="new-password"
                    hint={
                      <FormattedMessage
                        id="signup.completeProfile.password.hint"
                        defaultMessage="You can always sign-in using just your e-mail."
                      />
                    }
                  >
                    {({ field }) => (
                      <PasswordInput
                        {...field}
                        onChange={e => {
                          const { value } = e.target;
                          if ('password' in values && value === '') {
                            setValues(omit(values, 'password'));
                          } else {
                            setFieldValue('password', value);
                          }
                        }}
                      />
                    )}
                  </FormField>
                  <div className="mt-2 w-full self-center px-1">
                    <PasswordStrengthBar
                      password={'password' in values && values.password}
                      onChangeScore={score => setPasswordScore(score)}
                    />
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
          <div className="grow sm:hidden" />
          <div className="flex w-full max-w-lg flex-col gap-4">
            <Button className="w-full" type="submit" variant="default" loading={loading}>
              <FormattedMessage id="signup.completeProfile.action" defaultMessage="Create Profile" />
            </Button>
          </div>
        </Form>
      )}
    </FormikZod>
  );
}
