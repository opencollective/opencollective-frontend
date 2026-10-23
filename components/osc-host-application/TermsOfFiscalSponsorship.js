import React, { useState } from 'react';
import { XCircle } from 'lucide-react';
import { useRouter } from 'next/router';
import { defineMessages, FormattedMessage, useIntl } from 'react-intl';

import { addAuthTokenToHeader } from '../../lib/api';
import useLoggedInUser from '../../lib/hooks/useLoggedInUser';

import NextIllustration from '../collectives/HomeNextIllustration';
import Link from '../Link';
import { Alert, AlertDescription } from '../ui/Alert';
import { Button } from '../ui/Button';
import { Checkbox } from '../ui/Checkbox';

import ApplicationDescription from './ApplicationDescription';

const messages = defineMessages({
  acceptTermsOfFiscalSponsorship: {
    id: 'createCollective.acceptTermsOfFiscalSponsorship',
    defaultMessage: 'Please accept the terms of fiscal sponsorship',
  },
});

const FISCAL_SPONSOR_TERMS =
  'https://docs.google.com/document/u/1/d/e/2PACX-1vQbiyK2Fe0jLdh4vb9BfHY4bJ1LCo4Qvy0jg9P29ZkiC8y_vKJ_1fNgIbV0p6UdvbcT8Ql1gVto8bf9/pub';

const _callRedirectToGithub = async collectiveSlug => {
  const urlParams = new URLSearchParams({
    context: 'createCollective',
    ...(collectiveSlug ? { CollectiveId: collectiveSlug } : null),
  });

  const response = await fetch(`/api/connected-accounts/github/oauthUrl?${urlParams.toString()}`, {
    method: 'GET',
    headers: addAuthTokenToHeader(),
  });
  const json = await response.json();
  if (json?.redirectUrl) {
    window.location.href = json.redirectUrl;
    return true;
  } else {
    return false;
  }
};

const TermsOfFiscalSponsorship = ({ checked, onChecked }) => {
  const { LoggedInUser } = useLoggedInUser();
  const { formatMessage } = useIntl();
  const [isRedirecting, setIsRedirecting] = useState(false);

  const router = useRouter();
  const [error, setError] = useState();

  const { collectiveSlug, redirectToGithub } = router.query;

  const callRedirectToGithub = React.useCallback(async collectiveSlug => {
    try {
      setIsRedirecting(true);
      if ((await _callRedirectToGithub(collectiveSlug)) === false) {
        setIsRedirecting(false);
      }
    } catch (error) {
      setError(error.message);
      setIsRedirecting(false);
    }
  }, []);

  React.useEffect(() => {
    if (LoggedInUser && redirectToGithub) {
      callRedirectToGithub(collectiveSlug);
    }
  }, [LoggedInUser, redirectToGithub, callRedirectToGithub, collectiveSlug]);

  const handleVerifyGithub = () => {
    if (!checked) {
      setError(formatMessage(messages.acceptTermsOfFiscalSponsorship));
    } else if (!LoggedInUser) {
      router.push({
        pathname: '/signin',
        query: { next: `${router.asPath}?redirectToGithub=true` },
      });
    } else {
      callRedirectToGithub(collectiveSlug);
    }
  };

  return (
    <div className="mt-6 flex flex-col items-center justify-center sm:mt-12">
      <div className="flex flex-col items-center justify-center sm:flex-row">
        <div className="mb-6 h-40 w-40">
          <NextIllustration
            alt="Open Source Collective logotype"
            src="/static/images/osc-logo.png"
            width={160}
            height={160}
          />
        </div>
        <div className="mb-4 w-72 text-center sm:ml-6 sm:w-[488px] sm:text-left">
          <h1 className="mb-3.5 text-[32px] leading-10 font-semibold tracking-tight text-foreground">
            <FormattedMessage id="HostApplication.header" defaultMessage="Apply with your Collective" />
          </h1>
          <p className="text-base leading-6 font-medium text-muted-foreground">
            <FormattedMessage
              id="collective.subtitle.opensource"
              defaultMessage="Open source projects are invited to join the Open Source Collective Fiscal Host."
            />
          </p>
        </div>
      </div>

      <div className="w-full max-w-[672px]">
        <div className="mt-3 flex flex-col gap-4 rounded-lg border border-border p-4 sm:mt-0 sm:p-8">
          <ApplicationDescription />

          <label className="flex cursor-pointer items-start gap-2 text-sm leading-normal">
            <Checkbox checked={checked} onCheckedChange={value => onChecked(value === true)} />
            <span>
              <FormattedMessage
                id="OCFHostApplication.tosCheckBoxLabel"
                defaultMessage="I agree with the <TOSLink>terms of fiscal sponsorship</TOSLink>."
                values={{
                  TOSLink: chunks => (
                    <Link
                      href={FISCAL_SPONSOR_TERMS}
                      openInNewTab
                      className="text-primary underline-offset-4 hover:underline"
                    >
                      {chunks}
                    </Link>
                  ),
                }}
              />
            </span>
          </label>
        </div>

        {error && (
          <Alert variant="destructive" className="mt-4">
            <XCircle className="size-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <div className="mt-8 mb-12 grid grid-cols-1 gap-8 sm:grid-cols-2">
          <Button
            type="button"
            size="lg"
            className="w-full"
            loading={isRedirecting}
            disabled={!checked}
            onClick={handleVerifyGithub}
          >
            {!LoggedInUser ? (
              <FormattedMessage
                id="createcollective.opensource.LogInAndVerifyGithub"
                defaultMessage="Sign in and verify using GitHub"
              />
            ) : (
              <FormattedMessage id="createcollective.opensource.VerifyGithub" defaultMessage="Verify using GitHub" />
            )}
          </Button>
          <Button asChild variant="outline" size="lg" className="w-full">
            <Link
              href={{
                pathname: `/opensource/apply/form`,
                query: { ...(collectiveSlug && { collectiveSlug }) },
              }}
              onClick={e => {
                if (!checked) {
                  e.preventDefault();
                  setError(formatMessage(messages.acceptTermsOfFiscalSponsorship));
                }
              }}
            >
              <FormattedMessage
                id="createcollective.opensource.ManualVerification"
                defaultMessage="Request manual verification"
              />
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
};

export default TermsOfFiscalSponsorship;
