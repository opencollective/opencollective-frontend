import React from 'react';
import Header from '../components/Header';
import Body from '../components/Body';
import Footer from '../components/Footer';
import CollectiveCover from '../components/CollectiveCover';
import { addGetLoggedInUserFunction } from '../graphql/queries';
import Loading from '../components/Loading';
import ErrorPage from '../components/ErrorPage';
import withData from '../lib/withData';
import withIntl from '../lib/withIntl';
import ExpensesWithData from '../components/ExpensesWithData';
import { get, pick } from 'lodash';
import { FormattedMessage, FormattedDate } from 'react-intl'
import CollectivePicker from '../components/CollectivePickerWithData';
import { graphql, compose } from 'react-apollo';
import gql from 'graphql-tag'
import { capitalize } from '../lib/utils';

/**
 * This page is used to approve/reject in one click an expense or a collective
 */
class ActionPage extends React.Component {

  static getInitialProps (props) {
    const { query: { table, id, action }, data } = props;
    return { action, table, id, ssr: false };
  }

  constructor(props) {
    super(props);
    this.state = { loading: true };
    this.mutation = `${props.action}${capitalize(props.table).replace(/s$/,'')}`;
  }

  async componentDidMount() {
    const { getLoggedInUser } = this.props;
    console.log(">>> performing", this.mutation, this.props[this.mutation]);
    try {
      const res = await this.props[this.mutation](this.props.id);
      console.log(">>> res", JSON.stringify(res));
      this.setState({ loading: false });
    } catch (error) {
      console.log(">>> error", JSON.stringify(error));
      this.setState({ loading: false, error: error.graphQLErrors[0] });
    }
    console.log(">>> fetching logged in user");
    const LoggedInUser = getLoggedInUser && await getLoggedInUser(this.props.collectiveSlug);
    console.log(">>> LoggedInUser fetched: ", LoggedInUser);
    this.setState({ LoggedInUser });
  }

  render() {
    const { action, table, id } = this.props;
    const { LoggedInUser, loading } = this.state;

    return (
      <div className="ActionPage">
        <style jsx>{`
        `}</style>

        <Header
          title={action}
          className={this.state.loading ? 'loading': ''}
          LoggedInUser={LoggedInUser}
          />

        <Body>

          <div className="content" >
            { loading && this.mutation === 'approveCollective' && <FormattedMessage id="actions.approveCollective.processing" defaultMessage="Approving collective" /> }
            { loading && this.mutation === 'approveExpense' && <FormattedMessage id="actions.approveExpense.processing" defaultMessage="Approving expense" /> }
            { loading && this.mutation === 'rejectExpense' && <FormattedMessage id="actions.rejectExpense.processing" defaultMessage="Rejecting expense" /> }
            { !loading && !this.state.error && <FormattedMessage id="actions.done" defaultMessage="done " /> }
            { this.state.error &&
              <div className="error">
                <h2><FormattedMessage id="error.label" defaultMessage="Error" /></h2>
                <div className="messge">{this.state.error.message}</div>
              </div>
            }
          </div>

        </Body>

        <Footer />

      </div>
    );
  }
}

const getQueryForAction = (action) => gql`
mutation ${action}($id: Int!) {
  ${action}(id: $id) {
    id
  }
}
`;

const addMutationForAction = (action) => graphql(getQueryForAction(action), {
  props: ( { mutate }) => ({
    [action]: async (id) => {
      return await mutate({ variables: { id } })
    }
  })
});

const actions = ["approveCollective", "approveExpense", "rejectExpense"];
const addMutations = compose.apply(this, actions.map(action => addMutationForAction(action)));

export default withData(compose(addGetLoggedInUserFunction, addMutations)(withIntl(ActionPage)));