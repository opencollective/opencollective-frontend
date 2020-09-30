import React from 'react';
import PropTypes from 'prop-types';
import { gql } from '@apollo/client';
import { graphql } from '@apollo/client/react/hoc';
import { FormattedMessage } from 'react-intl';

import { transactionFieldsFragment, transactionsQuery } from '../../lib/graphql/queries';

import SmallButton from '../SmallButton';

class RefundTransactionBtn extends React.Component {
  static propTypes = {
    id: PropTypes.number.isRequired,
    isRefund: PropTypes.bool,
    CollectiveId: PropTypes.number.isRequired,
    refundTransaction: PropTypes.func,
  };

  constructor(props) {
    super(props);
    this.setShowingState = this.setShowingState.bind(this);

    const canRefund = !props.isRefund;
    this.state = {
      showing: {
        canRefund,
        refunded: props.isRefund,
        confirmRefund: false,
        refunding: false,
      },
    };
  }

  /** Set state received as true and all the other ones to false.
   *
   * This function should be called with a single state. An exception
   * will be thrown if more than one state is passed.
   */
  setShowingState({ canRefund, confirmRefund, refunded, refunding, error }) {
    if (canRefund && confirmRefund && refunded && refunding && error) {
      throw new Error("Can't set more than one state to true");
    }
    this.setState({
      showing: {
        canRefund: !!canRefund,
        confirmRefund: !!confirmRefund,
        refunded: !!refunded,
        refunding: !!refunding,
        error: !!error,
      },
    });
  }

  /** Fires off the actual refund action.
   *
   * This function sets the state to `refunding` before calling the
   * refund graphql mutation and then it sets the state to `refunded`
   * after it's all done.
   */
  async onClickRefund() {
    this.setShowingState({ refunding: true });
    try {
      await this.props.refundTransaction(this.props.id);
      this.setShowingState({ refunded: true });
    } catch (e) {
      this.setShowingState({ error: true });
      this.setState({ error: e.message });
    }
  }

  render() {
    return (
      <div>
        <style jsx>
          {`
            .error {
              color: red;
              font-weight: bold;
              padding-top: 20px;
            }
            .confirmation {
              border-top: solid 1px #ddd;
              margin: 10px 0;
              padding: 10px 0;
            }
            .confirmation strong {
              display: block;
              padding-bottom: 5px;
            }
            .confirmation-buttons {
              display: flex;
              flex-direction: row;
              justify-content: flex-start;
            }
            .confirmation-buttons .SmallButton.refund {
              margin-right: 10px;
            }
          `}
        </style>

        {this.state.showing.error && <div className="error">ERROR: {this.state.error}</div>}

        {/* Already refunded so we don't really don't need to show
            anything */}
        {this.state.showing.refunded && <div />}

        {/* User just pressed refunding. Display loading spinner */}
        {this.state.showing.refunding && (
          <div className="confirmation">
            <em>Refunding</em>
          </div>
        )}

        {this.state.showing.canRefund && (
          <div className="confirmation">
            <div className="confirmation-buttons">
              <SmallButton className="refund" onClick={() => this.setShowingState({ confirmRefund: true })}>
                <FormattedMessage id="transaction.refund.btn" defaultMessage="refund" />
              </SmallButton>
            </div>
          </div>
        )}

        {this.state.showing.confirmRefund && (
          <div className="confirmation">
            <strong>Do you really want to refund this transaction?</strong>
            <div className="confirmation-buttons">
              <SmallButton className="refund" onClick={() => this.onClickRefund()}>
                <FormattedMessage id="transaction.refund.yes.btn" defaultMessage="Yes, refund!" />
              </SmallButton>
              <SmallButton className="no" onClick={() => this.setShowingState({ canRefund: true })}>
                <FormattedMessage id="no" defaultMessage="No" />
              </SmallButton>
            </div>
          </div>
        )}
      </div>
    );
  }
}

const refundTransactionMutation = gql`
  mutation RefundTransaction($id: Int!) {
    refundTransaction(id: $id) {
      id
      refundTransaction {
        ...TransactionFields
        refundTransaction {
          ...TransactionFields
        }
      }
    }
  }

  ${transactionFieldsFragment}
`;

const addRefundTransactionMutation = graphql(refundTransactionMutation, {
  props: ({ ownProps, mutate }) => ({
    refundTransaction: async id =>
      await mutate({
        variables: { id },
        update: (proxy, { data: { refundTransaction } }) => {
          const variables = {
            CollectiveId: ownProps.CollectiveId,
            limit: 20,
            offset: 0,
          };

          // Retrieve the query from the cache
          const data = proxy.readQuery({
            query: transactionsQuery,
            variables,
          });

          // Insert new transaction at the beginning
          data.allTransactions.unshift(refundTransaction.refundTransaction);

          // write data back for the query
          proxy.writeQuery({ query: transactionsQuery, variables, data });
        },
      }),
  }),
});

export default addRefundTransactionMutation(RefundTransactionBtn);
