import React from 'react';
import PropTypes from 'prop-types';
import TierComponent from '../components/Tier';
import InputField from '../components/InputField';
import Button from '../components/Button';
import { Row, Col, Form } from 'react-bootstrap';
import { defineMessages, FormattedMessage } from 'react-intl';
import { capitalize } from '../lib/utils';
import { getStripeToken, isValidCard } from '../lib/stripe';
import { pick } from 'lodash';
import withIntl from '../lib/withIntl';

class OrderForm extends React.Component {

  static propTypes = {
    order: PropTypes.object.isRequired, // { tier: {}, quantity: Int, interval: String, totalAmount: Int }
    LoggedInUser: PropTypes.object,
    onSubmit: PropTypes.func.isRequired,
    stripePublishableKey: PropTypes.string.isRequired
  }

  constructor(props) {
    super(props);
    const { intl, order } = props;

    this.creditcardRequired = order.totalAmount > 0 || order.tier.amount > 0;

    this.state = {
      user: {},
      order: order || {},
      tier: order.tier || {},
      result: {}
    };
    this.handleChange = this.handleChange.bind(this);
    this.handleSubmit = this.handleSubmit.bind(this);
    this.error = this.error.bind(this);
    this.resetError = this.resetError.bind(this);
    this.validate = this.validate.bind(this);
    this.resetOrder = this.resetOrder.bind(this);

    this.messages = defineMessages({
      'order.success': { id: 'tier.order.success', defaultMessage: '🎉 Your order has been processed with success' },
      'order.error': { id: 'tier.order.error', defaultMessage: `An error occured 😳. The order didn't go through. Please try again in a few.` },
      'creditcard.missing': { id: 'creditcard.missing', defaultMessage: 'Mmmm... 🤔 looks like you forgot to provide your credit card details.' },
      'creditcard.error': { id: 'creditcard.error', defaultMessage: 'Invalid credit card' },
      'ticket.title': { id: 'tier.order.ticket.title', defaultMessage: 'RSVP' },
      'backer.title': { id: 'tier.order.backer.title', defaultMessage: 'Become a {name}' },
      'sponsor.title': { id: 'tier.order.sponsor.title', defaultMessage: 'Become a {name}' },
      'order.button': { id: 'tier.order.button', defaultMessage: 'place order' },
      'type.label': { id: 'tier.type.label', defaultMessage: 'type' },
      'firstName.label': { id: 'user.firstName.label', defaultMessage: 'first name' },
      'lastName.label': { id: 'user.lastName.label', defaultMessage: 'last name' },
      'organization.label': { id: 'user.organization.label', defaultMessage: 'organization' },
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
        name: 'email',
        type: 'email',
        focus: true,
        required: true
      },
      {
        name: 'firstName'
      },
      {
        name: 'lastName'
      },
      {
        name: 'organization'
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
      const stripePublishableKey = (window.location.hostname === 'localhost') ? 'pk_test_5aBB887rPuzvWzbdRiSzV3QB' : this.props.stripePublishableKey;
      // eslint-disable-next-line
      Stripe.setPublishableKey(stripePublishableKey);
    }
  }

  // Prefill the form with logged in user if any
  componentWillReceiveProps(props) {
    if (!this.state.user.email) {
      const user = pick(props.LoggedInUser, ['firstName', 'lastName', 'email', 'organization', 'website', 'twitterHandle', 'description']);
      this.setState({
        user,
        LoggedInUser: props.LoggedInUser
      });
    }
  }

  handleChange(obj, attr, value) {
    this.resetError();
    const newState = { ... this.state };
    if (value) {
      newState[obj][attr] = value;
    } else {
      newState[obj] = Object.assign({}, this.state[obj], attr);
    }

    // Trying to be smart and autodetect the organization based on the domain of the email address
    if (obj === 'user' && attr === 'email' && !this.state.user.organization) {
      const domain = value.substr(value.indexOf('@')+1).toLowerCase();
      if (domain && ['gmail.com','skynet.be','outlook.com','gmx.com','qq.com','live.com', 'msn.com', 'aol.com', 'lycos.com', 'me.com','icloud.com', 'mac.com','web.de','yandex.ru'].indexOf(domain) === -1 && !domain.match(/mail/) && !domain.match(/yahoo\./)) {
        newState['user']['organization'] = capitalize(domain.substr(0, domain.indexOf('.')));
      }
    }

    this.setState(newState);
    window.state = newState;
  }

  async handleSubmit() {
    if (! await this.validate()) return false;
    this.setState({ loading: true });

    const { sanitizedCard, order, tier } = this.state;
    let { user } = this.state;

    if (this.state.LoggedInUser) {
      user = { id: this.state.LoggedInUser.id };
    }
    user.paymentMethod = sanitizedCard;
    const quantity = tier.quantity || 1;
    const OrderInputType = {
      user,
      description: tier.description,
      publicMessage: order.publicMessage,
      quantity,
      interval: tier.interval,
      totalAmount: (quantity * tier.amount) || order.totalAmount
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

    if (this.creditcardRequired) {
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
        const sanitizedCard = {
          identifier: card.number.replace(/ /g, '').substr(-4),
          fullName: card.fullName,
          expMonth: card.exp_month,
          expYear: card.exp_year,
          token: res.token,
          brand: res.card.brand,
          country: res.card.country,
          funding: res.card.funding,
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

  render() {
    const { intl } = this.props;
    const quantity = this.state.order.quantity || 1;

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
            <h2>Personal details</h2>
            {this.state.LoggedInUser && this.fields.map(field => (
              <Row className={field.name} key={`${field.name}.value`}>
                <Col sm={12}>
                  <div className="form-group">
                    <label className="col-sm-3 control-label">{capitalize(field.label)}</label>
                    <Col sm={9}>
                    <span className="value">{this.state.LoggedInUser[field.name]}</span>
                    </Col>
                  </div>
                </Col>
              </Row>
            ))}
            {!this.state.LoggedInUser && this.fields.map(field => (
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

        { this.creditcardRequired &&
          <div className="paymentDetails">
            <h2>Payment details</h2>
            <Row>
              <Col sm={12}>
                <InputField
                  label="Credit Card"
                  type="creditcard"
                  name="creditcard"
                  options={this.state.LoggedInUser && this.state.LoggedInUser.paymentMethods}
                  className="horizontal"
                  onChange={(value) => this.handleChange("creditcard", value)}
                  />
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
            <Button className="blue" ref="submit" onClick={this.handleSubmit} disabled={this.state.loading}>
              {this.state.loading ? <FormattedMessage id='loading' defaultMessage='loading' /> : this.state.tier.button || capitalize(intl.formatMessage(this.messages['order.button']))}
            </Button>
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