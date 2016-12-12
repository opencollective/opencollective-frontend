import React from 'react';
import { css } from 'glamor';
import colors from '../constants/colors';
import TicketsCtlr from './TicketsCtlr';
import Button from './Button';

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

const formatCurrency =  (amount, currency = 'USD') => {
  if (!amount) return 'free';
  amount = amount / 100;
  return amount.toLocaleString(currency, {
    style: 'currency',
    currency,
    minimumFractionDigits : 0,
    maximumFractionDigits : 2
  })
};

class Tier extends React.Component {

  static propTypes = {
    tier: React.PropTypes.object
  }

  constructor(props) {
    super(props);
    this.state = { qt: 1, amount: props.tier.amount };
  }

  handleTicketsChange(qt) {
    this.setState({ qt, amount: qt * this.props.tier.amount });
  }

  render() {
    const { tier } = this.props;

    return (
      <div className={styles.tier}>
        <div className={styles.header}>
          <div className={styles.title} >{tier.name}</div>
          <div className={styles.title} >{formatCurrency(this.state.amount)}</div>
        </div>
        <p className={styles.description}>{tier.description}</p>
        <div id="actions" className={styles.actions}>
          <Button id="btnTicketsCtrl"><TicketsCtlr value={1} onChange={(value) => this.handleTicketsChange(value)} /></Button>
          <Button className="blue" label={`get ticket${this.state.qt > 1 ? 's' : ''}`} />
        </div>
      </div>
    );
  }
}

export default Tier;