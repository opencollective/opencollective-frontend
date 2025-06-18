import React from 'react';
import type { FormikHelpers } from 'formik';
import { Form } from 'formik';
import { MailCheck } from 'lucide-react';
import { FormattedMessage } from 'react-intl';
import { z } from 'zod';

import { signin } from '@/lib/api';
import useLoggedInUser from '@/lib/hooks/useLoggedInUser';
import { getWebsiteUrl } from '@/lib/utils';

import { FormikZod } from '@/components/FormikZod';
import StyledInputFormikField from '@/components/StyledInputFormikField';
import { Button } from '@/components/ui/Button';
import { toast } from '@/components/ui/useToast';

import { Alert, AlertDescription, AlertTitle } from '../ui/Alert';

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

const SignInMiniform = ({ email }: { email?: string }) => {
  const [step, setStep] = React.useState(SignInSteps.EMAIL);
  const [isLoading, setLoading] = React.useState(false);
  const { login } = useLoggedInUser();
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
            <FormattedMessage
              id="signin.emailSent.description"
              defaultMessage="Please leave this tab open and check your inbox for a sign-in link. If you don't see it, check your spam folder."
            />
          </AlertDescription>
        </Alert>
      ) : (
        <FormikZod<FormValuesSchema> schema={schema} onSubmit={handleSubmit} initialValues={{ email }}>
          {({ values, submitForm }) => (
            <Form className="flex flex-col gap-2" onSubmit={submitForm}>
              <StyledInputFormikField
                name="email"
                label={<FormattedMessage id="Form.yourEmail" defaultMessage="Your email address" />}
                placeholder="e.g. doe@johns.com"
                type="email"
                useLegacyComponent={false}
              />
              {step === SignInSteps.PASSWORD && (
                <StyledInputFormikField
                  name="password"
                  label={<FormattedMessage id="Form.yourPassword" defaultMessage="Your password" />}
                  type="password"
                  useLegacyComponent={false}
                />
              )}
              <div className="mt-2 flex w-full flex-col justify-stretch gap-2">
                <Button type="button" onClick={submitForm} className="grow" loading={isLoading}>
                  <FormattedMessage id="actions.signin" defaultMessage="Sign In" />
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
