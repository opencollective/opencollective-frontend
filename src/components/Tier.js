import React from 'react';
import { Link } from 'react-router';
import { css } from 'glamor';
import colors from '../constants/colors';
import TicketsCtlr from './TicketsCtlr';
import Button from './Button';
import { formatCurrency } from '../lib/utils';

const styles = {
  tier: css({
    width: '100%',
    maxWidth: '400px',
    border: `1px solid ${colors.lightgray}`,
    margin: '10px auto',
    color: colors.black
  }),
  header: css({
    margin: '10px',
    display: 'flex',
    justifyContent: 'space-between'
  }),
  title: css({
    fontSize: '14px'
  }),
  description: css({
    margin: '10px',
    color: colors.darkgray,
    fontSize: '12px'
  }),
  actions: css({
    display: 'flex',
    justifyContent: 'space-between',
    flexDirection: 'row',
    height: '60px'
  }),
  btn: css({
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    fontSize: '12px',
    fontWeight: 'bold',
    width: '100%',
    textTransform: 'uppercase',
    '&.blue': {
      color: 'white',
      background: colors.blue
    }
  })
};

class Tier extends React.Component {

  static propTypes = {
    tier: React.PropTypes.object.isRequired,
    className: React.PropTypes.object,
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
  }

  handleTicketsChange(quantity) {
    const response = { quantity, amount: quantity * this.props.tier.amount, tier: this.tier };
    this.setState(response);
    this.onChange(response);
  }

  render() {
    const { name, description, amount, currency, max, left } = this.props.tier;

    return (
      <div className={this.props.className}>
        <div className={styles.tier}>
          <div className={styles.header}>
            <div className={styles.title} >{name}</div>
            <div className={styles.title} >{formatCurrency(this.state.amount, currency)}</div>
          </div>
          <p className={styles.description}>{description}</p>
          <div id="actions" className={styles.actions}>
            <Button id="btnTicketsCtrl"><TicketsCtlr value={this.quantity} onChange={(value) => this.handleTicketsChange(value)} /></Button>
            {this.props.onClick && <Button className="blue" label={`get ticket${this.state.quantity > 1 ? 's' : ''}`} onClick={() => this.props.onClick(this.state)} />}
          </div>
        </div>
      </div>
    );
  }
}

export default Tier;