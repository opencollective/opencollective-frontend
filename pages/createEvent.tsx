import React from 'react';
import { gql, useQuery } from '@apollo/client';
import type { NextPageContext } from 'next';
import { useRouter } from 'next/router';
import { FormattedMessage, useIntl } from 'react-intl';

import { FEATURES, isFeatureEnabled } from '@/lib/allowed-features';
import { generateNotFoundError } from '@/lib/errors';
import { loadGoogleMaps } from '@/lib/google-maps';
import type { CreateEventPageQuery, CreateEventPageQueryVariables } from '@/lib/graphql/types/v2/graphql';
import useLoggedInUser from '@/lib/hooks/useLoggedInUser';
import { getCollectivePageRoute } from '@/lib/url-helpers';

import Body from '@/components/Body';
import CollectiveNavbar from '@/components/collective-navbar';
import CreateEventForm from '@/components/CreateEventForm';
import ErrorPage from '@/components/ErrorPage';
import Header from '@/components/Header';
import { getI18nLink } from '@/components/I18nFormatters';
import Link from '@/components/Link';
import MessageBox from '@/components/MessageBox';
import Footer from '@/components/navigation/Footer';
import PageFeatureNotSupported from '@/components/PageFeatureNotSupported';
import { Button } from '@/components/ui/Button';
import { Skeleton } from '@/components/ui/Skeleton';

const createEventPageQuery = gql`
  query CreateEventPage($slug: String!) {
    account(slug: $slug) {
      id
      legacyId
      slug
      type
      name
      isFrozen
      ... on AccountWithHost {
        host {
          id
          slug
          features {
            id
            CONTACT_FORM
          }
        }
      }
    }
  }
`;

function CreateEventPage({ parentCollectiveSlug }: { parentCollectiveSlug: string }) {
  const intl = useIntl();
  const { loadingLoggedInUser, LoggedInUser } = useLoggedInUser();
  const router = useRouter();
  const [isLoadingGoogleMaps, setIsLoadingGoogleMaps] = React.useState(true);
  const {
    data,
    error,
    loading: loadingParent,
  } = useQuery<CreateEventPageQuery, CreateEventPageQueryVariables>(createEventPageQuery, {
    variables: { slug: parentCollectiveSlug },
  });
  const title = intl.formatMessage({ defaultMessage: 'New event', id: 'C+Npdp' });
  const parent = data?.account;
  const isAdmin = LoggedInUser && parent && LoggedInUser.isAdminOfCollective(parent);

  React.useEffect(() => {
    loadGoogleMaps().finally(() => {
      setIsLoadingGoogleMaps(false);
    });
  }, []);

  const handleCreateEvent = React.useCallback(
    async createdEvent => {
      await router.push({
        pathname: `/${parentCollectiveSlug}/events/${createdEvent.slug}`,
        query: {
          status: 'eventCreated',
        },
      });
      window.scrollTo(0, 0);
    },
    [router],
  );

  if (error) {
    return <ErrorPage error={error} />;
  } else if (!loadingParent && !parent) {
    return <ErrorPage error={generateNotFoundError(parentCollectiveSlug)} log={false} />;
  } else if (LoggedInUser && !isAdmin) {
    return <PageFeatureNotSupported />;
  }

  const loading = loadingParent || loadingLoggedInUser || isLoadingGoogleMaps;
  return (
    <div className="min-h-screen">
      <Header title={title} LoggedInUser={LoggedInUser} showMenuItems={false} />

      <Body className="bg-gray-50">
        <CollectiveNavbar isLoading={loading} collective={parent} isAdmin={isAdmin} selectedCategory={null} />

        <div className="mx-auto max-w-4xl px-4 py-6 sm:px-6 sm:py-12 lg:px-8 lg:py-16 xl:py-24">
          {/* Page Title Section */}
          <div className="mb-6">
            <h1 className="mb-1 text-3xl font-bold text-gray-900 capitalize">
              <FormattedMessage defaultMessage="New event" id="C+Npdp" />
            </h1>
            {loading || !parent ? (
              <Skeleton className="h-6 w-80" />
            ) : (
              <p className="text-lg text-gray-600">
                <FormattedMessage
                  defaultMessage="Set up your event details for {collectiveName}"
                  id="event.create.subtitle"
                  values={{ collectiveName: parent.name }}
                />
              </p>
            )}
          </div>

          {loading || !parent ? (
            <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
              <div className="space-y-4">
                <Skeleton className="h-8 w-48" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-3/4" />
                <div className="mt-6 space-y-3">
                  <Skeleton className="h-10 w-full" />
                  <Skeleton className="h-10 w-full" />
                  <Skeleton className="h-32 w-full" />
                  <Skeleton className="h-10 w-32" />
                </div>
              </div>
            </div>
          ) : !LoggedInUser ? (
            <div className="rounded-lg border border-gray-200 bg-white p-6 text-center shadow-sm">
              <div className="mx-auto max-w-md">
                <div className="mb-4">
                  <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-blue-100">
                    <svg className="h-6 w-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                      />
                    </svg>
                  </div>
                  <h3 className="mb-2 text-lg font-medium text-gray-900">
                    <FormattedMessage
                      id="authorization.loginRequired"
                      defaultMessage="You need to be logged in to continue."
                    />
                  </h3>
                </div>
                <Link href={`/signin?next=/${parent.slug}/events/new`}>
                  <Button size="lg" className="w-full sm:w-auto">
                    <FormattedMessage id="signIn" defaultMessage="Sign In" />
                  </Button>
                </Link>
              </div>
            </div>
          ) : parent?.isFrozen ? (
            <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
              <MessageBox withIcon type="warning" my={0}>
                <FormattedMessage
                  defaultMessage="This account is currently frozen and cannot be used to create events."
                  id="10vwJU"
                />{' '}
                {isFeatureEnabled(parent['host'], FEATURES.CONTACT_FORM) && (
                  <FormattedMessage
                    defaultMessage="Please <ContactLink>contact</ContactLink> your fiscal host for more details."
                    id="KxBiJC"
                    values={{
                      ContactLink: getI18nLink({ href: `${getCollectivePageRoute(parent['host'])}/contact` }),
                    }}
                  />
                )}
              </MessageBox>
            </div>
          ) : (
            <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
              <CreateEventForm onSuccess={handleCreateEvent} loading={loading} parent={parent} />
            </div>
          )}
        </div>
      </Body>

      <Footer />
    </div>
  );
}

CreateEventPage.getInitialProps = (ctx: NextPageContext) => {
  const { parentCollectiveSlug } = ctx.query;
  return { parentCollectiveSlug };
};

// next.js export
// ts-unused-exports:disable-next-line
export default CreateEventPage;
