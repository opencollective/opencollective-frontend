import React from 'react';
import PropTypes from 'prop-types';
import { FormattedMessage } from 'react-intl';

import { getCurrencySymbol } from '../../lib/utils';

import InputField from '../InputField';

class EditPayExpenseFees extends React.Component {
  static propTypes = {
    currency: PropTypes.string.isRequired,
    onChange: PropTypes.func.isRequired,
    disabled: PropTypes.bool,
    canEditPlatformFee: PropTypes.bool,
    payoutMethod: PropTypes.string,
  };

  constructor(props) {
    super(props);
    this.state = {
      fees: {},
    };
    this.handleChange = this.handleChange.bind(this);
  }

  handleChange(obj) {
    const fees = { ...this.state.fees, ...obj };
    this.setState({ fees });
    this.props.onChange(fees);
  }

  render() {
    const { currency, canEditPlatformFee, payoutMethod } = this.props;

    return (
      <div className="EditPayExpenseFees">
        <style jsx>
          {`
            .EditPayExpenseFees {
              align-items: flex-end;
              display: flex;
              flex-wrap: wrap;
            }

            .processorFee {
              margin-right: 1rem;
              max-width: 16rem;
            }

            .columns {
              display: flex;
              flex-wrap: wrap;
              font-size: 1.2rem;
            }
            .col {
              width: 14rem;
              margin-right: 2rem;
            }
            label {
              text-transform: uppercase;
              color: #aaaeb3;
              font-weight: 300;
              white-space: nowrap;
            }

            .processorFee label {
              margin: 0;
            }
          `}
        </style>
        <style global jsx>
          {`
            .processorFee .inputField,
            .processorFee .form-group {
              margin: 0;
            }

            .processorFee .inputField {
              margin-top: 0.5rem;
            }
          `}
        </style>

        <div className="columns fees">
          {payoutMethod === 'other' && (
            <div className="hostFeeInCollectiveCurrency col">
              <label htmlFor="hostFeeInCollectiveCurrency">
                <FormattedMessage id="expense.hostFeeInCollectiveCurrency" defaultMessage="host fee" />
              </label>
              <InputField
                defaultValue={0}
                id="hostFeeInCollectiveCurrency"
                name="hostFeeInCollectiveCurrency"
                onChange={hostFeeInCollectiveCurrency => this.handleChange({ hostFeeInCollectiveCurrency })}
                pre={getCurrencySymbol(currency)}
                type="currency"
              />
            </div>
          )}
          <div className="paymentProcessorFeeInCollectiveCurrency col">
            <label htmlFor="paymentProcessorFeeInCollectiveCurrency">
              <FormattedMessage
                id="expense.paymentProcessorFeeInCollectiveCurrency"
                defaultMessage="payment processor fee"
              />
            </label>
            <InputField
              defaultValue={0}
              id="paymentProcessorFeeInCollectiveCurrency"
              name="paymentProcessorFeeInCollectiveCurrency"
              onChange={paymentProcessorFeeInCollectiveCurrency =>
                this.handleChange({ paymentProcessorFeeInCollectiveCurrency })
              }
              pre={getCurrencySymbol(currency)}
              type="currency"
            />
          </div>

          {canEditPlatformFee && payoutMethod === 'other' && (
            <div className="platformFeeInCollectiveCurrency col">
              <label htmlFor="platformFeeInCollectiveCurrency">
                <FormattedMessage id="expense.platformFeeInCollectiveCurrency" defaultMessage="platform fee" />
              </label>
              <InputField
                defaultValue={0}
                id="platformFeeInCollectiveCurrency"
                name="platformFeeInCollectiveCurrency"
                onChange={platformFeeInCollectiveCurrency => this.handleChange({ platformFeeInCollectiveCurrency })}
                pre={getCurrencySymbol(currency)}
                type="currency"
              />
            </div>
          )}
        </div>
      </div>
    );
  }
}

export default EditPayExpenseFees;
