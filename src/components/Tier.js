import React from 'react';
import PropTypes from 'prop-types';
import colors from '../constants/colors';
import TicketController from './TicketController';
import CTAButton from './Button';
import Currency from './Currency';
import { defineMessages, FormattedNumber, FormattedMessage } from 'react-intl';
import withIntl from '../lib/withIntl';
import { ButtonGroup, Button } from 'react-bootstrap';
import InputField from './InputField';
import { getCurrencySymbol, capitalize } from '../lib/utils';
import { get } from 'lodash';

class Tier extends React.Component {

  static propTypes = {
    tier: PropTypes.object.isRequired,
    className: PropTypes.string,
    defaultValue: PropTypes.object,
    onChange: PropTypes.func, // onChange({ id, quantity, amount, interval })
    onClick: PropTypes.func // onClick({ id, quantity, amount, interval })
  }

  constructor(props) {
    super(props);

    this.onChange = this.props.onChange || function() {}; 
    this.handleChange = this.handleChange.bind(this);
    this.tier = props.tier;
    this.defaultValue = props.defaultValue || {};
    this.defaultValue.quantity = this.defaultValue.quantity || 1;
    this.defaultValue.amount = (props.tier.amount > 0) ? this.defaultValue.quantity * props.tier.amount : this.defaultValue.amount;
    this.state = { ...this.defaultValue, id: props.tier.id };
    if (this.tier.presets) {
      this.presets = this.tier.presets.filter(p => !isNaN(p)).map(p => parseInt(p, 10));
      this.state.interval = this.defaultValue.interval || null;
      if (!this.state.amount) {
        this.handleChange('amount', this.presets[Math.floor(this.presets.length / 2)]);
      }
    }

    this.anchor = (get(this.tier, 'name') || "").toLowerCase().replace(/ /g,'-');
    this.currencyStyle = { style: 'currency', currencyDisplay: 'symbol', minimumFractionDigits: 0, maximumFractionDigits: 2};

    this.messages = defineMessages({
      'amount.label': { id: 'tier.amount.label', defaultMessage: 'amount' },
      'interval.label': { id: 'tier.interval.label', defaultMessage: 'interval' },
      'interval.onetime': { id: 'tier.interval.onetime', defaultMessage: 'one time' },
      'interval.month': { id: 'tier.interval.month', defaultMessage: 'month' },
      'interval.year': { id: 'tier.interval.year', defaultMessage: 'year' }
    });

  }

  handleTicketsChange(quantity) {
    const response = {
      quantity,
      amount: quantity * this.props.tier.amount,
      id: this.tier.id
    };
    if (this.state.interval) {
      response.interval = this.state.interval;
    }
    this.setState(response);
    this.onChange(response);
  }

  handleChange(field, value) {
    const state = this.state;

    // Make sure that the custom amount entered by the user is never under the minimum preset amount
    if (field === 'amount' && this.tier.presets && this.tier.presets[0] >= value) {
      value = this.tier.presets[0];
    }

    state[field] = value;
    this.setState(state);
    this.onChange(state);
  }

  render() {
    const { intl } = this.props;
    const { type, name, description, currency, interval } = this.props.tier;

    const intervals = [ null, 'month', 'year'];

    return (
      <div className={`${this.props.className} tier ${this.props.onClick ? 'withCTA' : ''}`} id={this.anchor}>
        <style jsx global>{`
          .tier .inputAmount .form-group {
            margin: 0;
          }
        `}</style>
        <style jsx>{`
          .tier {
            width: 100%;
            max-width: 400px;
            min-height: 12rem;
            position: relative;
            border: 1px solid ${colors.lightgray};
            color: ${colors.black};
          }
          .header {
            margin: 1rem;
            display: flex;
            justify-content: space-between;
          }
          .title {
            font-size: 1.8rem;
          }
          .description {
            margin: 1rem 1rem 2rem 1rem;
            color: ${colors.darkgray};
            font-size: 1.5rem;
          }
          .actions {
            display: flex;
            justify-content: space-between;
            flex-direction: row;
            height: 6rem;
            width: 100%;
          }
          .ctabtn {
            display: flex;
            justify-content: center;
            align-items: center;
            font-size: 1.2rem;
            font-weight: bold;
            width: 100%;
            text-transform: uppercase;
          }
          .ctabtn.blue {
            color: white;
            background: ${colors.blue};
          }
          .ctabtn.gray {
            color: white;
            background: ${colors.darkgray};
          }
          .inputRow {
            margin: 1rem 0;
          }
          label {
            text-transform: uppercase;
            color: #aaaeb3;
            font-weight: 300;
            font-family: lato, montserratlight, arial;
            white-space: nowrap;
            font-size: 1rem;
          }
          .tier label {
            width: 100%;
          }
          .presets {
            display: flex;
            flex-wrap: wrap;
            justify-content: space-between;
          }
          .tier :global(.presetBtnGroup) {
            margin: 0.5rem 0;
          }
          .tier :global(.inputAmount) {
            width: 12rem;
            margin: 0.5rem 0;
          }
          .tier :global(input[name=amount]) {
            max-width: 8rem;
          }
          .tier :global(.btn-group), .tier :global(.inputField), .tier :global(.form-group), .tier :global(.form-control) {
            border-radius: 3px;
            background-color: #ffffff;
            box-shadow: inset 0 -3px 0 0 rgba(0, 0, 0, 0.03);
            height: 40px;
          }
          .tier :global(.btn-group>.btn) {
            height: 40px;
          }
          .tier :global(.btn-primary), :global(.btn-primary:hover), :global(.btn-primary:active), :global(.btn-primary:focus) {
            background-color: #f0f3f5;
            box-shadow: inset 0 3px 0 0 rgba(0, 0, 0, 0.07);
            border: solid 1px #dcdfe1;
            font-family: montserralight, Montserrat;
            font-weight: bold;
            font-size: 1.2rem;
            color: #494b4d;
          }
          .tier:global(.btn-default) {
            font-family: montserralight, Montserrat;
            font-size: 1.2rem;
            color: #494b4d;
            background-color: transparent;
            border: solid 1px #dcdfe1;
          }
        `}</style>
        <div>
          <div className="header">
            <div className="title" >{capitalize(name)}</div>
            { !this.presets &&
              <div className="title" >
                { !this.state.amount && !this.presets && <FormattedMessage id="amount.free" defaultMessage="free" /> }
                { this.state.amount > 0 && <Currency value={this.state.amount} currency={currency} /> }
                { interval && '/' }
                {interval && interval === 'month' && intl.formatMessage(this.messages[`interval.month`])}
                {interval && interval === 'year' && intl.formatMessage(this.messages[`interval.year`])}
              </div>
            }
          </div>
          <div className="description">
            {description}
            { this.presets &&
              <div>
                <div className="inputRow">
                  <label><FormattedMessage id="tier.amount.select" defaultMessage="Select amount" /></label>
                  <div className="presets">
                    <ButtonGroup className="presetBtnGroup">
                      { this.presets.map(preset => !isNaN(preset) && (
                        <Button className="presetBtn" bsStyle={this.state.amount === preset ? 'primary' : 'default'} onClick={() => this.handleChange('amount', preset)}>
                          <FormattedNumber
                            value={preset / 100}
                            currency={currency}
                            {...this.currencyStyle}
                            />
                        </Button>
                      ))}
                    </ButtonGroup>
                    <InputField
                      name='amount'
                      className="inputAmount"
                      min={this.tier.presets && this.tier.presets[0]}
                      pre={getCurrencySymbol(currency)}
                      type='currency'
                      value={this.state.amount}
                      onChange={(amount) => this.handleChange('amount', amount)} />
                    </div>
                </div>
                <div className="inputRow">
                  <label><FormattedMessage id="tier.interval.select" defaultMessage="Select frequency" /></label>
                  <ButtonGroup className="intervalBtnGroup">
                    { intervals.map(interval => (
                      <Button className="intervalBtn" bsStyle={this.state.interval === interval ? 'primary' : 'default'} onClick={() => this.handleChange('interval', interval)}>
                        {intl.formatMessage(this.messages[`interval.${interval || 'onetime'}`])}
                      </Button>
                    ))}
                  </ButtonGroup>                
                </div>
              </div>
            }
          </div>
          { type === 'TICKET' &&
            <div id="actions" className="actions">
              <TicketController defaultValue={this.defaultValue.quantity} onChange={(value) => this.handleTicketsChange(value)} />
              {this.props.onClick && <CTAButton className="ctabtn blue" label={(<FormattedMessage id='tier.GetTicket' values={{ quantity: this.state.quantity }} defaultMessage={`{quantity, plural, one {get ticket} other {get tickets}}`} />)} onClick={() => this.props.onClick(this.state)} />}
            </div>
          }
          { type !== 'TICKET' && this.props.onClick && 
            <div id="actions" className="actions">
              <CTAButton className="ctabtn blue" label={this.tier.button || (<FormattedMessage id='tier.GetTier' values={{name}} defaultMessage={`become a {name}`} />)} onClick={() => this.props.onClick(this.state)} />
            </div>
          }
        </div>
      </div>
    );
  }
}

export default withIntl(Tier);