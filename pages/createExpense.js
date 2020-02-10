import React from 'react';
import PropTypes from 'prop-types';
import { FormattedMessage } from 'react-intl';
import { graphql } from 'react-apollo';
import gql from 'graphql-tag';
import { Box, Flex } from '@rebass/grid';

import { compose } from '../lib/utils';

import ExpensesStatsWithData from '../components/expenses/ExpensesStatsWithData';
import CreateExpenseForm from '../components/expenses/CreateExpenseForm';

import ErrorPage from '../components/ErrorPage';
import Button from '../components/Button';
import CollectiveCover from '../components/CollectiveCover';
import Header from '../components/Header';
import Body from '../components/Body';
import Footer from '../components/Footer';

import { withUser } from '../components/UserProvider';
import { Router } from '../server/pages';

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

  getPayoutMethod = expenseData => {
    if (expenseData.payoutMethod === 'paypal') {
      return { type: 'PAYPAL', data: { email: expenseData.paypalEmail } };
    } else {
      return null;
    }
  };

  createExpense = async expense => {
    const collective = this.props.data.Collective;

    try {
      expense.collective = { id: collective.id };
      expense.currency = collective.currency;
      expense.PayoutMethod = this.getPayoutMethod(expense);
      delete expense.paypalEmail;
      delete expense.payoutMethod;
      const res = await this.props.createExpense(expense);
      const expenseCreated = res.data.createExpense;
      Router.pushRoute(`/${this.props.slug}/expenses/${expenseCreated.id}/?createSuccess=true`);
    } catch (e) {
      // TODO: this should be reported to the user
      console.error(e);
    }
  };

  render() {
    const { data, LoggedInUser } = this.props;

    if (!data.Collective) {
      return <ErrorPage data={data} />;
    }

    const collective = data.Collective;
    return (
      <div className="ExpensesPage">
        <Header collective={collective} LoggedInUser={LoggedInUser} />

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
              <CreateExpenseForm collective={collective} LoggedInUser={LoggedInUser} onSubmit={this.createExpense} />
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
      expensePolicy
      settings
      image
      imageUrl
      backgroundImage
      isHost
      isActive
      isArchived
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
      createdByUser {
        id
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

const addData = compose(addCollectiveData, addMutation);

export default withUser(addData(CreateExpensePage));
