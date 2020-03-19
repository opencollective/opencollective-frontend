import React from 'react';
import PropTypes from 'prop-types';
import { get } from 'lodash';
import { FormattedMessage } from 'react-intl';
import { graphql } from '@apollo/react-hoc';
import gql from 'graphql-tag';

import MessageBox from '../components/MessageBox';
import Container from '../components/Container';
import { withUser } from '../components/UserProvider';
import AuthenticatedPage from '../components/AuthenticatedPage';

class MarkOrderAsPaidPage extends React.Component {
  static getInitialProps({ query }) {
    return { id: parseInt(query.id) };
  }

  static propTypes = {
    /** OrderId */
    id: PropTypes.number.isRequired,
    /** @ignore from graphql */
    markOrderAsPaid: PropTypes.func.isRequired,
    /** @ignore from withUser */
    loadingLoggedInUser: PropTypes.bool.isRequired,
    /** @ignore from withUser */
    LoggedInUser: PropTypes.object,
  };

  state = {
    status: MarkOrderAsPaidPage.SUBMITTING,
    isRequestSent: false,
    error: null,
  };

  componentDidMount() {
    if (!this.props.loadingLoggedInUser && this.props.LoggedInUser) {
      return this.triggerRequest();
    }
  }

  componentDidUpdate() {
    if (!this.state.isRequestSent && !this.props.loadingLoggedInUser && this.props.LoggedInUser) {
      return this.triggerRequest();
    }
  }

  static SUBMITTING = 1;
  static SUCCESS = 2;
  static ERROR = 3;

  async triggerRequest() {
    try {
      this.setState({ isRequestSent: true });
      await this.props.markOrderAsPaid(this.props.id);
      this.setState({ status: MarkOrderAsPaidPage.SUCCESS });
    } catch (e) {
      const error = get(e, 'graphQLErrors.0') || e;
      this.setState({ status: MarkOrderAsPaidPage.ERROR, error: error.message });
    }
  }

  render() {
    const { status, error } = this.state;

    return (
      <AuthenticatedPage title="Mark order as paid">
        <Container
          display="flex"
          py={[5, 6]}
          px={2}
          flexDirection="column"
          alignItems="center"
          background="linear-gradient(180deg, #EBF4FF, #FFFFFF)"
        >
          {status === MarkOrderAsPaidPage.SUBMITTING && (
            <MessageBox type="info" isLoading>
              <FormattedMessage id="order.markAsPaid.processing" defaultMessage="Marking order as paid..." />
            </MessageBox>
          )}
          {status === MarkOrderAsPaidPage.SUCCESS && (
            <MessageBox mb={3} type="success" withIcon>
              <FormattedMessage
                id="order.markAsPaid.success"
                defaultMessage="The order was marked as paid successfully."
              />
            </MessageBox>
          )}
          {status === MarkOrderAsPaidPage.ERROR && (
            <MessageBox type="error" withIcon>
              {error}
            </MessageBox>
          )}
        </Container>
      </AuthenticatedPage>
    );
  }
}

const markOrderAsPaidQuery = gql`
  mutation markOrderAsPaid($id: Int!) {
    markOrderAsPaid(id: $id) {
      id
      status
      collective {
        id
        stats {
          id
          balance
        }
      }
    }
  }
`;

const addMarkOrderAsPaidMutation = graphql(markOrderAsPaidQuery, {
  props: ({ mutate }) => ({
    markOrderAsPaid: async id => {
      return await mutate({ variables: { id } });
    },
  }),
});

export default addMarkOrderAsPaidMutation(withUser(MarkOrderAsPaidPage));
