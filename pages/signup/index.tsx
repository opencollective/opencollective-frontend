import React from 'react';
import { gql, useQuery } from '@apollo/client';
import { findKey, omit, pick } from 'lodash';
import type { NextRouter } from 'next/router';
import { useRouter } from 'next/router';
import { FormattedMessage } from 'react-intl';

import { getDashboardRoute, isRelativeHref } from '@/lib/url-helpers';

import Body from '@/components/Body';
import Header from '@/components/Header';
import Image from '@/components/Image';
import Link from '@/components/Link';
import { CollectiveForm } from '@/components/signup/CollectiveForm';
import { InviteAdminForm, SignupSteps } from '@/components/signup/common';
import { CompleteProfileSteps, EmailVerificationSteps } from '@/components/signup/IndividualForm';
import { OrganizationForm } from '@/components/signup/OrganizationForm';
import { Card, CardContent } from '@/components/ui/Card';

const DEFAULT_STEPS = [SignupSteps.EMAIL_INPUT, SignupSteps.VERIFY_OTP, SignupSteps.COMPLETE_PROFILE];

const signupPageQuery = gql`
  query SignupPage {
    me {
      id
      email
      requiresProfileCompletion
    }
  }
`;

const STEP_URLS = {
  [SignupSteps.EMAIL_INPUT]: '/signup',
  [SignupSteps.VERIFY_OTP]: '/signup/verify',
  [SignupSteps.COMPLETE_PROFILE]: '/signup/profile',
  [SignupSteps.CREATE_ORG]: '/signup/organization',
  [SignupSteps.CREATE_COLLECTIVE]: '/signup/collective',
};

const getRedirectPathSafe = (router: NextRouter) => {
  if (!router.query?.next) {
    return null;
  }
  const next = decodeURIComponent(Array.isArray(router.query?.next) ? router.query.next[0] : router.query.next);
  return isRelativeHref(next) && next !== '/' ? next : null;
};

enum NEXT_ACTION_FLOWS {
  ORGANIZATION = 'organization',
  COLLECTIVE = 'collective',
}

// ts-unused-exports:disable-next-line
export default function SignupPage() {
  const router = useRouter();
  const [nextActionFlow, setNextActionFlow] = React.useState<NEXT_ACTION_FLOWS>(
    findKey(NEXT_ACTION_FLOWS, f => f === router.query?.step) || router.query?.organization === 'true'
      ? NEXT_ACTION_FLOWS.ORGANIZATION
      : router.query?.collective === 'true'
        ? NEXT_ACTION_FLOWS.COLLECTIVE
        : null,
  );
  const steps = React.useMemo(
    () =>
      nextActionFlow === NEXT_ACTION_FLOWS.ORGANIZATION
        ? [...DEFAULT_STEPS, SignupSteps.CREATE_ORG, SignupSteps.INVITE_ADMINS]
        : nextActionFlow === NEXT_ACTION_FLOWS.COLLECTIVE
          ? [...DEFAULT_STEPS, SignupSteps.CREATE_COLLECTIVE, SignupSteps.INVITE_ADMINS]
          : DEFAULT_STEPS,
    [nextActionFlow],
  );
  const { data, loading } = useQuery(signupPageQuery, { fetchPolicy: 'network-only' });
  const [createdAccount, setCreatedAccount] = React.useState(null);
  const [step, setStep] = React.useState<SignupSteps>(
    STEP_URLS[router.query?.step as SignupSteps] ? (router.query?.step as SignupSteps) : steps[0],
  );
  const nextStep = React.useCallback(
    (requestedStep?: SignupSteps, query?: Record<string, string | string[]>) => {
      setStep(prev => {
        const nextStep = steps[steps.indexOf(prev) + 1];
        if (!requestedStep && !nextStep) {
          const pathname =
            getRedirectPathSafe(router) ||
            (createdAccount ? getDashboardRoute(createdAccount, '/overview') : '/dashboard');
          router.push(pathname);
          return prev;
        } else {
          const step = requestedStep || nextStep;
          const newQuery = omit({ ...pick(router.query, ['next', 'session', 'active', 'host']), ...query }, ['step']);
          if (
            nextActionFlow &&
            [SignupSteps.EMAIL_INPUT, SignupSteps.COMPLETE_PROFILE, SignupSteps.VERIFY_OTP].includes(step)
          ) {
            if (nextActionFlow === NEXT_ACTION_FLOWS.ORGANIZATION) {
              newQuery.organization = 'true';
            } else if (nextActionFlow === NEXT_ACTION_FLOWS.COLLECTIVE) {
              newQuery.collective = 'true';
            }
          }

          if (STEP_URLS[step]) {
            router.replace({ pathname: STEP_URLS[step], query: newQuery }, undefined, { shallow: true });
          } else {
            router.replace({ pathname: router.pathname, query: newQuery }, undefined, { shallow: true });
          }
          return step;
        }
      });
    },
    [steps, router, nextActionFlow, createdAccount],
  );

  const me = data?.me;
  React.useLayoutEffect(() => {
    if (router.query.step === 'organization' || router.query.organization === 'true') {
      setNextActionFlow(NEXT_ACTION_FLOWS.ORGANIZATION);
    } else if (router.query.step === 'collective' || router.query.collective === 'true') {
      setNextActionFlow(NEXT_ACTION_FLOWS.COLLECTIVE);
    }

    if (me && step === steps[0]) {
      if (me.requiresProfileCompletion) {
        nextStep(SignupSteps.COMPLETE_PROFILE, omit(router.query, ['email']));
      } else if (nextActionFlow === NEXT_ACTION_FLOWS.ORGANIZATION) {
        nextStep(SignupSteps.CREATE_ORG);
      } else if (nextActionFlow === NEXT_ACTION_FLOWS.COLLECTIVE) {
        nextStep(SignupSteps.CREATE_COLLECTIVE);
      } else {
        // If the user is already logged in and not creating an org, redirect to home page
        router.push(getRedirectPathSafe(router) || '/dashboard');
      }
    } else if (
      !me &&
      !loading &&
      step === SignupSteps.EMAIL_INPUT &&
      router.query?.email &&
      router.query?.step === 'verify'
    ) {
      nextStep(SignupSteps.VERIFY_OTP);
    }
  }, [me, router, step, steps, nextActionFlow, loading, nextStep]);

  const progress = React.useMemo(() => (steps.indexOf(step) + 1) / steps.length, [step, steps]);

  return (
    <React.Fragment>
      <Header
        title="Sign Up"
        description="Create your profile on Open Collective and show the world the open collectives that you are contributing to."
        withTopBar={false}
      />
      <Body className="flex h-screen flex-col bg-white/50 bg-[url(/static/images/signup/background.png)] bg-size-[auto,100%] bg-top bg-no-repeat bg-blend-lighten 2xl:bg-size-[110%,auto]">
        {nextActionFlow && steps.indexOf(step) >= steps.indexOf(SignupSteps.COMPLETE_PROFILE) && (
          <div
            className="fixed top-0 left-0 h-[5px] max-w-full rounded-r-sm bg-primary transition-all duration-700"
            style={{ width: `${progress * 95}%` }}
          />
        )}
        <div className="mx-auto flex w-full max-w-7xl items-center px-4 py-4">
          <Link href="/" className="flex items-center gap-2">
            <Image width={35} height={35} src="/static/images/oc-logo-watercolor-256.png" alt="Open Collective" />{' '}
            <Image height={21} width={141} src="/static/images/logotype.svg" alt="Open Collective" />
          </Link>
        </div>
        <div className="mt-14 flex grow flex-col items-center">
          {loading ? null : me && step === DEFAULT_STEPS[0] && !nextActionFlow ? (
            <Card className="w-full max-w-lg">
              <CardContent className="flex flex-col gap-6">
                <h2 className="text-center text-lg font-semibold">
                  <FormattedMessage id="signup.alreadyLoggedIn" defaultMessage="You are already logged in." />
                </h2>
              </CardContent>
            </Card>
          ) : (
            <React.Fragment>
              {[SignupSteps.EMAIL_INPUT, SignupSteps.VERIFY_OTP].includes(step) && (
                <EmailVerificationSteps step={step} nextStep={nextStep} nextActionFlow={nextActionFlow} />
              )}
              {step === SignupSteps.COMPLETE_PROFILE && <CompleteProfileSteps step={step} nextStep={nextStep} />}
              {step === SignupSteps.CREATE_ORG && (
                <OrganizationForm step={step} nextStep={nextStep} setCreatedAccount={setCreatedAccount} />
              )}
              {step === SignupSteps.CREATE_COLLECTIVE && (
                <CollectiveForm step={step} nextStep={nextStep} setCreatedAccount={setCreatedAccount} />
              )}
              {step === SignupSteps.INVITE_ADMINS && (
                <InviteAdminForm step={step} nextStep={nextStep} createdAccount={createdAccount} />
              )}
            </React.Fragment>
          )}
        </div>
      </Body>
    </React.Fragment>
  );
}
