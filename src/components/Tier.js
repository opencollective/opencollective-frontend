import React from 'react';
import { Link } from 'react-router';
import { css } from 'glamor';
import colors from '../constants/colors';
import TicketsCtlr from './TicketsCtlr';
import Button from './Button';
import { formatCurrency } from '../lib/utils';
import { injectIntl, FormattedMessage } from 'react-intl';

const styles = {
  tier: css({
    width: '100%',
    maxWidth: '400px',
    minHeight: '12rem',
    position: 'relative',
    border: `1px solid ${colors.lightgray}`,
    margin: '1rem auto',
    paddingBottom: '6rem',
    color: colors.black
  }),
  header: css({
    margin: '1rem',
    display: 'flex',
    justifyContent: 'space-between'
  }),
  title: css({
    fontSize: '1.8rem'
  }),
  description: css({
    margin: '1rem',
    color: colors.darkgray,
    fontSize: '1.5rem'
  }),
  actions: css({
    display: 'flex',
    justifyContent: 'space-between',
    flexDirection: 'row',
    height: '6rem',
    position: 'absolute',
    bottom: '0',
    width: '100%'
  }),
  btn: css({
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    fontSize: '1.2rem',
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
      <div className={this.props.className}>
        <div className={styles.tier}>
          <div className={styles.header}>
            <div className={styles.title} >{name}</div>
            <div className={styles.title} >{formatCurrency(this.state.amount, currency, this.props.intl)}</div>
          </div>
          <p className={styles.description}>{description}</p>
          { type === 'ticket' &&
            <div id="actions" className={styles.actions}>
              <Button id="btnTicketsCtrl"><TicketsCtlr value={this.quantity} onChange={(value) => this.handleTicketsChange(value)} /></Button>
              {this.props.onClick && <Button className="blue" label={(<FormattedMessage id='tier.GetTicket' values={{quantity:this.state.quantity}} defaultMessage={`{quantity, plural, one {get ticket} other {get tickets}}`} />)} onClick={() => this.props.onClick(this.state)} />}
            </div>
          }
          { type === 'tier' &&
            <div id="actions" className={styles.actions}>
              {this.props.onClick && <Button className="blue" label={(<FormattedMessage id='tier.GetTier' values={{name}} defaultMessage={`become a {name}`} />)} onClick={() => this.props.onClick(this.state)} />}
            </div>
          }
        </div>
      </div>
    );
  }
}

export default injectIntl(Tier);