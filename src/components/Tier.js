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
    margin: '10px',
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
    height: '40px'
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
    name: React.PropTypes.string.isRequired,
    description: React.PropTypes.string,
    amount: React.PropTypes.number,
    currency: React.PropTypes.string,
    max: React.PropTypes.number,
    left: React.PropTypes.number,
    onChange: React.PropTypes.func,
    onClick: React.PropTypes.func
  }

  constructor(props) {
    super(props);
    this.state = { qt: 1, amount: props.amount };
    this.onChange = this.props.onChange || function() {}; 
    this.onChange(this.state);
  }

  handleTicketsChange(qt) {
    const newState = { qt, amount: qt * this.props.amount };
    this.setState(newState);
    this.tier = Object.assign({}, this.tier, newState);
    this.onChange(newState);
  }

  render() {
    const { name, description, amount, currency, max, left } = this.props;
    this.tier = this.props;

    return (
      <div className={styles.tier}>
        <div className={styles.header}>
          <div className={styles.title} >{name}</div>
          <div className={styles.title} >{formatCurrency(this.state.amount, currency)}</div>
        </div>
        <p className={styles.description}>{description}</p>
        <div id="actions" className={styles.actions}>
          <Button id="btnTicketsCtrl"><TicketsCtlr value={1} onChange={(value) => this.handleTicketsChange(value)} /></Button>
          <Button className="blue" label={`get ticket${this.state.qt > 1 ? 's' : ''}`} onClick={() => this.props.onClick(this.tier)} />
        </div>
      </div>
    );
  }
}

export default Tier;