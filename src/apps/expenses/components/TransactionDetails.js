import React from 'react';
import PropTypes from 'prop-types';
import { defineMessages, FormattedNumber, FormattedMessage } from 'react-intl';
import { imagePreview, capitalize } from '../../../lib/utils';
import withIntl from '../../../lib/withIntl';
import { get } from 'lodash';

import RefundTransactionBtn from './RefundTransactionBtn';

import Link from '../../../components/Link';

class TransactionDetails extends React.Component {
  static propTypes = {
    collective: PropTypes.shape({
      id: PropTypes.number.isRequired,
      slug: PropTypes.string.isRequired,
      type: PropTypes.string.isRequired,
    }),
    id: PropTypes.number.isRequired,
    amount: PropTypes.number.isRequired,
    canEditCollective: PropTypes.bool,
    currency: PropTypes.string.isRequired,
    attachment: PropTypes.string,
    uuid: PropTypes.number,
    netAmountInCollectiveCurrency: PropTypes.number,
    platformFeeInHostCurrency: PropTypes.number,
    paymentProcessorFeeInHostCurrency: PropTypes.number,
    hostCurrency: PropTypes.string,
    hostCurrencyFxRate: PropTypes.number,
    paymentMethod: PropTypes.shape({
      service: PropTypes.string.isRequired,
    }),
    host: PropTypes.shape({
      hostFeePercent: PropTypes.number,
      slug: PropTypes.string.isRequired,
      name: PropTypes.string.isRequired,
    }),
    type: PropTypes.oneOf(['CREDIT', 'DEBIT']),
    isRefund: PropTypes.bool, // whether or not this transaction refers to a refund
    intl: PropTypes.object.isRequired,
    mode: PropTypes.string, // open or closed
  };

  constructor(props) {
    super(props);
    this.messages = defineMessages({
      hostFeeInHostCurrency: {
        id: 'transaction.hostFeeInHostCurrency',
        defaultMessage: '{hostFeePercent} host fee',
      },
      platformFeeInHostCurrency: {
        id: 'transaction.platformFeeInHostCurrency',
        defaultMessage: '5% Open Collective fee',
      },
      paymentProcessorFeeInHostCurrency: {
        id: 'transaction.paymentProcessorFeeInHostCurrency',
        defaultMessage: 'payment processor fee',
      },
    });
    this.currencyStyle = {
      style: 'currency',
      currencyDisplay: 'symbol',
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    };
  }

  render() {
    const {
      intl,
      canEditCollective,
      collective,
      attachment,
      id,
      type,
      host,
      amount,
      currency,
      hostCurrency,
      hostCurrencyFxRate,
      netAmountInCollectiveCurrency,
      paymentMethod,
      isRefund,
      uuid,
    } = this.props;

    // can refund if root user or if admin of collective (only for collectives hosted by /brusselstogetherasbl for now)
    const canRefund =
      LoggedInUser &&
      (LoggedInUser.isRoot() ||
        (get(transaction, 'host.id') === 9802 &&
          LoggedInUser.canEditCollective(collective)));

    const hostFeePercent = host && `${host.hostFeePercent}%`;
    const amountDetails = [
      intl.formatNumber(amount / 100, {
        currency: currency,
        ...this.currencyStyle,
      }),
    ];
    if (hostCurrencyFxRate && hostCurrencyFxRate !== 1) {
      const amountInHostCurrency = amount * hostCurrencyFxRate;
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
          amountDetails.push(
            `${intl.formatNumber(this.props[feeName] / 100, {
              currency: hostCurrency,
              ...this.currencyStyle,
            })} (${intl.formatMessage(this.messages[feeName], {
              hostFeePercent,
            })})`,
          );
        }
      });
    };

    addFees([
      'hostFeeInHostCurrency',
      'platformFeeInHostCurrency',
      'paymentProcessorFeeInHostCurrency',
    ]);

    const amountDetailsStr =
      amountDetails.length > 1 ? amountDetails.join(' ') : null;

    return (
      <div className={`TransactionDetails ${this.props.mode}`}>
        <style jsx>
          {`
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

        {type === 'DEBIT' && (
          <div className="frame">
            {attachment && (
              <a
                href={attachment}
                target="_blank"
                rel="noopener noreferrer"
                title="Open receipt in a new window"
              >
                <img src={imagePreview(attachment)} />
              </a>
            )}
            {!attachment && <img src={'/static/images/receipt.svg'} />}
          </div>
        )}
        {get(host, 'name') && (
          <div className="col">
            <label>
              <FormattedMessage id="transaction.host" defaultMessage="host" />
            </label>
            <Link route={`/${host.slug}`}>{host.name}</Link> ({hostCurrency})
          </div>
        )}
        <div className="col">
          <label>
            <FormattedMessage
              id="transaction.paymentMethod"
              defaultMessage="payment method"
            />
          </label>
          {paymentMethod && capitalize(paymentMethod.service)}
        </div>
        {hostCurrencyFxRate &&
          hostCurrencyFxRate !== 1 && (
            <div className="col">
              <label>
                <FormattedMessage
                  id="transaction.fxrate"
                  defaultMessage="fx rate"
                />
              </label>
              {hostCurrencyFxRate}
            </div>
          )}
        <div className="col">
          <label>
            <FormattedMessage
              id="transaction.amountDetails"
              defaultMessage="amount details"
            />
          </label>
          <div className="amountDetails">
            {amountDetailsStr && (
              <span>
                <span>{amountDetailsStr}</span>
                <span className="netAmountInCollectiveCurrency">
                  &nbsp;=&nbsp;
                </span>
              </span>
            )}
            <span className="netAmountInCollectiveCurrency">
              <FormattedNumber
                value={netAmountInCollectiveCurrency / 100}
                currency={currency}
                {...this.currencyStyle}
              />
            </span>
            &nbsp;
            <span className="netAmountInCollectiveCurrencyDescription">
              (
              <FormattedMessage
                id="transaction.netAmountInCollectiveCurrency.description"
                defaultMessage="net amount added to your collective's balance"
              />
              )
            </span>
          </div>
        </div>

        {type === 'DEBIT' &&
          canEditCollective &&
          !isRefund && (
            <div className="col invoice">
              <label>
                <FormattedMessage
                  id="transaction.invoice"
                  defaultMessage="invoice"
                />
              </label>
              <div>
                <a
                  href={`/${collective.slug}/transactions/${uuid}/invoice.pdf`}
                >
                  <FormattedMessage
                    id="transaction.downloadPDF"
                    defaultMessage="Download (pdf)"
                  />
                </a>
              </div>
            </div>
          )}

        <div className="actions">
          {canRefund && (
            <div className="transactionActions">
              <RefundTransactionBtn
                id={id}
                isRefund={isRefund}
                CollectiveId={collective.id}
              />
            </div>
          )}
        </div>
      </div>
    );
  }
}

export default withIntl(TransactionDetails);
