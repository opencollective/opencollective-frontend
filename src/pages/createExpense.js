import React from 'react';
import Header from '../components/Header';
import Body from '../components/Body';
import Footer from '../components/Footer';
import CollectiveCover from '../components/CollectiveCover';
import { addCollectiveCoverData, addGetLoggedInUserFunction } from '../graphql/queries';
import Loading from '../components/Loading';
import NotFound from '../components/NotFoundPage';
import ErrorPage from '../components/ErrorPage';
import withData from '../lib/withData';
import withIntl from '../lib/withIntl';
import ExpensesWithData from '../components/ExpensesWithData';
import ExpensesStatsWithData from '../components/ExpensesStatsWithData';
import { get, pick } from 'lodash';
import { FormattedMessage } from 'react-intl'
import { graphql } from 'react-apollo'
import gql from 'graphql-tag'
import CreateExpenseForm from '../components/CreateExpenseForm';
import Button from '../components/Button';
import Link from '../components/Link';

class ExpensesPage extends React.Component {

  static getInitialProps (props) {
    const { query: { collectiveSlug, action }, data } = props;
    return { slug: collectiveSlug, data, action }
  }

  constructor(props) {
    super(props);
    this.createExpense = this.createExpense.bind(this);
    this.state = {};
  }

  async componentDidMount() {
    const { getLoggedInUser } = this.props;
    const LoggedInUser = getLoggedInUser && await getLoggedInUser(this.props.collectiveSlug);
    this.setState({ LoggedInUser });
  }

  async createExpense(expense) {
    const { LoggedInUser } = this.state;
    const collective = this.props.data.Collective;

    try {
      expense.collective = { id: collective.id };
      expense.currency = collective.currency;
      expense.user = pick(expense, ['paypalEmail']);
      delete expense.paypalEmail;

      if (LoggedInUser) {
        expense.user.id = LoggedInUser.id;
      }
      console.log(">>> createExpense", expense);
      const res = await this.props.createExpense(expense);
      console.log(">>> createExpense res", res);
      this.setState({ showNewExpenseForm: false, expenseCreated: res.data.createExpense })
    } catch (e) {
      console.error(e);
    }
  }

  render() {
    const { data, action } = this.props;
    const { LoggedInUser, expenseCreated } = this.state;
    if (data.loading) return (<Loading />);
    if (!data.Collective) return (<NotFound />);

    if (data.error) {
      console.error("graphql error>>>", data.error.message);
      return (<ErrorPage message="GraphQL error" />)
    }

    const collective = data.Collective;
    const showNewExpenseForm = !expenseCreated;

    return (
      <div className="ExpensesPage">
        <style jsx>{`
          .columns {
            display: flex;
          }
          .rightColumn {
            width: 300px;
            margin-left: 5rem;
          }
          .largeColumn {
            width: 900px;
          }
          .actions {
            text-align: center;
            margin: 2rem;
          }
          .actions :global(> button) {
            margin-right: 1rem;
          }
        `}</style>
        <Header
          title={collective.name}
          description={collective.description}
          twitterHandle={collective.twitterHandle}
          image={collective.image || collective.backgroundImage}
          className={this.state.status}
          LoggedInUser={LoggedInUser}
          />

        <Body>

          <CollectiveCover
            collective={collective}
            href={`/${collective.slug}`}
            cta={{ href: `/${collective.slug}#contribute`, label: 'contribute' }}
            LoggedInUser={LoggedInUser}
            />

          <div className="content columns" >

            <div className="largeColumn">

              { expenseCreated &&
                <div className="expenseCreated">
                  <p>
                    <FormattedMessage id="expense.created" defaultMessage="Your expense has been submitted with success. It is now pending approval from one of the core contributors of the collective. You will be notified by email once it has been approved. Then, the host ({host}) will proceed to reimburse your expense." values={{ host: collective.host.name }} />
                  </p>
                  <div className="actions">
                    <Button className="blue" onClick={() => this.setState({ expenseCreated: null, showNewExpenseForm: true })}>
                      <FormattedMessage id="expenses.sendAnotherExpense" defaultMessage="Submit Another Expense" />
                    </Button>
                    <Button className="whiteblue viewAllExpenses" href={`/${collective.slug}/expenses`}>
                      <FormattedMessage id="expenses.viewAll" defaultMessage="View All Expenses" />
                    </Button>
                  </div>
                </div>
              }

              { showNewExpenseForm &&
                <CreateExpenseForm
                  collective={collective}
                  LoggedInUser={LoggedInUser}
                  onSubmit={this.createExpense}
                  />
              }

            </div>

            <div className="rightColumn">

              <Link route={`/${collective.slug}/expenses`}>
                <FormattedMessage id="collective.expenses.title" defaultMessage="{n, plural, one {Latest expense} other {Latest expenses}}" values={{n: 2}} />
              </Link>

              <ExpensesStatsWithData slug={collective.slug} />

            </div>

          </div>

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

const addMutation = graphql(createExpenseQuery, {
  props: ( { mutate }) => ({
    createExpense: async (expense) => {
      return await mutate({ variables: { expense } })
    }
  })
});

export default withData(addGetLoggedInUserFunction(addCollectiveCoverData(addMutation(withIntl(ExpensesPage)))));