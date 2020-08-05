import React from 'react';
import PropTypes from 'prop-types';
import { graphql } from '@apollo/react-hoc';
import { get, mapValues } from 'lodash';
import { FormattedMessage } from 'react-intl';
import styled from 'styled-components';

import { CollectiveType } from '../lib/constants/collectives';
import { getErrorFromGraphqlException } from '../lib/errors';
import { API_V2_CONTEXT, gqlV2 } from '../lib/graphql/helpers';
import { addCollectiveCoverData } from '../lib/graphql/queries';
import { Router } from '../server/pages';

import Body from '../components/Body';
import { Sections } from '../components/collective-page/_constants';
import CollectiveNavbar from '../components/CollectiveNavbar';
import Container from '../components/Container';
import ErrorPage from '../components/ErrorPage';
import { parseAmountRange } from '../components/expenses/filters/ExpensesAmountFilter';
import { getDateRangeFromPeriod } from '../components/expenses/filters/ExpensesDateFilter';
import Footer from '../components/Footer';
import { Box, Flex } from '../components/Grid';
import Header from '../components/Header';
import Link from '../components/Link';
import Loading from '../components/Loading';
import MessageBox from '../components/MessageBox';
import Page from '../components/Page';
import Pagination from '../components/Pagination';
import SearchBar from '../components/SearchBar';
import StyledHr from '../components/StyledHr';
import { H1 } from '../components/Text';
import TransactionsDownloadCSV from '../components/transactions/TransactionsDownloadCSV';
import TransactionsDownloadInvoices from '../components/transactions/TransactionsDownloadInvoices';
import TransactionsFilters from '../components/transactions/TransactionsFilters';
import TransactionsList from '../components/transactions/TransactionsList';
import { withUser } from '../components/UserProvider';

const transactionsQuery = gqlV2/* GraphQL */ `
  query Transactions(
    $slug: String!
    $limit: Int!
    $offset: Int!
    $type: TransactionType
    $minAmount: Int
    $maxAmount: Int
    $dateFrom: ISODateTime
    $searchTerm: String
  ) {
    transactions(
      account: { slug: $slug }
      limit: $limit
      offset: $offset
      type: $type
      minAmount: $minAmount
      maxAmount: $maxAmount
      dateFrom: $dateFrom
      searchTerm: $searchTerm
    ) {
      totalCount
      offset
      limit
      nodes {
        id
        uuid
        amount {
          currency
          valueInCents
        }
        netAmount {
          currency
          valueInCents
        }
        platformFee {
          currency
          valueInCents
        }
        paymentProcessorFee {
          currency
          valueInCents
        }
        hostFee {
          currency
          valueInCents
        }
        type
        description
        createdAt
        isRefunded
        toAccount {
          id
          name
          slug
          type
          imageUrl
          ... on Collective {
            host {
              name
              slug
              type
            }
          }
        }
        fromAccount {
          id
          name
          slug
          type
          imageUrl
        }
        paymentMethod {
          type
        }
        order {
          id
          status
        }
        expense {
          id
          status
          tags
          type
          legacyId
          comments {
            totalCount
          }
          payoutMethod {
            type
          }
          account {
            slug
          }
          createdByAccount {
            slug
          }
        }
      }
    }
  }
`;

const TransactionPageWrapper = styled.div`
  display: flex;
  flex-direction: column;
  min-height: 100vh;
  #footer {
    margin-top: auto;
  }
`;

const EXPENSES_PER_PAGE = 15;

const getVariablesFromQuery = query => {
  const amountRange = parseAmountRange(query.amount);
  const [dateFrom] = getDateRangeFromPeriod(query.period);
  return {
    offset: parseInt(query.offset) || 0,
    limit: parseInt(query.limit) || EXPENSES_PER_PAGE,
    type: query.type,
    status: query.status,
    tags: query.tag ? [query.tag] : undefined,
    minAmount: amountRange[0] && amountRange[0] * 100,
    maxAmount: amountRange[1] && amountRange[1] * 100,
    payoutMethodType: query.payout,
    dateFrom,
    searchTerm: query.searchTerm,
  };
};

class TransactionsPage extends React.Component {
  static async getInitialProps({ query: { collectiveSlug, ...query } }) {
    return { slug: collectiveSlug, query };
  }

  static propTypes = {
    slug: PropTypes.string, // from getInitialProps, for addCollectiveCoverData
    data: PropTypes.object.isRequired, // from withData
    transactionsData: PropTypes.object,
    LoggedInUser: PropTypes.object,
    query: PropTypes.object,
  };

  constructor(props) {
    super(props);
    this.state = { Collective: get(props, 'data.Collective') };
  }

  async componentDidMount() {
    const { data } = this.props;
    const Collective = (data && data.Collective) || this.state.collective;
    this.setState({ Collective });
  }

  componentDidUpdate(oldProps) {
    // We store the component in state and update only if the next one is not
    // null because of a bug in Apollo where it strips the `Collective` from data
    // during re-hydratation.
    // See https://github.com/opencollective/opencollective/issues/1872
    const currentCollective = get(this.props, 'data.Collective');
    if (currentCollective && get(oldProps, 'data.Collective') !== currentCollective) {
      this.setState({ Collective: currentCollective });
    }
  }

  render() {
    const { LoggedInUser, query, transactionsData, data, slug } = this.props;
    const collective = get(this.props, 'data.Collective') || this.state.Collective;
    const { transactions, error, loading, variables } = transactionsData;
    const hasFilters = Object.entries(query).some(([key, value]) => {
      return !['view', 'offset', 'limit', 'slug'].includes(key) && value;
    });
    const isHostAdmin = LoggedInUser?.isHostAdmin(collective);
    const isCollectiveAdmin = LoggedInUser?.canEditCollective(collective);
    const canDownloadInvoices =
      isHostAdmin || (isCollectiveAdmin && (collective.type === 'ORGANIZATION' || collective.type === 'USER'));

    if (!collective && data.loading) {
      return (
        <Page title="Transactions">
          <Loading />
        </Page>
      );
    } else if (!collective) {
      return <ErrorPage data={data} />;
    }

    return (
      <TransactionPageWrapper className="TransactionsPage">
        <Header collective={collective} LoggedInUser={LoggedInUser} />

        <Body>
          <Container mb={4}>
            <CollectiveNavbar
              collective={collective}
              isAdmin={LoggedInUser && LoggedInUser.canEditCollective(collective)}
              showEdit
              selectedSection={collective.type === CollectiveType.COLLECTIVE ? Sections.BUDGET : Sections.TRANSACTIONS}
              callsToAction={{
                hasSubmitExpense: [CollectiveType.COLLECTIVE, CollectiveType.EVENT].includes(collective.type),
              }}
            />
          </Container>
          <Box maxWidth={1000} m="0 auto" py={[0, 5]} px={2}>
            <Flex justifyContent="space-between">
              <H1 fontSize="32px" lineHeight="40px" py={2} fontWeight="normal" display={['none', 'block']}>
                <FormattedMessage id="section.transactions.title" defaultMessage="Transactions" />
              </H1>
              <Box p={2} flexGrow={[1, 0]}>
                <SearchBar
                  defaultValue={query.searchTerm}
                  onSubmit={searchTerm => Router.pushRoute('transactions', { ...query, searchTerm, offset: null })}
                />
              </Box>
            </Flex>
            <StyledHr my="24px" mx="8px" borderWidth="0.5px" />
            <Flex
              mb={['8px', '46px']}
              mx="8px"
              justifyContent="space-between"
              flexDirection={['column', 'row']}
              alignItems={['stretch', 'flex-end']}
            >
              <TransactionsFilters
                filters={query}
                collective={collective}
                onChange={queryParams =>
                  Router.pushRoute('transactions', {
                    ...query,
                    ...queryParams,
                    collectiveSlug: slug,
                    offset: null,
                  })
                }
              />
              <Flex>
                {canDownloadInvoices && (
                  <Box mr="8px">
                    <TransactionsDownloadInvoices collective={collective} />
                  </Box>
                )}
                <TransactionsDownloadCSV collective={collective} />
              </Flex>
            </Flex>
            {error ? (
              <MessageBox type="error" withIcon>
                {getErrorFromGraphqlException(error).message}
              </MessageBox>
            ) : !loading && !transactions?.nodes?.length ? (
              <MessageBox type="info" withIcon data-cy="zero-transactions-message">
                {hasFilters ? (
                  <FormattedMessage
                    id="TransactionsList.Empty"
                    defaultMessage="No transaction matches the given filters, <ResetLink>reset them</ResetLink> to see all transactions."
                    values={{
                      ResetLink(text) {
                        return (
                          <Link
                            data-cy="reset-transactions-filters"
                            route="transactions"
                            params={{
                              ...mapValues(query, () => null),
                              collectiveSlug: collective.slug,
                              view: 'transactions',
                            }}
                          >
                            {text}
                          </Link>
                        );
                      },
                    }}
                  />
                ) : (
                  <FormattedMessage id="transactions.empty" defaultMessage="No transactions" />
                )}
              </MessageBox>
            ) : (
              <React.Fragment>
                <TransactionsList
                  isLoading={loading}
                  nbPlaceholders={variables.limit}
                  transactions={transactions?.nodes}
                />
                <Flex mt={5} justifyContent="center">
                  <Pagination
                    route="transactions"
                    total={transactions?.totalCount}
                    limit={variables.limit}
                    offset={variables.offset}
                    scrollToTopOnChange
                  />
                </Flex>
              </React.Fragment>
            )}
          </Box>
        </Body>

        <Footer />
      </TransactionPageWrapper>
    );
  }
}

const addTransactionsData = graphql(transactionsQuery, {
  name: 'transactionsData',
  // skip: props => !props.slug,
  options: props => {
    return {
      variables: { slug: props.slug, ...getVariablesFromQuery(props.query) },
      context: API_V2_CONTEXT,
    };
  },
});

export default withUser(addTransactionsData(addCollectiveCoverData(TransactionsPage)));
