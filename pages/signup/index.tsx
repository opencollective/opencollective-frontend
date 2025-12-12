import React from 'react';
import { gql, useQuery } from '@apollo/client';
import { omit, pick } from 'lodash';
import type { NextRouter } from 'next/router';
import { useRouter } from 'next/router';
import { FormattedMessage } from 'react-intl';

import { API_V2_CONTEXT } from '@/lib/graphql/helpers';
import { getDashboardRoute, isRelativeHref } from '@/lib/url-helpers';

import Body from '@/components/Body';
import Header from '@/components/Header';
import Image from '@/components/Image';
import Link from '@/components/Link';
import { SignupSteps } from '@/components/signup/common';
import { CompleteProfileSteps, EmailVerificationSteps } from '@/components/signup/IndividualForm';
import { InviteAdminForm, OrganizationForm } from '@/components/signup/OrganizationForm';
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
};

const getRedirectPathSafe = (router: NextRouter) => {
  if (!router.query?.next) {
    return null;
  }
  const next = decodeURIComponent(Array.isArray(router.query?.next) ? router.query.next[0] : router.query.next);
  return isRelativeHref(next) && next !== '/' ? next : null;
};

// ts-unused-exports:disable-next-line
export default function SignupPage() {
  const router = useRouter();
  const [includeOrganizationFlow, setIncludeOrganizationFlow] = React.useState(
    Boolean(router.query?.step === 'organization' || router.query?.organization === 'true'),
  );
  const steps = React.useMemo(
    () =>
      !includeOrganizationFlow ? DEFAULT_STEPS : [...DEFAULT_STEPS, SignupSteps.CREATE_ORG, SignupSteps.INVITE_ADMINS],
    [includeOrganizationFlow],
  );
  const [createdOrganization, setCreatedOrganization] = React.useState(null);
  const { data, loading } = useQuery(signupPageQuery, { context: API_V2_CONTEXT, fetchPolicy: 'network-only' });
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
            (createdOrganization ? getDashboardRoute(createdOrganization, '/overview') : '/dashboard');
          router.push(pathname);
          return prev;
        } else {
          const step = requestedStep || nextStep;
          const newQuery = omit({ ...pick(router.query, ['next', 'session', 'active', 'host']), ...query }, ['step']);
          if (includeOrganizationFlow) {
            newQuery.organization = 'true';
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
    [steps, router, includeOrganizationFlow, createdOrganization],
  );

  const me = data?.me;
  React.useLayoutEffect(() => {
    if (router.query.step === 'organization' || router.query.organization === 'true') {
      setIncludeOrganizationFlow(true);
    }
    if (me && step === steps[0]) {
      if (me.requiresProfileCompletion) {
        nextStep(SignupSteps.COMPLETE_PROFILE, omit(router.query, ['email']));
      } else if (includeOrganizationFlow) {
        nextStep(SignupSteps.CREATE_ORG);
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
  }, [me, router, step, steps, includeOrganizationFlow, loading, nextStep]);

  const progress = React.useMemo(() => (steps.indexOf(step) + 1) / steps.length, [step, steps]);

  return (
    <React.Fragment>
      <Header
        title="Sign Up"
        description="Create your profile on Open Collective and show the world the open collectives that you are contributing to."
        withTopBar={false}
      />
      <Body className="flex h-screen flex-col bg-white/50 bg-[url(/static/images/signup/background.png)] bg-size-[auto,100%] bg-top bg-no-repeat bg-blend-lighten 2xl:bg-size-[110%,auto]">
        {includeOrganizationFlow && steps.indexOf(step) >= steps.indexOf(SignupSteps.COMPLETE_PROFILE) && (
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
          {loading ? null : me && step === DEFAULT_STEPS[0] && !includeOrganizationFlow ? (
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
                <EmailVerificationSteps
                  step={step}
                  nextStep={nextStep}
                  includeOrganizationFlow={includeOrganizationFlow}
                />
              )}
              {step === SignupSteps.COMPLETE_PROFILE && <CompleteProfileSteps step={step} nextStep={nextStep} />}
              {step === SignupSteps.CREATE_ORG && (
                <OrganizationForm step={step} nextStep={nextStep} setCreatedOrganization={setCreatedOrganization} />
              )}
              {step === SignupSteps.INVITE_ADMINS && (
                <InviteAdminForm step={step} nextStep={nextStep} createdOrganization={createdOrganization} />
              )}
            </React.Fragment>
          )}
        </div>
      </Body>
    </React.Fragment>
  );
}
