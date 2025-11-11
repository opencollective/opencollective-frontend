import React from 'react';
import { gql, useQuery } from '@apollo/client';
import { useRouter } from 'next/navigation';
import { FormattedMessage } from 'react-intl';

import { API_V2_CONTEXT } from '@/lib/graphql/helpers';

import Body from '@/components/Body';
import Header from '@/components/Header';
import Image from '@/components/Image';
import Link from '@/components/Link';
import { SignupFormContext, SignupSteps } from '@/components/signup/common';
import { CompleteProfileSteps, EmailVerificationSteps } from '@/components/signup/IndividualForm';
import { Card, CardContent } from '@/components/ui/Card';

const DEFAULT_STEPS = [
  SignupSteps.EMAIL_INPUT,
  SignupSteps.SET_PASSWORD,
  SignupSteps.VERIFY_OTP,
  SignupSteps.COMPLETE_PROFILE,
];

const singupPageQuery = gql`
  query SignupPage {
    me {
      id
      email
      requiresProfileCompletion
    }
  }
`;

// ts-unused-exports:disable-next-line
export default function SignupPage() {
  const { data } = useQuery(singupPageQuery, { context: API_V2_CONTEXT, fetchPolicy: 'network-only' });
  const me = data?.me;
  const router = useRouter();
  const [step, setStep] = React.useState<SignupSteps>(SignupSteps.EMAIL_INPUT);
  const nextStep = React.useCallback((step?: SignupSteps, completeAction?: () => void) => {
    if (!step && completeAction) {
      completeAction();
    } else {
      setStep(prev => {
        const nextStep = step || DEFAULT_STEPS[DEFAULT_STEPS.indexOf(prev) + 1];
        return nextStep;
      });
    }
  }, []);
  const progress = (DEFAULT_STEPS.indexOf(step) + 1) / DEFAULT_STEPS.length;

  React.useEffect(() => {
    if (me && step === DEFAULT_STEPS[0]) {
      if (me.requiresProfileCompletion) {
        setStep(SignupSteps.COMPLETE_PROFILE);
      } else {
        // If the user is already logged in, redirect to home page
        router.push('/dashboard');
      }
    }
  }, [me, router, step]);

  return (
    <React.Fragment>
      <Header
        title="Sign Up"
        description="Create your profile on Open Collective and show the world the open collectives that you are contributing to."
        withTopBar={false}
      />
      <Body className="flex h-screen flex-col bg-white/50 bg-[url(/static/images/signup/background.png)] bg-size-[auto,100%] bg-top bg-no-repeat bg-blend-lighten 2xl:bg-size-[110%,auto]">
        <div
          className="h-[5px] max-w-full rounded-r-sm bg-primary transition-all"
          style={{ width: `${progress * 95}%` }}
        ></div>
        <Link href="/" className="mx-auto flex w-full max-w-7xl items-center gap-2 px-4 py-4">
          <Image width={35} height={35} src="/static/images/oc-logo-watercolor-256.png" alt="Open Collective" />{' '}
          <Image height={21} width={141} src="/static/images/logotype.svg" alt="Open Collective" />
        </Link>
        <div className="mt-14 flex grow flex-col items-center">
          {me && step === DEFAULT_STEPS[0] ? (
            <Card className="w-full max-w-lg">
              <CardContent className="flex flex-col gap-6">
                <h2 className="text-center text-lg font-semibold">
                  <FormattedMessage id="signup.alreadyLoggedIn" defaultMessage="You are already logged in." />
                </h2>
              </CardContent>
            </Card>
          ) : (
            <SignupFormContext.Provider value={{ step, nextStep }}>
              {[SignupSteps.EMAIL_INPUT, SignupSteps.SET_PASSWORD, SignupSteps.VERIFY_OTP].includes(step) && (
                <EmailVerificationSteps />
              )}
              {step === SignupSteps.COMPLETE_PROFILE && <CompleteProfileSteps />}
            </SignupFormContext.Provider>
          )}
        </div>
      </Body>
    </React.Fragment>
  );
}
