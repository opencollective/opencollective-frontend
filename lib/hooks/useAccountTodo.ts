import { gql, useQuery } from '@apollo/client';

import type { WorkspaceAccount } from '@/lib/account';
import { hasAccountMoneyManagement } from '@/lib/collective';
import type { AccountTodoQuery } from '@/lib/graphql/types/v2/graphql';

const accountTodoQuery = gql`
  query AccountTodo($slug: String!, $isOrgWithMoneyManagment: Boolean!) {
    account(slug: $slug) {
      toPayExpenses: expenses(status: [READY_TO_PAY], includeChildrenExpenses: true)
        @include(if: $isOrgWithMoneyManagment) {
        totalCount
      }
      pendingExpenses: expenses(
        status: PENDING
        direction: RECEIVED
        includeChildrenExpenses: true
        limit: 0
        types: [INVOICE, RECEIPT, FUNDING_REQUEST, UNCLASSIFIED, CHARGE, SETTLEMENT]
      ) {
        totalCount
      }
      pendingGrants: expenses(
        status: PENDING
        direction: RECEIVED
        includeChildrenExpenses: true
        limit: 0
        type: GRANT
      ) {
        totalCount
      }
      receivedGrantRequests: expenses(direction: RECEIVED, limit: 0, type: GRANT) {
        totalCount
      }
      issuedGrantRequests: expenses(direction: SUBMITTED, limit: 0, type: GRANT) {
        totalCount
      }
      pausedResumableIncomingContributions: orders(
        filter: INCOMING
        status: [PAUSED]
        includeIncognito: true
        includeHostedAccounts: false
        includeChildrenAccounts: true
        pausedBy: [COLLECTIVE, HOST, PLATFORM]
      ) {
        totalCount
      }
      pausedOutgoingContributions: orders(filter: OUTGOING, status: PAUSED, includeIncognito: true) {
        totalCount
      }
      ... on AccountWithContributions {
        canStartResumeContributionsProcess
        hasResumeContributionsProcessStarted
      }
    }
  }
`;

type AccountTodoData = NonNullable<AccountTodoQuery['account']>;

export type AccountTodoCounts = {
  toPayExpenses: number;
  pendingExpenses: number;
  pendingGrants: number;
  receivedGrantRequests: number;
  issuedGrantRequests: number;
  pausedResumableIncomingContributions: number;
  pausedOutgoingContributions: number;
};

const getAccountTodoCounts = (todoData?: AccountTodoData): AccountTodoCounts => ({
  toPayExpenses: todoData?.toPayExpenses?.totalCount ?? 0,
  pendingExpenses: todoData?.pendingExpenses?.totalCount ?? 0,
  pendingGrants: todoData?.pendingGrants?.totalCount ?? 0,
  receivedGrantRequests: todoData?.receivedGrantRequests?.totalCount ?? 0,
  issuedGrantRequests: todoData?.issuedGrantRequests?.totalCount ?? 0,
  pausedResumableIncomingContributions: todoData?.pausedResumableIncomingContributions?.totalCount ?? 0,
  pausedOutgoingContributions: todoData?.pausedOutgoingContributions?.totalCount ?? 0,
});

type UseAccountTodoOptions = {
  skip?: boolean;
};

const useAccountTodo = (account?: WorkspaceAccount | null, options?: UseAccountTodoOptions) => {
  const isOrgWithMoneyManagment = account?.type === 'ORGANIZATION' && hasAccountMoneyManagement(account);

  const { data, loading, error, refetch } = useQuery(accountTodoQuery, {
    variables: { slug: account?.slug, isOrgWithMoneyManagment: !!isOrgWithMoneyManagment },
    skip: options?.skip || !account?.slug,
  });

  const todoData = data?.account;

  return {
    data: todoData,
    counts: getAccountTodoCounts(todoData),
    loading,
    error,
    refetch,
    canStartResumeContributionsProcess: todoData?.canStartResumeContributionsProcess,
    hasResumeContributionsProcessStarted: todoData?.hasResumeContributionsProcessStarted,
    isOrgWithMoneyManagment: !!isOrgWithMoneyManagment,
  };
};

export default useAccountTodo;
