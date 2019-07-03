import React from 'react';
import PropTypes from 'prop-types';
import { FormattedMessage } from 'react-intl';
import { graphql, compose } from 'react-apollo';
import gql from 'graphql-tag';
import { Flex } from '@rebass/grid';

import Header from '../components/Header';
import Body from '../components/Body';
import Footer from '../components/Footer';
import Loading from '../components/Loading';
import MessageBox from '../components/MessageBox';
import SignInOrJoinFree from '../components/SignInOrJoinFree';
import { withUser } from '../components/UserProvider';

import { capitalize } from '../lib/utils';

/**
 * This page is used to approve/reject in one click an expense or a collective
 */
class ActionPage extends React.Component {
  static getInitialProps({ query: { action, table, id } }) {
    return { action, table, id: Number(id), ssr: false };
  }

  static propTypes = {
    action: PropTypes.string,
    table: PropTypes.string,
    id: PropTypes.number,
    ssr: PropTypes.bool,
    LoggedInUser: PropTypes.object, // from withUser,
    loadingLoggedInUser: PropTypes.bool.isRequired, // from withUser
  };

  constructor(props) {
    super(props);
    this.state = { loading: true, actionTriggered: false };
    this.mutation = `${props.action}${capitalize(props.table).replace(/s$/, '')}`;
  }

  async componentDidMount() {
    this.triggerActionOnceLoggedInUser();
  }

  async componentDidUpdate() {
    this.triggerActionOnceLoggedInUser();
  }

  async triggerActionOnceLoggedInUser() {
    if (this.props.LoggedInUser && !this.state.actionTriggered) {
      this.setState({ actionTriggered: true });
      try {
        const res = await this.props[this.mutation](this.props.id);
        console.log('>>> res', JSON.stringify(res));
        this.setState({ loading: false });
      } catch (error) {
        console.log('>>> error', JSON.stringify(error));
        this.setState({ loading: false, error: error.graphQLErrors[0] });
      }
    }
  }

  renderContent() {
    const { LoggedInUser } = this.props;
    const { loading } = this.state;

    if (!LoggedInUser) {
      return (
        <Flex justifyContent="center" alignItems="center" className="content" px={2} py={5}>
          <SignInOrJoinFree />
        </Flex>
      );
    } else {
      return (
        <Flex justifyContent="center" alignItems="center" className="content" px={2} py={5}>
          {loading && this.mutation === 'approveCollective' && (
            <FormattedMessage id="actions.approveCollective.processing" defaultMessage="Approving collective" />
          )}
          {loading && this.mutation === 'approveExpense' && (
            <FormattedMessage id="actions.approveExpense.processing" defaultMessage="Approving expense" />
          )}
          {loading && this.mutation === 'rejectExpense' && (
            <FormattedMessage id="actions.rejectExpense.processing" defaultMessage="Rejecting expense" />
          )}
          {!loading && !this.state.error && (
            <MessageBox type="success" withIcon>
              <FormattedMessage id="actions.done" defaultMessage="Done" />
            </MessageBox>
          )}
          {this.state.error && (
            <div className="error">
              <h2>
                <FormattedMessage id="error.label" defaultMessage="Error" />
              </h2>
              <div className="message">{this.state.error.message}</div>
            </div>
          )}
        </Flex>
      );
    }
  }

  render() {
    const { action, LoggedInUser, loadingLoggedInUser } = this.props;
    const { loading } = this.state;

    return (
      <div className="ActionPage">
        <Header
          title={action}
          className={loading || loadingLoggedInUser ? 'loading' : ''}
          LoggedInUser={LoggedInUser}
        />
        <Body>{loadingLoggedInUser ? <Loading /> : this.renderContent()}</Body>
        <Footer />
      </div>
    );
  }
}

/* eslint-disable graphql/template-strings, graphql/no-deprecated-fields, graphql/capitalized-type-name, graphql/named-operations */
const getQueryForAction = action => gql`
mutation ${action}($id: Int!) {
  ${action}(id: $id) {
    id
  }
}
`;
/* eslint-disable graphql/template-strings, graphql/no-deprecated-fields, graphql/capitalized-type-name, graphql/named-operations */

const addMutationForAction = action =>
  graphql(getQueryForAction(action), {
    props: ({ mutate }) => ({
      [action]: async id => {
        return await mutate({ variables: { id } });
      },
    }),
  });

const actions = ['approveCollective', 'approveExpense', 'rejectExpense'];
const addMutations = compose.apply(this, actions.map(action => addMutationForAction(action)));

export default withUser(addMutations(ActionPage));
