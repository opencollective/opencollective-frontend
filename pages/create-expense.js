import { Box, Flex } from '@rebass/grid';
import { get } from 'lodash';
import memoizeOne from 'memoize-one';
import { withRouter } from 'next/router';
import PropTypes from 'prop-types';
import React from 'react';
import { graphql } from '@apollo/react-hoc';
import { FormattedMessage } from 'react-intl';

import expenseTypes from '../lib/constants/expenseTypes';
import { getErrorFromGraphqlException, generateNotFoundError } from '../lib/errors';
import CollectiveNavbar from '../components/CollectiveNavbar';
import CollectiveThemeProvider from '../components/CollectiveThemeProvider';
import Container from '../components/Container';
import ContainerOverlay from '../components/ContainerOverlay';
import ErrorPage from '../components/ErrorPage';
import ExpenseForm, { prepareExpenseForSubmit } from '../components/expenses/ExpenseForm';
import ExpenseSummary from '../components/expenses/ExpenseSummary';
import MobileCollectiveInfoStickyBar from '../components/expenses/MobileCollectiveInfoStickyBar';
import LoadingPlaceholder from '../components/LoadingPlaceholder';
import MessageBox from '../components/MessageBox';
import Page from '../components/Page';
import SignInOrJoinFree from '../components/SignInOrJoinFree';
import StyledButton from '../components/StyledButton';
import { H1 } from '../components/Text';
import { withUser } from '../components/UserProvider';
import { API_V2_CONTEXT, gqlV2 } from '../lib/graphql/helpers';
import { Router } from '../server/pages';
import ExpenseNotesForm from '../components/expenses/ExpenseNotesForm';
import ExpenseAttachedFilesForm from '../components/expenses/ExpenseAttachedFilesForm';
import CreateExpenseDismissibleIntro from '../components/expenses/CreateExpenseDismissibleIntro';
import ExpenseInfoSidebar from './ExpenseInfoSidebar';
import {
  loggedInAccountExpensePayoutFieldsFragment,
  expensePageExpenseFieldsFragment,
} from '../components/expenses/graphql/fragments';

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
      refetch: PropTypes.func,
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
    this.formTopRef = React.createRef();
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
    if (oldState.step !== this.state.step && this.formTopRef.current) {
      this.formTopRef.current.scrollIntoView({ behavior: 'smooth' });
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
      const result = await this.props.createExpense({
        account: { id: this.props.data.account.id },
        expense: { ...prepareExpenseForSubmit(expense), tags: tags },
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
    this.setState(state => ({ expense: { ...state.expense, [name]: value } }));
  };

  onAttachedFilesChange = attachedFiles => {
    this.setState(state => ({ expense: { ...state.expense, attachedFiles } }));
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
            <Container position="relative" minHeight={[null, 800]} ref={this.formTopRef}>
              {!loadingLoggedInUser && !LoggedInUser && (
                <ContainerOverlay p={2} top="0" position={['fixed', null, 'absolute']}>
                  <SignInOrJoinFree routes={{ join: `/create-account?next=${encodeURIComponent(router.asPath)}` }} />
                </ContainerOverlay>
              )}
              <Box maxWidth={1242} m="0 auto" px={[2, 3, 4]} py={[4, 5]}>
                <Flex justifyContent="space-between" flexWrap="wrap">
                  <Box flex="1 1 500px" minWidth={300} maxWidth={750} mr={[0, 3, 5]} mb={5}>
                    <H1 fontSize="H4" lineHeight="H4" mb={24} py={2}>
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
                        <CreateExpenseDismissibleIntro collectiveName={collective.name} />
                        {step === STEPS.FORM && (
                          <ExpenseForm
                            collective={collective}
                            loading={loadingLoggedInUser}
                            onSubmit={this.onFormSubmit}
                            expense={this.state.expense}
                            payoutProfiles={this.getPayoutProfiles(loggedInAccount)}
                            autoFocusTitle
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
                            <Box mt={24}>
                              {this.state.expense.type === expenseTypes.INVOICE && (
                                <Box mb={4}>
                                  <ExpenseAttachedFilesForm
                                    onChange={this.onAttachedFilesChange}
                                    defaultValue={this.state.expense.attachedFiles}
                                  />
                                </Box>
                              )}
                              <ExpenseNotesForm
                                onChange={this.onNotesChanges}
                                defaultValue={this.state.expense.privateMessage}
                              />
                              {this.state.error && (
                                <MessageBox type="error" withIcon mt={3}>
                                  {this.state.error.message}
                                </MessageBox>
                              )}
                              <Flex flexWrap="wrap" mt={4}>
                                <StyledButton
                                  mt={2}
                                  minWidth={175}
                                  width={['100%', 'auto']}
                                  mx={[2, 0]}
                                  mr={[null, 3]}
                                  whiteSpace="nowrap"
                                  data-cy="edit-expense-btn"
                                  onClick={() => this.setState({ step: STEPS.FORM })}
                                  disabled={this.state.isSubmitting}
                                >
                                  ← <FormattedMessage id="Expense.edit" defaultMessage="Edit expense" />
                                </StyledButton>
                                <StyledButton
                                  buttonStyle="primary"
                                  mt={2}
                                  width={['100%', 'auto']}
                                  mx={[2, 0]}
                                  whiteSpace="nowrap"
                                  data-cy="submit-expense-btn"
                                  onClick={this.onSummarySubmit}
                                  loading={this.state.isSubmitting}
                                  minWidth={175}
                                >
                                  <FormattedMessage id="ExpenseForm.Submit" defaultMessage="Submit expense" />
                                </StyledButton>
                              </Flex>
                            </Box>
                          </div>
                        )}
                      </Box>
                    )}
                  </Box>
                  <Box minWidth={270} width={['100%', null, null, 275]} mt={70}>
                    <ExpenseInfoSidebar
                      isLoading={data.loading}
                      collective={collective}
                      host={host}
                      expense={{ tags: this.state.tags }}
                      onChangeTags={this.setTags}
                      isEditing={step === STEPS.FORM}
                    />
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
        ...loggedInAccountExpensePayoutFieldsFragment
      }
    }

    ${loggedInAccountExpensePayoutFieldsFragment}
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
      ...expensePageExpenseFieldsFragment
    }
  }
  ${expensePageExpenseFieldsFragment}
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
