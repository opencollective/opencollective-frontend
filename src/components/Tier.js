import React from 'react';
import colors from '../constants/colors';
import TicketController from './TicketController';
import Button from './Button';
import { formatCurrency } from '../lib/utils';
import { injectIntl, FormattedMessage } from 'react-intl';

class Tier extends React.Component {

  static propTypes = {
    tier: React.PropTypes.object.isRequired,
    className: React.PropTypes.string,
    quantity: React.PropTypes.number,
    onChange: React.PropTypes.func, // onChange(response{quantity, amount, tier})
    onClick: React.PropTypes.func // onClick(response{quantity, amount, tier})
  }

  constructor(props) {
    super(props);
    this.tier = props.tier;
    this.quantity = props.quantity || 1;
    this.state = { quantity: this.quantity, amount: this.quantity * this.tier.amount, tier: this.tier };
    this.onChange = this.props.onChange || function() {}; 
    this.anchor = this.tier.name.toLowerCase().replace(/ /g,'-');
  }

  handleTicketsChange(quantity) {
    const response = { quantity, amount: quantity * this.props.tier.amount, tier: this.tier };
    this.setState(response);
    this.onChange(response);
  }

  render() {
    const { name, description, currency } = this.props.tier;

    const type = (name.match(/ticket/i)) ? 'ticket' : 'tier';

    return (
      <div className={`${this.props.className} tier`} id={this.anchor}>
        <style jsx>{`
          .tier {
            width: 100%;
            max-width: 400px;
            min-height: 12rem;
            position: relative;
            border: 1px solid ${colors.lightgray};
            margin: 3rem auto;
            padding-bottom: 6rem;
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
            margin: 1rem;
            color: ${colors.darkgray};
            font-size: 1.5rem;
          }
          .actions {
            display: flex;
            justify-content: space-between;
            flex-direction: row;
            height: 6rem;
            position: absolute;
            bottom: 0;
            width: 100%;
          }
          .btn {
            display: flex;
            justify-content: center;
            align-items: center;
            font-size: 1.2rem;
            font-weight: bold;
            width: 100%;
            text-transform: uppercase;
          }
          .btn.blue {
            color: white;
            background: ${colors.blue};
          }
          .btn.gray {
            color: white;
            background: ${colors.darkgray};
          } 
        `}</style>
        <div>
          <div className="header">
            <div className="title" >{name}</div>
            <div className="title" >{formatCurrency(this.state.amount, currency, this.props.intl)}</div>
          </div>
          <p className="description">{description}</p>
          { type === 'ticket' &&
            <div id="actions" className="actions">
              <Button className="gray"><TicketController value={this.quantity} onChange={(value) => this.handleTicketsChange(value)} /></Button>
              {this.props.onClick && <Button className="blue" label={(<FormattedMessage id='tier.GetTicket' values={{quantity:this.state.quantity}} defaultMessage={`{quantity, plural, one {get ticket} other {get tickets}}`} />)} onClick={() => this.props.onClick(this.state)} />}
            </div>
          }
          { type === 'tier' &&
            <div id="actions" className="actions">
              {this.props.onClick && <Button className="gray" label={(<FormattedMessage id='tier.GetTier' values={{name}} defaultMessage={`become a {name}`} />)} onClick={() => this.props.onClick(this.state)} />}
            </div>
          }
        </div>
      </div>
    );
  }
}

export default injectIntl(Tier);