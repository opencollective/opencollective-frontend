import React, { Fragment } from 'react';
import PropTypes from 'prop-types';
import { useQuery } from '@apollo/client';
import { omit, omitBy } from 'lodash';
import { useRouter } from 'next/router';
import { FormattedMessage } from 'react-intl';
import styled from 'styled-components';

import { API_V2_CONTEXT, gqlV2 } from '../../../lib/graphql/helpers';

import { Box, Flex, Grid } from '../../Grid';
import { getI18nLink } from '../../I18nFormatters';
import Loading from '../../Loading';
import Pagination from '../../Pagination';
import StyledButton from '../../StyledButton';
import { P } from '../../Text';
import { TOAST_TYPE, useToasts } from '../../ToastProvider';
import AssignVirtualCardModal from '../AssignVirtualCardModal';
import CreateVirtualCardModal from '../CreateVirtualCardModal';
import DeleteVirtualCardModal from '../DeleteVirtualCardModal';
import EditVirtualCardModal from '../EditVirtualCardModal';
import VirtualCard from '../VirtualCard';

import VirtualCardFilters from './virtual-cards/VirtualCardFilters';

const hostVirtualCardsQuery = gqlV2/* GraphQL */ `
  query HostedVirtualCards(
    $slug: String
    $limit: Int!
    $offset: Int!
    $state: String
    $merchantAccount: AccountReferenceInput
    $collectiveAccountIds: [AccountReferenceInput]
  ) {
    host(slug: $slug) {
      id
      legacyId
      slug
      supportedPayoutMethods
      name
      imageUrl
      currency
      hostedVirtualCards(
        limit: $limit
        offset: $offset
        state: $state
        merchantAccount: $merchantAccount
        collectiveAccountIds: $collectiveAccountIds
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

const HostVirtualCards = props => {
  const router = useRouter();
  const routerQuery = omit(router.query, ['slug', 'section']);
  const offset = parseInt(routerQuery.offset) || 0;
  const { state, merchant, collectiveAccountIds } = routerQuery;
  const { addToast } = useToasts();
  const { loading, data, refetch } = useQuery(hostVirtualCardsQuery, {
    context: API_V2_CONTEXT,
    variables: {
      slug: props.collective.slug,
      limit: VIRTUAL_CARDS_PER_PAGE,
      offset,
      state,
      merchantAccount: { slug: merchant },
      collectiveAccountIds: collectiveAccountIds
        ? collectiveAccountIds.split(',').map(collectiveAccountId => ({ legacyId: parseInt(collectiveAccountId) }))
        : undefined,
    },
  });

  const [displayAssignCardModal, setAssignCardModalDisplay] = React.useState(false);
  const [displayCreateVirtualCardModal, setCreateVirtualCardModalDisplay] = React.useState(false);
  const [editingVirtualCard, setEditingVirtualCard] = React.useState(undefined);
  const [deletingVirtualCard, setDeletingVirtualCard] = React.useState(undefined);

  const handleUpdateFilters = queryParams => {
    return router.push(
      {
        pathname: `/${props.collective.slug}/admin/host-virtual-cards`,
        query: omitBy({ ...routerQuery, ...queryParams }, value => !value),
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

  const handleEditCardSuccess = message => {
    addToast({
      type: TOAST_TYPE.SUCCESS,
      message: message,
    });
    setEditingVirtualCard(undefined);
    setDeletingVirtualCard(undefined);
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

  if (loading) {
    return <Loading />;
  }

  return (
    <Fragment>
      <Box>
        <P>
          <FormattedMessage
            id="Host.VirtualCards.List.Description"
            defaultMessage="Make payments easier by creating virtual cards on Privacy.com and linking them to Collectives. One Collective can have multiple virtual cards. <learnMoreLink>Learn more</learnMoreLink>"
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
            isCollectiveFilter={true}
            filters={routerQuery}
            collective={props.collective}
            virtualCardMerchants={data.host.hostedVirtualCardMerchants.nodes}
            virtualCardCollectives={data.host.hostedVirtualCardCollectives.nodes}
            onChange={queryParams => handleUpdateFilters({ ...queryParams, offset: null })}
          />
        </Flex>
      </Box>
      <Grid mt={4} gridTemplateColumns={['100%', '366px 366px']} gridGap="32px 24px">
        <AddCardPlaceholder
          width="366px"
          height="248px"
          justifyContent="center"
          alignItems="center"
          flexDirection="column"
        >
          <StyledButton
            my={1}
            buttonStyle="primary"
            buttonSize="round"
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
            buttonStyle="primary"
            buttonSize="round"
            data-cy="confirmation-modal-continue"
            onClick={() => setAssignCardModalDisplay(true)}
          >
            +
          </StyledButton>
          <Box mt="10px">
            <FormattedMessage id="Host.VirtualCards.AssignCard" defaultMessage="Assign Card" />
          </Box>
        </AddCardPlaceholder>
        {data.host.hostedVirtualCards.nodes.map(vc => (
          <VirtualCard
            key={vc.id}
            {...vc}
            onSuccess={refetch}
            editHandler={() => setEditingVirtualCard(vc)}
            deleteHandler={() => setDeletingVirtualCard(vc)}
            canEditVirtualCard
          />
        ))}
      </Grid>
      <Flex mt={5} alignItems="center" flexDirection="column" justifyContent="center">
        <Pagination
          route={`/${props.collective.slug}/admin/host-virtual-cards`}
          total={data.host.hostedVirtualCards.totalCount}
          limit={VIRTUAL_CARDS_PER_PAGE}
          offset={offset}
          ignoredQueryParams={['slug', 'section']}
        />
        <P mt={1} fontSize="12px">
          <FormattedMessage id="TotalItems" defaultMessage="Total Items" />: {data.host.hostedVirtualCards.totalCount}
        </P>
      </Flex>
      {displayAssignCardModal && (
        <AssignVirtualCardModal
          host={data.host}
          onSuccess={handleAssignCardSuccess}
          onClose={() => {
            setAssignCardModalDisplay(false);
          }}
          show
        />
      )}
      {editingVirtualCard && (
        <EditVirtualCardModal
          host={data.host}
          onSuccess={handleEditCardSuccess}
          onClose={() => {
            setEditingVirtualCard(undefined);
          }}
          virtualCard={editingVirtualCard}
          show
        />
      )}
      {deletingVirtualCard && (
        <DeleteVirtualCardModal
          host={data.host}
          onSuccess={handleEditCardSuccess}
          onClose={() => {
            setDeletingVirtualCard(undefined);
          }}
          virtualCard={deletingVirtualCard}
          show
        />
      )}
      {displayCreateVirtualCardModal && (
        <CreateVirtualCardModal
          host={data.host}
          onSuccess={handleCreateVirtualCardSuccess}
          onClose={() => {
            setCreateVirtualCardModalDisplay(false);
          }}
          show
        />
      )}
    </Fragment>
  );
};

HostVirtualCards.propTypes = {
  collective: PropTypes.shape({
    id: PropTypes.number,
    slug: PropTypes.string,
    settings: PropTypes.shape({
      virtualcards: PropTypes.shape({
        autopause: PropTypes.bool,
        requestcard: PropTypes.bool,
        policy: PropTypes.string,
      }),
    }),
  }),
  hideTopsection: PropTypes.func,
};

export default HostVirtualCards;
