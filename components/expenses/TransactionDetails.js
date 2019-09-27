import React from 'react';
import PropTypes from 'prop-types';
import { defineMessages, FormattedNumber, FormattedMessage, injectIntl } from 'react-intl';
import { get } from 'lodash';

import { capitalize } from '../../lib/utils';

import Link from '../Link';
import ExternalLinkNewTab from '../ExternalLinkNewTab';
import InvoiceDownloadLink from './InvoiceDownloadLink';
import RefundTransactionBtn from './RefundTransactionBtn';

class TransactionDetails extends React.Component {
  static propTypes = {
    collective: PropTypes.shape({
      id: PropTypes.number.isRequired,
      slug: PropTypes.string.isRequired,
      type: PropTypes.string.isRequired,
      hostFeePercent: PropTypes.number,
    }),
    id: PropTypes.number.isRequired,
    amount: PropTypes.number.isRequired,
    /** If the transaction has an attachement attached, it will replace the invoice link */
    attachment: PropTypes.string,
    canDownloadInvoice: PropTypes.bool,
    canRefund: PropTypes.bool,
    className: PropTypes.string,
    currency: PropTypes.string.isRequired,
    uuid: PropTypes.string,
    netAmountInCollectiveCurrency: PropTypes.number,
    platformFeeInHostCurrency: PropTypes.number,
    paymentProcessorFeeInHostCurrency: PropTypes.number,
    taxAmount: PropTypes.number,
    hostCurrency: PropTypes.string,
    hostCurrencyFxRate: PropTypes.number,
    paymentMethod: PropTypes.shape({
      service: PropTypes.string.isRequired,
    }),
    host: PropTypes.shape({
      slug: PropTypes.string.isRequired,
      name: PropTypes.string.isRequired,
    }),
    type: PropTypes.oneOf(['CREDIT', 'DEBIT']),
    isRefund: PropTypes.bool, // whether or not this transaction refers to a refund
    intl: PropTypes.object.isRequired,
    mode: PropTypes.string, // open or closed
    fromCollective: PropTypes.object,
  };

  constructor(props) {
    super(props);
    this.messages = defineMessages({
      taxAmount: {
        id: 'transaction.taxAmount',
        defaultMessage: 'VAT',
      },
      hostFeeInHostCurrency: {
        id: 'transaction.hostFeeInHostCurrency',
        defaultMessage: '{percentage} host fee',
      },
      platformFeeInHostCurrency: {
        id: 'transaction.platformFeeInHostCurrency',
        defaultMessage: '{percentage} Open Collective fee',
      },
      paymentProcessorFeeInHostCurrency: {
        id: 'transaction.paymentProcessorFeeInHostCurrency',
        defaultMessage: '{percentage} payment processor fee',
      },
    });
    this.currencyStyle = {
      style: 'currency',
      currencyDisplay: 'symbol',
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    };
  }

  paymentMethodName = pm => {
    if (pm.type === 'virtualcard') {
      return pm.name.replace('card from', 'Gift Card from');
    } else if (pm.type === 'creditcard') {
      return <FormattedMessage id="creditcard.label" defaultMessage="Credit Card" />;
    } else {
      return capitalize(pm.service);
    }
  };

  /**
   * Amount details:
   * /airbnb/transactions DEBITS AirBnB gives $1,000 to Webpack
   * $1,000 - $50 (host fees) - $50 (Open Collective fees) - $30 (Payment Processor Fees) = $870 (net amount for Webpack)
   * /webpack/transactions CREDITS AirBnB gives $1,000 to Webpack
   * $1,000 - $50 (host fees) - $50 (Open Collective fees) - $30 (Payment Processor Fees) = $870 (net amount for Webpack)
   * /webpack/transactions DEBIT Tobiaz receives $1,000 from Webpack
   * -$1,000 - $30 (Payment Processor Fees) = -$1,030 (net amount for Webpack)
   */
  formatAmountDetails() {
    const {
      intl,
      type,
      netAmountInCollectiveCurrency,
      amount,
      collective,
      currency,
      hostCurrency,
      hostCurrencyFxRate,
    } = this.props;

    const initialAmount = ['ORGANIZATION', 'USER'].includes(collective.type) ? -netAmountInCollectiveCurrency : amount;
    let totalAmount = initialAmount;
    const amountDetails = [
      intl.formatNumber(initialAmount / 100, {
        currency: currency,
        ...this.currencyStyle,
      }),
    ];
    if (hostCurrencyFxRate && hostCurrencyFxRate !== 1) {
      const amountInHostCurrency = amount * hostCurrencyFxRate;
      totalAmount = amount;
      amountDetails.push(
        ` (${intl.formatNumber(amountInHostCurrency / 100, {
          currency: hostCurrency,
          ...this.currencyStyle,
        })})`,
      );
    }
    const addFees = feesArray => {
      feesArray.forEach(feeName => {
        if (this.props[feeName]) {
          const percentage =
            this.props[feeName] > 0 ? this.props[feeName] / totalAmount : -(this.props[feeName] / totalAmount);
          amountDetails.push(
            `${intl.formatNumber(this.props[feeName] / 100, {
              currency: hostCurrency,
              ...this.currencyStyle,
            })} (${intl.formatMessage(this.messages[feeName], {
              percentage: `${(percentage * 100).toFixed(2)}%`,
            })})`,
          );
        }
      });
    };

    addFees(['taxAmount', 'hostFeeInHostCurrency', 'platformFeeInHostCurrency', 'paymentProcessorFeeInHostCurrency']);

    let amountDetailsStr = amountDetails.length > 1 ? amountDetails.join(' ') : '';

    if (['ORGANIZATION', 'USER'].includes(collective.type) && type === 'CREDIT') {
      amountDetailsStr = amountDetailsStr.replace(/-/g, '+');
    }

    return amountDetailsStr;
  }

  render() {
    const {
      canDownloadInvoice,
      canRefund,
      collective,
      fromCollective,
      id,
      type,
      host,
      currency,
      hostCurrency,
      hostCurrencyFxRate,
      amount,
      netAmountInCollectiveCurrency,
      paymentMethod,
      isRefund,
      uuid,
      attachment,
    } = this.props;

    const amountDetailsStr = this.formatAmountDetails();
    let finalAmount = netAmountInCollectiveCurrency,
      recipient = collective;
    if (['ORGANIZATION', 'USER'].includes(collective.type)) {
      finalAmount = -amount;
      recipient = fromCollective;
    }

    return (
      <div className={`TransactionDetails ${this.props.mode} ${this.props.className}`}>
        <style jsx>
          {`
            .TransactionDetails {
              font-size: 1.2rem;
              overflow: hidden;
              transition: max-height 0.5s cubic-bezier(0.25, 0.46, 0.45, 0.94);
              max-height: 21rem;
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
              white-space: nowrap;
            }
            .netAmountInCollectiveCurrency {
              font-weight: bold;
            }
            .TransactionDetails .actions {
              clear: both;
            }

            @media (max-width: 600px) {
              .TransactionDetails {
                max-height: 30rem;
              }
            }
          `}
        </style>

        {get(host, 'name') && (
          <div className="col">
            <label>
              <FormattedMessage id="transaction.host" defaultMessage="host" />
            </label>
            <Link route={`/${host.slug}`}>{host.name}</Link> ({hostCurrency})
          </div>
        )}
        {paymentMethod && (
          <div className="col">
            <label>
              <FormattedMessage id="transaction.paymentMethod" defaultMessage="payment method" />
            </label>
            {paymentMethod && this.paymentMethodName(paymentMethod)}
          </div>
        )}
        {hostCurrencyFxRate && hostCurrencyFxRate !== 1 && (
          <div className="col">
            <label>
              <FormattedMessage id="transaction.fxrate" defaultMessage="fx rate" />
            </label>
            {hostCurrencyFxRate}
          </div>
        )}

        {type === 'DEBIT' && canDownloadInvoice && !isRefund && uuid && (
          <div className="col invoice">
            <label>
              <FormattedMessage id="transaction.invoice" defaultMessage="invoice" />
            </label>
            <div>
              {attachment ? (
                <ExternalLinkNewTab href={attachment}>
                  <FormattedMessage id="actions.download" defaultMessage="Download" />
                </ExternalLinkNewTab>
              ) : (
                <InvoiceDownloadLink type="transaction" transactionUuid={uuid}>
                  {({ loading, download }) => (
                    <a onClick={download}>
                      {loading ? (
                        <FormattedMessage id="Select.Loading" defaultMessage="Loading..." />
                      ) : (
                        <FormattedMessage id="transaction.downloadPDF" defaultMessage="Download (pdf)" />
                      )}
                    </a>
                  )}
                </InvoiceDownloadLink>
              )}
            </div>
          </div>
        )}

        <div className="col">
          <label>
            <FormattedMessage id="transaction.details" defaultMessage="transaction details" />
          </label>
          <div className="amountDetails">
            {amountDetailsStr && (
              <span>
                <span>{amountDetailsStr}</span>
                <span className="netAmountInCollectiveCurrency">&nbsp;=&nbsp;</span>
              </span>
            )}
            <span className="netAmountInCollectiveCurrency">
              <FormattedNumber value={finalAmount / 100} currency={currency} {...this.currencyStyle} />
            </span>
            &nbsp;
            <span className="netAmountInCollectiveCurrencyDescription">
              (
              <FormattedMessage
                id="transaction.netAmountInCollectiveCurrency.description"
                defaultMessage="net amount for {collective}"
                values={{ collective: recipient.name }}
              />
              )
            </span>
          </div>
        </div>

        <div className="actions">
          {canRefund && (
            <div className="transactionActions">
              <RefundTransactionBtn id={id} isRefund={isRefund} CollectiveId={collective.id} />
            </div>
          )}
        </div>
      </div>
    );
  }
}

export default injectIntl(TransactionDetails);
