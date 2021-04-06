import React from 'react';
import PropTypes from 'prop-types';
import { gql } from '@apollo/client';
import { graphql } from '@apollo/client/react/hoc';
import { Add } from '@styled-icons/material/Add';
import { get, last, omitBy } from 'lodash';
import memoizeOne from 'memoize-one';
import { withRouter } from 'next/router';
import { defineMessages, FormattedMessage, injectIntl } from 'react-intl';

import GiftCardDetails from '../../GiftCardDetails';
import { Box, Flex } from '../../Grid';
import Link from '../../Link';
import Loading from '../../Loading';
import Pagination from '../../Pagination';
import StyledButton from '../../StyledButton';
import StyledButtonSet from '../../StyledButtonSet';
import StyledSelect from '../../StyledSelect';
import { P } from '../../Text';
import SettingsTitle from '../SettingsTitle';

const messages = defineMessages({
  notBatched: {
    id: 'giftCards.notBatched',
    defaultMessage: 'Not batched',
  },
  allBatches: {
    id: 'giftCards.batches.all',
    defaultMessage: 'All batches',
  },
});

const NOT_BATCHED_KEY = '__not-batched__';

/**
 * A filterable list of gift cards meant to be displayed for organization
 * admins.
 */
class GiftCards extends React.Component {
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

  getQueryParams(picked, newParams) {
    return omitBy({ ...this.props.router.query, ...newParams }, (value, key) => !value || !picked.includes(key));
  }

  renderFilters(onlyConfirmed) {
    let selected = 'all';
    if (onlyConfirmed) {
      selected = 'redeemed';
    }
    if (onlyConfirmed === false) {
      selected = 'pending';
    }

    const query = this.getQueryParams(['filter', 'batch']);
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
          <Link href={{ pathname: `/${this.props.collectiveSlug}/edit/gift-cards`, query: { ...query, filter: item } }}>
            <P p="0.5em 1em" color={isSelected ? 'white.full' : 'black.800'} style={{ margin: 0 }}>
              {item === 'all' && <FormattedMessage id="giftCards.filterAll" defaultMessage="All" />}
              {item === 'redeemed' && <FormattedMessage id="giftCards.filterRedeemed" defaultMessage="Redeemed" />}
              {item === 'pending' && <FormattedMessage id="giftCards.filterPending" defaultMessage="Pending" />}
            </P>
          </Link>
        )}
      </StyledButtonSet>
    );
  }

  renderNoGiftCardMessage(onlyConfirmed) {
    if (onlyConfirmed === undefined) {
      return (
        <Link href={`/${this.props.collectiveSlug}/edit/gift-cards-create`}>
          <FormattedMessage id="giftCards.createFirst" defaultMessage="Create your first gift card!" />
        </Link>
      );
    } else if (onlyConfirmed) {
      return <FormattedMessage id="giftCards.emptyClaimed" defaultMessage="No gift cards claimed yet" />;
    } else {
      return <FormattedMessage id="giftCards.emptyUnclaimed" defaultMessage="No unclaimed gift cards" />;
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
    const queryResult = get(data, 'Collective.createdGiftCards', {});
    const onlyConfirmed = get(data, 'variables.isConfirmed');
    const batches = get(data, 'Collective.giftCardsBatches');
    const { offset, limit, total, paymentMethods = [] } = queryResult;
    const lastGiftCard = last(paymentMethods);
    const [batchesOptions, selectedOption] = this.getBatchesOptions(batches, get(data, 'variables.batch'), intl);

    return (
      <div>
        <SettingsTitle>
          <FormattedMessage id="editCollective.menu.giftCards" defaultMessage="Gift Cards" />
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
                <Link href={`/${collectiveSlug}/edit/gift-cards-create`}>
                  <StyledButton buttonStyle="primary" buttonSize="medium">
                    <Add size="1em" />
                    {'  '}
                    <FormattedMessage id="giftCards.create" defaultMessage="Create gift cards" />
                  </StyledButton>
                </Link>
              </Flex>
            </Flex>
            {batchesOptions.length > 1 && (
              <Box mb={3}>
                <StyledSelect
                  inputId="batches-options"
                  options={batchesOptions}
                  onChange={({ value }) =>
                    this.props.router.push({
                      pathname: `/${collectiveSlug}/edit/gift-cards`,
                      query: this.getQueryParams(['filter', 'batch'], { batch: value }),
                    })
                  }
                  defaultValue={selectedOption}
                />
              </Box>
            )}
          </Box>
          {data.loading ? (
            <Loading />
          ) : (
            <div data-cy="gift-cards-list">
              {paymentMethods.length === 0 && (
                <Flex justifyContent="center" mt="4em">
                  {this.renderNoGiftCardMessage(onlyConfirmed)}
                </Flex>
              )}
              {paymentMethods.map(v => (
                <div key={v.id}>
                  <GiftCardDetails giftCard={v} collectiveSlug={this.props.collectiveSlug} />
                  {v !== lastGiftCard && <hr />}
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

const GIFT_CARDS_PER_PAGE = 15;

const getIsConfirmedFromFilter = filter => {
  if (filter === undefined || filter === 'all') {
    return undefined;
  }
  return filter === 'redeemed';
};

/** A query to get the gift cards created by a collective. Must be authenticated. */
const giftCardsQuery = gql`
  query EditCollectiveGiftCards($CollectiveId: Int, $isConfirmed: Boolean, $limit: Int, $offset: Int, $batch: String) {
    Collective(id: $CollectiveId) {
      id
      giftCardsBatches {
        id
        name
        count
      }
      createdGiftCards(isConfirmed: $isConfirmed, limit: $limit, offset: $offset, batch: $batch) {
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

const getGiftCardsVariablesFromProps = ({ collectiveId, router, limit }) => ({
  CollectiveId: collectiveId,
  isConfirmed: getIsConfirmedFromFilter(router.query.filter),
  batch: router.query.batch === NOT_BATCHED_KEY ? null : router.query.batch,
  offset: Number(router.query.offset) || 0,
  limit: limit || GIFT_CARDS_PER_PAGE,
});

const addGiftCardsData = graphql(giftCardsQuery, {
  options: props => ({
    variables: getGiftCardsVariablesFromProps(props),
    fetchPolicy: 'network-only',
  }),
});

export default withRouter(injectIntl(addGiftCardsData(GiftCards)));
