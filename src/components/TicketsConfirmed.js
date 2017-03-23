import React from 'react';
import Modal from './Modal';
import AddToCalendar from 'react-add-to-calendar';

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
    const event = props.event;
    this.addToCalendarEvent = {
      title: event.name,
      description: event.description,
      location: event.address,
      startTime: (new Date(event.startsAt)).toISOString(),
      endTime: (new Date(event.endsAt)).toISOString()
    };
  }

  render() {
    const { event, response, intl } = this.props;
    
    return (
      <Modal onClose={this.props.onClose} show={this.props.show} className="TicketsConfirmedModal" title={(<FormattedMessage id="TicketsConfirmed.ticketsAcquired" values={{quantity: response.quantity}} defaultMessage='{quantity, plural, one {ticket} other {tickets}} acquired!' />)} >
        <div className="TicketsConfirmed">
          <style jsx>{`
          .TicketsConfirmed {
            background: url('/static/images/boom.svg') no-repeat center -75px;
            min-height: 350px;
            width: 100%;
          }

          .text {
            margin: 0 auto;
            width: 100%;
            bottom: 1rem;
            max-width: 80%;
          }

          p {
            text-align: center;
          }

          #ticket {
            color: black;
            margin: 0 auto;
            width: 345px;
            max-width: 80%;
            border: 40px solid white;
            border-image: url("/static/images/tickets.svg") 40;
            position: relative;
          }

          #ticket .topbar {
            margin-top: -2rem;
            padding: 0.5rem 0;
            display: flex;
            justify-content: space-between;
            font-weight: bold;
            text-transform: uppercase;
            background: white;
            font-family: Arial, Helvetica, sans-serif;
          }

          #ticket .topbar .numberTickets {
          }

          #ticket .content {
            background: white;
            width: 100%;
            height: 100%;
            display: flex;
            justify-content: center;
            align-items: center;
            flex-direction: column;
            text-align: center;
            font-size: 1.4rem;
          }

          .datetime {
            text-align: center;
          }

          .location {
            font-size: 1.2rem;
            color: #797D7F;
          }
          `}</style>
          <style jsx global>{`
          .react-add-to-calendar {
            width: 175px;
            -webkit-font-smoothing: antialiased;
            text-shadow: 1px 1px 1px rgba(0, 0, 0, 0.004);
            position: relative;
            display: inline-block;
            margin: 1rem auto; }
          .react-add-to-calendar__wrapper {
            zoom: 1;
            cursor: pointer; }
          .react-add-to-calendar__button {
            padding: 10px;
            background-color: #f9f9f9;
            border: 1px solid #aab9d4;
            border-radius: 3px;
            color: #000; }
            .react-add-to-calendar__button--light {
              background-color: #fff; }
          .react-add-to-calendar__icon--right {
            padding-left: 5px; }
          .react-add-to-calendar__icon--left {
            padding-right: 5px; }
          .react-add-to-calendar__dropdown {
            position: absolute;
            top: 30px;
            left: 1px;
            width: 93%;
            padding: 5px 0 5px 8px;
            box-shadow: 1px 3px 6px rgba(0, 0, 0, 0.15);
            border: 1px solid #a8a8a8;
            background-color: #fff;
            text-align: left; }
          .react-add-to-calendar__dropdown ul {
            list-style: none;
            padding: 0;
            margin: 0; }
          .react-add-to-calendar__dropdown ul li a {
            color: #000;
            text-decoration: none; }
          .react-add-to-calendar__dropdown ul li a i {
            padding-right: 10px; }
          `}</style>
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
          <div className='text'>
            <p>{ response.user && <FormattedMessage id="TicketsConfirmed.ConfirmationSent" values={{email:response.user.email}} defaultMessage={`A confirmation email has been sent to your address {email}`} />}</p>
            <p><FormattedMessage id="TicketsConfirmed.SeeYouSoon" defaultMessage='See you soon!' /></p>
            <p>
              <AddToCalendar event={this.addToCalendarEvent} />
            </p>
          </div>
        </div>
      </Modal>
    );
  }
}

export default injectIntl(TicketsConfirmed);