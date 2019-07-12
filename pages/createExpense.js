import React from 'react';
import PropTypes from 'prop-types';
import { FormattedMessage } from 'react-intl';
import { graphql } from 'react-apollo';
import gql from 'graphql-tag';
import { Box, Flex } from '@rebass/grid';
import { pick } from 'lodash';

import { compose } from '../lib/utils';

import ExpensesStatsWithData from '../components/expenses/ExpensesStatsWithData';
import CreateExpenseForm from '../components/expenses/CreateExpenseForm';
import ExpenseNeedsTaxFormMessage from '../components/expenses/ExpenseNeedsTaxFormMessage';

import ErrorPage from '../components/ErrorPage';
import Button from '../components/Button';
import CollectiveCover from '../components/CollectiveCover';
import Header from '../components/Header';
import Body from '../components/Body';
import Footer from '../components/Footer';

import { withUser } from '../components/UserProvider';

class CreateExpensePage extends React.Component {
  static getInitialProps({ query: { collectiveSlug, action } }) {
    return { slug: collectiveSlug, action };
  }

  static propTypes = {
    slug: PropTypes.string, // for addCollectiveData
    action: PropTypes.string, // not used atm, not clear where it's coming from, not in the route
    createExpense: PropTypes.func.isRequired, // from addMutation
    data: PropTypes.object.isRequired, // from withData
    LoggedInUser: PropTypes.object,
  };

  constructor(props) {
    super(props);
    this.state = {
      expenseCreated: false,
    };
  }

  createExpense = async expense => {
    const { LoggedInUser } = this.props;
    const collective = this.props.data.Collective;

    try {
      expense.collective = { id: collective.id };
      expense.currency = collective.currency;
      expense.user = pick(expense, ['paypalEmail']);
      delete expense.paypalEmail;

      if (LoggedInUser) {
        expense.user.id = LoggedInUser.id;
      }
      console.log('>>> createExpense', expense);
      const res = await this.props.createExpense(expense);
      console.log('>>> createExpense res', res);
      this.setState({
        showNewExpenseForm: false,
        expenseCreated: res.data.createExpense,
      });
    } catch (e) {
      console.error(e);
    }
  };

  render() {
    const { data, LoggedInUser } = this.props;
    const { expenseCreated } = this.state;

    if (!data.Collective) return <ErrorPage data={data} />;

    const collective = data.Collective;
    const showNewExpenseForm = !expenseCreated;

    return (
      <div className="ExpensesPage">
        <Header
          title={collective.name}
          description={collective.description}
          twitterHandle={collective.twitterHandle}
          image={collective.image || collective.backgroundImage}
          LoggedInUser={LoggedInUser}
        />

        <Body>
          <CollectiveCover
            key={collective.slug}
            collective={collective}
            href={`/${collective.slug}`}
            LoggedInUser={LoggedInUser}
            displayContributeLink={collective.isActive && collective.host ? true : false}
          />

          <Flex flexDirection={['column', null, 'row']}>
            <Box width={[1, null, 3 / 4]}>
              {expenseCreated && (
                <Box m={3}>
                  <p className="expenseCreated">
                    {collective.host && (
                      <FormattedMessage
                        id="expense.created"
                        defaultMessage="Your expense has been submitted with success. It is now pending approval from one of the core contributors of the collective. You will be notified by email once it has been approved. Then, the host ({host}) will proceed to reimburse your expense."
                        values={{ host: collective.host.name }}
                      />
                    )}
                    {!collective.host && (
                      <FormattedMessage
                        id="expense.created.noHost"
                        defaultMessage="Your expense has been submitted with success. It is now pending approval from one of the core contributors of the collective. You will be notified by email once it has been approved."
                      />
                    )}
                  </p>
                  <ExpenseNeedsTaxFormMessage id={expenseCreated.id} />
                  <Flex justifyContent="center" mt={4} flexWrap="wrap">
                    <Button
                      className="blue"
                      onClick={() =>
                        this.setState({
                          expenseCreated: null,
                          showNewExpenseForm: true,
                        })
                      }
                    >
                      <FormattedMessage id="expenses.sendAnotherExpense" defaultMessage="Submit Another Expense" />
                    </Button>
                    <Box ml={[0, null, 3]}>
                      <Button className="whiteblue viewAllExpenses" href={`/${collective.slug}/expenses`}>
                        <FormattedMessage id="expenses.viewAll" defaultMessage="View All Expenses" />
                      </Button>
                    </Box>
                  </Flex>
                </Box>
              )}

              {showNewExpenseForm && (
                <CreateExpenseForm collective={collective} LoggedInUser={LoggedInUser} onSubmit={this.createExpense} />
              )}
            </Box>

            <Box width={[1, null, 1 / 4]} pb={4} px={3}>
              <ExpensesStatsWithData slug={collective.slug} />

              <Flex mt="5rem" justifyContent={['center', null, 'flex-start']}>
                <Button href={`/${collective.slug}/expenses`}>
                  <FormattedMessage id="expenses.viewAll" defaultMessage="View All Expenses" />
                </Button>
              </Flex>
            </Box>
          </Flex>
        </Body>

        <Footer />
      </div>
    );
  }
}

const createExpenseQuery = gql`
  mutation createExpense($expense: ExpenseInputType!) {
    createExpense(expense: $expense) {
      id
      description
      status
      createdAt
      updatedAt
      incurredAt
      category
      amount
      currency
      payoutMethod
      privateMessage
      attachment
      collective {
        id
        slug
        currency
        name
        host {
          id
          slug
        }
        stats {
          id
          balance
        }
      }
      fromCollective {
        id
        type
        name
        slug
        image
      }
      user {
        id
        email
        paypalEmail
      }
    }
  }
`;

const getCollectiveQuery = gql`
  query Collective($slug: String) {
    Collective(slug: $slug) {
      id
      type
      slug
      path
      name
      currency
      backgroundImage
      expensePolicy
      settings
      image
      isHost
      isActive
      tags
      stats {
        id
        balance
        updates
        events
        yearlyBudget
        totalAmountReceived
        backers {
          all
        }
      }
      host {
        id
        slug
        name
        image
        expensePolicy
      }
      parentCollective {
        id
        slug
        name
      }
      members {
        id
        role
        createdAt
        description
        member {
          id
          description
          name
          slug
          type
          image
        }
      }
    }
  }
`;

const addMutation = graphql(createExpenseQuery, {
  props: ({ mutate }) => ({
    createExpense: async expense => {
      return await mutate({ variables: { expense } });
    },
  }),
});

const addCollectiveData = graphql(getCollectiveQuery);

const addData = compose(
  addCollectiveData,
  addMutation,
);

export default withUser(addData(CreateExpensePage));
