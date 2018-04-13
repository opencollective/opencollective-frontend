import React from 'react';
import PropTypes from 'prop-types';
import withIntl from '../lib/withIntl';
import { graphql } from 'react-apollo'
import { FormattedMessage } from 'react-intl';
import gql from 'graphql-tag'
import SmallButton from './SmallButton';

class CancelSubscriptionBtn extends React.Component {

  static propTypes = {
    id: PropTypes.number.isRequired,
    onError: PropTypes.func
  }

  constructor(props) {
    super(props);
    this.onClick = this.onClick.bind(this);
    this.state = {
      result: {},
      loading: false
    };
  }

  async onClick() {
    const { id, onError } = this.props;
    this.setState({loading: true});
    let result;
    try {
      result = await this.props.cancelSubscription(id);
    } catch (err) {
      onError(err.graphQLErrors[0].message);
    }
    this.setState({loading: false});
  }

  render() {
    return (
      <div className="CancelSubscriptionBtn">
        <SmallButton className="yes" bsStyle="primary" onClick={this.onClick}><FormattedMessage id="subscription.cancel.btn" defaultMessage="yes" disabled={this.state.loading}/></SmallButton>
        { this.state.loading && <div className="loading">Processing...</div> }
      </div>
    );
  }

}

const cancelSubscriptionQuery = gql`
mutation cancelSubscription($id: Int!) {
  cancelSubscription(id: $id) {
    id
    isSubscriptionActive
  }
}
`;

const addMutation = graphql(cancelSubscriptionQuery, {
  props: ( { mutate }) => ({
    cancelSubscription: async (id) => {
      return await mutate({ variables: { id } })
    }
  })
});

export default addMutation(withIntl(CancelSubscriptionBtn));
