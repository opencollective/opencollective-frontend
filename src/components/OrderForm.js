import React from 'react';
import PropTypes from 'prop-types';
import TierComponent from '../components/Tier';
import InputField from '../components/InputField';
import ActionButton from '../components/Button';
import { Button, HelpBlock, Row, Col, Form, FormControl } from 'react-bootstrap';
import { defineMessages, FormattedMessage } from 'react-intl';
import { capitalize, formatCurrency } from '../lib/utils';
import { getStripeToken, isValidCard } from '../lib/stripe';
import { pick } from 'lodash';
import withIntl from '../lib/withIntl';
import { checkUserExistence, signin } from '../lib/api';

class OrderForm extends React.Component {

  static propTypes = {
    order: PropTypes.object.isRequired, // { tier: {}, quantity: Int, interval: String, totalAmount: Int }
    LoggedInUser: PropTypes.object,
    onSubmit: PropTypes.func.isRequired
  }

  constructor(props) {
    super(props);
    const { intl, order } = props;

    const tier = order.tier || {};
    this.state = {
      isNewUser: true,
      loginSent: false,
      user: {},
      fromCollective: {},
      creditcard: { save: true },
      order: order || { totalAmount: tier.amount * (tier.quantity || 1)},
      tier,
      result: {}
    };

    this.handleChange = this.handleChange.bind(this);
    this.handleSubmit = this.handleSubmit.bind(this);
    this.error = this.error.bind(this);
    this.resetError = this.resetError.bind(this);
    this.validate = this.validate.bind(this);
    this.resetOrder = this.resetOrder.bind(this);

    this.messages = defineMessages({
      'order.profile': { id: 'tier.order.profile', defaultMessage: `Profile` },
      'order.success': { id: 'tier.order.success', defaultMessage: '🎉 Your order has been processed with success' },
      'order.error': { id: 'tier.order.error', defaultMessage: `An error occured 😳. The order didn't go through. Please try again in a few.` },
      'creditcard.label': { id: 'creditcard.label', defaultMessage: 'Credit Card' },
      'creditcard.save': { id: 'creditcard.save', defaultMessage: 'Save credit card to {type, select, user {my account} other {{type} account}}' },
      'creditcard.missing': { id: 'creditcard.missing', defaultMessage: 'Mmmm... 🤔 looks like you forgot to provide your credit card details.' },
      'creditcard.error': { id: 'creditcard.error', defaultMessage: 'Invalid credit card' },
      'ticket.title': { id: 'tier.order.ticket.title', defaultMessage: 'RSVP' },
      'backer.title': { id: 'tier.order.backer.title', defaultMessage: 'Become a {name}' },
      'sponsor.title': { id: 'tier.order.sponsor.title', defaultMessage: 'Become a {name}' },
      'order.button': { id: 'tier.order.button', defaultMessage: 'place order' },
      'type.label': { id: 'tier.type.label', defaultMessage: 'type' },
      'firstName.label': { id: 'user.firstName.label', defaultMessage: 'first name' },
      'lastName.label': { id: 'user.lastName.label', defaultMessage: 'last name' },
      'website.label': { id: 'user.website.label', defaultMessage: 'website' },
      'twitterHandle.label': { id: 'user.twitterHandle.label', defaultMessage: 'twitter' },
      'twitterHandle.description': { id: 'user.twitterHandle.description', defaultMessage: 'If any' },
      'email.label': { id: 'user.email.label', defaultMessage: 'email' },
      'description.label': { id: 'user.description.label', defaultMessage: 'Short bio' },
      'description.description': { id: 'user.description.description', defaultMessage: 'Present yourself in 60 characters or less, if you can!' },
      'totalAmount.label': { id: 'tier.totalAmount.label', defaultMessage: 'Total amount' },
      'startsAt.label': { id: 'tier.startsAt.label', defaultMessage: 'start date and time' },
      'endsAt.label': { id: 'tier.endsAt.label', defaultMessage: 'end date and time' },
      'order.publicMessage.placeholder': { id: 'order.publicMessage.placeholder', defaultMessage: 'Use this space to add a personal message (public)' }
    });

    this.fields = [
      {
        name: 'firstName'
      },
      {
        name: 'lastName'
      },
      {
        name: 'website'
      },
      {
        name: 'twitterHandle',
        pre: '@',
        validate: (val) => val.match(/^[A-Za-z0-9_]{1,15}$/)
      },
      {
        name: 'description'
      }
    ]

    this.fields = this.fields.map(field => {
      if (this.messages[`${field.name}.label`]) {
        field.label = intl.formatMessage(this.messages[`${field.name}.label`]);
      }
      if (this.messages[`${field.name}.description`]) {
        field.description = intl.formatMessage(this.messages[`${field.name}.description`]);
      }
      return field;
    })
  }

  componentDidMount() {
    if (typeof Stripe !== 'undefined') {
      const stripePublishableKey = (window.location.hostname === 'localhost') ? 'pk_test_5aBB887rPuzvWzbdRiSzV3QB' : 'pk_live_qZ0OnX69UlIL6pRODicRzsZy';
      // eslint-disable-next-line
      Stripe.setPublishableKey(stripePublishableKey);
    }
  }

  // Prefill the form with logged in user if any
  componentWillReceiveProps(props) {
    if (!this.state.fromCollective.email && props.LoggedInUser) {
      const user = pick(props.LoggedInUser, ['firstName', 'lastName', 'email', 'organization', 'website', 'twitterHandle', 'description']);
      const fromCollective = { id: props.LoggedInUser.CollectiveId, type: 'USER' };
      this.setState({
        user,
        fromCollective,
        LoggedInUser: props.LoggedInUser
      });
    }
  }

  handleChange(obj, attr, value) {
    this.resetError();
    const newState = { ... this.state };

    if (value === 'null') {
      value = null;
    }

    if (value !== undefined) {
      newState[obj][attr] = value;
    } else {
      newState[obj] = Object.assign({}, this.state[obj], attr);
    }

    if (obj === 'tier') {
      newState['order']['totalAmount'] = newState['tier']['amount'] * newState['tier']['quantity'];
    }

    if (attr === 'email') {
      checkUserExistence(value).then(exists => {
        this.setState({ isNewUser: !exists });
      });
    }

    this.setState(newState);
    if (typeof window !== undefined) {
      window.state = newState;
    }
  }

  async handleSubmit() {
    if (! await this.validate()) return false;
    this.setState({ loading: true });

    const { sanitizedCard, order, tier, fromCollective } = this.state;

    const quantity = tier.quantity || 1;
    const OrderInputType = {
      fromCollective,
      publicMessage: order.publicMessage,
      quantity,
      interval: tier.interval,
      totalAmount: (quantity * tier.amount) || order.totalAmount,
      paymentMethod: sanitizedCard
    };

    if (tier.id) {
      OrderInputType.tier = { id: tier.id, amount: tier.amount };
    }
    console.log("OrderForm", "onSubmit", OrderInputType);
    await this.props.onSubmit(OrderInputType);
    this.setState({ loading: false });
  }

  error(msg) {
    this.setState({ result: { error: msg }});
  }

  resetError() {
    this.setState({ result: { error: null }});
  }

  async validate() {
    const { intl } = this.props;

    if (this.state.order.totalAmount > 0) {
      const card = this.state.creditcard;
      if (!card) {
        this.setState({ result: { error: intl.formatMessage(this.messages['creditcard.missing']) }})
        return false;
      }
      const newState = {...this.state};
      if (card.uuid && card.uuid.length === 36) {
        newState.sanitizedCard = card;
        this.setState(newState);
        return true;
      } else if (isValidCard(card)) {
        const res = await getStripeToken(card)
        const last4 = card.number.replace(/ /g, '').substr(-4);
        const sanitizedCard = {
          name: last4,
          token: res.token,
          data: {
            fullName: card.full_name,
            expMonth: card.exp_month,
            expYear: card.exp_year,
            brand: res.card.brand,
            country: res.card.country,
            funding: res.card.funding,
          },
          save: card.save
        };
        newState.sanitizedCard = sanitizedCard;
        this.setState(newState);
        return true;
      } else {
        this.setState({ result: { error: intl.formatMessage(this.messages['creditcard.error']) }})
        return false;
      }
    }
  }

  resetOrder() {
    this.setState({ order: {} });
  }

  signin() {
    signin(this.state.user, window.location.href).then(() => {
      this.setState({ loginSent: true })
    })
  }

  render() {
    const { intl } = this.props;
    const { LoggedInUser } = this.state;
    const quantity = this.state.order.quantity || 1;

    const inputEmail = {
      type: 'email',
      name: 'email',
      required: true,
      focus: true,
      label: intl.formatMessage(this.messages['email.label']),
      defaultValue: this.state.order['email'],
      onChange: (value) => this.handleChange("user", "email", value)
    };
    if (!this.state.isNewUser) {
      inputEmail.button = <Button onClick={() => this.signin()} focus={true}>Login</Button>;
      if (!this.state.loginSent) {
        inputEmail.description = `Oh oh, looks like you already have an account on Open Collective with this email address. Please login.`
      } else {
        inputEmail.button = <Button disabled={true}>Login</Button>;
        inputEmail.description = `Login email sent. Please follow the instructions in that email to proceed.`
      }
    }

    const fromCollectiveOptions = [], collectivesById = {};
    if (LoggedInUser) {
      fromCollectiveOptions.push({ [LoggedInUser.CollectiveId]: LoggedInUser.collective.name });
      collectivesById[LoggedInUser.CollectiveId] = LoggedInUser.collective;
      LoggedInUser.memberOf.map(membership => {
        if (['ADMIN','HOST'].indexOf(membership.role) === -1) return;
        const value = membership.collective.id;
        const label = membership.collective.name;
        collectivesById[value] = membership.collective;
        fromCollectiveOptions.push({ [value]: label });
      })
    }
    fromCollectiveOptions.push({ createOrganization: 'Create an organization' });

    let paymentMethods = [];
    if (LoggedInUser && this.state.fromCollective) {
      paymentMethods = collectivesById[this.state.fromCollective.id].paymentMethods
    }
    const paymentMethodsOptions = [];
    paymentMethods.map(option => {
      const value = option.uuid
      const label = `💳  \xA0\xA0${option.data.brand} ${option.data.funding} ${option.data.identifier} - exp ${option.data.expMonth}/${option.data.expYear}`;
      paymentMethodsOptions.push({ [value]: label });
    });
    paymentMethodsOptions.push({[null]: 'other'});

    return (
      <div className="OrderForm">
        <style jsx>{`
        h2 {
          margin: 3rem 0 3rem 0;
        }
        .OrderForm {
          max-width: 700px;
          margin: 0 auto;
        }
        .userDetailsForm {
          overflow: hidden;
        }
        .paymentDetails {
          overflow: hidden;
        }
        .OrderForm :global(.tier) {
          margin: 0 0 1rem 0;
        }
        label {
          max-width: 100%;
          padding-right: 1rem;
        }
        .actions {
          margin: 6rem auto;
          text-align: center;
          max-width: 400px
        }
        .result {
          margin-top: 3rem;
        }
        .result div {
          width: 100%;
        }
        .error {
          color: red;
          font-weight: bold;
        }
        :global(.col-sm-12) {
          width: 100%;
        }
        .value {
          padding-top: 7px;
          display: inline-block;
        }
        @media (min-width: 768px) {
          .actions {
            margin: 6rem 0 6rem 26%;
          }
        }
        `}</style>
        <Form horizontal>
          <div className="userDetailsForm">
            <h2><FormattedMessage id="tier.order.userdetails" defaultMessage="User details" /></h2>
            {LoggedInUser &&
              <InputField
                className="horizontal"
                type="select"
                label={intl.formatMessage(this.messages['order.profile'])}
                name="fromCollectiveSelector"
                onChange={value => this.handleChange("fromCollective", collectivesById[value])}
                options={fromCollectiveOptions}
                />
            }
            {!LoggedInUser &&
              <Row key={`email.input`}>
                <Col sm={12}>
                  <InputField
                    className="horizontal"
                    {...inputEmail}
                    />
                </Col>
              </Row>
            }
            {!LoggedInUser && this.state.isNewUser && this.fields.map(field => (
              <Row key={`${field.name}.input`}>
                <Col sm={12}>
                  <InputField
                    className="horizontal"
                    {...field}
                    defaultValue={this.state.order[field.name]}
                    onChange={(value) => this.handleChange("user", field.name, value)}
                    />
                </Col>
              </Row>
            ))}
        </div>

        { this.state.order.totalAmount > 0 &&
          <div className="paymentDetails">
            <h2>Payment details</h2>
            <Row>
              <Col sm={12}>
                { paymentMethods.length === 0 &&
                  <div>
                    <InputField
                      label={intl.formatMessage(this.messages['creditcard.label'])}
                      type="creditcard"
                      name="creditcard"
                      className="horizontal"
                      onChange={(creditcardObject) => this.handleChange("creditcard", creditcardObject)}
                      />
                    <InputField
                      description={intl.formatMessage(this.messages['creditcard.save'], { type: this.state.fromCollective.type && this.state.fromCollective.type.toLowerCase() })}
                      className="horizontal"
                      name="saveCreditCard"
                      type="checkbox"
                      defaultValue={true}
                      onChange={value => this.handleChange("creditcard", "save", value)}
                      />
                  </div>
                }
                { paymentMethods.length > 0 &&
                  <InputField
                    type="select"
                    className="horizontal"
                    type="select"
                    label={intl.formatMessage(this.messages['creditcard.label'])}
                    name="creditcardSelector"
                    onChange={value => this.handleChange("creditcard", "uuid", value)}
                    options={paymentMethodsOptions}
                    />
                }              
              </Col>
            </Row>
          </div>
        }
        
        <div className="order">
          <h2>Order details</h2>
          <Row>
            <Col sm={12}>
              <div className="form-group">
                <label className="col-sm-3 control-label">Order</label>
                <Col sm={9}>
                  <TierComponent
                    tier={this.state.tier}
                    interval={this.state.order.interval}
                    quantity={quantity}
                    amount={this.state.order.totalAmount / quantity}
                    onChange={(tier) => this.handleChange("tier", tier)}
                    />
                </Col>
              </div>
            </Col>
          </Row>
          <Row>
            <Col sm={12}>
            <InputField
              label="Message (public)"
              type="textarea"
              name="publicMessage"
              className="horizontal"
              placeholder={intl.formatMessage(this.messages['order.publicMessage.placeholder'])}
              defaultValue={this.state.order.publicMessage}
              onChange={(value) => this.handleChange("order", "publicMessage", value)}
              />
            </Col>
          </Row>
        </div>

        <div className="actions">
          <div className="submit">
            <ActionButton className="blue" ref="submit" onClick={this.handleSubmit} disabled={this.state.loading}>
              {this.state.loading ? <FormattedMessage id='loading' defaultMessage='loading' /> : this.state.tier.button || capitalize(intl.formatMessage(this.messages['order.button']))}
            </ActionButton>
          </div>
          <div className="result">
              {this.state.loading && <div className="loading">Processing...</div>}
              {this.state.result.success &&
                <div className="success">
                  {this.state.result.success}
                </div>
              }
              {this.state.result.error && 
                <div className="error">
                  {this.state.result.error}
                </div>
              }
          </div>
        </div>
          
      </Form>
        
      </div>
    )
  }
}

export default withIntl(OrderForm);