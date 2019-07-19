import React from 'react';
import PropTypes from 'prop-types';
import { FormattedMessage, injectIntl, defineMessages, FormattedDate } from 'react-intl';
import { Flex, Box } from '@rebass/grid';
import { orderBy } from 'lodash';
import gql from 'graphql-tag';
import { graphql } from 'react-apollo';
import memoizeOne from 'memoize-one';

import { formatCurrency } from '../../lib/utils';
import { H3, P, Span } from '../Text';
import Container from '../Container';
import MessageBox from '../MessageBox';
import Avatar from '../Avatar';
import LoadingPlaceholder from '../LoadingPlaceholder';
import DebitCreditList, { DebitItem, CreditItem } from '../DebitCreditList';
import StyledFilters from '../StyledFilters';

import ContainerSectionContent from './ContainerSectionContent';
import LinkCollective from '../LinkCollective';
import StyledLink from '../StyledLink';

const FILTERS = { ALL: 'ALL', CREDIT: 'CREDIT', DEBIT: 'DEBIT' };
const FILTERS_LIST = Object.values(FILTERS);
const I18nFilters = defineMessages({
  [FILTERS.ALL]: {
    id: 'SectionTransactions.All',
    defaultMessage: 'All',
  },
  [FILTERS.CREDIT]: {
    id: 'SectionTransactions.Credit',
    defaultMessage: 'Credit',
  },
  [FILTERS.DEBIT]: {
    id: 'SectionTransactions.Debit',
    defaultMessage: 'Debit',
  },
});

class SectionTransactions extends React.Component {
  static propTypes = {
    /** Collective */
    collective: PropTypes.shape({
      id: PropTypes.number.isRequired,
      name: PropTypes.string.isRequired,
    }).isRequired,

    /** @ignore from withData */
    data: PropTypes.shape({
      loading: PropTypes.bool,
      /** Expenses paid + refunds */
      creditTransactions: PropTypes.arrayOf(
        PropTypes.shape({
          id: PropTypes.number.isRequired,
          amount: PropTypes.number.isRequired,
          createdAt: PropTypes.string.isRequired,
          type: PropTypes.string.isRequired,
          fromcollective: PropTypes.shape({
            id: PropTypes.number.isRequired,
            name: PropTypes.string.isRequired,
            slug: PropTypes.string.isRequired,
          }),
        }),
      ),
      /** Financial contributions */
      debitTransactions: PropTypes.arrayOf(
        PropTypes.shape({
          id: PropTypes.number.isRequired,
          amount: PropTypes.number.isRequired,
          createdAt: PropTypes.string.isRequired,
          type: PropTypes.string.isRequired,
          collective: PropTypes.shape({
            id: PropTypes.number.isRequired,
            name: PropTypes.string.isRequired,
            slug: PropTypes.string.isRequired,
          }),
        }),
      ),
    }),

    /** @ignore from injectIntl */
    intl: PropTypes.object,
  };

  state = { filter: FILTERS.ALL };

  getAllTransactions = memoizeOne((credits, debits, filter) => {
    if (filter === FILTERS.CREDIT) {
      return credits;
    } else if (filter === FILTERS.DEBIT) {
      return debits;
    } else {
      return orderBy([...credits, ...debits], t => new Date(t.createdAt), ['desc']).slice(0, 10);
    }
  });

  render() {
    const { data, intl } = this.props;
    const { filter } = this.state;
    let showFilters = true;

    if (data.loading) {
      return <LoadingPlaceholder height={600} borderRadius={0} />;
    } else if (data.creditTransactions.length === 0 && data.debitTransactions.length === 0) {
      return (
        <ContainerSectionContent pt={5} pb={6}>
          <H3 mb={4} fontSize={['H4', 'H2']} fontWeight="normal" color="black.900">
            <FormattedMessage id="SectionTransactions.Title" defaultMessage="Transactions" />
          </H3>
          <MessageBox type="info" withIcon>
            <FormattedMessage id="SectionTransactions.Empty" defaultMessage="No transaction yet." />
          </MessageBox>
        </ContainerSectionContent>
      );
    } else if (data.creditTransactions.length === 0 || data.debitTransactions.length === 0) {
      showFilters = false;
    }

    const transactions = this.getAllTransactions(data.creditTransactions, data.debitTransactions, filter);
    return (
      <ContainerSectionContent pt={5} pb={6}>
        <H3 mb={4} fontSize={['H4', 'H2']} fontWeight="normal" color="black.900">
          <FormattedMessage id="SectionTransactions.Title" defaultMessage="Transactions" />
        </H3>
        {showFilters && (
          <Box mb={3}>
            <StyledFilters
              filters={FILTERS_LIST}
              selected={this.state.filter}
              onChange={filter => this.setState({ filter })}
              getLabel={filter => intl.formatMessage(I18nFilters[filter])}
              minButtonWidth={180}
            />
          </Box>
        )}

        <DebitCreditList>
          {transactions.map(transaction => {
            const { id, currency, fromCollective, description, createdAt } = transaction;
            const isCredit = transaction.type === 'CREDIT';
            const amount = isCredit
              ? transaction.netAmountInCollectiveCurrency
              : transaction.netAmountInCollectiveCurrency * -1;
            const ItemContainer = isCredit ? CreditItem : DebitItem;

            return (
              <ItemContainer key={id}>
                <Container p={24} display="flex" justifyContent="space-between">
                  <Flex>
                    <Box mr={3}>
                      <Avatar collective={fromCollective} radius={40} />
                    </Box>
                    <Flex flexDirection="column" justifyContent="space-between">
                      <P color="black.900" fontWeight="600">
                        {description}
                      </P>
                      <P color="black.400">
                        <StyledLink as={LinkCollective} collective={fromCollective} /> |{' '}
                        <FormattedDate value={createdAt} />
                      </P>
                    </Flex>
                  </Flex>
                  <P fontSize="LeadParagraph">
                    {isCredit ? (
                      <Span color="green.700" mr={2}>
                        +
                      </Span>
                    ) : (
                      <Span color="red.700" mr={2}>
                        −
                      </Span>
                    )}
                    <Span fontWeight="bold" mr={1}>
                      {formatCurrency(Math.abs(amount), currency)}
                    </Span>
                    <Span color="black.400" textTransform="uppercase">
                      {currency}
                    </Span>
                  </P>
                </Container>
              </ItemContainer>
            );
          })}
        </DebitCreditList>
      </ContainerSectionContent>
    );
  }
}

export default React.memo(
  graphql(
    gql`
      query SectionCollective($id: Int!) {
        creditTransactions: allTransactions(CollectiveId: $id, type: "CREDIT", limit: 10) {
          id
          netAmountInCollectiveCurrency
          createdAt
          type
          currency
          description
          fromCollective {
            id
            name
            slug
          }
        }
        debitTransactions: allTransactions(CollectiveId: $id, type: "DEBIT", limit: 10) {
          id
          netAmountInCollectiveCurrency
          createdAt
          type
          currency
          description
          fromCollective {
            id
            name
            slug
          }
        }
      }
    `,
    {
      options(props) {
        return { variables: { id: props.collective.id } };
      },
    },
  )(injectIntl(SectionTransactions)),
);
