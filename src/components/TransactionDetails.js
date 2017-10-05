import React from 'react';
import PropTypes from 'prop-types';
import { defineMessages, injectIntl, FormattedNumber, FormattedMessage } from 'react-intl';
import { imagePreview, capitalize } from '../lib/utils';
import { graphql } from 'react-apollo'
import gql from 'graphql-tag'

class TransactionDetails extends React.Component {

  static propTypes = {
    collective: PropTypes.object,
    transaction: PropTypes.object,
    LoggedInUser: PropTypes.object,
    mode: PropTypes.string // open or closed
  }

  constructor(props) {
    super(props);
    this.messages = defineMessages({
      'hostFeeInHostCurrency': { id: 'transaction.hostFeeInHostCurrency', defaultMessage: 'host fee' },
      'platformFeeInHostCurrency': { id: 'transaction.platformFeeInHostCurrency', defaultMessage: 'Open Collective fee' },
      'paymentProcessorFeeInHostCurrency': { id: 'transaction.paymentProcessorFeeInHostCurrency', defaultMessage: 'payment processor fee' }
    });
    this.currencyStyle = { style: 'currency', currencyDisplay: 'symbol', minimumFractionDigits: 0, maximumFractionDigits: 2};
  }

  render() {
    const { intl, collective, transaction, LoggedInUser } = this.props;
    console.log(">>> transaction", transaction)
    const type = transaction.type.toLowerCase();

    const amountDetails = [intl.formatNumber(transaction.amount / 100, { currency: transaction.currency, ...this.currencyStyle})];
    const addFees = (feesArray) => {
      feesArray.forEach(feeName => {
        if (transaction[feeName]) {
          amountDetails.push(`${intl.formatNumber(transaction[feeName] / 100, { currency: collective.currency, ...this.currencyStyle})} (${intl.formatMessage(this.messages[feeName])})`);
        }
      })
    }

    addFees(['hostFeeInHostCurrency', 'platformFeeInHostCurrency', 'paymentProcessorFeeInHostCurrency']);

    const amountDetailsStr = amountDetails.length > 1 ? amountDetails.join(' - ') : null;

    return (
        <div className={`TransactionDetails ${this.props.mode}`}>
        <style jsx>{`
          .TransactionDetails {
            font-size: 1.2rem;
            overflow: hidden;
            transition: max-height 0.5s cubic-bezier(0.25, 0.46, 0.45, 0.94);
            max-height: 19rem;
          }
          .TransactionDetails.closed {
            max-height: 0;
          }
          .TransactionDetails .frame {
            padding: 4px;
            margin-top: 1rem;
            margin-right: 1rem;
            float: left;
            background-color: #f3f4f5;
          }
          .TransactionDetails img {
            width: 64px;
          }
          .col {
            float: left;
            display: flex;
            flex-direction: column;
            margin-right: 1rem;
            margin-top: 1rem;
          }
          label {
            text-transform: uppercase;
            color: #aaaeb3;
            font-weight: 300;
            font-family: lato, montserratlight, arial;
            white-space: nowrap;
          }
          .netAmountInCollectiveCurrency {
            font-weight: bold;
          }

          @media(max-width: 600px) {
            .TransactionDetails {
              max-height: 30rem;
            }
          }
        `}</style>

        {type === 'debit' &&
          <div className="frame">
            {transaction.attachment &&
              <a href={transaction.attachment} target="_blank" title="Open receipt in a new window">
                <img src={imagePreview(transaction.attachment)} />
              </a>
            }
            {!transaction.attachment &&
              <img src={'/static/images/receipt.svg'} />
            }
          </div>
        }
        <div className="col">
          <label><FormattedMessage id='transaction.host' defaultMessage='host' /></label>
          {transaction.host.name}
        </div>
        <div className="col">
          <label><FormattedMessage id='transaction.paymentMethod' defaultMessage='payment method' /></label>
          {transaction.paymentMethod && capitalize(transaction.paymentMethod.service)}
        </div>
        <div className="col">
          <label><FormattedMessage id='transaction.amount' defaultMessage='amount' /></label>
          <div className="amountDetails">
            { amountDetailsStr &&
              <span>
                <span>{amountDetailsStr}</span>
                <span className="netAmountInCollectiveCurrency">&nbsp;=&nbsp;</span>
              </span>
            }
            <span className="netAmountInCollectiveCurrency">
              <FormattedNumber
                value={transaction.netAmountInCollectiveCurrency / 100}
                currency={collective.currency}
                {...this.currencyStyle}
                />
            </span>
          </div>
        </div>
        { type === 'credit' && LoggedInUser && LoggedInUser.canEditCollective &&
          <div className="col invoice">
            <label><FormattedMessage id='transaction.invoice' defaultMessage='invoice' /></label>
            <div>
              <a href={`/${collective.slug}/transactions/${transaction.uuid}/invoice.pdf`}>
                <FormattedMessage id='transaction.downloadPDF' defaultMessage='Download PDF' />
              </a>
            </div>
          </div>
        }
      </div>
    );
  }
}


const getTransactionQuery = gql`
query Transaction($id: Int!) {
  Transaction(id: $id) {
    id
    uuid
    description
    publicMessage
    privateMessage
    createdAt
    type
    amount
    currency
    netAmountInCollectiveCurrency
    hostFeeInHostCurrency
    platformFeeInHostCurrency
    paymentProcessorFeeInHostCurrency
    paymentMethod {
      name
    }
    user {
      id
      name
      username
      image
    }
    host {
      id
      name
    }
    ... on Expense {
      category
      attachment
    }
    ... on Donation {
      subscription {
        interval
      }
    }
  }
}
`;

export const addGetTransaction = (component) => {
const accessToken = typeof window !== 'undefined' && window.localStorage.getItem('accessToken');

// if we don't have an accessToken, there is no need to get the details of a transaction
// as we won't have access to any more information than the allTransactions query
if (!accessToken) return component;

return graphql(getTransactionQuery, {
  options(props) {
    return {
      variables: {
        id: props.transaction.id
      }
    }
  }
})(component);
}


export default addGetTransaction(injectIntl(TransactionDetails));