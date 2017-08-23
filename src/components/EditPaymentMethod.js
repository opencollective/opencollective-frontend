import React from 'react';
import PropTypes from 'prop-types';

import { Row, Col, Checkbox, Button, Form } from 'react-bootstrap';
import { defineMessages, FormattedMessage } from 'react-intl';
import withIntl from '../lib/withIntl';
import InputField from '../components/InputField';
import { getCurrencySymbol, capitalize } from '../lib/utils';

class EditPaymentMethod extends React.Component {

  static propTypes = {
    paymentMethod: PropTypes.object.isRequired,
    onChange: PropTypes.func.isRequired
  };

  constructor(props) {
    super(props);
    const { intl, paymentMethod } = props;

    this.state = { paymentMethod, editMode: props.editMode || false };
    this.removePaymentMethod = this.removePaymentMethod.bind(this);
    this.onChange = props.onChange.bind(this);

    this.messages = defineMessages({
      'paymentMethod.edit': { id: 'paymentMethod.edit', defaultMessage: 'edit' },
      'paymentMethod.remove': { id: 'paymentMethod.remove', defaultMessage: 'remove' },
      'paymentMethod.monthlyLimitPerMember.label': { id: 'paymentMethod.monthlyLimitPerMember.label', defaultMessage: 'Monthly limit per member' },
      'paymentMethod.monthlyLimitPerMember.description': { id: 'paymentMethod.monthlyLimitPerMember.description', defaultMessage: 'You can set a monthly limit to allow the other members of your organization to use this credit card. If set to zero, only you and the other administrators of this organization will be able to use this card.' }
    });

  }

  removePaymentMethod() {
    this.onChange(null);
  }
  
  handleChange(obj) {
    const updatedPaymentMethod = { ...this.state.paymentMethod, ...obj }
    console.log(">>> handleChange", obj, "state", this.state.paymentMethod, "updatedPaymentMethod", updatedPaymentMethod);
    this.setState({ paymentMethod: updatedPaymentMethod });
    this.onChange(updatedPaymentMethod);
  }

  render() {
    const { intl, paymentMethod, currency } = this.props;

    return (
      <div className="EditPaymentMethod">
        <style global jsx>{`
          .monthlyLimitPerMember input {
            width: 10rem !important;
          }
        `}</style>

        <div className="createdAt col">{paymentMethod.createdAt}</div>
        <div className="identifier col">{paymentMethod.identifier}</div>
        { !this.state.editMode &&
        <div className="actions">
          <Button bsStyle="default" bsSize="xsmall" onClick={() => this.removePaymentMethod({})}>{intl.formatMessage(this.messages[`paymentMethod.remove`])}</Button>        
        </div>
        }

        { this.state.editMode &&
          <div>
            <InputField
              label="Credit Card"
              type="creditcard"
              name="creditcard"
              value={paymentMethod}
              className="horizontal"
              onChange={(creditcard) => this.handleChange({ card: creditcard })}
              />
            { this.props.monthlyLimitPerMember &&
              <InputField
                className="horizontal"
                label={capitalize(intl.formatMessage(this.messages['paymentMethod.monthlyLimitPerMember.label']))}
                type="currency"
                name="monthlyLimitPerMember"
                pre={getCurrencySymbol(currency)}
                value={paymentMethod.monthlyLimitPerMember}
                description={intl.formatMessage(this.messages['paymentMethod.monthlyLimitPerMember.description'])}
                onChange={(value) => this.handleChange({'monthlyLimitPerMember': value})}
                />
            }

          </div>
        }

      </div>
    );
  }

}

export default withIntl(EditPaymentMethod);