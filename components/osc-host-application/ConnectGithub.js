import React, { useEffect, useState } from 'react';
import { ArrowLeft, ArrowRight, XCircle } from 'lucide-react';
import { useRouter } from 'next/router';
import { FormattedMessage } from 'react-intl';

import { getGithubRepos } from '../../lib/api';

import NextIllustration from '../collectives/HomeNextIllustration';
import GithubRepositoriesFAQ from '../faqs/GithubRepositoriesFAQ';
import Link from '../Link';
import Spinner from '../Spinner';
import { Alert, AlertDescription } from '../ui/Alert';
import { Button } from '../ui/Button';

import GithubRepositories from './GithubRepositories';

const ConnectGithub = ({ setGithubInfo, nextDisabled }) => {
  const router = useRouter();
  const [repositories, setRepositories] = useState([]);
  const [loadingRepos, setLoadingRepos] = useState(true);
  const [error, setError] = useState(null);

  const { token, collectiveSlug } = router.query;
  const nextLinkPath = collectiveSlug
    ? `/opensource/apply/form?collectiveSlug=${collectiveSlug}`
    : '/opensource/apply/form';

  useEffect(() => {
    if (!token) {
      setLoadingRepos(false);
      return undefined;
    }

    let cancelled = false;
    setLoadingRepos(true);
    setError(null);

    getGithubRepos(token)
      .then(repos => {
        if (cancelled) {
          return;
        }
        if (repos.length !== 0) {
          setRepositories(repos);
        } else {
          setError("We couldn't find any repositories with at least 100 stars linked to this account");
        }
      })
      .catch(error => {
        if (!cancelled) {
          setError(error.toString());
        }
      })
      .finally(() => {
        if (!cancelled) {
          setLoadingRepos(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [token]);

  return (
    <div className="mt-6 flex flex-col items-center sm:mt-12">
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
          <h1
            data-cy="connect-github-header"
            className="mb-3.5 text-[32px] leading-10 font-semibold tracking-tight text-foreground"
          >
            <FormattedMessage id="openSourceApply.GithubRepositories.title" defaultMessage="Pick a repository" />
          </h1>
          <p className="mb-2 text-base leading-6 font-medium text-muted-foreground">
            <FormattedMessage
              id="collective.subtitle.seeRepo"
              defaultMessage="Don't see the repository you're looking for? {helplink}."
              values={{
                helplink: (
                  <Link
                    href="https://docs.oscollective.org/how-to-apply/github-verification#github-verification-troubleshooting"
                    openInNewTab
                    className="text-primary underline-offset-4 hover:underline"
                  >
                    <FormattedMessage id="getHelp" defaultMessage="Get help" />
                  </Link>
                ),
              }}
            />
          </p>
          <p className="text-base leading-6 font-medium text-muted-foreground">
            <FormattedMessage
              defaultMessage="Want to apply using an <AltVerificationLink>alternative verification criteria</AltVerificationLink>? <ApplyLink>Click here</ApplyLink>."
              id="kwIdJS"
              values={{
                ApplyLink: chunks => (
                  <Link href={nextLinkPath} className="text-primary underline-offset-4 hover:underline">
                    {chunks}
                  </Link>
                ),
                AltVerificationLink: chunks => (
                  <Link
                    openInNewTab
                    href="https://docs.oscollective.org/how-to-apply/manual-verification"
                    className="text-primary underline-offset-4 hover:underline"
                  >
                    {chunks}
                  </Link>
                ),
              }}
            />
          </p>
        </div>
      </div>

      {error && (
        <Alert variant="destructive" className="mt-4 w-full max-w-[672px]">
          <XCircle className="size-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {loadingRepos ? (
        <div className="mt-8 flex justify-center">
          <Spinner size={32} />
        </div>
      ) : (
        repositories.length > 0 && (
          <div className="mx-auto mt-8 grid w-full max-w-[1200px] grid-cols-1 gap-8 px-4 sm:px-0 lg:grid-cols-4 lg:gap-12">
            <div className="lg:col-span-2 lg:col-start-2">
              <GithubRepositories repositories={repositories} setGithubInfo={setGithubInfo} />
              <div className="mt-4 grid grid-cols-1 gap-8 sm:grid-cols-2">
                <Button
                  type="button"
                  variant="outline"
                  size="lg"
                  onClick={() => {
                    if (typeof window !== 'undefined') {
                      window.history.back();
                    }
                  }}
                >
                  <ArrowLeft size={16} />
                  <FormattedMessage id="Back" defaultMessage="Back" />
                </Button>
                <Button
                  type="button"
                  size="lg"
                  disabled={nextDisabled}
                  onClick={() => router.push(nextLinkPath)}
                  data-cy="connect-github-continue"
                >
                  <FormattedMessage id="Pagination.Next" defaultMessage="Next" />
                  <ArrowRight size={16} />
                </Button>
              </div>
            </div>
            <div className="lg:col-span-1 lg:col-start-4">
              <GithubRepositoriesFAQ className="lg:sticky lg:top-0" />
            </div>
          </div>
        )
      )}
    </div>
  );
};

export default ConnectGithub;
