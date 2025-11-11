import React from 'react';
import { gql, useMutation, useQuery } from '@apollo/client';
import type { FormikProps } from 'formik';
import { Form } from 'formik';
import { isEmpty, pick } from 'lodash';
import { Mail } from 'lucide-react';
import { useRouter } from 'next/router';
import { FormattedMessage, useIntl } from 'react-intl';
import { z } from 'zod';

import { resendOTP, signup, verifyEmail } from '@/lib/api';
import { formatErrorMessage, i18nGraphqlException } from '@/lib/errors';
import { API_V2_CONTEXT } from '@/lib/graphql/helpers';
import useLoggedInUser from '@/lib/hooks/useLoggedInUser';

import I18nFormatters from '@/components/I18nFormatters';
import Image from '@/components/Image';
import { Card, CardContent } from '@/components/ui/Card';

import { EditAvatar } from '../Avatar';
import Captcha, { isCaptchaEnabled } from '../Captcha';
import { FormField } from '../FormField';
import { FormikZod } from '../FormikZod';
import type { LinkProps } from '../Link';
import Link from '../Link';
import { PasswordInput } from '../PasswordInput';
import { PasswordStrengthBar } from '../PasswordStrengthBar';
import { Button } from '../ui/Button';
import { InputOTP, InputOTPGroup, InputOTPSlot } from '../ui/InputOTP';
import { Separator } from '../ui/Separator';
import { useToast } from '../ui/useToast';

import { SignupFormContext, SignupSteps } from './common';

const makeLink = (props: Omit<LinkProps, 'children'>) => (children: React.ReactNode) => (
  <Link {...props}>{children}</Link>
);

const emailVerificationFormSchema = z.object({
  email: z.string().email().min(5).max(64),
  password: z.string().min(8).max(128).optional(),
  otp: z.string().min(6).max(6).optional(),
  captcha: z.object({ token: z.string().nonempty(), provider: z.string().nonempty() }).optional(),
});

type emailVerificationFormValuesSchema = z.infer<typeof emailVerificationFormSchema>;

const ResendOTPCodeButton = (props: React.ComponentProps<typeof Button>) => {
  const start = React.useRef<number | null>(new Date().getTime());
  const [secondsLeft, setSecondsLeft] = React.useState(60);

  React.useEffect(() => {
    if (secondsLeft <= 0) {
      return;
    }
    const interval = setInterval(() => {
      const now = new Date().getTime();
      const elapsed = Math.floor((now - (start.current || now)) / 1000);
      const remaining = Math.max(0, 60 - elapsed);
      setSecondsLeft(remaining);
      if (remaining <= 0) {
        clearInterval(interval);
      }
    }, 1000);
    return () => clearInterval(interval);
  }, [secondsLeft]);

  return (
    <Button {...props} variant="link" disabled={secondsLeft > 0}>
      {secondsLeft > 0 ? ` (${secondsLeft}s) ` : ''}
      <FormattedMessage defaultMessage="Resend one-time-password" id="signup.individual.resendOTP" />
    </Button>
  );
};

export function EmailVerificationSteps() {
  const { login } = useLoggedInUser();
  const intl = useIntl();
  const signupContext = React.useContext(SignupFormContext);
  const formikRef = React.useRef<FormikProps<emailVerificationFormValuesSchema>>(undefined);
  const [passwordScore, setPasswordScore] = React.useState(0);

  const { toast } = useToast();

  const handleContinue = React.useCallback(
    async (step?: SignupSteps) => {
      if (formikRef.current) {
        const errors = await formikRef.current.validateForm();
        if (isEmpty(errors)) {
          signupContext.nextStep(step);
        }
      }
    },
    [signupContext],
  );

  const onSubmit = React.useCallback(
    async (values: emailVerificationFormValuesSchema) => {
      if (signupContext.step === SignupSteps.EMAIL_INPUT) {
        handleContinue(SignupSteps.SET_PASSWORD);
      } else if (signupContext.step === SignupSteps.SET_PASSWORD) {
        const response = await signup(values);
        if (response.success) {
          handleContinue(SignupSteps.VERIFY_OTP);
        } else {
          toast({ variant: 'error', message: formatErrorMessage(intl, response.error) });
        }
      } else if (signupContext.step === SignupSteps.VERIFY_OTP) {
        const response = await verifyEmail(pick(values, ['email', 'otp']));
        if (response.success) {
          const token = response.token;
          await login(token);
          handleContinue();
        } else {
          toast({ variant: 'error', message: formatErrorMessage(intl, response.error) });
        }
      }
    },
    [signupContext.step, handleContinue, login, toast, intl],
  );

  const validate = React.useCallback(
    async (values: emailVerificationFormValuesSchema) => {
      const errors = {} as Record<string, string>;
      if (values.password && passwordScore < 3) {
        errors.password = 'Password is too weak';
      }
      return errors;
    },
    [passwordScore],
  );

  const resendOTPCode = React.useCallback(async () => {
    if (formikRef.current) {
      const email = formikRef.current.values.email;
      const response = await resendOTP({ email });
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
          signupContext.nextStep(SignupSteps.EMAIL_INPUT);
        }
      }
    }
  }, [intl, signupContext, toast]);

  return (
    <FormikZod<emailVerificationFormValuesSchema>
      schema={emailVerificationFormSchema}
      onSubmit={onSubmit}
      validate={validate}
      initialValues={{}}
      innerRef={formikRef}
    >
      {({ values, setFieldValue }) => (
        <Form className="flex grow flex-col gap-8" data-cy="create-organization-form">
          <div className="flex w-full max-w-xl grow flex-col items-center gap-6">
            {signupContext.step === SignupSteps.VERIFY_OTP ? (
              <Image width={160} height={160} src="/static/images/signup/pidgeon.png" alt="Pidgeon" />
            ) : (
              <Image width={64} height={40} src="/static/images/signup/face.png" alt="Face" />
            )}
            <div className="flex flex-col gap-2 px-3 text-center">
              {signupContext.step === SignupSteps.VERIFY_OTP ? (
                <React.Fragment>
                  <h1 className="text-xl font-bold sm:text-3xl sm:leading-10">
                    <FormattedMessage defaultMessage="Let's verify your email" id="singup.otp.title" />
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
                    <FormattedMessage defaultMessage="Register your personal account" id="singup.individual.title" />
                  </h1>
                  <p className="text-sm break-words text-slate-700 sm:text-base">
                    <FormattedMessage
                      defaultMessage="You need to register your personal account to create an organisation.{newLine}Sign in or create a personal account to continue"
                      id="signup.individual.description"
                      values={I18nFormatters}
                    />
                  </p>
                </React.Fragment>
              )}
            </div>
            <Card className="w-full max-w-lg">
              <CardContent className="flex flex-col gap-6">
                {[SignupSteps.EMAIL_INPUT, SignupSteps.SET_PASSWORD].includes(signupContext.step) && (
                  <FormField
                    name="email"
                    label={<FormattedMessage id="Email" defaultMessage="Email" />}
                    placeholder="e.g. doe@johns.com"
                    type="email"
                    autoComplete="email"
                  />
                )}
                {signupContext.step === SignupSteps.EMAIL_INPUT && (
                  <React.Fragment>
                    <Button className="w-full" type="submit" variant="default">
                      <FormattedMessage id="actions.continue" defaultMessage="Continue" />
                    </Button>
                    <div className="mt-4 text-center text-sm">
                      <FormattedMessage
                        defaultMessage="Already have an account? <SignInLink>Sign in</SignInLink>"
                        id="signup.alreadyHaveAccount"
                        values={{
                          SignInLink: makeLink({
                            href: '/signin',
                            className: 'text-primary hover:underline',
                          }),
                        }}
                      />
                    </div>
                  </React.Fragment>
                )}
                {signupContext.step === SignupSteps.SET_PASSWORD && (
                  <React.Fragment>
                    <div>
                      <FormField
                        name="password"
                        label={<FormattedMessage id="Password" defaultMessage="Password" />}
                        autoComplete="new-password"
                      >
                        {({ field }) => <PasswordInput {...field} />}
                      </FormField>
                      <div className="mt-2 w-full self-center px-1">
                        <PasswordStrengthBar
                          password={values.password}
                          onChangeScore={score => setPasswordScore(score)}
                        />
                      </div>
                    </div>
                    {isCaptchaEnabled() && (
                      <div className="flex justify-center">
                        <Captcha onVerify={value => setFieldValue('captcha', value)} />
                      </div>
                    )}
                    <Button className="w-full" type="submit" variant="default">
                      <FormattedMessage id="actions.continue" defaultMessage="Continue" />
                    </Button>
                    <div className="flex items-center justify-stretch gap-4 overflow-hidden text-sm text-muted-foreground">
                      <Separator className="w-fit grow" />
                      <FormattedMessage defaultMessage="Or" id="signup.individual.or" />
                      <Separator className="w-fit grow" />
                    </div>
                    <Button className="w-full" type="submit" variant="outline">
                      <Mail size="16px" />
                      <FormattedMessage
                        id="signup.individual.continueWithEmail"
                        defaultMessage="Continue with email code"
                      />
                    </Button>
                  </React.Fragment>
                )}
                {signupContext.step === SignupSteps.VERIFY_OTP && (
                  <React.Fragment>
                    <p className="text-center">
                      <FormattedMessage
                        defaultMessage="We have sent a one-time code to <strong>{email}</strong>.{newLine}Please enter it below to verify your account."
                        id="signup.individual.verifyOtp.description"
                        values={{ ...I18nFormatters, email: values.email }}
                      />
                    </p>
                    <div>
                      <FormField name="otp" required autoComplete="one-time-code" showError={false}>
                        {({ field, form }) => (
                          <InputOTP
                            maxLength={6}
                            containerClassName="justify-center"
                            onChange={value => form.setFieldValue(field.name, value)}
                          >
                            <InputOTPGroup>
                              <InputOTPSlot index={0} autoFocus />
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
                      <Button className="w-full" type="submit" variant="default">
                        <FormattedMessage id="actions.continue" defaultMessage="Continue" />
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => {
                          signupContext.nextStep(SignupSteps.EMAIL_INPUT);
                        }}
                      >
                        <FormattedMessage defaultMessage="Change email address" id="signup.individual.changeEmail" />
                      </Button>
                    </div>
                  </React.Fragment>
                )}
              </CardContent>
            </Card>

            <div className="grow" />
            <div className="mb-[10%] max-w-md text-center text-sm text-muted-foreground">
              <FormattedMessage
                defaultMessage="By creating an account, you agree to our{newLine}<TOSLink>Terms of Service</TOSLink> and <PrivacyPolicyLink>Privacy Policy</PrivacyPolicyLink>."
                id="signup.individual.tosAgreement"
                values={{
                  ...I18nFormatters,
                  TOSLink: makeLink({
                    href: '/tos',
                    openInNewTab: true,
                    className: 'underline',
                  }),
                  PrivacyPolicyLink: makeLink({
                    href: '/privacypolicy',
                    openInNewTab: true,
                    className: 'underline',
                  }),
                }}
              />
            </div>
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
});

type CompleteProfileFormValuesSchema = z.infer<typeof completeProfileFormSchema>;

const profileQuery = gql`
  query CompleteProfileInfo {
    me {
      id
      slug
      name
      description
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

export function CompleteProfileSteps() {
  const intl = useIntl();
  const router = useRouter();
  const signupContext = React.useContext(SignupFormContext);
  const { refetchLoggedInUser } = useLoggedInUser();
  const formikRef = React.useRef<FormikProps<CompleteProfileFormValuesSchema>>(undefined);
  const { data } = useQuery(profileQuery, { context: API_V2_CONTEXT });
  const [updateAccount, { loading: submitting }] = useMutation(completeProfileMutation, {
    context: API_V2_CONTEXT,
  });
  const { toast } = useToast();

  const onSubmit = React.useCallback(
    async (values: CompleteProfileFormValuesSchema) => {
      try {
        await updateAccount({ variables: { account: values } });
        await refetchLoggedInUser();
        signupContext.nextStep(undefined, () => {
          router.push('/welcome');
        });
      } catch (e) {
        toast({ variant: 'error', title: 'Error', message: e.message });
        toast({
          variant: 'error',
          title: <FormattedMessage id="signup.completeProfile.error" defaultMessage="Error completing profile" />,
          message: i18nGraphqlException(intl, e),
        });
      }
    },
    [signupContext, updateAccount, intl, router, refetchLoggedInUser, toast],
  );

  React.useEffect(() => {
    if (data?.me) {
      formikRef.current?.setFieldValue('id', data.me.id);
    }
  }, [data]);

  return (
    <FormikZod<CompleteProfileFormValuesSchema>
      schema={completeProfileFormSchema}
      onSubmit={onSubmit}
      initialValues={{}}
      innerRef={formikRef}
    >
      {() => (
        <Form className="flex grow flex-col gap-8" data-cy="create-organization-form">
          <div className="flex w-full max-w-xl grow flex-col items-center gap-6">
            <Image width={80} height={79} src="/static/images/signup/stars.png" alt="Face" />
            <div className="flex flex-col gap-2 px-3 text-center">
              <React.Fragment>
                <h1 className="text-xl font-bold sm:text-3xl sm:leading-10">
                  <FormattedMessage defaultMessage="Let's complete your profile" id="singup.completeProfile.title" />
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
              <CardContent className="flex flex-col gap-6">
                <div className="self-center">
                  <FormField name="image">
                    {({ field, form }) => (
                      <EditAvatar
                        size={120}
                        type="USER"
                        name={field.name}
                        value={field.value}
                        onSuccess={({ url }) => form.setFieldValue(field.name, url)}
                        onReject={() => form.setFieldValue(field.name, null)}
                        minSize={1024}
                        maxSize={2e3 * 1024}
                      />
                    )}
                  </FormField>
                </div>
                <FormField
                  name="name"
                  label={<FormattedMessage id="DisplayName" defaultMessage="Display Name" />}
                  placeholder="e.g. John Doe"
                  type="string"
                  autoComplete="name nickname"
                />
                <FormField
                  name="legalName"
                  label={<FormattedMessage id="LegalName" defaultMessage="Legal Name" />}
                  placeholder="e.g. Johnathan Doe"
                  type="string"
                  autoComplete="name"
                  hint={
                    <span className="text-xs">
                      <FormattedMessage
                        defaultMessage="Your full legal name is required if different from name."
                        id="Hs/7w7"
                      />
                    </span>
                  }
                />
                <Button className="w-full" type="submit" variant="default" loading={submitting}>
                  <FormattedMessage id="signup.completeProfile.action" defaultMessage="Create Profile" />
                </Button>
              </CardContent>
            </Card>
          </div>
        </Form>
      )}
    </FormikZod>
  );
}
