import React from 'react';
import Payment from 'payment';
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

    // If credit card is autofilled by the browser or a password manager, the onChange event is not triggered
    // So we need to periodically check for change.
    setInterval(() => {
      this.handleChange('number');
    }, 1000);
  }

  componentDidMount() {
    Payment.formatCardNumber(this.refs.number);
    Payment.formatCardExpiry(this.refs.expiration);
  }

  handleChange(fieldname) {

    if (!this.refs[fieldname]) return;

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
          this.setState({ error: null });
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
    const { addCardLabel, number, expiration } = this.props;

    const debouncedHandleEvent = _.debounce(this.handleChange, 300);

    return (<div ref="CardForm" className="CardForm">
      <style jsx>{`
      .text-center {
          text-align: center;
      }
      .CardForm {
        padding-top: 1rem;
        clear: both;
      }
      :global(.form-control) {
        display: block;
        width: 100%;
        font-size: 14px;
        line-height: 1.42857143;
        color: #555;
        background-color: #fff;
        background-image: none;
        border: 1px solid #ccc;
        border-radius: 4px;
        box-shadow: inset 0 1px 1px rgba(0,0,0,.075);
        transition: border-color ease-in-out .15s,box-shadow ease-in-out .15s;
      }
      :global(.col-xs-12) {
        width: 100%;
        position: relative;
        min-height: 1px;
        padding-right: 15px;
      }
      :global(.col-sm-4, .col-sm-5) {
        float:left;
      }
      :global(.form-group) {
       margin-bottom: 15px;
      }
      :global(.col-xs-6) {
        width: 50%;
        position: relative;
        min-height: 1px;
        padding-right: 15px;
      }
      .warning {
        padding: 1rem;
        width: 100%;
        text-align: center;
        color: red;        
      }
      `}</style>
      <div className="row">
        <div className="field">
            <label>Card Number:</label>
            <input
              onKeyUp={ this.setCardType }
              className="form-control"
              type="text"
              ref="number"
              value={number}
              onChange={() => debouncedHandleEvent('number')}
              placeholder="Card Number"
            />
        </div>
      </div>
      <div className="row">
        <div className="field">
            <label>Expiration</label>
            <input
              className="form-control text-center"
              type="text"
              ref="expiration"
              value={expiration}
              onChange={() => debouncedHandleEvent('expiration')}
              placeholder="MM/YY"
            />
        </div>
        <div className="field">
            <label>CVC</label>
            <input
              className="form-control text-center"
              type="text"
              ref="cvc"
              onChange={() => debouncedHandleEvent('cvc')}
              placeholder="CVC"
            />
        </div>
      </div>
      {error && <div className="warning">{error}</div>}
      <Button type="submit" className='green' disabled={this.props.disabled} >{addCardLabel || 'Add Card'}</Button>
    </div>);
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
          margin: 15px;
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