import React, { Fragment } from 'react';
import PropTypes from 'prop-types';
import { gql, useQuery } from '@apollo/client';
import { isNil, omit, toLower, toUpper } from 'lodash';
import { useRouter } from 'next/router';
import { FormattedMessage } from 'react-intl';

import { API_V2_CONTEXT } from '../../../lib/graphql/helpers';
import useQueryFilter, { AmountRangeFilter, BooleanFilter, DateRangeFilter } from '../../../lib/hooks/useQueryFilter';

import AssignVirtualCardModal from '../../edit-collective/AssignVirtualCardModal';
import EditVirtualCardModal from '../../edit-collective/EditVirtualCardModal';
import { Box, Flex } from '../../Grid';
import { getI18nLink } from '../../I18nFormatters';
import Loading from '../../Loading';
import Pagination from '../../Pagination';
import { P } from '../../Text';
import { TOAST_TYPE, useToasts } from '../../ToastProvider';
import VirtualCardsTable from '../../virtual-cards/VirtualCardsTable';
import VirtualCardFilters from '../../VirtualCardFilters';

const hostVirtualCardsQuery = gql`
  query HostedVirtualCards(
    $slug: String
    $limit: Int!
    $offset: Int!
    $collectiveAccountReferences: [AccountReferenceInput]
    $status: [VirtualCardStatus]
    $withExpensesDateFrom: DateTime
    $withExpensesDateTo: DateTime
    $spentAmountFrom: AmountInput
    $spentAmountTo: AmountInput
    $hasMissingReceipts: Boolean
    $searchTerm: String
  ) {
    host(slug: $slug) {
      id
      legacyId
      slug
      name
      imageUrl(height: 40)
      currency
      settings
      stripe {
        username
      }
      hostedVirtualCards(
        limit: $limit
        offset: $offset
        collectiveAccountIds: $collectiveAccountReferences
        status: $status
        withExpensesDateFrom: $withExpensesDateFrom
        withExpensesDateTo: $withExpensesDateTo
        spentAmountFrom: $spentAmountFrom
        spentAmountTo: $spentAmountTo
        hasMissingReceipts: $hasMissingReceipts
        searchTerm: $searchTerm
      ) {
        totalCount
        limit
        offset
        nodes {
          id
          name
          last4
          data
          status
          privateData
          provider
          spendingLimitAmount
          spendingLimitInterval
          spendingLimitRenewsOn
          remainingLimit
          currency
          createdAt
          account {
            id
            name
            slug
            imageUrl(height: 64)
          }
          assignee {
            id
            name
            email
            slug
            imageUrl(height: 64)
          }
        }
      }
      hostedVirtualCardCollectives {
        totalCount
        limit
        offset
        nodes {
          id
          slug
          name
          legacyId
          imageUrl(height: 64)
          ... on AccountWithParent {
            parentAccount: parent {
              id
              slug
              name
              legacyId
              imageUrl(height: 64)
            }
          }
        }
      }
    }
  }
`;

const VIRTUAL_CARDS_PER_PAGE = 20;

const HostVirtualCards = props => {
  const queryFilter = useQueryFilter({
    ignoreQueryParams: ['slug', 'section'],
    filters: {
      searchTerm: {
        queryParam: 'q',
      },
      collectiveSlugs: {
        isMulti: true,
        queryParam: 'collective',
      },
      virtualCardStatus: {
        isMulti: true,
        queryParam: 'status',
        serialize: toLower,
        deserialize: toUpper,
      },
      usagePeriod: DateRangeFilter,
      missingReceipts: BooleanFilter,
      totalSpent: AmountRangeFilter,
    },
  });

  const router = useRouter();
  const routerQuery = omit(router.query, ['slug', 'section']);
  const offset = parseInt(routerQuery.offset) || 0;
  const limit = parseInt(routerQuery.limit) || VIRTUAL_CARDS_PER_PAGE;
  const { addToast } = useToasts();
  const { loading, data, refetch } = useQuery(hostVirtualCardsQuery, {
    context: API_V2_CONTEXT,
    variables: {
      slug: props.hostSlug,
      limit,
      offset,
      status: queryFilter.values.virtualCardStatus,
      withExpensesDateFrom: queryFilter.values.usagePeriod?.from,
      withExpensesDateTo: queryFilter.values.usagePeriod?.to,
      collectiveAccountReferences: queryFilter.values.collectiveSlugs.map(slug => ({ slug })),
      spentAmountFrom: !isNil(queryFilter.values.totalSpent?.fromAmount)
        ? { valueInCents: queryFilter.values.totalSpent?.fromAmount }
        : null,
      spentAmountTo: !isNil(queryFilter.values.totalSpent?.toAmount)
        ? { valueInCents: queryFilter.values.totalSpent?.toAmount }
        : null,
      hasMissingReceipts: queryFilter.values.missingReceipts,
      searchTerm: queryFilter.values.searchTerm,
    },
  });

  const [displayAssignCardModal, setAssignCardModalDisplay] = React.useState(false);
  const [displayCreateVirtualCardModal, setCreateVirtualCardModalDisplay] = React.useState(false);

  const handleAssignCardSuccess = message => {
    addToast({
      type: TOAST_TYPE.SUCCESS,
      message: message || (
        <FormattedMessage id="Host.VirtualCards.AssignCard.Success" defaultMessage="Card successfully assigned" />
      ),
    });
    setAssignCardModalDisplay(false);
    refetch();
  };

  const handleCreateVirtualCardSuccess = message => {
    addToast({
      type: TOAST_TYPE.SUCCESS,
      message: message || <FormattedMessage defaultMessage="Virtual card successfully created" />,
    });
    setCreateVirtualCardModalDisplay(false);
    refetch();
  };

  return (
    <Fragment>
      <Box>
        <P fontSize="24px" fontWeight="700" lineHeight="32px" mb={3}>
          <FormattedMessage id="VirtualCards.Title" defaultMessage="Virtual Cards" />
        </P>
        <P>
          <FormattedMessage
            id="Host.VirtualCards.List.Description"
            defaultMessage="Make payments easier by creating virtual cards. One Collective can have multiple virtual cards. <learnMoreLink>Learn more</learnMoreLink>"
            values={{
              learnMoreLink: getI18nLink({
                href: 'https://docs.opencollective.com/help/fiscal-hosts/virtual-cards',
                openInNewTabNoFollow: true,
              }),
            }}
          />
        </P>
        <Flex mt={3} flexDirection={['row', 'column']}>
          <VirtualCardFilters
            loading={loading}
            collectivesFilter={queryFilter.values.collectiveSlugs}
            onCollectivesFilterChange={queryFilter.setCollectiveSlugs}
            collectivesWithVirtualCards={data?.host?.hostedVirtualCardCollectives?.nodes ?? []}
            virtualCardStatusFilter={queryFilter.values.virtualCardStatus}
            onVirtualCardStatusFilter={queryFilter.setVirtualCardStatus}
            expensePeriod={queryFilter.values.usagePeriod}
            onExpensePeriodChange={queryFilter.setUsagePeriod}
            missingReceipts={queryFilter.values.missingReceipts}
            onMissingReceiptsChange={queryFilter.setMissingReceipts}
            currency={data?.host?.currency}
            totalSpent={queryFilter.values.totalSpent}
            onTotalSpentChange={queryFilter.setTotalSpent}
            searchTerm={queryFilter.values.searchTerm}
            onSearchTermChange={queryFilter.setSearchTerm}
            onCreateCardClick={() => setCreateVirtualCardModalDisplay(true)}
            onAssignCardClick={() => setAssignCardModalDisplay(true)}
          />
        </Flex>
      </Box>
      {loading ? (
        <Loading />
      ) : (
        <React.Fragment>
          <Box mt={4}>
            <VirtualCardsTable
              canEditVirtualCard
              canDeleteVirtualCard
              onDeleteRefetchQuery="HostedVirtualCards"
              virtualCards={data.host.hostedVirtualCards.nodes}
              host={data.host}
            />
          </Box>
          <Flex mt={5} alignItems="center" flexDirection="column" justifyContent="center">
            <Pagination
              route={`/${data.host.slug}/admin/host-virtual-cards`}
              total={data.host.hostedVirtualCards.totalCount}
              limit={VIRTUAL_CARDS_PER_PAGE}
              offset={offset}
              ignoredQueryParams={['slug', 'section']}
            />
            <P mt={1} fontSize="12px">
              <FormattedMessage id="TotalItems" defaultMessage="Total Items" />:{' '}
              {data.host.hostedVirtualCards.totalCount}
            </P>
          </Flex>
        </React.Fragment>
      )}

      {displayAssignCardModal && (
        <AssignVirtualCardModal
          host={data.host}
          onSuccess={handleAssignCardSuccess}
          onClose={() => {
            setAssignCardModalDisplay(false);
          }}
        />
      )}

      {displayCreateVirtualCardModal && (
        <EditVirtualCardModal
          host={data.host}
          onSuccess={handleCreateVirtualCardSuccess}
          onClose={() => {
            setCreateVirtualCardModalDisplay(false);
          }}
        />
      )}
    </Fragment>
  );
};

HostVirtualCards.propTypes = {
  hostSlug: PropTypes.string,
  hideTopsection: PropTypes.func,
};

export default HostVirtualCards;
