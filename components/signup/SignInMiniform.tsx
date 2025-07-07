import React, { useEffect, useState } from 'react';
import type { FormikHelpers } from 'formik';
import { Form } from 'formik';
import { MailCheck } from 'lucide-react';
import { FormattedMessage } from 'react-intl';
import { z } from 'zod';

import { signin } from '@/lib/api';
import useLoggedInUser from '@/lib/hooks/useLoggedInUser';
import { getWebsiteUrl } from '@/lib/utils';

import { FormikZod } from '@/components/FormikZod';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/Alert';
import { Button } from '@/components/ui/Button';
import { toast } from '@/components/ui/useToast';

import { FormField } from '../FormField';

const schema = z.union([
  z.object({
    email: z.string().email(),
    password: z.string().min(8),
  }),
  z.object({
    email: z.string().email(),
  }),
]);

type FormValuesSchema = z.infer<typeof schema>;

enum SignInSteps {
  EMAIL = 'EMAIL',
  PASSWORD = 'PASSWORD',
  TWO_FACTOR = 'TWO_FACTOR',
  SUCCESS = 'SUCCESS',
  EMAIL_SENT = 'EMAIL_SENT',
  ERROR = 'ERROR',
}

export type SignInMiniformProps = {
  email?: string;
  redirect?: string;
  setWaitingForEmail?: (waiting: boolean) => void;
};

const SignInMiniform = ({ email, redirect, setWaitingForEmail: setIsWaitingForConfirmation }: SignInMiniformProps) => {
  const [step, setStep] = useState(SignInSteps.EMAIL);
  const [isLoading, setLoading] = useState(false);
  const { LoggedInUser, refetchLoggedInUser, login } = useLoggedInUser();

  // On Email Sent step, we keep checking if the user has logged in on another tab
  useEffect(() => {
    let interval: NodeJS.Timeout | undefined;
    if (step === SignInSteps.EMAIL_SENT) {
      interval = setInterval(() => {
        if (!LoggedInUser && localStorage.getItem('accessToken')) {
          refetchLoggedInUser();
        }
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [step, LoggedInUser, refetchLoggedInUser]);

  useEffect(() => {
    setIsWaitingForConfirmation?.(step === SignInSteps.EMAIL_SENT);
  }, [step, setIsWaitingForConfirmation]);

  const handleSubmit = async (
    values: FormValuesSchema,
    meta: FormikHelpers<FormValuesSchema>,
    opts: { sendLink?: boolean; resetPassword?: boolean } = { sendLink: false, resetPassword: false },
  ) => {
    try {
      setLoading(true);
      const response = await signin({
        user: values,
        websiteUrl: getWebsiteUrl(),
        sendLink: opts.sendLink,
        resetPassword: opts.resetPassword,
        createProfile: false,
        redirect: redirect || window.location.pathname + window.location.search,
      });
      if (response.token) {
        const user = await login(response.token);
        if (!user) {
          toast({
            variant: 'error',
            message: 'Token rejected. Please try again.',
          });
        }
      } else {
        setStep(SignInSteps.EMAIL_SENT);
      }
    } catch (e) {
      if (e.json?.errorCode === 'EMAIL_DOES_NOT_EXIST') {
        meta?.setFieldError('email', 'Email does not exist');
      } else if (e.json?.errorCode === 'PASSWORD_REQUIRED') {
        setStep(SignInSteps.PASSWORD);
      } else if (e.json?.errorCode === 'PASSWORD_INVALID') {
        meta?.setFieldError('password', 'Password is invalid');
      } else if (e.message?.includes('Two-factor authentication is enabled')) {
        setStep(SignInSteps.TWO_FACTOR);
      } else {
        meta?.setFieldValue('password', '');
        toast({
          variant: 'error',
          message: e.message || 'Server error',
        });
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      {step === SignInSteps.EMAIL_SENT ? (
        <Alert variant="info" className="flex flex-col items-center px-10 py-8">
          <div className="mb-6 text-ring">
            <MailCheck size={32} />
          </div>
          <AlertTitle className="mb-4">
            <FormattedMessage id="signin.emailSent" defaultMessage="Complete the sign-in in your Email!" />
          </AlertTitle>
          <AlertDescription className="text-center text-xs">
            <p>
              <FormattedMessage
                id="signin.emailSent.description"
                defaultMessage="Check your inbox for a sign-in link, if you don't see it, check your spam folder. You can either continue from the email or leave this page open and wait for the sign-in to complete."
              />
            </p>
            <p>
              <Button variant="link" onClick={() => setStep(SignInSteps.EMAIL)} className="text-xs underline">
                <FormattedMessage
                  defaultMessage="I would like to sign in with a different email address."
                  id="signin.emailSent.differentEmail"
                />
              </Button>
            </p>
          </AlertDescription>
        </Alert>
      ) : (
        <FormikZod<FormValuesSchema> schema={schema} onSubmit={handleSubmit} initialValues={{ email }}>
          {({ values, submitForm }) => (
            <Form className="flex flex-col gap-2" onSubmit={submitForm}>
              <FormField
                name="email"
                label={<FormattedMessage id="Form.yourEmail" defaultMessage="Your email address" />}
                placeholder="e.g. doe@johns.com"
                type="email"
              />
              {step === SignInSteps.PASSWORD && (
                <FormField
                  name="password"
                  label={<FormattedMessage id="Form.yourPassword" defaultMessage="Your password" />}
                  type="password"
                />
              )}
              <div className="mt-2 flex w-full flex-col justify-stretch gap-2">
                <Button type="button" onClick={submitForm} className="grow" loading={isLoading}>
                  <FormattedMessage id="signIn" defaultMessage="Sign In" />
                </Button>
                {step === SignInSteps.PASSWORD && (
                  <Button
                    type="button"
                    variant="outline"
                    className="grow"
                    onClick={() => handleSubmit(values, null, { sendLink: true })}
                    loading={isLoading}
                  >
                    <FormattedMessage defaultMessage="Send me an email" id="bDtPKE" />
                  </Button>
                )}
              </div>
            </Form>
          )}
        </FormikZod>
      )}
    </div>
  );
};

export default SignInMiniform;
