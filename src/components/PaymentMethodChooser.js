import React from 'react';
import PropTypes from 'prop-types';
import { pick, get } from 'lodash';
import { Row, Col, Checkbox, Button, Form, Popover, OverlayTrigger } from 'react-bootstrap';
import { defineMessages, FormattedMessage } from 'react-intl';
import withIntl from '../lib/withIntl';
import InputField from '../components/InputField';
import InputTypeCreditCard from '../components/InputTypeCreditCard';
import { getCurrencySymbol, capitalize } from '../lib/utils';
import { getStripeToken } from '../lib/stripe';

import SmallButton from './SmallButton';

class PaymentMethodChooser extends React.Component {

  static propTypes = {
    paymentMethodInUse: PropTypes.object.isRequired,
    paymentMethodsList: PropTypes.arrayOf(PropTypes.object),
    editMode: PropTypes.bool,
    onSubmit: PropTypes.func,
    onCancel: PropTypes.func
  };

  constructor(props) {
    super(props);

    this.handleChange = this.handleChange.bind(this);
    this.onSubmit = this.onSubmit.bind(this);
    this.resetForm = this.resetForm.bind(this);
    this.validate = this.validate.bind(this);
    this.error = this.error.bind(this);
    this.resetError = this.resetError.bind(this);
    this.state = {
      modified: false,
      showSelector: false,
      showNewCreditCardForm: false,
      result: {},
      card: {},
      showUnknownPaymentMethodHelp: Boolean(!this.props.paymentMethodInUse.name) // check for premigration payment methods
    };

    this.messages = defineMessages({
      'paymentMethod.add': { id: 'paymentMethod.add', defaultMessage: 'Add credit card' },
      'paymentMethod.save': { id: 'paymentMethod.save', defaultMessage: 'Save'},
      'paymentMethod.cancel': { id: 'paymentMethod.cancel', defaultMessage: 'Cancel'},
      'paymentMethod.success': { id: 'paymentMethod.success', defaultMessage: 'Successfully added!'},
      'paymentMethod.expire': { id: 'paymentMethod.expire', defaultMessage: 'Exp'},
      'paymentMethod.whyUnknownTitle': {id: 'paymentMethod.whyUnknownTitle', defaultMessage: 'Why is my credit card not showing up?'},
      'paymentMethod.whyUnknown': {id: 'paymentMethod.whyUnknown', defaultMessage: 'This subscription was created using an early version of our site when we didn\'t store credit card numbers. We suggest that you update this subscription with a newer credit card.'},
      'paymentMethod.cardUnavailable': {id: 'paymentMethod.cardUnavailable', defaultMessage: '(credit card info not available)'}
    });
  }

  componentWillReceiveProps(newProps) {
    // TODO: hacky fixes for state machine
    // Most likely need to rework the component
    this.setState({ modified: newProps.paymentMethodInUse.name ? false : true})

    // hack to revert back to cc selector
    if (!this.props.editMode && newProps.editMode) {
      this.setState({ showNewCreditCardForm: false });
    }

    // handles the case where there are no existing credit cards
    if (newProps.paymentMethodsList.length === 0 && newProps.editMode) {
      this.setState({ showNewCreditCardForm: true});
    }

  }

  resetForm() {
    this.setState({ 
      modified: false,
      showSelector: false,
      showNewCreditCardForm: false,
      result: {},
      card: {}
    })
    return this.props.onCancel();
  }

  error(msg) {
    const error = `${msg}`;
    this.setState({ result: { error }});
  }

  resetError() {
    this.setState({ result: { error: null }});
  }

  handleChange(value) {
    const newUuid = value && value.uuid;

    // determine if anything has changed
    if (this.props.paymentMethodInUse.uuid !== newUuid) {
      this.setState({ modified: true })
    } else {
      this.setState({ modified: false })
    }

    if (value && value.uuid === 'add') {
      this.setState({ showNewCreditCardForm: true});
    } else {
      this.setState({card: value});
    }
  }

  async validate() {
    const { card } = this.state;
    if (!card.uuid) {
      let res;
      try {
        res = await getStripeToken('cc', card);
      } catch (e) {
        console.log(">>> error: ", typeof e, e);
        this.error(e);
        return false;
      }
      const last4 = res.card.last4;
      const paymentMethod = {
        name: last4,
        token: res.token,
        service: 'stripe',
        type: 'creditcard',
        data: {
          fullName: res.card.full_name,
          expMonth: res.card.exp_month,
          expYear: res.card.exp_year,
          brand: res.card.brand,
          country: res.card.country,
          funding: res.card.funding,
          zip: res.card.address_zip
        },
      };
      this.setState({card: paymentMethod});
    }
    return true;

  }

  async onSubmit() {
    const { intl } = this.props;
    this.setState({ loading: true });

    if (! await this.validate()) {
      return false;
    }
    const { card } = this.state;

    this.setState({ loading: false })
    const result = await this.props.onSubmit(card);
  }

  generatePMString(pm) {
    const { intl } = this.props;

    const defaultString = intl.formatMessage(this.messages['paymentMethod.cardUnavailable']);

    if (!pm.name || !pm.data) return defaultString;

    const pmData = Object.assign({},pm.data);

    // Deal with long names
    if (pmData.brand.toLowerCase() === 'american express') {
      pmData.brand = 'AMEX';
    } else if (pmData.brand.length > 10) {
      pmData.brand = `${pmData.brand.slice(0, 8)}...`
    }

    const expiryString = (pmData.expMonth && pmData.expYear) ? ` (${intl.formatMessage(this.messages['paymentMethod.expire'])}: ${pmData.expMonth}/${pmData.expYear})` : '';

    return `💳 \xA0\xA0${pmData.brand.toUpperCase()} ***${pm.name || pmData.last4}${expiryString}`
  }

  populatePaymentMethods() {
    const { intl } = this.props;
    let paymentMethods = [], paymentMethodsOptions = [];

    const generateOptions = (paymentMethods) => {
      return paymentMethods.map(pm => {
        const value = pm.uuid
        const label = this.generatePMString(pm);
        const option = {};
        option[value] = label;
        return option;
      });
    }

    paymentMethods = (this.props.paymentMethodsList || []).filter(pm => pm.service === 'stripe');
    paymentMethodsOptions = generateOptions(paymentMethods);

    paymentMethodsOptions.push({'add': intl.formatMessage(this.messages['paymentMethod.add'])});

    return paymentMethodsOptions;
  }

  render() {
    const { intl } = this.props;

    const paymentMethodString = this.generatePMString(this.props.paymentMethodInUse);

    const paymentMethodsOptions = this.populatePaymentMethods();

    const popover = (<Popover id="popover-positioned-top" title={intl.formatMessage(this.messages['paymentMethod.whyUnknownTitle'])} >
            {intl.formatMessage(this.messages['paymentMethod.whyUnknown'])}
            </Popover>);

    const fontSize = '12px';

    return (
      <div className="PaymentMethodChooser">
      <style jsx global>{`
        .PaymentMethodChooser .form-group .control-label {
          display: none;
        }
        .PaymentMethodChooser .form-control {
          font-size: 11px;
        }

        .PaymentMethodChooser .horizontal.form-group {
          overflow: hidden;
        }

        .PaymentMethodChooser .horizontal.creditcard {
          overflow: hidden;
        }
          
        .PaymentMethodChooser .CreditCardForm {
          padding-top: 0.5rem;
        }

        .PaymentMethodChooser #card-errors {
          font-size: ${fontSize};
        }

        .PaymentMethodChooser .col-sm-10 {
          width: 100%;
        }
      `}</style>
      <style jsx>{`
        .actions {
          display: flex;
          flex-direction: row;
          width: 200px;
          justify-content: space-evenly;
          margin: auto;
          margin-top: 6px;
        }
      `}</style>


      {!this.props.editMode &&
        <div className="paymentmethod-info">
          {paymentMethodString} {this.state.showUnknownPaymentMethodHelp &&
            <OverlayTrigger trigger="click" placement={"top"} overlay={popover} rootClose>
              <img className='help-image' src='/static/images/help-icon.svg' />
            </OverlayTrigger> 
            }
        </div>}

      { this.props.editMode && !this.state.showNewCreditCardForm &&
          <InputField
            type="select"
            className="horizontal"
            name="creditcardSelector"
            onChange={uuid => this.handleChange({ uuid })}
            options={paymentMethodsOptions}
            defaultValue={this.props.paymentMethodInUse.uuid}
            />}


      { this.props.editMode && this.state.showNewCreditCardForm && 
         <div>
          <InputField
              type="creditcard"
              name="creditcard"
              className="horizontal"
              onChange={(creditcardObject) => this.handleChange(creditcardObject)}
              style={ {base: { fontSize }}}
              />
          </div>}
      { this.props.editMode && 
        <div className='actions'>
          <SmallButton className="yes" bsStyle="primary" onClick={this.onSubmit} disabled={this.state.loading || !this.state.modified} style={{minWidth: '80px'}}>
            {intl.formatMessage(this.messages[`paymentMethod.save`])} 
          </SmallButton>

          <SmallButton className="no" bsStyle="primary" onClick={this.resetForm}>
            {intl.formatMessage(this.messages[`paymentMethod.cancel`])} 
          </SmallButton>

        </div>}

      <div className="result">
        { this.state.result.error &&
          <div className="error">
            {this.state.result.error}
          </div>
        }
      </div>

      </div>);
    }
  }
export default withIntl(PaymentMethodChooser);