import React from 'react';
import Payment from 'payment';
import { Row, Col, FormGroup, ControlLabel, Button, Alert } from 'react-bootstrap';
import { getStripeToken } from '../lib/stripe';

class CreditCardForm extends React.Component {

  static propTypes = {
    stripePublishableKey: React.PropTypes.string.isRequired,
    onCardAdded: React.PropTypes.func,
    addCardLabel: React.PropTypes.string
  }

  constructor(props) {
    super(props);
    this.setCardType = this.setCardType.bind(this);
    this.handleSubmit = this.handleSubmit.bind(this);
    this.resetCard = this.resetCard.bind(this);
    
    // eslint-disable-next-line
    Stripe.setPublishableKey(this.props.stripePublishableKey);
    console.log("setting stripePublishableKey",this.props.stripePublishableKey);

    this.state = {
      number: null,
      exp_month: null,
      exp_year: null,
      cvc: null,
      token: null,
    };
  }

  resetCard() {
    this.setState({ number: null, exp_month: null, exp_year: null, cvc: null, token: null });
  }

  handleSubmit(event) {
    event.preventDefault();
    this.resetCard();

    const { refs } = this;
    const number = refs.number.value;
    const expiration = refs.expiration.value.split('/');
    const exp_month = parseInt(expiration[0], 10);
    const exp_year = parseInt(expiration[1], 10);
    const cvc = refs.cvc.value;
    const card = { number, exp_month, exp_year, cvc };

    getStripeToken(card)
      .then((token) => {
        card.token = token;
        this.setState(card);
        this.props.onCardAdded(card);
      }).catch((error) => {
        this.setState(Object.assign(this.state, { error }));
        console.error("getStripeToken error", error);
      });
  }

  setCardType(event) {
    const type = Payment.fns.cardType(event.target.value);
    const cards = document.querySelectorAll('[data-brand]');
    console.log("setCardType", type);

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

    return (<form ref="CardForm" className="CardForm" onSubmit={ this.handleSubmit }>
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
              placeholder="MM/YYYY"
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
              value={cvc}
              placeholder="CVC"
            />
          </FormGroup>
        </Col>
      </Row>
      {error && <Alert bsStyle="warning">{error}</Alert>}
      <Button type="submit" bsStyle="success" block>{addCardLabel || 'Add Card'}</Button>
    </form>);
  }

  componentDidMount() {
    const { number, expiration, cvc } = this.refs;
    Payment.formatCardNumber(number);
    Payment.formatCardExpiry(expiration);
    Payment.formatCardCVC(cvc);
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
          font-size: 26px;
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