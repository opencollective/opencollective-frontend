import React, { useEffect } from 'react';
import { has, isNil, omitBy } from 'lodash';
import type { InferGetServerSidePropsType } from 'next';
import { useRouter } from 'next/router';
import { defineMessages, useIntl } from 'react-intl';

import { FEATURES, isFeatureSupported } from '../lib/allowed-features';
import { getSSRQueryHelpers } from '../lib/apollo-client';
import { getCollectivePageMetadata, loggedInUserCanAccessFinancialData } from '../lib/collective';
import expenseTypes from '../lib/constants/expenseTypes';
import { PayoutMethodType } from '../lib/constants/payout-method';
import { parseDateInterval } from '../lib/date-utils';
import { generateNotFoundError } from '../lib/errors';
import { API_V2_CONTEXT, gql } from '../lib/graphql/helpers';
import type { ExpensesPageQuery } from '../lib/graphql/types/v2/graphql';
import { ExpenseStatus } from '../lib/graphql/types/v2/graphql';
import useLoggedInUser from '../lib/hooks/useLoggedInUser';
import { getCollectivePageCanonicalURL } from '../lib/url-helpers';

import { parseAmountRange } from '../components/budget/filters/AmountFilter';
import CollectiveNavbar from '../components/collective-navbar';
import { NAVBAR_CATEGORIES } from '../components/collective-navbar/constants';
import { accountNavbarFieldsFragment } from '../components/collective-navbar/fragments';
import { Dimensions } from '../components/collective-page/_constants';
import Container from '../components/Container';
import ErrorPage from '../components/ErrorPage';
import Expenses from '../components/expenses/ExpensesPage';
import { parseChronologicalOrderInput } from '../components/expenses/filters/ExpensesOrder';
import { expenseHostFields, expensesListFieldsFragment } from '../components/expenses/graphql/fragments';
import { Box } from '../components/Grid';
import Page from '../components/Page';
import PageFeatureNotSupported from '../components/PageFeatureNotSupported';

const messages = defineMessages({
  title: {
    id: 'ExpensesPage.title',
    defaultMessage: '{collectiveName} · Expenses',
  },
});

const EXPENSES_PER_PAGE = 10;

const expensesPageQuery = gql`
  query ExpensesPage(
    $collectiveSlug: String!
    $account: AccountReferenceInput
    $fromAccount: AccountReferenceInput
    $limit: Int!
    $offset: Int!
    $type: ExpenseType
    $tags: [String]
    $status: ExpenseStatusFilter
    $minAmount: Int
    $maxAmount: Int
    $payoutMethodType: PayoutMethodType
    $dateFrom: DateTime
    $dateTo: DateTime
    $searchTerm: String
    $orderBy: ChronologicalOrderInput
    $chargeHasReceipts: Boolean
    $virtualCards: [VirtualCardReferenceInput]
    $createdByAccount: AccountReferenceInput
  ) {
    account(slug: $collectiveSlug) {
      id
      legacyId
      slug
      type
      imageUrl
      backgroundImageUrl
      twitterHandle
      name
      currency
      isArchived
      isActive
      settings
      createdAt
      supportedExpenseTypes
      expensesTags {
        id
        tag
      }
      features {
        id
        ...NavbarFields
      }

      stats {
        id
        balanceWithBlockedFunds {
          valueInCents
          currency
        }
      }

      ... on AccountWithHost {
        isApproved
        host {
          id
          ...ExpenseHostFields
        }
      }

      ... on AccountWithParent {
        parent {
          id
          slug
          imageUrl
          backgroundImageUrl
          twitterHandle
        }
      }

      ... on Organization {
        # We add that for hasFeature
        isHost
        isActive
        host {
          id
          ...ExpenseHostFields
        }
      }

      ... on Event {
        parent {
          id
          name
          slug
          type
        }
      }

      ... on Project {
        parent {
          id
          name
          slug
          type
        }
      }
    }
    expenses(
      account: $account
      fromAccount: $fromAccount
      limit: $limit
      offset: $offset
      type: $type
      tag: $tags
      status: $status
      minAmount: $minAmount
      maxAmount: $maxAmount
      payoutMethodType: $payoutMethodType
      dateFrom: $dateFrom
      dateTo: $dateTo
      searchTerm: $searchTerm
      orderBy: $orderBy
      chargeHasReceipts: $chargeHasReceipts
      virtualCards: $virtualCards
      createdByAccount: $createdByAccount
    ) {
      totalCount
      offset
      limit
      nodes {
        id
        ...ExpensesListFieldsFragment
      }
    }
    # limit: 1 as current best practice to avoid the API fetching entries it doesn't need
    # TODO: We don't need to try and fetch this field on non-host accounts (should use a ... on Host)
    scheduledExpenses: expenses(
      host: { slug: $collectiveSlug }
      status: SCHEDULED_FOR_PAYMENT
      payoutMethodType: BANK_ACCOUNT
      limit: 1
    ) {
      totalCount
    }
  }

  ${expensesListFieldsFragment}
  ${accountNavbarFieldsFragment}
  ${expenseHostFields}
`;

const getPropsFromQuery = query => ({
  parentCollectiveSlug: query.parentCollectiveSlug || null,
  collectiveSlug: query.collectiveSlug,
  query: omitBy(
    {
      offset: parseInt(query.offset) || undefined,
      limit: parseInt(query.limit) || undefined,
      type: has(expenseTypes, query.type) ? query.type : undefined,
      status: has(ExpenseStatus, query.status) || query.status === 'READY_TO_PAY' ? query.status : undefined,
      payout: has(PayoutMethodType, query.payout) ? query.payout : undefined,
      direction: query.direction,
      period: query.period,
      amount: query.amount,
      tag: query.tag,
      searchTerm: query.searchTerm,
      orderBy: query.orderBy,
    },
    isNil,
  ),
});

const getVariablesFromProps = (props: Partial<ReturnType<typeof getPropsFromQuery>>) => {
  const amountRange = parseAmountRange(props.query.amount);
  const { from: dateFrom, to: dateTo } = parseDateInterval(props.query.period);
  const showSubmitted = props.query.direction === 'SUBMITTED';
  const fromAccount = showSubmitted ? { slug: props.collectiveSlug } : null;
  const account = !showSubmitted ? { slug: props.collectiveSlug } : null;
  return {
    collectiveSlug: props.collectiveSlug,
    fromAccount,
    account,
    offset: props.query.offset || 0,
    limit: props.query.limit || EXPENSES_PER_PAGE,
    type: props.query.type,
    status: props.query.status,
    tags: props.query.tag ? (props.query.tag === 'untagged' ? null : [props.query.tag]) : undefined,
    minAmount: amountRange[0] && amountRange[0] * 100,
    maxAmount: amountRange[1] && amountRange[1] * 100,
    payoutMethodType: props.query.payout,
    dateFrom,
    dateTo,
    orderBy: props.query.orderBy && parseChronologicalOrderInput(props.query.orderBy),
    searchTerm: props.query.searchTerm,
  };
};

type ExpensesPageProps = {
  collectiveSlug: string;
  parentCollectiveSlug: string;
  query: Partial<{
    offset: number;
    limit: number;
    type: string;
    status: string;
    payout: string;
    direction: string;
    period: string;
    amount: string;
    tag: string;
    searchTerm: string;
    orderBy: string;
  }>;
};

const expensePageQueryHelpers = getSSRQueryHelpers<ReturnType<typeof getVariablesFromProps>, ExpensesPageProps>({
  query: expensesPageQuery,
  context: API_V2_CONTEXT,
  getPropsFromContext: ctx => getPropsFromQuery(ctx.query),
  getVariablesFromContext: (ctx, props) => getVariablesFromProps(props),
  skipClientIfSSRThrows404: true,
});

// ignore unused exports getServerSideProps
// next.js export
export const getServerSideProps = expensePageQueryHelpers.getServerSideProps;

// ignore unused exports default
// next.js export
export default function ExpensesPage(props: InferGetServerSidePropsType<typeof getServerSideProps>) {
  const intl = useIntl();
  const router = useRouter();
  const { LoggedInUser } = useLoggedInUser();
  const query = expensePageQueryHelpers.useQuery(props);

  // Refetch data when logging in/out
  useEffect(() => {
    if (LoggedInUser) {
      query.refetch();
    }
  }, [LoggedInUser]);

  const error = query.error || expensePageQueryHelpers.getSSRErrorFromPageProps(props);
  const data: ExpensesPageQuery = query.data;
  const account = data?.account;
  const metadata = {
    ...getCollectivePageMetadata(account),
    title: intl.formatMessage(messages.title, { collectiveName: account?.name || 'Open Collective' }),
  };

  if (!query.loading) {
    if (error) {
      return <ErrorPage data={data} error={error} />;
    } else if (!account || !data?.expenses?.nodes) {
      return <ErrorPage error={generateNotFoundError(props.collectiveSlug)} log={false} />;
    } else if (!isFeatureSupported(data.account, FEATURES.RECEIVE_EXPENSES)) {
      return <PageFeatureNotSupported showContactSupportLink />;
    } else if (!loggedInUserCanAccessFinancialData(LoggedInUser, data.account)) {
      // Hack for funds that want to keep their budget "private"
      return <PageFeatureNotSupported showContactSupportLink={false} />;
    }
  }

  return (
    <Page
      collective={data.account}
      canonicalURL={`${getCollectivePageCanonicalURL(data.account)}/expenses`}
      {...metadata}
    >
      <CollectiveNavbar
        collective={data.account}
        isLoading={!data.account}
        selectedCategory={NAVBAR_CATEGORIES.BUDGET}
      />
      <Container position="relative" minHeight={[null, 800]}>
        <Box maxWidth={Dimensions.MAX_SECTION_WIDTH} m="0 auto" px={[2, 3, 4]} py={[0, 5]}>
          <Expenses
            data={data}
            refetch={query.refetch}
            query={router.query}
            loading={query.loading}
            variables={query.variables}
            LoggedInUser={LoggedInUser}
          />
        </Box>
      </Container>
    </Page>
  );
}
