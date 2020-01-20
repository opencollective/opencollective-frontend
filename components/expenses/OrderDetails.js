import React from 'react';
import PropTypes from 'prop-types';
import { FormattedNumber, FormattedMessage } from 'react-intl';

class OrderDetails extends React.Component {
  static propTypes = {
    collective: PropTypes.object,
    order: PropTypes.object,
    LoggedInUser: PropTypes.object,
    onChange: PropTypes.func,
    mode: PropTypes.string, // summary, edit or details
    data: PropTypes.object,
  };

  constructor(props) {
    super(props);
    this.currencyStyle = {
      style: 'currency',
      currencyDisplay: 'symbol',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    };
  }

  render() {
    const { data } = this.props;
    const order = (data && data.Order) || this.props.order;

    return (
      <div className={`OrderDetails ${this.props.mode}`}>
        <style jsx>
          {`
            .OrderDetails {
              font-size: 1.2rem;
              overflow: hidden;
              transition: max-height 0.5s cubic-bezier(0.25, 0.46, 0.45, 0.94);
            }
            .OrderDetails.summary {
              max-height: 0;
            }
            .col {
              float: left;
              display: flex;
              flex-direction: column;
              margin-right: 1rem;
              margin-top: 1rem;
            }
            .row {
              margin-left: 0;
              margin-right: 0;
            }
            label {
              text-transform: uppercase;
              color: #aaaeb3;
              font-weight: 300;
              white-space: nowrap;
            }
            @media (max-width: 600px) {
              .OrderDetails {
                max-height: 30rem;
              }
            }
          `}
        </style>

        {order.tier && (
          <div>
            <div className="col">
              <label>
                <FormattedMessage id="order.tier" defaultMessage="tier" />
              </label>
              {order.tier.name}
            </div>
            <div className="col">
              <label>
                <FormattedMessage id="Fields.amount" defaultMessage="Amount" />
              </label>
              <div className="amountDetails">
                <span className="amount">
                  <FormattedNumber value={order.tier.amount / 100} currency={order.currency} {...this.currencyStyle} />
                </span>
              </div>
            </div>
            <div className="col">
              <label>
                <FormattedMessage id="order.quantity" defaultMessage="quantity" />
              </label>
              {order.quantity}
            </div>
          </div>
        )}
      </div>
    );
  }
}

export default OrderDetails;
