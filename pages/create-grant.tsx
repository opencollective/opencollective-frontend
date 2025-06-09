import React from 'react';
import { type ApolloClient, gql } from '@apollo/client';
import type { NextPageContext } from 'next';
import { useRouter } from 'next/router';
import { defineMessages, useIntl } from 'react-intl';

import { APOLLO_STATE_PROP_NAME, initClient } from '@/lib/apollo-client';
import { getCollectivePageMetadata } from '@/lib/collective';
import { generateNotFoundError } from '@/lib/errors';
import { API_V2_CONTEXT } from '@/lib/graphql/helpers';
import type { CreateGrantPageQuery } from '@/lib/graphql/types/v2/graphql';
import { ExpenseType } from '@/lib/graphql/types/v2/schema';
import useLoggedInUser from '@/lib/hooks/useLoggedInUser';
import { PREVIEW_FEATURE_KEYS } from '@/lib/preview-features';
import { getCollectivePageCanonicalURL, getCollectivePageRoute } from '@/lib/url-helpers';
import { parseToBoolean } from '@/lib/utils';

import ErrorPage from '@/components/ErrorPage';
import Loading from '@/components/Loading';
import Page from '@/components/Page';
import PageFeatureNotSupported from '@/components/PageFeatureNotSupported';
import SubmitGrantFlow from '@/components/submit-grant/SubmitGrantFlow';

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
  const isGrantPreviewEnabled =
    !LoggedInUser ||
    LoggedInUser.hasPreviewFeatureEnabled(PREVIEW_FEATURE_KEYS.NEW_EXPENSE_FLOW) ||
    props.newFlowEnabledInUrl;

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
  } else if (!props.account) {
    return <ErrorPage error={generateNotFoundError(props.collectiveSlug)} log={false} />;
  } else if (!isGrantPreviewEnabled || !(props.account.supportedExpenseTypes || []).includes(ExpenseType.GRANT)) {
    return <PageFeatureNotSupported />;
  }

  return (
    <Page {...pageMetadata} collective={props.account} withTopBar={false} showFooter={false}>
      <SubmitGrantFlow
        expenseId={router.query.expenseId ? parseInt(router.query.expenseId as string, 10) : null}
        draftKey={router.query.draftKey as string}
        account={props.account}
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
          supportedExpenseTypes

          ...CollectivePageMetadataFields
        }
      }

      ${CollectivePageMetadataFieldsFragment}
    `,
    context: API_V2_CONTEXT,
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
    newFlowEnabledInUrl: parseToBoolean(ctx.query.newGrantFlowEnabled),
  };
};

function getApolloClient(ctx: NextPageContext) {
  return (
    ((ctx.req as any)?.apolloClient as ApolloClient<unknown>) ||
    initClient({
      initialState: window?.__NEXT_DATA__?.props?.[APOLLO_STATE_PROP_NAME],
    })
  );
}

// next.js export
// ts-unused-exports:disable-next-line
export default CreateGrantPage;
