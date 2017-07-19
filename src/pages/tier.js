import React from 'react';
import { addCollectiveTierData, addGetLoggedInUserFunction } from '../graphql/queries';
import { addCreateResponseMutation } from '../graphql/mutations';
import withData from '../lib/withData';
import withIntl from '../lib/withIntl';
import Header from '../components/Header';
import Body from '../components/Body';
import Footer from '../components/Footer';
import NotFound from '../components/NotFound';
import TierComponent from '../components/Tier';
import { defineMessages } from 'react-intl';
import InputField from '../components/InputField';
import { Alert, Row, Col, Button, Form } from 'react-bootstrap';
import { capitalize } from '../lib/utils';
import CollectiveCover from '../components/CollectiveCover';
import { get, pick } from 'lodash';
import { getStripeToken, isValidCard } from '../lib/stripe';

class Tier extends React.Component {

  static getInitialProps ({ query: { collectiveSlug, tierId, prefill } }) {
    return { collectiveSlug, tierId, prefill }
  }

  constructor(props) {
    super(props);
    const { intl } = props;

    const order = (!props.prefill) ? {} : {
      firstName: "Xavier",
      lastName: "Damman",
      organization: "Open Collective",
      website: "https://xdamman.com",
      email: "noreply@opencollective.com",
      description: "One line bio",
      message: "Custom message",
      twitteHandler: "xdamman"
    };

    this.state = { order, result: {} };
    this.handleChange = this.handleChange.bind(this);
    this.handleSubmit = this.handleSubmit.bind(this);
    this.validate = this.validate.bind(this);
    this.resetOrder = this.resetOrder.bind(this);
    this.order = this.order.bind(this);

    this.messages = defineMessages({
      'order.success': { id: 'tier.order.success', defaultMessage: '🎉 Your order has been processed with success' },
      'order.error': { id: 'tier.order.error', defaultMessage: `An error occured 😳. The order didn't go through. Please try again in a few.` },
      'creditcard.error': { id: 'creditcard.error', defaultMessage: 'Invalid credit card' },
      'ticket.title': { id: 'tier.order.ticket.title', defaultMessage: 'RSVP' },
      'backer.title': { id: 'tier.order.backer.title', defaultMessage: 'Become a {name}' },
      'sponsor.title': { id: 'tier.order.sponsor.title', defaultMessage: 'Become a {name}' },
      'order.btn': { id: 'tier.order.btn', defaultMessage: 'place order' },
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
      'amount.label': { id: 'tier.amount.label', defaultMessage: 'amount' },
      'startsAt.label': { id: 'tier.startsAt.label', defaultMessage: 'start date and time' },
      'endsAt.label': { id: 'tier.endsAt.label', defaultMessage: 'end date and time' },
      'response.message.placeholder': { id: 'response.message.placeholder', defaultMessage: 'Use this space to add a personal message (public)' }
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

  async componentDidMount() {
    const { getLoggedInUser, data } = this.props;
    const LoggedInUser = getLoggedInUser && await getLoggedInUser(this.props.collectiveSlug);
    const order = pick(LoggedInUser, ['firstName','lastName','email','organization', 'website', 'twitterHandle','description']);
    this.setState({LoggedInUser, order});

    if (typeof Stripe !== 'undefined') {
      const stripePublishableKey = (window.location.hostname === 'localhost') ? 'pk_test_5aBB887rPuzvWzbdRiSzV3QB' : data.Collective.stripePublishableKey;
      // eslint-disable-next-line
      Stripe.setPublishableKey(stripePublishableKey);
    }

  }

  handleChange(fieldname, value) {
    const order = {};
    order[fieldname] = value;

    if (fieldname === 'email' && !this.state.order.organization) {
      const domain = value.substr(value.indexOf('@')+1).toLowerCase();
      if (domain && ['gmail.com','skynet.be','outlook.com','gmx.com','qq.com','live.com', 'msn.com', 'aol.com', 'lycos.com', 'me.com','icloud.com', 'mac.com','web.de','yandex.ru'].indexOf(domain) === -1 && !domain.match(/mail/) && !domain.match(/yahoo\./)) {
        order['organization'] = capitalize(domain.substr(0,domain.indexOf('.')));
      }
    }

    // Make sure that endsAt is always >= startsAt
    if (fieldname === 'startsAt' || fieldname === 'endsAt') {
      const endsAt = this.state.order.endsAt;
      if (!endsAt || new Date(endsAt) < new Date(value)) {
        order['endsAt'] = value;
      }
    }
    const newState = { order: Object.assign({}, this.state.order, order) };
    console.log(">>> new state.order", newState.order);
    this.setState(newState);
  }

  async handleSubmit() {
    if (! await this.validate()) return;
    const order = this.state.order;
    const { data } = this.props;
    const attributes = {
      user: [
        'firstName',
        'lastName',
        'email',
        'organization',
        'website',
        'twitterHandle',
        'description',
        'website'
      ]
    };
    const user = pick(order, attributes.user);
    user.paymentMethod = order.sanitizedCard;
    const ResponseInputType = {
      user,
      description: order.message,
      quantity: order.quantity,
      collective: { slug: data.Collective.slug },
      tier: { id: data.Tier.id }
    };
    console.log("Ordering", ResponseInputType);
    this.order(ResponseInputType);
  }

  async validate() {
    const { intl, data } = this.props;
    if (data.Tier.amount > 0) {
      const card = this.state.order.creditcard;
      const newState = {...this.state};
      newState.order.quantity = newState.order.quantity || 1;
      if (isValidCard(card)) {
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
        newState.order.sanitizedCard = sanitizedCard;
        this.setState(newState);
        return true;
      } else if (card.uuid && card.uuid.length === 36) {
        newState.order.sanitizedCard = card;
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

  async order(order) {
    const { intl } = this.props;
    try {
      this.setState({status: 'loading'});
      const res = await this.props.createResponse(order);
      const response = res.data.createResponse;
      this.setState({ status: 'idle', order, result: { success: intl.formatMessage(this.messages['order.success']) } });
      window.location.replace(`https://opencollective.com/${response.user.username}`);
    } catch (e) {
      this.setState({ status: 'idle', result: { error: intl.formatMessage(this.messages['order.error']) } });
    }
  }

  render() {
    const { intl, data } = this.props;
    const { loading, Tier } = this.props.data;
    const collective = data.Collective;
    if (loading) return (<div />);

    if (!Tier) return (<NotFound />);

    return (
      <div>

        <Header
          title={collective.name}
          description={collective.description}
          twitterHandle={collective.twitterHandle}
          image={collective.logo || collective.backgroundImage}
          className={this.state.status}
          LoggedInUser={this.state.LoggedInUser}
          />

        <Body>
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
            margin-top: 6rem;
          }
          .result {
            margin-top: 3rem;
          }
          .result div {
            width: 100%;
          }
          :global(.col-sm-12) {
            width: 100%;
          }
          `}</style>
            <CollectiveCover
              collective={collective}
              logo={collective.logo}
              title={intl.formatMessage(this.messages[`${Tier.type.toLowerCase()}.title`], { name: Tier.name })}
              className="small"
              backgroundImage={collective.backgroundImage}
              style={get(collective, 'settings.style.hero.cover')}
              />

            <div className="content">
              <div className="OrderForm">
                <Form horizontal>
                  <div className="userDetailsForm">
                    <h2>Personal details</h2>
                    {this.fields.map(field => (
                      <Row>
                        <Col sm={12}>
                          <InputField
                            className="horizontal"
                            {...field}
                            defaultValue={this.state.order[field.name]}
                            onChange={(value) => this.handleChange(field.name, value)}
                            />
                        </Col>
                      </Row>
                    ))}
                </div>

                {Tier.amount > 0 &&
                  <div className="paymentDetails">
                    <h2>Payment details</h2>
                    <Row>
                      <Col sm={12}>
                        <InputField
                          label="Credit Card"
                          type="creditcard"
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
                          <TierComponent tier={this.state.order.tier || Tier} />
                        </Col>
                      </div>
                    </Col>
                  </Row>
                  <Row>
                    <Col sm={12}>
                    <InputField
                      label="Message"
                      type="textarea"
                      className="horizontal"
                      value={this.state.order.message}
                      placeholder={intl.formatMessage(this.messages['response.message.placeholder'])}
                      defaultValue={this.state.order.message}
                      onChange={(value) => this.handleChange("message", value)}
                      />
                    </Col>
                  </Row>
                </div>

                <div className="actions row">
                  <Col sm={3}></Col>
                  <Col sm={4}>
                    <Button bsStyle="primary" ref="submit" onClick={this.handleSubmit} disabled={this.state.status === 'loading'} block>{capitalize(intl.formatMessage(this.messages['order.btn']))}</Button>
                  </Col>
                </div>
                <div className="result row">
                  <Col sm={3}></Col>
                  <Col sm={9}>
                    {this.state.result.success &&
                      <div className="success">
                        <Alert bsStyle="success">{this.state.result.success}</Alert>
                      </div>
                    }
                    {this.state.result.error && 
                      <div className="error">
                        <Alert bsStyle="danger">{this.state.result.error}</Alert>
                      </div>
                    }
                  </Col>
                </div>
                  
              </Form>
                
              </div>
            </div>
        </Body>
        <Footer />
      </div>
    );
  }

}

export default withData(withIntl(addGetLoggedInUserFunction(addCollectiveTierData(addCreateResponseMutation(Tier)))));