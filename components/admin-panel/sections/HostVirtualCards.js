import React, { Fragment } from 'react';
import PropTypes from 'prop-types';
import { gql, useQuery } from '@apollo/client';
import { omit, omitBy, isEmpty } from 'lodash';
import { useRouter } from 'next/router';
import { FormattedMessage } from 'react-intl';
import styled from 'styled-components';
import DashboardHeader from '../../DashboardHeader';
import { API_V2_CONTEXT } from '../../../lib/graphql/helpers';
import Filters from '../../Filters';
import AssignVirtualCardModal from '../../edit-collective/AssignVirtualCardModal';
import EditVirtualCardModal from '../../edit-collective/EditVirtualCardModal';
import VirtualCardFilters from '../../edit-collective/sections/virtual-cards/VirtualCardFilters';
import VirtualCard from '../../edit-collective/VirtualCard';
import { Box, Flex, Grid } from '../../Grid';
import { getI18nLink } from '../../I18nFormatters';
import Loading from '../../Loading';
import Pagination from '../../Pagination';
import StyledButton from '../../StyledButton';
import { P } from '../../Text';
import { TOAST_TYPE, useToasts } from '../../ToastProvider';

const hostVirtualCardsQuery = gql`
  query HostedVirtualCards(
    $slug: String
    $limit: Int!
    $offset: Int!
    $status: [VirtualCardStatus]
    $merchantAccount: AccountReferenceInput
    $collectiveAccountIds: [AccountReferenceInput]
    $hasMissingReceipts: Boolean
  ) {
    host(slug: $slug) {
      id
      legacyId
      slug
      name
      imageUrl
      currency
      settings
      hostedVirtualCards(
        limit: $limit
        offset: $offset
        status: $status
        merchantAccount: $merchantAccount
        collectiveAccountIds: $collectiveAccountIds
        hasMissingReceipts: $hasMissingReceipts
      ) {
        totalCount
        limit
        offset
        nodes {
          id
          name
          last4
          data
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
            imageUrl
          }
          assignee {
            id
            name
            slug
            imageUrl
          }
        }
      }
      hostedVirtualCardMerchants {
        nodes {
          id
          type
          slug
          name
          currency
          location {
            id
            address
            country
          }
          imageUrl(height: 64)
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

const AddCardPlaceholder = styled(Flex)`
  border-radius: 20px;
  ${props => `border: 1px dashed ${props.theme.colors.primary[500]};`}
`;

const VIRTUAL_CARDS_PER_PAGE = 6;
const enforceDefaultParamsOnQuery = query => {
  return {
    ...query,
    status: query.status || 'ACTIVE',
  };
};
const HostVirtualCards = props => {
  const router = useRouter();
  const routerQuery = omit(router.query, ['slug', 'section']);
  const query = enforceDefaultParamsOnQuery(routerQuery);

  const offset = parseInt(routerQuery.offset) || 0;
  const { status, merchant, collectiveAccountIds, hasMissingReceipts } = routerQuery;
  const { addToast } = useToasts();
  const { loading, data, refetch } = useQuery(hostVirtualCardsQuery, {
    context: API_V2_CONTEXT,
    variables: {
      slug: props.hostSlug,
      limit: VIRTUAL_CARDS_PER_PAGE,
      offset,
      status: query.status === 'ALL' ? null : query.status ? query.status : 'ACTIVE',
      hasMissingReceipts: hasMissingReceipts === 'true',
      merchantAccount: { slug: merchant },
      collectiveAccountIds: collectiveAccountIds
        ? collectiveAccountIds.split(',').map(collectiveAccountId => ({ legacyId: parseInt(collectiveAccountId) }))
        : undefined,
    },
  });
  const [displayAssignCardModal, setAssignCardModalDisplay] = React.useState(false);
  const [displayCreateVirtualCardModal, setCreateVirtualCardModalDisplay] = React.useState(false);

  const handleUpdateFilters = queryParams => {
    return router.push(
      {
        pathname: `/dashboard/${props.hostSlug}/host-virtual-cards`,
        query: omitBy(queryParams, value => !value),
      },
      null,
      { scroll: false },
    );
  };

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
  const createVirtualCardAction = {
    label: <FormattedMessage defaultMessage="Create virtual card" />,
    onClick: () => setCreateVirtualCardModalDisplay(true),
  };
  const views = [
    {
      label: 'Active',
      query: { status: 'ACTIVE' },
      actions: [createVirtualCardAction],
    },
    {
      label: 'Missing receipts',
      query: { hasMissingReceipts: 'true' },
      actions: [createVirtualCardAction],
    },
    {
      label: 'Inactive',
      query: { status: 'INACTIVE' },
      actions: [createVirtualCardAction],
    },
    {
      label: 'Canceled',
      query: { status: 'CANCELED' },
      actions: [createVirtualCardAction],
    },
  ];

  // if (loading) {
  //   return <Loading />;
  // }
  const resetFilter = {
    status: 'ALL',
  };
  return (
    <div className="w-full max-w-screen-xl">
      <Filters
        title={<FormattedMessage id="VirtualCards.Title" defaultMessage="Virtual Cards" />}
        filterOptions={[
          {
            key: 'status',
            label: 'Status',
            noFilter: 'ALL',
            options: ['ACTIVE', 'INACTIVE', 'CANCELED'],
          },
          {
            key: 'hasMissingReceipts',
            label: 'Has missing receipts',
          },
        ]}
        views={views}
        query={query}
        // orderBy={query.orderBy}
        onChange={queryParams => handleUpdateFilters({ ...resetFilter, ...queryParams, offset: null })}
      />
      {/* <Flex mt={3} flexDirection={['row', 'column']}>
          <VirtualCardFilters
            isCollectiveFilter={true}
            filters={routerQuery}
            collective={data.host}
            virtualCardMerchants={data.host.hostedVirtualCardMerchants.nodes}
            virtualCardCollectives={data.host.hostedVirtualCardCollectives.nodes}
            onChange={queryParams => handleUpdateFilters({ ...queryParams, offset: null })}
          />
        </Flex> */}
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4 ">
        {data?.host?.hostedVirtualCards.nodes.map(vc => (
          <VirtualCard
            key={vc.id}
            host={data.host}
            virtualCard={vc}
            canEditVirtualCard
            canPauseOrResumeVirtualCard
            canDeleteVirtualCard
            onDeleteRefetchQuery="HostedVirtualCards"
          />
        ))}
      </div>
      {/* <Grid mt={4} gridTemplateColumns={['100%', '366px 366px']} gridGap="32px 24px">
        <AddCardPlaceholder
          width="366px"
          height="248px"
          justifyContent="center"
          alignItems="center"
          flexDirection="column"
        >
          <StyledButton
            my={1}
            px={14}
            py={10}
            buttonStyle="primary"
            buttonSize="medium"
            data-cy="confirmation-modal-continue"
            onClick={() => setCreateVirtualCardModalDisplay(true)}
          >
            +
          </StyledButton>
          <Box mt="10px">
            <FormattedMessage defaultMessage="Create virtual card" />
          </Box>
        </AddCardPlaceholder>
        <AddCardPlaceholder
          width="366px"
          height="248px"
          justifyContent="center"
          alignItems="center"
          flexDirection="column"
        >
          <StyledButton
            my={1}
            px={14}
            py={10}
            buttonStyle="primary"
            buttonSize="medium"
            data-cy="confirmation-modal-continue"
            onClick={() => setAssignCardModalDisplay(true)}
          >
            +
          </StyledButton>
          <Box mt="10px">
            <FormattedMessage id="Host.VirtualCards.AssignCard" defaultMessage="Assign Card" />
          </Box>
        </AddCardPlaceholder>
      </Grid> */}
      <Flex mt={5} alignItems="center" flexDirection="column" justifyContent="center">
        <Pagination
          route={`/${data?.host?.slug}/admin/host-virtual-cards`}
          total={data?.host?.hostedVirtualCards.totalCount}
          limit={VIRTUAL_CARDS_PER_PAGE}
          offset={offset}
          ignoredQueryParams={['slug', 'section']}
        />
        <P mt={1} fontSize="12px">
          <FormattedMessage id="TotalItems" defaultMessage="Total Items" />: {data?.host?.hostedVirtualCards.totalCount}
        </P>
      </Flex>
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
    </div>
  );
};

HostVirtualCards.propTypes = {
  hostSlug: PropTypes.string,
  hideTopsection: PropTypes.func,
};

export default HostVirtualCards;
