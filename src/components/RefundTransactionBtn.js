import React from 'react';
import PropTypes from 'prop-types';
import gql from 'graphql-tag';
import { graphql } from 'react-apollo';
import { FormattedMessage } from 'react-intl';

import withIntl from '../lib/withIntl';
import SmallButton from './SmallButton';
import { getTransactionsQuery, transactionFields } from '../graphql/queries';

class RefundTransactionBtn extends React.Component {

  static propTypes = {
    transaction: PropTypes.object.isRequired,
    collective: PropTypes.object.isRequired
  }

  constructor(props) {
    super(props);
    this.state = { hidden: false };
  }

  async onClick() {
    this.setState({ hidden: true });
    await this.props.refundTransaction(this.props.transaction.id);
  }

  render() {
    return (this.state.hidden) ? <div/> : (
      <div className="RefundTransactionBtn">
        <SmallButton className="refund" bsStyle="danger" bsSize="xsmall" onClick={::this.onClick}>
          <FormattedMessage id="transaction.refund.btn" defaultMessage="refund" />
        </SmallButton>
      </div>
    );
  }
}

const refundTransactionQuery = gql`
  mutation refundTransaction($id: Int!) {
    refundTransaction(id: $id) {
      id
      refundTransaction {
        ${transactionFields}
      }
    }
  }
`;

const addMutation = graphql(refundTransactionQuery, {
  props: ({ ownProps, mutate }) => ({
    refundTransaction: async (id) => await mutate({
      variables: { id },
      update: (proxy, { data: { refundTransaction }}) => {
        // Retrieve the query from the cache
        const data = proxy.readQuery({
          query: getTransactionsQuery,
          variables: {
            CollectiveId: ownProps.collective.id,
            limit: 20,
            offset: 0
          }
        });

        // Insert new transaction at the beginning
        data.allTransactions.unshift(refundTransaction.refundTransaction);

        // write data back for the query
        proxy.writeQuery({ query: getTransactionsQuery, data});
      }
    })
  })
});

export default addMutation(withIntl(RefundTransactionBtn));
