import React from 'react';
import PropTypes from 'prop-types';
import { graphql } from '@apollo/react-hoc';
import gql from 'graphql-tag';
import { FormattedMessage } from 'react-intl';

import { compose } from '../lib/utils';
import { Router } from '../server/pages';

import Body from '../components/Body';
import Button from '../components/Button';
import CollectiveNavbar from '../components/CollectiveNavbar';
import ErrorPage from '../components/ErrorPage';
import CreateExpenseForm from '../components/expenses/CreateExpenseFormLegacy';
import ExpensesStatsWithData from '../components/expenses/ExpensesStatsWithData';
import Footer from '../components/Footer';
import { Box, Flex } from '../components/Grid';
import Header from '../components/Header';
import { withUser } from '../components/UserProvider';

class CreateExpensePage extends React.Component {
  static getInitialProps({ query: { collectiveSlug, action } }) {
    return { slug: collectiveSlug, action };
  }

  static propTypes = {
    slug: PropTypes.string, // for addcreateExpensePageData
    action: PropTypes.string, // not used atm, not clear where it's coming from, not in the route
    createExpense: PropTypes.func.isRequired, // from addMutation
    data: PropTypes.object.isRequired, // from withData
    LoggedInUser: PropTypes.object,
  };

  getPayoutMethod = expenseData => {
    if (expenseData.PayoutMethod) {
      return expenseData.PayoutMethod;
    } else if (expenseData.payoutMethod === 'paypal') {
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
      Router.pushRoute(`/${this.props.slug}/expenses/${expenseCreated.id}/legacy?createSuccess=true`);
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
    const canEdit = LoggedInUser && LoggedInUser.canEditCollective(collective);
    return (
      <div className="ExpensesPage">
        <Header collective={collective} LoggedInUser={LoggedInUser} />

        <Body>
          <CollectiveNavbar collective={collective} isAdmin={canEdit} showEdit />

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

const createExpenseMutation = gql`
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

const createExpensePageQuery = gql`
  query CreateExpensePage($slug: String) {
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
        connectedAccounts {
          id
          service
          createdAt
          updatedAt
        }
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

const addCreateExpenseMutation = graphql(createExpenseMutation, {
  props: ({ mutate }) => ({
    createExpense: async expense => {
      return await mutate({ variables: { expense } });
    },
  }),
});

const addCreateExpensePageData = graphql(createExpensePageQuery);

const addGraphql = compose(addCreateExpensePageData, addCreateExpenseMutation);

export default withUser(addGraphql(CreateExpensePage));
