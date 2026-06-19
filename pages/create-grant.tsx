import React from 'react';
import { type ApolloClient, gql } from '@apollo/client';
import type { NextPageContext } from 'next';
import { useRouter } from 'next/router';
import { defineMessages, FormattedMessage, useIntl } from 'react-intl';

import { APOLLO_STATE_PROP_NAME, initClient } from '@/lib/apollo-client';
import { expenseSubmissionAllowed, getCollectivePageMetadata, isHiddenAccount } from '@/lib/collective';
import { generateNotFoundError } from '@/lib/errors';
import type { CreateGrantPageQuery } from '@/lib/graphql/types/v2/graphql';
import { ExpenseType } from '@/lib/graphql/types/v2/graphql';
import useLoggedInUser from '@/lib/hooks/useLoggedInUser';
import { getCollectivePageCanonicalURL, getCollectivePageRoute } from '@/lib/url-helpers';

import CollectiveNavbar from '@/components/collective-navbar';
import { NAVBAR_CATEGORIES } from '@/components/collective-navbar/constants';
import { accountNavbarFieldsFragment } from '@/components/collective-navbar/fragments';
import Container from '@/components/Container';
import ContainerOverlay from '@/components/ContainerOverlay';
import ErrorPage from '@/components/ErrorPage';
import { Flex } from '@/components/Grid';
import Loading from '@/components/Loading';
import MessageBox from '@/components/MessageBox';
import Page from '@/components/Page';
import PageFeatureNotSupported from '@/components/PageFeatureNotSupported';
import SignInOrJoinFree, { SignInOverlayBackground } from '@/components/SignInOrJoinFree';
import SubmitGrantFlow from '@/components/submit-grant/SubmitGrantFlow';

const NAVBAR_CALLS_TO_ACTION = { hasSubmitExpense: false, hasRequestGrant: false };

const CreateGrantPageI18n = defineMessages({
  TITLE: {
    defaultMessage: 'Grant application to {account}',
    id: 'miGVdq',
  },
});

function CreateGrantPage(props: Awaited<ReturnType<typeof CreateGrantPage.getInitialProps>>) {
  const intl = useIntl();
  const router = useRouter();
  const { LoggedInUser, loadingLoggedInUser } = useLoggedInUser();
  const pageMetadata = React.useMemo(() => {
    if (!props.account) {
      return null;
    }

    const canonicalURL = `${getCollectivePageCanonicalURL(props.account)}/grants/new`;

    return {
      ...getCollectivePageMetadata(props.account),
      canonicalURL,
      title: intl.formatMessage(CreateGrantPageI18n.TITLE, {
        account: props.account.name,
      }),
    };
  }, [props.account, intl]);

  const handleOnClose = React.useCallback(() => {
    const collectivePage = getCollectivePageRoute(props.account);
    router.replace(collectivePage);
  }, [props.account, router]);

  const { queryResult } = props;

  if (queryResult.loading || loadingLoggedInUser) {
    return (
      <Page {...pageMetadata} collective={props.account} withTopBar={false} showFooter={false}>
        <div className="flex h-screen flex-col items-center justify-center p-12">
          <Loading />
        </div>
      </Page>
    );
  } else if (props.error) {
    return <ErrorPage error={props.error} />;
  } else if (!props.account || isHiddenAccount(props.account)) {
    return <ErrorPage error={generateNotFoundError(props.collectiveSlug)} log={false} />;
  } else if (!(props.account.supportedExpenseTypes || []).includes(ExpenseType.GRANT)) {
    return <PageFeatureNotSupported />;
  }

  const account = props.account;

  if (!expenseSubmissionAllowed(account, LoggedInUser)) {
    return (
      <Page {...pageMetadata} collective={account}>
        <Flex justifyContent="center" p={5}>
          <MessageBox type="error" withIcon>
            <FormattedMessage
              id="mustBeMemberOfCollective"
              defaultMessage="You must be a member of the collective to see this page"
            />
          </MessageBox>
        </Flex>
      </Page>
    );
  }

  if (!loadingLoggedInUser && !LoggedInUser) {
    return (
      <Page {...pageMetadata} collective={account}>
        <CollectiveNavbar
          collective={account}
          selectedCategory={NAVBAR_CATEGORIES.BUDGET}
          callsToAction={NAVBAR_CALLS_TO_ACTION}
        />
        <Container position="relative" minHeight={[null, 800]}>
          <ContainerOverlay
            py={[2, null, 6]}
            top="0"
            position={['fixed', null, 'absolute']}
            justifyContent={['center', null, 'flex-start']}
          >
            <SignInOverlayBackground>
              <SignInOrJoinFree
                showOCLogo={false}
                showSubHeading={false}
                hideFooter
                routes={{ join: `/create-account?next=${encodeURIComponent(router.asPath)}` }}
              />
            </SignInOverlayBackground>
          </ContainerOverlay>
        </Container>
      </Page>
    );
  }

  return (
    <Page {...pageMetadata} collective={account} withTopBar={false} showFooter={false}>
      <SubmitGrantFlow
        expenseId={router.query.expenseId ? parseInt(router.query.expenseId as string, 10) : null}
        draftKey={router.query.draftKey as string}
        account={account}
        handleOnClose={handleOnClose}
      />
    </Page>
  );
}

const CollectivePageMetadataFieldsFragment = gql`
  fragment CollectivePageMetadataFields on Account {
    ... on AccountWithParent {
      parent {
        id
        legacyId
        slug
        type
        backgroundImageUrl
        imageUrl
      }
    }

    id
    legacyId
    slug
    type
    name
    description
    backgroundImageUrl
    imageUrl
    isSuspended
  }
`;

CreateGrantPage.getInitialProps = async (ctx: NextPageContext) => {
  const collectiveSlug = ctx.query.collectiveSlug as string;

  const client = getApolloClient(ctx);

  const queryResult = await client.query<CreateGrantPageQuery>({
    query: gql`
      query CreateGrantPage($collectiveSlug: String!) {
        account(slug: $collectiveSlug) {
          id
          type
          legacyId
          slug
          settings
          supportedExpenseTypes
          isSuspended
          features {
            id
            ...NavbarFields
          }

          ...CollectivePageMetadataFields
        }
      }

      ${CollectivePageMetadataFieldsFragment}
      ${accountNavbarFieldsFragment}
    `,
    variables: {
      collectiveSlug,
    },
  });

  const account = queryResult.data?.account;
  const error = queryResult.error;
  return {
    collectiveSlug,
    account,
    error,
    queryResult,
  };
};

function getApolloClient(ctx: NextPageContext) {
  return (
    (ctx.req as { apolloClient?: ApolloClient<unknown> })?.apolloClient ||
    initClient({
      initialState: window?.__NEXT_DATA__?.props?.[APOLLO_STATE_PROP_NAME],
    })
  );
}

// next.js export
// ts-unused-exports:disable-next-line
export default CreateGrantPage;
