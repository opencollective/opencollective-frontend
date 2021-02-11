import React from 'react';
import PropTypes from 'prop-types';
import { gql } from '@apollo/client';
import { graphql } from '@apollo/client/react/hoc';
import { Add } from '@styled-icons/material/Add';
import { get, last } from 'lodash';
import memoizeOne from 'memoize-one';
import NextLink from 'next/link';
import { withRouter } from 'next/router';
import { defineMessages, FormattedMessage, injectIntl } from 'react-intl';

import { Router } from '../../../server/pages';

import { Box, Flex } from '../../Grid';
import Loading from '../../Loading';
import Pagination from '../../Pagination';
import StyledButton from '../../StyledButton';
import StyledButtonSet from '../../StyledButtonSet';
import StyledSelect from '../../StyledSelect';
import { P } from '../../Text';
import VirtualCardDetails from '../../VirtualCardDetails';
import SettingsTitle from '../SettingsTitle';

const messages = defineMessages({
  notBatched: {
    id: 'virtualCards.notBatched',
    defaultMessage: 'Not batched',
  },
  allBatches: {
    id: 'virtualCards.batches.all',
    defaultMessage: 'All batches',
  },
});

const NOT_BATCHED_KEY = '__not-batched__';

/**
 * A filterable list of virtual cards meant to be displayed for organization
 * admins.
 */
class VirtualCards extends React.Component {
  static propTypes = {
    collectiveId: PropTypes.number.isRequired,
    collectiveSlug: PropTypes.string.isRequired,
    /** Max number of items to display */
    limit: PropTypes.number,
    /** Provided by graphql */
    data: PropTypes.object,
    /** Provided by withRouter */
    router: PropTypes.object,
    /** @ignore */
    intl: PropTypes.object,
  };

  constructor(props) {
    super(props);
    this.state = { claimedFilter: 'all' };
  }

  renderFilters(onlyConfirmed) {
    let selected = 'all';
    if (onlyConfirmed) {
      selected = 'redeemed';
    }
    if (onlyConfirmed === false) {
      selected = 'pending';
    }

    return (
      <StyledButtonSet
        justifyContent="center"
        mt={[4, 0]}
        items={['all', 'redeemed', 'pending']}
        selected={selected}
        buttonProps={{ p: 1 }}
        display="block"
      >
        {({ item, isSelected }) => (
          <NextLink href={{ pathname: `editCollective`, query: this.props.router.query }}>
            <P p="0.5em 1em" color={isSelected ? 'white.full' : 'black.800'} style={{ margin: 0 }}>
              {item === 'all' && <FormattedMessage id="virtualCards.filterAll" defaultMessage="All" />}
              {item === 'redeemed' && <FormattedMessage id="virtualCards.filterRedeemed" defaultMessage="Redeemed" />}
              {item === 'pending' && <FormattedMessage id="virtualCards.filterPending" defaultMessage="Pending" />}
            </P>
          </NextLink>
        )}
      </StyledButtonSet>
    );
  }

  renderNoVirtualCardMessage(onlyConfirmed) {
    if (onlyConfirmed === undefined) {
      return (
        <NextLink href={`${this.props.collectiveSlug}/edit/gift-cards-create`}>
          <FormattedMessage id="virtualCards.createFirst" defaultMessage="Create your first gift card!" />
        </NextLink>
      );
    } else if (onlyConfirmed) {
      return <FormattedMessage id="virtualCards.emptyClaimed" defaultMessage="No gift cards claimed yet" />;
    } else {
      return <FormattedMessage id="virtualCards.emptyUnclaimed" defaultMessage="No unclaimed gift cards" />;
    }
  }

  /** Get batch options for select. First option is always "No batch" */
  getBatchesOptions = memoizeOne((batches, selected, intl) => {
    if (!batches || batches.length < 2) {
      return [[], null];
    } else {
      const options = [
        { label: intl.formatMessage(messages.allBatches), value: undefined },
        ...batches.map(batch => ({
          label: `${batch.name || intl.formatMessage(messages.notBatched)} (${batch.count})`,
          value: batch.name || NOT_BATCHED_KEY,
        })),
      ];

      return [options, options.find(option => option.value === selected)];
    }
  });

  render() {
    const { data, collectiveSlug, intl } = this.props;
    const queryResult = get(data, 'Collective.createdVirtualCards', {});
    const onlyConfirmed = get(data, 'variables.isConfirmed');
    const batches = get(data, 'Collective.virtualCardsBatches');
    const { offset, limit, total, paymentMethods = [] } = queryResult;
    const lastVirtualCard = last(paymentMethods);
    const [batchesOptions, selectedOption] = this.getBatchesOptions(batches, get(data, 'variables.batch'), intl);

    return (
      <div>
        <SettingsTitle>
          <FormattedMessage id="editCollective.menu.virtualCards" defaultMessage="Gift Cards" />
        </SettingsTitle>
        <Box mt={4}>
          <Box mb={4}>
            <Flex
              mb={3}
              flexDirection={['column-reverse', 'row']}
              justifyContent="space-between"
              alignItems="center"
              flexWrap="wrap"
            >
              {this.renderFilters(onlyConfirmed)}
              <Flex justifyContent="center">
                <NextLink href={`${collectiveSlug}/edit/gift-cards-create`}>
                  <StyledButton buttonStyle="primary" buttonSize="medium">
                    <Add size="1em" />
                    {'  '}
                    <FormattedMessage id="virtualCards.create" defaultMessage="Create gift cards" />
                  </StyledButton>
                </NextLink>
              </Flex>
            </Flex>
            {batchesOptions.length > 1 && (
              <Box mb={3}>
                <StyledSelect
                  options={batchesOptions}
                  onChange={({ value }) =>
                    Router.pushRoute('editCollective', { ...this.props.router.query, batch: value })
                  }
                  defaultValue={selectedOption}
                />
              </Box>
            )}
          </Box>
          {data.loading ? (
            <Loading />
          ) : (
            <div data-cy="virtualcards-list">
              {paymentMethods.length === 0 && (
                <Flex justifyContent="center" mt="4em">
                  {this.renderNoVirtualCardMessage(onlyConfirmed)}
                </Flex>
              )}
              {paymentMethods.map(v => (
                <div key={v.id}>
                  <VirtualCardDetails virtualCard={v} collectiveSlug={this.props.collectiveSlug} />
                  {v !== lastVirtualCard && <hr />}
                </div>
              ))}
              {total > limit && (
                <Flex className="vc-pagination" justifyContent="center" mt={4}>
                  <Pagination offset={offset} total={total} limit={limit} />
                </Flex>
              )}
            </div>
          )}
        </Box>
      </div>
    );
  }
}

const VIRTUALCARDS_PER_PAGE = 15;

const getIsConfirmedFromFilter = filter => {
  if (filter === undefined || filter === 'all') {
    return undefined;
  }
  return filter === 'redeemed';
};

/** A query to get the virtual cards created by a collective. Must be authenticated. */
const virtualCardsQuery = gql`
  query EditCollectiveVirtualCards(
    $CollectiveId: Int
    $isConfirmed: Boolean
    $limit: Int
    $offset: Int
    $batch: String
  ) {
    Collective(id: $CollectiveId) {
      id
      virtualCardsBatches {
        id
        name
        count
      }
      createdVirtualCards(isConfirmed: $isConfirmed, limit: $limit, offset: $offset, batch: $batch) {
        offset
        limit
        total
        paymentMethods {
          id
          uuid
          currency
          name
          service
          type
          batch
          data
          initialBalance
          monthlyLimitPerMember
          balance
          expiryDate
          isConfirmed
          data
          createdAt
          expiryDate
          description
          collective {
            id
            slug
            imageUrl
            type
            name
          }
        }
      }
    }
  }
`;

const getVirtualCardsVariablesFromProps = ({ collectiveId, router, limit }) => ({
  CollectiveId: collectiveId,
  isConfirmed: getIsConfirmedFromFilter(router.query.filter),
  batch: router.query.batch === NOT_BATCHED_KEY ? null : router.query.batch,
  offset: Number(router.query.offset) || 0,
  limit: limit || VIRTUALCARDS_PER_PAGE,
});

const addVirtualCardsData = graphql(virtualCardsQuery, {
  options: props => ({
    variables: getVirtualCardsVariablesFromProps(props),
    fetchPolicy: 'network-only',
  }),
});

export default withRouter(injectIntl(addVirtualCardsData(VirtualCards)));
