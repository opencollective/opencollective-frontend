import React from 'react';
import '../css/TicketsConfirmed.css';
import Modal from './Modal';

import { formatCurrency } from '../lib/utils';
import { FormattedMessage, FormattedDate, FormattedTime, injectIntl } from 'react-intl';


class TicketsConfirmed extends React.Component {

  static propTypes = {
    response: React.PropTypes.object.isRequired,
    event: React.PropTypes.object.isRequired,
    onClose: React.PropTypes.func,
    show: React.PropTypes.bool
  }

  constructor(props) {
    super(props);
  }

  render() {
    const { event, response, intl } = this.props;
    
    return (
      <Modal onClose={this.props.onClose} show={this.props.show} className="TicketsConfirmed" title={(<FormattedMessage id="TicketsConfirmed.ticketsAcquired" values={{quantity: response.quantity}} defaultMessage='{quantity, plural, one {ticket} other {tickets}} acquired!' />)} >
        <div>
          <div id="ticket">
            <div className="topbar">
              <div className="numberTickets">
                <FormattedMessage id="TicketsConfirmed.tickets" values={{quantity: response.quantity}} defaultMessage='{quantity} {quantity, plural, one {ticket} other {tickets}}' />
              </div>
              <div className="amount">
                {response.tier && formatCurrency(response.quantity * response.tier.amount, response.tier.currency, intl)}
              </div>
            </div>
            <div className="content">
              <div className="datetime">
                <div className="date">
                  <FormattedDate
                    value={event.startsAt}
                    year='numeric'
                    month='long'
                    day='numeric'
                    weekday='long'
                  />
                </div>
                <div className="time">
                  <FormattedTime value={event.startsAt} />
                </div>
              </div>
              <div className="location">
                <div className="locationName">{event.location}</div>
                <div className="locationAddress">{event.address}</div>
              </div>
            </div>
          </div>
        </div>
        <div className='text'>
          <p>{ response.user && <FormattedMessage id="TicketsConfirmed.ConfirmationSent" values={{email:response.user.email}} defaultMessage={`A confirmation email has been sent to your address {email}`} />}</p>
          <p><FormattedMessage id="TicketsConfirmed.SeeYouSoon" defaultMessage='See you soon!' /></p>
        </div>
      </Modal>
    );
  }
}

export default injectIntl(TicketsConfirmed);