import React from 'react';
import PropTypes from 'prop-types';
import withIntl from '../lib/withIntl';
import { graphql } from 'react-apollo'
import { FormattedMessage } from 'react-intl';
import gql from 'graphql-tag'
import SmallButton from './SmallButton';

class RefundTransactionBtn extends React.Component {

  static propTypes = {
    transaction: PropTypes.object.isRequired
  }

  constructor(props) {
    super(props);
    this.onClick = this.onClick.bind(this);
  }

  async onClick() {
    const { transaction } = this.props;
    await this.props.refundTransaction(transaction.id);
  }

  render() {
    return (
      <div className="RefundTransactionBtn">
        <SmallButton className="refund" bsStyle="danger" bsSize="xsmall" onClick={this.onClick}>
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
    }
  }
`;

const addMutation = graphql(refundTransactionQuery, {
  props: ({ mutate }) => ({
    refundTransaction: async (id) => await mutate({ variables: { id } })
  })
});

export default addMutation(withIntl(RefundTransactionBtn));
