import React from 'react';
import PropTypes from 'prop-types';
import stylesheet from '../styles/card.css';
import CardReactFormContainer from 'card-react';
import { FormGroup, FormControl } from 'react-bootstrap';
import Payment from 'payment';
import withIntl from '../lib/withIntl';
import { defineMessages } from 'react-intl';

class InputTypeCreditCard extends React.Component {

  static propTypes = {
    name: PropTypes.string,
    value: PropTypes.object,
    options: PropTypes.arrayOf(PropTypes.object), // dropdown to select credit card on file
    onChange: PropTypes.func.isRequired
  };

  constructor(props) {
    super(props);
    this.handleChange = this.handleChange.bind(this);
    this.state = {};
    this.messages = defineMessages({
      'creditcard.number.placeholder': { id: 'creditcard.number.placeholder', defaultMessage: 'Card number' },
      'creditcard.name.placeholder': { id: 'creditcard.name.placeholder', defaultMessage: 'Full name' },
      'creditcard.expiry.placeholder': { id: 'creditcard.expiry.placeholder', defaultMessage: 'MM/YY' },
      'creditcard.cvc.placeholder': { id: 'creditcard.cvc.placeholder', defaultMessage: 'CVC' },
    });
  }

  handleChange(fieldname, value) {

    const newState = {...this.state};

    if (fieldname === 'number') {
      value = value.replace(/ /g, '');
    }

    if (fieldname === 'expiry') {
      const expiration = value.split('/');
      newState['exp_month'] = Number((expiration[0] || '').trim());
      if (expiration.length > 0) {
        const year = Number((expiration[1] || '').trim());
        newState['exp_year'] = (year > 2000) ? year : 2000 + year;
      }
    } else {
      newState[fieldname] = value;
    }
    this.setState(newState);
    this.props.onChange(newState);
  }

  componentWillReceiveProps(nextProps) {
    if (nextProps.options && nextProps.options.length > 0) {
      if (typeof this.state.uuid !== 'string') {
        this.handleChange("uuid", nextProps.options[0].uuid);
      }
    }
  }

  render() {
    const { intl } = this.props;
    const options = this.props.options || [];
    const showNewCreditCardForm = !(this.state.uuid && this.state.uuid.length === 36);

    return (
      <div className="CreditCardForm">
        <style dangerouslySetInnerHTML={{ __html: stylesheet }} />
        <style jsx>{`
        .CreditCardForm {
          max-width: 350px;
        }
        .CreditCardForm :global(.form-group) {
          margin: 0;
        }
        #card-wrapper {
          margin: 0 0 2rem 0;
        }
        .oneline {
          display: flex;
          flex-direction: row;
          margin-top: 0.5rem;
        }
        :global(.ccinput) {
          margin-left: 0.5rem;
        }
        :global(#CCname) {
          width: 18rem;;
        }
        :global(#CCnumber) {
          width: 100%;
          margin: 0;
        }
        :global(.creditcardSelector) {
          margin-bottom: 2rem;
        }
      `}</style>

      { options.length > 0 &&
          <FormControl
            componentClass="select"
            className="creditcardSelector"
            type="select"
            name="creditcardSelector"
            onChange={event => this.handleChange("uuid", event.target.value)}
            >
            { options.map(option => {
              const value = option.uuid
              const label = `${option.data.brand} ${option.data.funding} ${option.data.identifier} ${option.data.expMonth}/${option.data.expYear}`;
              return (<option value={value}>{`💳 ${label}`}</option>)
              })
            }
            <option value="">other</option>
          </FormControl>
      }

      { showNewCreditCardForm &&
        <div>
          <div id="card-wrapper"></div>
          <CardReactFormContainer 
            container="card-wrapper"
            placeholder={this.props.placeholder}
            value={this.state.value || this.props.placeholder}
            onChange={event => this.handleChange(event.target.value)}
            formInputsNames={
                {
                  number: 'CCnumber', // optional — default "number"
                  expiry: 'CCexpiry',// optional — default "expiry"
                  cvc: 'CCcvc', // optional — default "cvc"
                  name: 'CCname' // optional - default "name"
                }
              }
            >
              <div className="ccform">
                <FormGroup validationState={(!this.state.number || Payment.fns.validateCardNumber(this.state.number)) ? null : 'error'} controlId="CCnumber">
                  <FormControl
                    placeholder={intl.formatMessage(this.messages['creditcard.number.placeholder'])}
                    type="text"
                    name="CCnumber"
                    key="CCnumber"
                    defaultValue={this.props.number}
                    onChange={(e) => this.handleChange("number", e.target.value)}
                    />
                  <FormControl.Feedback />
                </FormGroup>
                <div className="oneline">
                  <FormControl placeholder={intl.formatMessage(this.messages['creditcard.name.placeholder'])} type="text" name="CCname" key="CCname" onChange={(e) => this.handleChange("fullName", e.target.value)} />
                  <FormControl placeholder={intl.formatMessage(this.messages['creditcard.expiry.placeholder'])} type="text" name="CCexpiry" key="CCexpiry" className="ccinput" onChange={(e) => this.handleChange("expiry", e.target.value)} />
                  <FormControl placeholder={intl.formatMessage(this.messages['creditcard.cvc.placeholder'])}type="text" name="CCcvc" key="CCcvc" className="ccinput" onChange={(e) => this.handleChange("cvc", e.target.value)} />
                </div>
              </div>
          </CardReactFormContainer>
        </div>
        }
    </div>
    );
  }
}

export default withIntl(InputTypeCreditCard);