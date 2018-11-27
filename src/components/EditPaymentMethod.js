import React from 'react';
import PropTypes from 'prop-types';

import Router from 'next/router';
import { Row, Col, Button } from 'react-bootstrap';
import { defineMessages, FormattedMessage } from 'react-intl';
import withIntl from '../lib/withIntl';
import InputField from './InputField';
import { getCurrencySymbol, capitalize } from '../lib/utils';
import { paymentMethodLabelWithIcon } from '../lib/payment_method_label';

class EditPaymentMethod extends React.Component {
  static propTypes = {
    paymentMethod: PropTypes.object.isRequired,
    onChange: PropTypes.func.isRequired,
    editMode: PropTypes.bool,
    slug: PropTypes.string,
  };

  constructor(props) {
    super(props);
    const { paymentMethod } = props;

    this.state = { paymentMethod, editMode: props.editMode || false };
    this.removePaymentMethod = this.removePaymentMethod.bind(this);
    this.onChange = props.onChange.bind(this);

    this.messages = defineMessages({
      'paymentMethod.edit': {
        id: 'paymentMethod.edit',
        defaultMessage: 'edit',
      },
      'paymentMethod.remove': {
        id: 'paymentMethod.remove',
        defaultMessage: 'remove',
      },
      'paymentMethod.editSubscriptions': {
        id: 'paymentMethod.editSubscriptions',
        defaultMessage: 'edit subscriptions',
      },
      'paymentMethod.monthlyLimitPerMember.label': {
        id: 'paymentMethod.monthlyLimitPerMember.label',
        defaultMessage: 'Monthly limit per member',
      },
      'paymentMethod.monthlyLimitPerMember.description': {
        id: 'paymentMethod.monthlyLimitPerMember.description',
        defaultMessage:
          'You can set a monthly limit to allow the other members of your organization to use this credit card. If set to zero, only you and the other administrators of this organization will be able to use this card.',
      },
    });
  }

  removePaymentMethod() {
    this.onChange(null);
  }

  handleChange(obj) {
    const updatedPaymentMethod = { ...this.state.paymentMethod, ...obj };
    this.setState({ paymentMethod: updatedPaymentMethod });
    this.onChange(updatedPaymentMethod);
  }

  render() {
    const { intl, paymentMethod, currency } = this.props;
    const { service, type, orders } = paymentMethod;
    const hasOrders = orders && orders.length > 0;
    const isStripeCreditCard = service === 'stripe' && type === 'creditcard';
    const canRemove = !hasOrders && isStripeCreditCard;

    return (
      <div className="EditPaymentMethod">
        <style global jsx>
          {`
            .monthlyLimitPerMember input {
              width: 10rem !important;
            }
          `}
        </style>

        <div>
          {this.state.editMode && (
            <InputField
              label="Credit Card"
              type="creditcard"
              name="creditcard"
              defaultValue={paymentMethod}
              className="horizontal"
              onChange={creditcard => this.handleChange({ card: creditcard })}
            />
          )}
          {!this.state.editMode && (
            <Row>
              <Col sm={12}>
                <div className="form-group">
                  <label className="col-sm-2 control-label">
                    <FormattedMessage
                      id="paymentMethod.typeSelect"
                      values={{ type }}
                      defaultMessage="{type, select, virtualcard {Gift card} creditcard {Credit card} prepaid {Prepaid}}"
                    />
                  </label>
                  <Col sm={9}>
                    <div className="name col">{paymentMethodLabelWithIcon(intl, paymentMethod)}</div>
                    {hasOrders && (
                      <div className="actions">
                        <FormattedMessage
                          id="paymentMethod.activeSubscriptions"
                          defaultMessage="{n} active {n, plural, one {subscription} other {subscriptions}}"
                          values={{ n: orders.length }}
                        />
                        &nbsp;
                        <Button
                          bsStyle="default"
                          bsSize="xsmall"
                          onClick={() =>
                            Router.push(
                              `/subscriptions?collectiveSlug=${this.props.slug}`,
                              `/${this.props.slug}/subscriptions`,
                            )
                          }
                        >
                          {intl.formatMessage(this.messages['paymentMethod.editSubscriptions'])}
                        </Button>
                      </div>
                    )}
                    {canRemove && (
                      <div className="actions">
                        <Button bsStyle="default" bsSize="xsmall" onClick={() => this.removePaymentMethod({})}>
                          {intl.formatMessage(this.messages['paymentMethod.remove'])}
                        </Button>
                      </div>
                    )}
                  </Col>
                </div>
              </Col>
            </Row>
          )}
          {this.props.monthlyLimitPerMember && (
            <Row>
              <InputField
                className="horizontal"
                label={capitalize(intl.formatMessage(this.messages['paymentMethod.monthlyLimitPerMember.label']))}
                type="currency"
                name="monthlyLimitPerMember"
                pre={getCurrencySymbol(currency)}
                defaultValue={paymentMethod.monthlyLimitPerMember}
                description={intl.formatMessage(this.messages['paymentMethod.monthlyLimitPerMember.description'])}
                onChange={value => this.handleChange({ monthlyLimitPerMember: value })}
              />
            </Row>
          )}
        </div>
      </div>
    );
  }
}

export default withIntl(EditPaymentMethod);
