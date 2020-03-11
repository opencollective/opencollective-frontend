import { Box, Flex } from '@rebass/grid';
import { get, omit, pick } from 'lodash';
import memoizeOne from 'memoize-one';
import { withRouter } from 'next/router';
import PropTypes from 'prop-types';
import React from 'react';
import { graphql } from 'react-apollo';
import { FormattedMessage } from 'react-intl';

import { generateNotFoundError } from '../lib/errors';
import CollectiveNavbar from '../components/CollectiveNavbar';
import CollectiveThemeProvider from '../components/CollectiveThemeProvider';
import Container from '../components/Container';
import ContainerOverlay from '../components/ContainerOverlay';
import ErrorPage from '../components/ErrorPage';
import ExpandableExpensePolicies from '../components/expenses/ExpandableExpensePolicies';
import ExpenseForm from '../components/expenses/ExpenseForm';
import ExpenseSummary from '../components/expenses/ExpenseSummary';
import MobileCollectiveInfoStickyBar from '../components/expenses/MobileCollectiveInfoStickyBar';
import CreateExpenseFAQ from '../components/faqs/CreateExpenseFAQ';
import FormattedMoneyAmount from '../components/FormattedMoneyAmount';
import LoadingPlaceholder from '../components/LoadingPlaceholder';
import MessageBox from '../components/MessageBox';
import Page from '../components/Page';
import PageFeatureNotSupported from '../components/PageFeatureNotSupported';
import SignInOrJoinFree from '../components/SignInOrJoinFree';
import StyledButton from '../components/StyledButton';
import StyledInputTags from '../components/StyledInputTags';
import StyledLink from '../components/StyledLink';
import { H1, H5 } from '../components/Text';
import { withUser } from '../components/UserProvider';
import hasFeature, { FEATURES } from '../lib/allowed-features';
import { API_V2_CONTEXT, gqlV2 } from '../lib/graphql/helpers';
import { getErrorFromGraphqlException } from '../lib/utils';
import expenseTypes from '../lib/constants/expenseTypes';
import { Router } from '../server/pages';
import ExpenseNotesForm from '../components/expenses/ExpenseNotesForm';

const STEPS = { FORM: 'FORM', SUMMARY: 'summary' };

class CreateExpensePage extends React.Component {
  static getInitialProps({ query: { collectiveSlug, parentCollectiveSlug } }) {
    return { collectiveSlug, parentCollectiveSlug };
  }

  static propTypes = {
    /** from getInitialProps */
    collectiveSlug: PropTypes.string.isRequired,
    /** from getInitialProps */
    parentCollectiveSlug: PropTypes.string,
    /** from withUser */
    LoggedInUser: PropTypes.object,
    /** from withUser */
    loadingLoggedInUser: PropTypes.bool,
    /** from withRouter */
    router: PropTypes.object,
    /** from apollo */
    createExpense: PropTypes.func.isRequired,
    /** from apollo */
    data: PropTypes.shape({
      loading: PropTypes.bool,
      error: PropTypes.any,
      refetch: PropTypes.func.isRequired,
      account: PropTypes.shape({
        id: PropTypes.string.isRequired,
        name: PropTypes.string.isRequired,
        description: PropTypes.string,
        type: PropTypes.string.isRequired,
        twitterHandle: PropTypes.string,
        imageUrl: PropTypes.string,
      }),
      loggedInAccount: PropTypes.shape({
        adminMemberships: PropTypes.shape({
          nodes: PropTypes.arrayOf(
            PropTypes.shape({
              id: PropTypes.string.isRequired,
              account: PropTypes.shape({
                id: PropTypes.string.isRequired,
                slug: PropTypes.string.isRequired,
                name: PropTypes.string,
                imageUrl: PropTypes.string,
              }),
            }),
          ),
        }),
      }),
    }).isRequired, // from withData
  };

  constructor(props) {
    super(props);
    this.stepTitleRef = React.createRef();
    this.state = {
      step: STEPS.FORM,
      expense: null,
      tags: null,
      isSubmitting: false,
    };
  }

  componentDidMount() {
    // Reftech data if user is logged in
    if (this.props.LoggedInUser) {
      this.props.data.refetch();
    }
  }

  componentDidUpdate(oldProps, oldState) {
    // Reftech data if user is logged in
    if (!oldProps.LoggedInUser && this.props.LoggedInUser) {
      this.props.data.refetch();
    }

    // Scroll to top when switching steps
    if (oldState.step !== this.state.step && this.stepTitleRef.current) {
      this.stepTitleRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }

  getPageMetaData(collective) {
    if (collective) {
      return { title: `${collective.name} - New expense` };
    } else {
      return { title: `New expense` };
    }
  }

  onFormSubmit = expense => {
    this.setState({ expense, step: STEPS.SUMMARY });
  };

  onSummarySubmit = async () => {
    try {
      this.setState({ isSubmitting: true, error: null });
      const { expense, tags } = this.state;
      const attachmentFieldsToOmit = expense.type === expenseTypes.INVOICE ? ['id', 'url'] : ['id'];
      const result = await this.props.createExpense({
        account: { id: this.props.data.account.id },
        expense: {
          ...pick(expense, ['description', 'type', 'privateMessage']),
          payee: pick(expense.payee, ['id']),
          payoutMethod: pick(expense.payoutMethod, ['id', 'name', 'data', 'isSaved', 'type']),
          // Omit attachment's ids that were created for keying purposes
          attachments: expense.attachments.map(a => omit(a, attachmentFieldsToOmit)),
          tags: tags,
        },
      });

      const legacyExpenseId = result.data.createExpense.legacyId;
      Router.pushRoute(`/${this.props.collectiveSlug}/expenses/${legacyExpenseId}/v2`);
    } catch (e) {
      this.setState({ error: getErrorFromGraphqlException(e), isSubmitting: false });
    }
  };

  onNotesChanges = e => {
    const name = e.target.name;
    const value = e.target.value;
    this.setState(state => ({
      expense: {
        ...state.expense,
        [name]: value,
      },
    }));
  };

  setTags = tags => {
    this.setState({ tags });
  };

  getPayoutProfiles = memoizeOne(loggedInAccount => {
    if (!loggedInAccount) {
      return [];
    } else {
      const accountsAdminOf = get(loggedInAccount, 'adminMemberships.nodes', []).map(member => member.account);
      return [loggedInAccount, ...accountsAdminOf];
    }
  });

  render() {
    const { collectiveSlug, data, LoggedInUser, loadingLoggedInUser, router } = this.props;
    const { step } = this.state;

    if (!data.loading) {
      if (!data || data.error) {
        return <ErrorPage data={data} />;
      } else if (!data.account) {
        return <ErrorPage error={generateNotFoundError(collectiveSlug, true)} log={false} />;
      } else if (!hasFeature(data.account, FEATURES.NEW_EXPENSE_FLOW)) {
        return <PageFeatureNotSupported />;
      }
    }

    const collective = data && data.account;
    const host = collective && collective.host;
    const loggedInAccount = data && data.loggedInAccount;
    return (
      <Page collective={collective} {...this.getPageMetaData(collective)} withoutGlobalStyles>
        <CollectiveThemeProvider collective={collective}>
          <React.Fragment>
            <CollectiveNavbar collective={collective} isLoading={!collective} />
            <Container position="relative" minHeight={800}>
              {!loadingLoggedInUser && !LoggedInUser && (
                <ContainerOverlay p={2} top="0" position={['fixed', null, 'absolute']}>
                  <SignInOrJoinFree routes={{ join: `/create-account?next=${encodeURIComponent(router.asPath)}` }} />
                </ContainerOverlay>
              )}
              <Box maxWidth={1160} m="0 auto" px={[2, 3, 4]} py={[4, 5]}>
                {step === STEPS.SUMMARY && (
                  <StyledLink color="black.600" onClick={() => this.setState({ step: STEPS.FORM, error: null })} mb={4}>
                    &larr;&nbsp;
                    <FormattedMessage id="Back" defaultMessage="Back" />
                  </StyledLink>
                )}
                <Flex justifyContent="space-between" flexWrap="wrap">
                  <Box flex="1 1 500px" minWidth={300} maxWidth={750} mr={[3, null, 5]}>
                    <H1 fontSize="H4" mb={24} py={2} ref={this.stepTitleRef}>
                      {step === STEPS.FORM ? (
                        <FormattedMessage id="create-expense.title" defaultMessage="Submit expense" />
                      ) : (
                        <FormattedMessage id="Expense.summary" defaultMessage="Expense summary" />
                      )}
                    </H1>
                    {data.loading ? (
                      <LoadingPlaceholder width="100%" height={400} />
                    ) : (
                      <Box>
                        {step === STEPS.FORM && (
                          <ExpenseForm
                            collective={collective}
                            loading={loadingLoggedInUser}
                            onSubmit={this.onFormSubmit}
                            expense={this.state.expense}
                            payoutProfiles={this.getPayoutProfiles(loggedInAccount)}
                          />
                        )}
                        {step === STEPS.SUMMARY && (
                          <div>
                            <ExpenseSummary
                              host={collective.host}
                              expense={{
                                ...this.state.expense,
                                tags: this.state.tags,
                                createdByAccount: this.props.data.loggedInAccount,
                              }}
                            />
                            <ExpenseNotesForm onChange={this.onNotesChanges} />
                            {this.state.error && (
                              <MessageBox type="error" withIcon mt={3}>
                                {this.state.error.message}
                              </MessageBox>
                            )}
                            <StyledButton
                              buttonStyle="primary"
                              mt={3}
                              data-cy="submit-expense-btn"
                              onClick={this.onSummarySubmit}
                              loading={this.state.isSubmitting}
                              minWidth={150}
                            >
                              <FormattedMessage id="ExpenseForm.Submit" defaultMessage="Submit expense" />
                            </StyledButton>
                          </div>
                        )}
                      </Box>
                    )}
                  </Box>
                  <Box mt={4} width={270}>
                    <H5 mb={3}>
                      <FormattedMessage id="CollectiveBalance" defaultMessage="Collective balance" />
                    </H5>
                    <Container borderLeft="1px solid" borderColor="green.600" pl={3} fontSize="H5" color="black.500">
                      {data.loading ? (
                        <LoadingPlaceholder height={28} width={75} />
                      ) : (
                        <FormattedMoneyAmount
                          currency={collective.currency}
                          amount={collective.balance}
                          amountStyles={{ color: 'black.800' }}
                        />
                      )}
                    </Container>
                    <Box mt={50}>
                      <H5 mb={3}>
                        <FormattedMessage id="Tags" defaultMessage="Tags" />
                      </H5>
                      <StyledInputTags inputId="expense-tags" onChange={this.setTags} disabled />
                    </Box>
                    <ExpandableExpensePolicies host={host} collective={collective} mt={50} />
                    <Box mt={50}>
                      <CreateExpenseFAQ
                        withBorderLeft
                        withNewButtons
                        titleProps={{ fontSize: 'H5', fontWeight: 500, mb: 3 }}
                      />
                    </Box>
                  </Box>
                </Flex>
              </Box>
              <MobileCollectiveInfoStickyBar isLoading={data.loading} collective={collective} host={host} />
            </Container>
          </React.Fragment>
        </CollectiveThemeProvider>
      </Page>
    );
  }
}

const getData = graphql(
  gqlV2`
    query CreateExpensePage($collectiveSlug: String!) {
      account(slug: $collectiveSlug, throwIfMissing: false) {
        id
        slug
        name
        type
        description
        settings
        imageUrl
        twitterHandle
        currency
        expensePolicy
        payoutMethods {
          id
          type
          name
          data
        }
        ... on Collective {
          id
          isApproved
          balance
          host {
            id
            name
            slug
            type
            expensePolicy
            location {
              address
              country
            }
            transferwise {
              availableCurrencies
            }
          }
        }
        ... on Event {
          id
          isApproved
          balance
          host {
            id
            name
            slug
            type
            expensePolicy
            location {
              address
              country
            }
          }
        }
      }
      loggedInAccount {
        id
        slug
        imageUrl
        type
        name
        payoutMethods {
          id
          type
          name
          data
        }
        adminMemberships: memberOf(role: ADMIN) {
          nodes {
            id
            account {
              id
              slug
              imageUrl
              type
              name
              location {
                address
                country
              }
              payoutMethods {
                id
                type
                name
                data
              }
            }
          }
        }
      }
    }
  `,
  {
    options: {
      context: API_V2_CONTEXT,
    },
  },
);

const withCreateExpenseMutation = graphql(
  gqlV2`
  mutation createExpense($expense: ExpenseCreateInput!, $account: AccountReferenceInput!) {
    createExpense(expense: $expense, account: $account) {
      id
      legacyId
    }
  }
`,
  {
    options: { context: API_V2_CONTEXT },
    props: ({ mutate }) => ({
      createExpense: async variables => {
        return mutate({ variables });
      },
    }),
  },
);

export default withUser(getData(withRouter(withCreateExpenseMutation(CreateExpensePage))));
