import React from 'react';
import PropTypes from 'prop-types';
import colors from '../lib/constants/colors';
import TicketController from './TicketController';
import CTAButton from './Button';
import Currency from './Currency';
import { defineMessages, FormattedNumber, FormattedMessage, injectIntl } from 'react-intl';
import { ButtonGroup, Button } from 'react-bootstrap';
import InputField from './InputField';
import { getCurrencySymbol, capitalize, formatCurrency } from '../lib/utils';
import { get } from 'lodash';
import Markdown from 'react-markdown';

class Tier extends React.Component {
  static propTypes = {
    tier: PropTypes.object.isRequired,
    className: PropTypes.string,
    values: PropTypes.object, // overriding values {quantity, amount, interval}
    onChange: PropTypes.func, // onChange({ id, quantity, amount, interval })
    onClick: PropTypes.func, // onClick({ id, quantity, amount, interval })
    intl: PropTypes.object.isRequired,
  };

  constructor(props) {
    super(props);
    this.state = { customAmountError: null };

    this.onChange = this.props.onChange || function() {};
    this.onClick = this.props.onClick || function() {};
    this.handleChange = this.handleChange.bind(this);
    this.handleSubmit = this.handleSubmit.bind(this);

    this.currencyStyle = {
      style: 'currency',
      currencyDisplay: 'symbol',
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    };

    this.messages = defineMessages({
      'amount.label': { id: 'Fields.amount', defaultMessage: 'Amount' },
      'customAmount.error.minimumAmount': {
        id: 'tier.customAmount.error.minimumAmount',
        defaultMessage: 'Minimum amount should be {minimumAmount}',
      },
      'interval.label': {
        id: 'tier.interval.label',
        defaultMessage: 'interval',
      },
      'interval.onetime': {
        id: 'tier.interval.onetime',
        defaultMessage: 'one time',
      },
      'interval.month': { id: 'tier.interval.month', defaultMessage: 'monthly' },
      'interval.year': { id: 'tier.interval.year', defaultMessage: 'yearly' },
    });

    this.defaultDescription = (
      <FormattedMessage
        id="tier.defaultDescription"
        defaultMessage="Become a {name} for {amount} per {interval} and help us sustain our activities!"
        values={{
          name: props.tier.name,
          amount: formatCurrency(props.tier.amount, props.tier.currency),
          interval: props.tier.interval,
        }}
      />
    );

    switch (props.tier.type) {
      case 'DONATION':
        this.buttonLabel = <FormattedMessage id="collective.donate" defaultMessage="donate" />;
        this.defaultDescription = (
          <FormattedMessage id="tier.donation.description" defaultMessage="Thank you for your kind donation 🙏" />
        );
        break;
      case 'TIER':
      default:
        this.buttonLabel = (
          <FormattedMessage id="tier.button" values={{ name: this.props.tier.name }} defaultMessage="become a {name}" />
        );
        break;
    }
  }

  componentDidMount() {
    const currentValues = this.calcCurrentValues();
    const values = this.props.values;

    // handle the initial condition of starting without an amount
    if (currentValues.amount && values && !values.amount) {
      this.handleChange('amount', currentValues.amount);
    }
  }

  // since this is a pure component, we don't want to store state
  // But, we still need a way to construct the current values of
  // quantity, amount and interval
  calcCurrentValues() {
    const { values, tier } = this.props;

    let quantity, amount, singleAmount, interval, presets;

    // Case 1: handle presets. Both interval and amount are changeable
    if (tier.presets) {
      presets = tier.presets.filter(p => !isNaN(p)).map(p => parseInt(p, 10));
      interval = (values && values.interval) || null;
      amount = (values && values.amount) || presets[Math.floor(presets.length / 2)];
      quantity = 1;
    } else if (tier.type === 'TICKET') {
      // Case 2: handle quantity. Can't be active at same time as presets
      quantity = (values && values.quantity) || 1;
      singleAmount = tier.amount;
      amount = tier.amount * quantity;
    } else if (tier.amount || values.amount) {
      // Case 3: nothing is changeable, comes with amount (and interval optional)
      interval = tier.interval || values.interval;
      amount = tier.amount || values.amount;
      quantity = 1;
    }
    return { interval, amount, singleAmount, quantity, presets };
  }

  handleTicketsChange(quantity) {
    const { availableQuantity } = this.props.tier.stats;
    if (availableQuantity && quantity > availableQuantity) {
      return;
    }
    const currentValues = this.calcCurrentValues();

    const response = {
      ...this.props.tier,
      quantity,
    };
    if (currentValues.interval) {
      response.interval = currentValues.interval;
    }
    this.onChange(response);
  }

  handleChange(field, value) {
    const { tier, intl } = this.props;

    const currentValues = this.calcCurrentValues();

    const response = Object.assign({}, tier, {
      amount: currentValues.amount,
      interval: currentValues.interval,
      quantity: currentValues.quantity,
    });

    // Make sure that the custom amount entered by the user is never under the minimum preset amount
    if (field === 'amount') {
      if (tier.presets && tier.presets[0] > value) {
        value = tier.presets[0];
        this.setState({
          customAmountError: intl.formatMessage(this.messages['customAmount.error.minimumAmount'], {
            minimumAmount: formatCurrency(value, tier.currency),
          }),
        });
      } else {
        this.setState({ customAmountError: null });
      }
    }

    response[field] = value;
    this.onChange(response);
  }

  handleSubmit() {
    const { tier } = this.props;

    const { quantity, amount, singleAmount, interval } = this.calcCurrentValues();

    this.onClick({ id: tier.id, amount, singleAmount, quantity, interval });
  }

  render() {
    const { intl, tier } = this.props;
    const { type, name, description, currency, maxQuantity } = this.props.tier;

    const intervals = [null, 'month', 'year'];
    const currentValues = this.calcCurrentValues();
    const { quantity, amount, interval, presets } = currentValues;
    const anchor = (get(tier, 'name') || '').toLowerCase().replace(/ /g, '-');

    if (type === 'TICKET') {
      this.buttonLabel = (
        <FormattedMessage
          id="tier.ticket.button"
          values={{ quantity }}
          defaultMessage="{quantity, plural, one {get ticket} other {get tickets}}"
        />
      );
    }

    return (
      <div className={`${this.props.className} tier ${this.props.onClick ? 'withCTA' : ''}`} id={anchor}>
        <style jsx global>
          {`
            .tier .inputAmount .form-group {
              margin: 0;
            }
          `}
        </style>
        <style jsx>
          {`
            .tier {
              width: 100%;
              max-width: 400px;
              min-height: 12rem;
              position: relative;
              border: 1px solid ${colors.lightgray};
              color: ${colors.black};
              box-shadow: 0 2px 4px 0 rgba(0, 0, 0, 0.04);
              border: solid 1px rgba(37, 39, 41, 0.16);
              border-radius: 8px;
              padding: 2rem;
            }
            .header {
              margin: 1rem;
              display: flex;
              justify-content: space-between;
            }
            .title {
              font-size: 2.2rem;
              color: var(--charcoal-grey-two);
            }
            .amount {
              position: absolute;
              top: 3rem;
              right: 3rem;
              font-size: 1.6rem;
              font-weight: 500;
              line-height: 1;
              text-align: right;
              color: #45484c;
              color: var(--charcoal-grey-three);
            }
            .customAmount {
              width: 13rem;
            }
            .customAmount .error {
              font-size: 11px;
              color: red;
            }
            .interval {
              font-size: 1.2rem;
              color: ${colors.darkgray};
            }
            .limited {
              margin: -1.5rem 0 0 1rem;
              font-size: 1.1rem;
              font-weight: 500;
              line-height: 2.09;
              letter-spacing: 1px;
              text-align: left;
              color: #e69900;
              color: var(--attention);
            }
            .description {
              min-height: 5rem;
              margin: 0rem 1rem 1rem 1rem;
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
              width: 13rem;
              margin: 0.2rem 0;
            }
            .tier :global(input[name='amount']) {
              max-width: 8rem;
            }
            .tier :global(.btn-group),
            .tier :global(.inputField),
            .tier :global(.form-group),
            .tier :global(.form-control) {
              border-radius: 3px;
              background-color: #ffffff;
              box-shadow: inset 0 -3px 0 0 rgba(0, 0, 0, 0.03);
              height: 40px;
            }
            .tier :global(.btn-group > .btn) {
              height: 40px;
            }
            .tier :global(.btn-primary),
            :global(.btn-primary:hover),
            :global(.btn-primary:active),
            :global(.btn-primary:focus) {
              background-color: #f0f3f5;
              box-shadow: inset 0 3px 0 0 rgba(0, 0, 0, 0.07);
              border: solid 1px #dcdfe1;
              font-weight: bold;
              font-size: 1.2rem;
              color: #494b4d;
            }
            .tier:global(.btn-default) {
              font-size: 1.2rem;
              color: #494b4d;
              background-color: transparent;
              border: solid 1px #dcdfe1;
            }
          `}
        </style>
        <div>
          <div className="header">
            <div className="title">{capitalize(name)}</div>
            {!presets && (
              <div className="title amount">
                {!amount && tier.type !== 'DONATION' && <FormattedMessage id="amount.free" defaultMessage="free" />}
                {amount > 0 && <Currency value={amount} currency={currency} />}
                {interval && (
                  <div className="interval">
                    <FormattedMessage
                      id="tier.interval"
                      defaultMessage="per {interval, select, month {month} year {year} other {}}"
                      values={{ interval }}
                    />
                  </div>
                )}
              </div>
            )}
          </div>
          {maxQuantity > 0 && (
            <div className="limited">
              <FormattedMessage
                id="tier.limited"
                values={{
                  maxQuantity,
                  availableQuantity: get(tier, 'stats.availableQuantity'),
                }}
                defaultMessage="LIMITED: {availableQuantity} LEFT OUT OF {maxQuantity}"
              />
            </div>
          )}
          <div className="description">
            {description && <Markdown source={description} />}
            {!description && <p>{this.defaultDescription}</p>}

            {presets && (
              <div>
                <div className="selectPreset inputRow">
                  <label>
                    <FormattedMessage
                      id="tier.amount.select"
                      defaultMessage="Select {interval, select, month {monthly} year {yearly} other {one time}} amount"
                      values={{ interval }}
                    />
                  </label>
                  <div className="presets">
                    <ButtonGroup className="presetBtnGroup">
                      {presets.map(
                        preset =>
                          !isNaN(preset) && (
                            <Button
                              key={`presetBtn-${preset}`}
                              className="presetBtn"
                              bsStyle={amount === preset ? 'primary' : 'default'}
                              onClick={() => this.handleChange('amount', preset)}
                            >
                              <FormattedNumber value={preset / 100} currency={currency} {...this.currencyStyle} />
                            </Button>
                          ),
                      )}
                    </ButtonGroup>
                    <div className="customAmount">
                      <InputField
                        name="amount"
                        className="inputAmount"
                        min={tier.presets && tier.presets[0]}
                        options={{ step: 1 }}
                        pre={getCurrencySymbol(currency)}
                        type="currency"
                        value={amount}
                        onChange={amount => this.handleChange('amount', amount)}
                      />
                      {this.state.customAmountError && <div className="error">{this.state.customAmountError}</div>}
                    </div>
                  </div>
                </div>
                {type === 'DONATION' && (
                  <div className="selectInterval inputRow">
                    <label>
                      <FormattedMessage id="tier.interval.select" defaultMessage="Select frequency" />
                    </label>
                    <ButtonGroup className="intervalBtnGroup">
                      {intervals.map(i => (
                        <Button
                          key={`key-${i}`}
                          className={`intervalBtn ${i}`}
                          bsStyle={interval === i ? 'primary' : 'default'}
                          onClick={() => this.handleChange('interval', i)}
                        >
                          {intl.formatMessage(this.messages[`interval.${i || 'onetime'}`])}
                        </Button>
                      ))}
                    </ButtonGroup>
                  </div>
                )}
              </div>
            )}
          </div>
          {type === 'TICKET' && (
            <div id="actions" className="actions">
              <TicketController value={quantity} onChange={value => this.handleTicketsChange(value)} />
              {this.props.onClick && (
                <CTAButton className="ctabtn blue ticket" label={this.buttonLabel} onClick={this.handleSubmit} />
              )}
            </div>
          )}
          {type !== 'TICKET' && this.props.onClick && (
            <div id="actions" className="actions">
              <CTAButton className="ctabtn blue" label={tier.button || this.buttonLabel} onClick={this.handleSubmit} />
            </div>
          )}
        </div>
      </div>
    );
  }
}

export default injectIntl(Tier);
