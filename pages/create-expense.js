import React from 'react';
import PropTypes from 'prop-types';
import { graphql } from '@apollo/client/react/hoc';
import { compose, get, pick } from 'lodash';
import memoizeOne from 'memoize-one';
import { withRouter } from 'next/router';
import { FormattedMessage, injectIntl } from 'react-intl';

import hasFeature, { FEATURES } from '../lib/allowed-features';
import { getCollectiveTypeForUrl } from '../lib/collective.lib';
import { CollectiveType } from '../lib/constants/collectives';
import expenseTypes from '../lib/constants/expenseTypes';
import { formatErrorMessage, generateNotFoundError, getErrorFromGraphqlException } from '../lib/errors';
import FormPersister from '../lib/form-persister';
import { API_V2_CONTEXT, gqlV2 } from '../lib/graphql/helpers';

import CollectiveNavbar from '../components/collective-navbar';
import { collectiveNavbarFieldsFragment } from '../components/collective-page/graphql/fragments';
import Container from '../components/Container';
import ContainerOverlay from '../components/ContainerOverlay';
import ErrorPage from '../components/ErrorPage';
import CreateExpenseDismissibleIntro from '../components/expenses/CreateExpenseDismissibleIntro';
import ExpenseForm, { prepareExpenseForSubmit } from '../components/expenses/ExpenseForm';
import ExpenseInfoSidebar from '../components/expenses/ExpenseInfoSidebar';
import ExpenseNotesForm from '../components/expenses/ExpenseNotesForm';
import ExpenseSummary from '../components/expenses/ExpenseSummary';
import {
  expensePageExpenseFieldsFragment,
  loggedInAccountExpensePayoutFieldsFragment,
} from '../components/expenses/graphql/fragments';
import MobileCollectiveInfoStickyBar from '../components/expenses/MobileCollectiveInfoStickyBar';
import { Box, Flex } from '../components/Grid';
import LoadingPlaceholder from '../components/LoadingPlaceholder';
import MessageBox from '../components/MessageBox';
import Page from '../components/Page';
import PageFeatureNotSupported from '../components/PageFeatureNotSupported';
import SignInOrJoinFree from '../components/SignInOrJoinFree';
import StyledButton from '../components/StyledButton';
import { H1 } from '../components/Text';
import { TOAST_TYPE, withToasts } from '../components/ToastProvider';
import { withUser } from '../components/UserProvider';

const STEPS = { FORM: 'FORM', SUMMARY: 'summary' };

const { USER, ORGANIZATION } = CollectiveType;

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
    /** from injectIntl */
    intl: PropTypes.object,
    /** from apollo */
    createExpense: PropTypes.func.isRequired,
    /** from apollo */
    draftExpenseAndInviteUser: PropTypes.func.isRequired,
    /** from withToast */
    addToast: PropTypes.func.isRequired,
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
        isArchived: PropTypes.bool,
        expensesTags: PropTypes.arrayOf(
          PropTypes.shape({
            id: PropTypes.string.isRequired,
            tag: PropTypes.string.isRequired,
          }),
        ),
        host: PropTypes.shape({
          id: PropTypes.string.isRequired,
        }),
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
      isSubmitting: false,
      formPersister: null,
      isInitialForm: true,
    };
  }

  componentDidMount() {
    // Re-fetch data if user is logged in
    if (this.props.LoggedInUser) {
      this.props.data.refetch();
      this.initFormPersister();
    }
  }

  componentDidUpdate(oldProps, oldState) {
    // Re-fetch data if user is logged in
    if (!oldProps.LoggedInUser && this.props.LoggedInUser) {
      this.props.data.refetch();
    }

    // Reset form persister when data loads or when account changes
    if (!this.state.formPersister || oldProps.data?.account?.id !== this.props.data?.account?.id) {
      this.initFormPersister();
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

  initFormPersister() {
    const { data, LoggedInUser } = this.props;
    if (data?.account && LoggedInUser) {
      this.setState({
        formPersister: new FormPersister(`expense-${data.account.id}=${LoggedInUser.id}`),
      });
    }
  }

  onFormSubmit = async expense => {
    try {
      if (expense.payee.isInvite) {
        const expenseDraft = pick(expense, [
          'description',
          'longDescription',
          'tags',
          'type',
          'privateMessage',
          'invoiceInfo',
          'recipientNote',
          'items',
          'attachedFiles',
          'payee',
          'payeeLocation',
          'payoutMethod',
        ]);
        const result = await this.props.draftExpenseAndInviteUser({
          variables: {
            account: { id: this.props.data.account.id },
            expense: expenseDraft,
          },
        });
        if (this.state.formPersister) {
          this.state.formPersister.clearValues();
        }

        // Redirect to the expense page
        const legacyExpenseId = result.data.draftExpenseAndInviteUser.legacyId;
        const { collectiveSlug, parentCollectiveSlug, data } = this.props;
        const parentCollectiveSlugRoute = parentCollectiveSlug ? `${parentCollectiveSlug}/` : '';
        const collectiveType = parentCollectiveSlug ? getCollectiveTypeForUrl(data?.account) : undefined;
        const collectiveTypeRoute = collectiveType ? `${collectiveType}/` : '';
        await this.props.router.push(
          `${parentCollectiveSlugRoute}${collectiveTypeRoute}${collectiveSlug}/expenses/${legacyExpenseId}`,
        );
      } else {
        this.setState({ expense, step: STEPS.SUMMARY, isInitialForm: false });
      }
    } catch (e) {
      this.setState({ error: getErrorFromGraphqlException(e), isSubmitting: false });
    }
  };

  onSummarySubmit = async () => {
    try {
      this.setState({ isSubmitting: true, error: null });
      const { expense } = this.state;
      const result = await this.props.createExpense({
        variables: {
          account: { id: this.props.data.account.id },
          expense: prepareExpenseForSubmit(expense),
        },
      });

      // Clear local storage backup if expense submitted successfully
      if (this.state.formPersister) {
        this.state.formPersister.clearValues();
      }

      // Redirect to the expense page
      const legacyExpenseId = result.data.createExpense.legacyId;
      const { collectiveSlug, parentCollectiveSlug, data } = this.props;
      const parentCollectiveSlugRoute = parentCollectiveSlug ? `${parentCollectiveSlug}/` : '';
      const collectiveType = parentCollectiveSlug ? getCollectiveTypeForUrl(data?.account) : undefined;
      const collectiveTypeRoute = collectiveType ? `${collectiveType}/` : '';
      await this.props.router.push(
        `${parentCollectiveSlugRoute}${collectiveTypeRoute}${collectiveSlug}/expenses/${legacyExpenseId}`,
      );
      this.props.addToast({
        type: TOAST_TYPE.SUCCESS,
        title: <FormattedMessage id="Expense.Submitted" defaultMessage="Expense submitted" />,
        message: (
          <FormattedMessage id="Expense.SuccessPage" defaultMessage="You can edit or review updates on this page." />
        ),
      });
      window.scrollTo(0, 0);
    } catch (e) {
      this.setState({ error: getErrorFromGraphqlException(e), isSubmitting: false });
    }
  };

  onNotesChanges = e => {
    const name = e.target.name;
    const value = e.target.value;
    this.setState(state => ({ expense: { ...state.expense, [name]: value } }));
  };

  getSuggestedTags(collective) {
    const tagsStats = (collective && collective.expensesTags) || null;
    return tagsStats && tagsStats.map(({ tag }) => tag);
  }

  getPayoutProfiles = memoizeOne(loggedInAccount => {
    if (!loggedInAccount) {
      return [];
    } else {
      const accountsAdminOf = get(loggedInAccount, 'adminMemberships.nodes', [])
        .map(member => member.account)
        .filter(
          account =>
            [USER, ORGANIZATION].includes(account.type) ||
            // Same Host
            (account.isActive && this.props.data?.account?.host?.id === account.host?.id) ||
            // Self-hosted Collectives
            (account.isActive && account.id === account.host?.id),
        );
      return [loggedInAccount, ...accountsAdminOf];
    }
  });

  render() {
    const { collectiveSlug, data, LoggedInUser, loadingLoggedInUser, router, intl } = this.props;
    const { step } = this.state;

    if (!data.loading) {
      if (!data || data.error) {
        return <ErrorPage data={data} />;
      } else if (!data.account) {
        return <ErrorPage error={generateNotFoundError(collectiveSlug)} log={false} />;
      } else if (!hasFeature(data.account, FEATURES.RECEIVE_EXPENSES)) {
        return <PageFeatureNotSupported />;
      } else if (data.account.isArchived) {
        return <PageFeatureNotSupported showContactSupportLink={false} />;
      }
    }

    const collective = data && data.account;
    const host = collective && collective.host;
    const loggedInAccount = data && data.loggedInAccount;

    const payoutProfiles = this.getPayoutProfiles(loggedInAccount);

    return (
      <Page collective={collective} {...this.getPageMetaData(collective)}>
        <React.Fragment>
          <CollectiveNavbar
            collective={collective}
            isLoading={!collective}
            callsToAction={{ hasSubmitExpense: false, hasRequestGrant: false }}
          />
          <Container position="relative" minHeight={[null, 800]} ref={this.formTopRef}>
            {!loadingLoggedInUser && !LoggedInUser && (
              <ContainerOverlay
                py={[2, null, 6]}
                top="0"
                position={['fixed', null, 'absolute']}
                justifyContent={['center', null, 'flex-start']}
              >
                <SignInOrJoinFree routes={{ join: `/create-account?next=${encodeURIComponent(router.asPath)}` }} />
              </ContainerOverlay>
            )}
            <Box maxWidth={1242} m="0 auto" px={[2, 3, 4]} py={[4, 5]}>
              <Flex justifyContent="space-between" flexDirection={['column', 'row']}>
                <Box minWidth={300} maxWidth={['100%', null, null, 728]} mr={[0, 3, 5]} mb={5} flexGrow="1">
                  <H1 fontSize="24px" lineHeight="32px" mb={24} py={2}>
                    {step === STEPS.FORM ? (
                      <FormattedMessage id="ExpenseForm.Submit" defaultMessage="Submit expense" />
                    ) : (
                      <FormattedMessage id="Summary" defaultMessage="Summary" />
                    )}
                  </H1>
                  {data.loading || loadingLoggedInUser ? (
                    <LoadingPlaceholder width="100%" height={400} />
                  ) : (
                    <Box>
                      <CreateExpenseDismissibleIntro collectiveName={collective.name} />
                      {step === STEPS.FORM && (
                        <ExpenseForm
                          collective={collective}
                          loading={loadingLoggedInUser}
                          loggedInAccount={loggedInAccount}
                          onSubmit={this.onFormSubmit}
                          expense={this.state.expense}
                          expensesTags={this.getSuggestedTags(collective)}
                          payoutProfiles={payoutProfiles}
                          formPersister={this.state.formPersister}
                          shouldLoadValuesFromPersister={this.state.isInitialForm}
                          autoFocusTitle
                        />
                      )}
                      {step === STEPS.SUMMARY && (
                        <div>
                          <ExpenseSummary
                            host={collective.host}
                            expense={{
                              ...this.state.expense,
                              createdByAccount: this.props.data.loggedInAccount,
                            }}
                            collective={collective}
                          />
                          <Box mt={24}>
                            <ExpenseNotesForm
                              onChange={this.onNotesChanges}
                              defaultValue={this.state.expense.privateMessage}
                            />
                            {this.state.error && (
                              <MessageBox type="error" withIcon mt={3}>
                                {formatErrorMessage(intl, this.state.error)}
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
                                {this.state.expense?.type === expenseTypes.FUNDING_REQUEST ? (
                                  <FormattedMessage id="ExpenseForm.SubmitRequest" defaultMessage="Submit request" />
                                ) : (
                                  <FormattedMessage id="ExpenseForm.Submit" defaultMessage="Submit expense" />
                                )}
                              </StyledButton>
                            </Flex>
                          </Box>
                        </div>
                      )}
                    </Box>
                  )}
                </Box>
                <Box maxWidth={['100%', 210, null, 275]} mt={70}>
                  <ExpenseInfoSidebar isLoading={data.loading} collective={collective} host={host} />
                </Box>
              </Flex>
            </Box>
            <MobileCollectiveInfoStickyBar isLoading={data.loading} collective={collective} host={host} />
          </Container>
        </React.Fragment>
      </Page>
    );
  }
}

const hostFieldsFragment = gqlV2/* GraphQL */ `
  fragment CreateExpenseHostFields on Host {
    id
    name
    slug
    type
    expensePolicy
    settings
    currency
    location {
      address
      country
    }
    transferwise {
      availableCurrencies
    }
    supportedPayoutMethods
  }
`;

const createExpensePageQuery = gqlV2/* GraphQL */ `
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
      isArchived
      expensePolicy
      features {
        ...NavbarFields
      }
      expensesTags {
        id
        tag
      }

      stats {
        balanceWithBlockedFunds {
          valueInCents
          currency
        }
      }

      ... on AccountWithHost {
        isApproved
        host {
          ...CreateExpenseHostFields
        }
      }

      # For Hosts with Budget capabilities

      ... on Organization {
        isHost
        isActive
        # NOTE: This will be the account itself in this case
        host {
          ...CreateExpenseHostFields
        }
      }
    }
    loggedInAccount {
      ...LoggedInAccountExpensePayoutFields
    }
  }

  ${loggedInAccountExpensePayoutFieldsFragment}
  ${hostFieldsFragment}
  ${collectiveNavbarFieldsFragment}
`;

const addCreateExpensePageData = graphql(createExpensePageQuery, {
  options: {
    context: API_V2_CONTEXT,
    fetchPolicy: 'cache-and-network',
  },
});

const createExpenseMutation = gqlV2/* GraphQL */ `
  mutation CreateExpense($expense: ExpenseCreateInput!, $account: AccountReferenceInput!) {
    createExpense(expense: $expense, account: $account) {
      ...ExpensePageExpenseFields
    }
  }
  ${expensePageExpenseFieldsFragment}
`;

const addCreateExpenseMutation = graphql(createExpenseMutation, {
  name: 'createExpense',
  options: { context: API_V2_CONTEXT },
});

const draftExpenseAndInviteUserMutation = gqlV2/* GraphQL */ `
  mutation DraftExpenseAndInviteUser($expense: ExpenseInviteDraftInput!, $account: AccountReferenceInput!) {
    draftExpenseAndInviteUser(expense: $expense, account: $account) {
      ...ExpensePageExpenseFields
    }
  }
  ${expensePageExpenseFieldsFragment}
`;

const addDraftExpenseAndInviteUserMutation = graphql(draftExpenseAndInviteUserMutation, {
  name: 'draftExpenseAndInviteUser',
  options: { context: API_V2_CONTEXT },
});

const addHoc = compose(
  withUser,
  withRouter,
  addCreateExpensePageData,
  addCreateExpenseMutation,
  addDraftExpenseAndInviteUserMutation,
  withToasts,
  injectIntl,
);

export default addHoc(CreateExpensePage);
