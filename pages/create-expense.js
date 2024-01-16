import React from 'react';
import PropTypes from 'prop-types';
import { graphql } from '@apollo/client/react/hoc';
import { omit, pick } from 'lodash';
import { withRouter } from 'next/router';
import { FormattedMessage, injectIntl } from 'react-intl';

import { itemHasOCR } from '../components/expenses/lib/ocr';
import hasFeature, { FEATURES } from '../lib/allowed-features';
import { expenseSubmissionAllowed, getCollectivePageMetadata, getCollectiveTypeForUrl } from '../lib/collective';
import expenseTypes from '../lib/constants/expenseTypes';
import { generateNotFoundError, i18nGraphqlException } from '../lib/errors';
import { getPayoutProfiles } from '../lib/expenses';
import FormPersister from '../lib/form-persister';
import { API_V2_CONTEXT, gql } from '../lib/graphql/helpers';
import { addParentToURLIfMissing, getCollectivePageCanonicalURL } from '../lib/url-helpers';
import UrlQueryHelper from '../lib/UrlQueryHelper';
import { compose, parseToBoolean } from '../lib/utils';

import CollectiveNavbar from '../components/collective-navbar';
import { Dimensions } from '../components/collective-page/_constants';
import { collectiveNavbarFieldsFragment } from '../components/collective-page/graphql/fragments';
import Container from '../components/Container';
import ContainerOverlay from '../components/ContainerOverlay';
import ErrorPage from '../components/ErrorPage';
import { ConfirmOCRValues } from '../components/expenses/ConfirmOCRValues';
import CreateExpenseDismissibleIntro from '../components/expenses/CreateExpenseDismissibleIntro';
import ExpenseForm, { EXPENSE_FORM_STEPS, prepareExpenseForSubmit } from '../components/expenses/ExpenseForm';
import ExpenseInfoSidebar from '../components/expenses/ExpenseInfoSidebar';
import ExpenseNotesForm from '../components/expenses/ExpenseNotesForm';
import ExpenseRecurringForm from '../components/expenses/ExpenseRecurringForm';
import ExpenseSummary, { SummaryHeader } from '../components/expenses/ExpenseSummary';
import {
  accountingCategoryFields,
  expensePageExpenseFieldsFragment,
  loggedInAccountExpensePayoutFieldsFragment,
} from '../components/expenses/graphql/fragments';
import MobileCollectiveInfoStickyBar from '../components/expenses/MobileCollectiveInfoStickyBar';
import { Box, Flex } from '../components/Grid';
import LinkCollective from '../components/LinkCollective';
import LoadingPlaceholder from '../components/LoadingPlaceholder';
import MessageBox from '../components/MessageBox';
import Page from '../components/Page';
import PageFeatureNotSupported from '../components/PageFeatureNotSupported';
import SignInOrJoinFree, { SignInOverlayBackground } from '../components/SignInOrJoinFree';
import StyledButton from '../components/StyledButton';
import StyledCard from '../components/StyledCard';
import { Survey, SURVEY_KEY } from '../components/Survey';
import { toast } from '../components/ui/useToast';
import { withUser } from '../components/UserProvider';

const STEPS = { ...EXPENSE_FORM_STEPS, SUMMARY: 'summary' };

const CreateExpensePageUrlQueryHelper = new UrlQueryHelper({
  collectiveSlug: { type: 'string' },
  parentCollectiveSlug: { type: 'string' },
  customData: { type: 'json' },
});

class CreateExpensePage extends React.Component {
  static getInitialProps({ query: query }) {
    return CreateExpensePageUrlQueryHelper.decode(query);
  }

  static propTypes = {
    /** from getInitialProps */
    collectiveSlug: PropTypes.string.isRequired,
    parentCollectiveSlug: PropTypes.string,
    customData: PropTypes.object,
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
    /** from apollo */
    data: PropTypes.shape({
      loading: PropTypes.bool,
      error: PropTypes.any,
      refetch: PropTypes.func,
      account: PropTypes.shape({
        id: PropTypes.string.isRequired,
        parent: PropTypes.object,
        name: PropTypes.string.isRequired,
        slug: PropTypes.string.isRequired,
        description: PropTypes.string,
        type: PropTypes.string.isRequired,
        twitterHandle: PropTypes.string,
        imageUrl: PropTypes.string,
        isArchived: PropTypes.bool,
        supportedExpenseTypes: PropTypes.array,
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
      step: STEPS.PAYEE,
      expense: null,
      isSubmitting: false,
      formPersister: null,
      isInitialForm: true,
      recurring: null,
      hasConfirmedOCR: false,
    };
  }

  async componentDidMount() {
    // Reset form when `resetForm` is passed in the URL
    if (this.handleResetForm()) {
      return;
    }

    // Re-fetch data if user is logged in
    if (this.props.LoggedInUser) {
      this.props.data.refetch();
      this.initFormPersister();
    }

    const { router, data } = this.props;
    const account = data?.account;
    addParentToURLIfMissing(router, account, '/expenses/new');
  }

  async componentDidUpdate(oldProps, oldState) {
    // Reset form when `resetForm` is passed in the URL
    if (this.handleResetForm()) {
      return;
    }

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
    const baseMetadata = getCollectivePageMetadata(collective);
    const canonicalURL = `${getCollectivePageCanonicalURL(collective)}/expenses/new`;
    if (collective) {
      return { ...baseMetadata, title: `${collective.name} - New expense`, canonicalURL };
    } else {
      return { ...baseMetadata, title: `New expense`, canonicalURL };
    }
  }

  buildFormPersister() {
    const { LoggedInUser, data } = this.props;
    if (data.account && LoggedInUser) {
      return new FormPersister(`expense-${data.account.id}=${LoggedInUser.id}`);
    }
  }

  handleResetForm() {
    const { router } = this.props;
    if (parseToBoolean(router.query.resetForm)) {
      const formPersister = this.buildFormPersister();
      if (formPersister) {
        formPersister.clearValues();
        const query = omit(router.query, ['resetForm']);
        const routeAs = router.asPath.split('?')[0];
        return router.push({ pathname: '/create-expense', query }, routeAs, { shallow: true });
      }
    }
  }

  initFormPersister() {
    const formPersister = this.buildFormPersister();
    if (formPersister) {
      this.setState({ formPersister });
    }
  }

  onFormSubmit = async expense => {
    try {
      if (expense.payee.isInvite) {
        const result = await this.props.draftExpenseAndInviteUser({
          variables: {
            account: { id: this.props.data.account.id },
            expense: { ...prepareExpenseForSubmit(expense), customData: this.props.customData },
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
      toast({
        variant: 'error',
        message: i18nGraphqlException(this.props.intl, e),
      });
    }
  };

  onSummarySubmit = async () => {
    try {
      this.setState({ isSubmitting: true, error: null });
      const { expense, recurring } = this.state;
      const result = await this.props.createExpense({
        variables: {
          account: { id: this.props.data.account.id },
          expense: { ...prepareExpenseForSubmit(expense), customData: this.props.customData },
          recurring,
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
      await this.props.router.push({
        pathname: `${parentCollectiveSlugRoute}${collectiveTypeRoute}${collectiveSlug}/expenses/${legacyExpenseId}`,
        query: pick(this.props.router.query, ['ocr', 'mockImageUpload']),
      });
      toast({
        variant: 'success',
        title: <FormattedMessage id="Expense.Submitted" defaultMessage="Expense submitted" />,
        message: this.props.LoggedInUser ? (
          <Survey hasParentTitle surveyKey={SURVEY_KEY.EXPENSE_SUBMITTED} />
        ) : (
          <FormattedMessage id="Expense.SuccessPage" defaultMessage="You can edit or review updates on this page." />
        ),
        duration: 20000,
      });
      window.scrollTo(0, 0);
    } catch (e) {
      toast({
        variant: 'error',
        message: i18nGraphqlException(this.props.intl, e),
      });
      this.setState({ isSubmitting: false });
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

  render() {
    const { collectiveSlug, data, LoggedInUser, loadingLoggedInUser, router } = this.props;
    const { step } = this.state;

    if (!data.loading) {
      if (!data || data.error) {
        return <ErrorPage data={data} />;
      } else if (!data.account) {
        return <ErrorPage error={generateNotFoundError(collectiveSlug)} log={false} />;
      } else if (
        !hasFeature(data.account, FEATURES.RECEIVE_EXPENSES) ||
        data.account.supportedExpenseTypes.length === 0
      ) {
        return <PageFeatureNotSupported />;
      } else if (data.account.isArchived) {
        return <PageFeatureNotSupported showContactSupportLink={false} />;
      }
    }

    const collective = data && data.account;
    const host = collective && collective.host;
    const loggedInAccount = data && data.loggedInAccount;
    const payoutProfiles = getPayoutProfiles(loggedInAccount);
    const hasItemsWithOCR = Boolean(this.state.expense?.items?.some(itemHasOCR));
    const mustConfirmOCR = hasItemsWithOCR && !this.state.hasConfirmedOCR;

    return (
      <Page collective={collective} {...this.getPageMetaData(collective)}>
        {!expenseSubmissionAllowed(collective, LoggedInUser) ? (
          <Flex justifyContent="center" p={5}>
            <MessageBox type="error" withIcon>
              <FormattedMessage
                id="mustBeMemberOfCollective"
                defaultMessage="You must be a member of the collective to see this page"
              />
            </MessageBox>
          </Flex>
        ) : (
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
                  <SignInOverlayBackground>
                    <SignInOrJoinFree
                      showOCLogo={false}
                      showSubHeading={false}
                      hideFooter
                      routes={{ join: `/create-account?next=${encodeURIComponent(router.asPath)}` }}
                    />
                  </SignInOverlayBackground>
                </ContainerOverlay>
              )}
              <Box maxWidth={Dimensions.MAX_SECTION_WIDTH} m="0 auto" px={[2, 3, 4]} py={[4, 5]}>
                <Flex justifyContent="space-between" flexDirection={['column', 'row']}>
                  <Box minWidth={300} maxWidth={['100%', null, null, 728]} mr={[0, 3, 5]} mb={5} flexGrow="1">
                    <SummaryHeader fontSize="24px" lineHeight="32px" mb={24} py={2}>
                      {step !== STEPS.SUMMARY ? (
                        <FormattedMessage id="ExpenseForm.Submit" defaultMessage="Submit expense" />
                      ) : (
                        <FormattedMessage
                          id="ExpenseSummaryTitle"
                          defaultMessage="{type, select, CHARGE {Charge} INVOICE {Invoice} RECEIPT {Receipt} GRANT {Grant} SETTLEMENT {Settlement} other {Expense}} Summary to <LinkCollective>{collectiveName}</LinkCollective>"
                          values={{
                            type: this.state.expense?.type,
                            collectiveName: collective?.name,
                            LinkCollective: text => <LinkCollective collective={collective}>{text}</LinkCollective>,
                          }}
                        />
                      )}
                    </SummaryHeader>
                    {data.loading || loadingLoggedInUser ? (
                      <LoadingPlaceholder width="100%" height={400} />
                    ) : (
                      <Box>
                        <CreateExpenseDismissibleIntro collectiveName={collective.name} />
                        {step !== STEPS.SUMMARY ? (
                          <ExpenseForm
                            collective={collective}
                            host={host}
                            loading={loadingLoggedInUser}
                            loggedInAccount={loggedInAccount}
                            onSubmit={this.onFormSubmit}
                            expense={this.state.expense}
                            expensesTags={this.getSuggestedTags(collective)}
                            payoutProfiles={payoutProfiles}
                            formPersister={this.state.formPersister}
                            shouldLoadValuesFromPersister={this.state.isInitialForm}
                            defaultStep={step}
                            autoFocusTitle
                          />
                        ) : (
                          <div>
                            <StyledCard p={[16, 24, 32]} mb={0}>
                              <ExpenseSummary
                                host={collective.host}
                                expense={{
                                  ...this.state.expense,
                                  createdByAccount: this.props.data.loggedInAccount,
                                }}
                                collective={collective}
                                borderless
                                isEditing
                              />
                              <ExpenseRecurringForm
                                recurring={this.state.recurring}
                                onChange={recurring => this.setState({ recurring })}
                              />
                            </StyledCard>
                            <Box mt={24}>
                              <ExpenseNotesForm
                                onChange={this.onNotesChanges}
                                defaultValue={this.state.expense.privateMessage}
                              />
                              <div className="mt-5">
                                {hasItemsWithOCR && (
                                  <ConfirmOCRValues
                                    items={this.state.expense.items}
                                    onConfirm={hasConfirmedOCR => this.setState({ hasConfirmedOCR })}
                                    currency={this.state.expense.currency}
                                  />
                                )}
                              </div>
                              <Flex flexWrap="wrap" mt={4}>
                                <StyledButton
                                  mt={2}
                                  minWidth={175}
                                  width={['100%', 'auto']}
                                  mx={[2, 0]}
                                  mr={[null, 3]}
                                  whiteSpace="nowrap"
                                  data-cy="edit-expense-btn"
                                  onClick={() => this.setState({ step: STEPS.EXPENSE })}
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
                                  disabled={mustConfirmOCR}
                                  minWidth={175}
                                >
                                  {this.state.expense?.type === expenseTypes.GRANT ? (
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
        )}
      </Page>
    );
  }
}

const hostFieldsFragment = gql`
  fragment CreateExpenseHostFields on Host {
    id
    name
    legalName
    legacyId
    slug
    type
    expensePolicy
    settings
    currency
    features {
      id
      MULTI_CURRENCY_EXPENSES
    }
    location {
      id
      address
      country
    }
    transferwise {
      id
      availableCurrencies
    }
    accountingCategories(kind: EXPENSE) {
      nodes {
        id
        ...AccountingCategoryFields
      }
    }
    policies {
      id
      EXPENSE_CATEGORIZATION {
        requiredForExpenseSubmitters
        requiredForCollectiveAdmins
      }
    }
    supportedPayoutMethods
    isTrustedHost
  }
  ${accountingCategoryFields}
`;

const createExpensePageQuery = gql`
  query CreateExpensePage($collectiveSlug: String!) {
    account(slug: $collectiveSlug, throwIfMissing: false) {
      id
      legacyId
      slug
      name
      type
      description
      settings
      twitterHandle
      imageUrl
      backgroundImageUrl
      currency
      isArchived
      isActive
      expensePolicy
      supportedExpenseTypes
      features {
        id
        ...NavbarFields
        MULTI_CURRENCY_EXPENSES
      }
      expensesTags {
        id
        tag
      }

      stats {
        id
        balanceWithBlockedFunds {
          valueInCents
          currency
        }
      }

      ... on AccountWithHost {
        isApproved
        host {
          id
          ...CreateExpenseHostFields
        }
      }

      # For Hosts with Budget capabilities

      ... on Organization {
        isHost
        isActive
        # NOTE: This will be the account itself in this case
        host {
          id
          ...CreateExpenseHostFields
        }
      }

      ... on AccountWithParent {
        parent {
          id
          slug
          expensePolicy
          imageUrl
          backgroundImageUrl
          twitterHandle
        }
      }
    }
    loggedInAccount {
      id
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

const createExpenseMutation = gql`
  mutation CreateExpense(
    $expense: ExpenseCreateInput!
    $account: AccountReferenceInput!
    $recurring: RecurringExpenseInput
  ) {
    createExpense(expense: $expense, account: $account, recurring: $recurring) {
      id
      ...ExpensePageExpenseFields
    }
  }
  ${expensePageExpenseFieldsFragment}
`;

const addCreateExpenseMutation = graphql(createExpenseMutation, {
  name: 'createExpense',
  options: { context: API_V2_CONTEXT },
});

const draftExpenseAndInviteUserMutation = gql`
  mutation DraftExpenseAndInviteUser($expense: ExpenseInviteDraftInput!, $account: AccountReferenceInput!) {
    draftExpenseAndInviteUser(expense: $expense, account: $account) {
      id
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
  injectIntl,
);

export default addHoc(CreateExpensePage);
