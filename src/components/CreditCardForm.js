import React from 'react';
import Payment from 'payment';
import { Row, Col, FormGroup, ControlLabel, Alert } from 'react-bootstrap';
import { getStripeToken, isValidCard } from '../lib/stripe';
import Button from './Button';
import _ from 'lodash';

class CreditCardForm extends React.Component {

  static propTypes = {
    stripePublishableKey: React.PropTypes.string.isRequired,
    onCardAdded: React.PropTypes.func,
    addCardLabel: React.PropTypes.string,
    disabled: React.PropTypes.bool
  }

  constructor(props) {
    super(props);
    this.setCardType = this.setCardType.bind(this);
    this.handleChange = this.handleChange.bind(this);
    
    if (typeof Stripe !== 'undefined') {
      // eslint-disable-next-line
      Stripe.setPublishableKey(this.props.stripePublishableKey);
      console.log("setting stripePublishableKey",this.props.stripePublishableKey);
    }

    this.state = {
      error: null,
      card: {
        number: this.props.number,
        exp_month: null,
        exp_year: null,
        cvc: null
      }
    };

    const expiration = this.props.expiration;
    if (expiration) {
      const tokens = expiration.split('/');
      this.state.card.exp_month = Number(tokens[0]);
      this.state.card.exp_year = 2000 + Number(tokens[1]);
    }
  }

  componentDidMount() {
    Payment.formatCardNumber(this.refs.number);
    Payment.formatCardExpiry(this.refs.expiration);
  }

  handleChange(fieldname) {

    const field = {};
    field[fieldname] = this.refs[fieldname].value;
    const card = Object.assign({}, this.state.card, field);

    if (fieldname === 'expiration') {
      const expiration = this.refs[fieldname].value.split('/');
      card.exp_month = Number(expiration[0]);
      card.exp_year = 2000 + Number(expiration[1]);
    }

    this.setState({ card });

    if (isValidCard(card)) {
      getStripeToken(card)
        .then((token) => {
          const sanitizedCard = {
            number: card.number.replace(/ /g, '').substr(-4),
            expMonth: card.exp_month,
            expYear: card.exp_year,
            token
          };
          this.props.onCardAdded(sanitizedCard);
        }).catch((error) => {
          this.setState(Object.assign(this.state, { error }));
          console.error("getStripeToken error", error);
        });
    }
  }

  setCardType(event) {
    const type = Payment.fns.cardType(event.target.value);
    const cards = document.querySelectorAll('[data-brand]');

    [].forEach.call(cards, (element) => {
      if (element.getAttribute('data-brand') === type) {
        element.classList.add('active');
      } else {
        element.classList.remove('active');
      }
    });
  }

  renderCardList() {
    return (<ul className="credit-card-list clearfix">
      <li><i data-brand="visa" className="fa fa-cc-visa"></i></li>
      <li><i data-brand="amex" className="fa fa-cc-amex"></i></li>
      <li><i data-brand="mastercard" className="fa fa-cc-mastercard"></i></li>
      <li><i data-brand="jcb" className="fa fa-cc-jcb"></i></li>
      <li><i data-brand="discover" className="fa fa-cc-discover"></i></li>
      <li><i data-brand="dinersclub" className="fa fa-cc-diners-club"></i></li>
    </ul>);
  }

  renderCardForm() {
    const { error } = this.state;
    const { addCardLabel, number, expiration, cvc } = this.props;

    const debouncedHandleEvent = _.debounce(this.handleChange, 500);

    return (<div ref="CardForm" className="CardForm">
      <Row>
        <Col xs={ 12 }>
          <FormGroup>
            <ControlLabel>Card Number</ControlLabel>
            <input
              onKeyUp={ this.setCardType }
              className="form-control"
              type="text"
              ref="number"
              value={number}
              onChange={() => debouncedHandleEvent('number')}
              placeholder="Card Number"
            />
          </FormGroup>
        </Col>
      </Row>
      <Row>
        <Col xs={ 6 } sm={ 5 }>
          <FormGroup>
            <ControlLabel>Expiration</ControlLabel>
            <input
              className="form-control text-center"
              type="text"
              ref="expiration"
              value={expiration}
              onChange={() => debouncedHandleEvent('expiration')}
              placeholder="MM/YY"
            />
          </FormGroup>
        </Col>
        <Col xs={ 6 } sm={ 4 } smOffset={ 3 }>
          <FormGroup>
            <ControlLabel>CVC</ControlLabel>
            <input
              className="form-control text-center"
              type="text"
              ref="cvc"
              onChange={() => debouncedHandleEvent('cvc')}
              placeholder="CVC"
            />
          </FormGroup>
        </Col>
      </Row>
      {error && <Alert bsStyle="warning">{error}</Alert>}
      <Button type="submit" className='green' disabled={this.props.disabled} >{addCardLabel || 'Add Card'}</Button>
    </div>);
  }

  renderCard() {
    const { number, exp_month, exp_year, cvc, token } = this.state;
    return number ? (<Alert bsStyle="info">
      <h5>{ number }</h5>
      <p className="exp-cvc">
        <span>{ exp_month }/{ exp_year }</span>
        <span>{ cvc }</span>
      </p>
      <em>{ token }</em>
    </Alert>) : '';
  }

  render() {
    return (
      <div className="CreditCardForm">
        <style>{`
        .CreditCardForm {
          max-width: 400px;
        }

        .CreditCardForm .credit-card-list {
          list-style: none;
          padding: 0;
          margin: 15px 0;
        }

        .CreditCardForm li {
          float: left;
          color: #aaa;
          font-size: 2.6rem;
        }

        .CreditCardForm li:not(:last-child) {
          margin-right: 10px;
        }

        .CreditCardForm li .active {
          color: green;
        }

        .CreditCardForm .alert {
          margin-top: 20px;
        }

        .CreditCardForm h5 {
          margin-top: 0px;
        }

        .CreditCardForm .exp-cvc {
          margin-bottom: 5px;
          span:first-child { margin-right: 15px; }
        }
        `}</style>
        { this.renderCardList() }
        { this.renderCardForm() }
      </div>
    );
  }
}

CreditCardForm.propTypes = {};

export default CreditCardForm;