import React from 'react';
import PropTypes from 'prop-types';
import { FormattedDate, FormattedMessage } from 'react-intl';
import { graphql } from 'react-apollo'
import gql from 'graphql-tag'
import { Router } from '../server/pages';

class EventsWithData extends React.Component {

  static propTypes = {
    collectiveSlug: PropTypes.string.isRequired
  }

  constructor(props) {
    super(props);
    this.renderEventEntry = this.renderEventEntry.bind(this);
    this.handleClick = this.handleClick.bind(this);
  }

  handleClick(e) {
    if (window.top.location.hostname.match(/opencollective\.com/i) || window.top.location.hostname === 'localhost') {
      const route = e.currentTarget.attributes.href.value;
      Router.push(route);
      e.preventDefault();
      return false;
    }
  }

  renderEventEntry(event) {
    return (<li key={event.id}>
              <a href={`/${event.parentCollective.slug}/events/${event.slug}`} onClick={this.handleClick} target="_top">{event.name}</a>, &nbsp;
              <FormattedDate value={event.startsAt} day='numeric' month='long' />, &nbsp;
              {event.location.name}
            </li>);
  }

  render() {
    const { loading, allEvents } = this.props.data;

    if (loading) return (<div />);

    const now = new Date, pastEvents = [], futureEvents = [];
    allEvents.map(event => {
      if (new Date(event.startsAt) > now)
        futureEvents.push(event);
      else
        pastEvents.push(event);
    })
    pastEvents.reverse();

    return (
      <div className="Events">
        <style jsx global>{`
        .Events {
          font-size: 1.4rem;
          line-height: 1.5;
        }
        .title {
          display: flex;
          align-items: baseline;
        }

        .title .action {
          font-size: 1.1rem;
        }

        h2 {
          font-size: 20px;
          margin-right: 1rem;
          margin-bottom: 0;
        }

        ul {
          list-style: none;
          padding: 0;
          margin-top: 0.5rem;
        }

        .events {
          padding: 10px;
        }
        .createEvent {
          text-align: center;
        }
        .btn {
          display: inline-block;
          padding: 6px 12px;
          margin-bottom: 0;
          font-size: 14px;
          font-weight: 400;
          line-height: 1.42857143;
          text-align: center;
          white-space: nowrap;
          vertical-align: middle;
          touch-action: manipulation;
          cursor: pointer;
          user-select: none;
          background-image: none;
          border: 1px solid transparent;
          border-radius: 4px;
        }
        .btn-default {
          color: #333;
          background-color: #fff;
          border-color: #ccc;
        }
        .btn-default:hover {
          color: #333;
          background-color: #e6e6e6;
          border-color: #adadad;
          text-decoration: none;
          outline: 0;
        }
        `}
        </style>
        <div className="events" ref="events">
          {futureEvents.length === 0 && pastEvents.length === 0 &&
            <div className="createEvent">
              <p><FormattedMessage id='events.widget.noEventScheduled' defaultMessage={`No event has been scheduled yet.`} /></p>
              <a href={`/${this.props.collectiveSlug}/events/new`} onClick={this.handleClick} className="btn btn-default" target="_top"><FormattedMessage id='events.widget.createEvent' defaultMessage={`Create an Event`} /></a>
            </div>
          }
          { (futureEvents.length > 0 || pastEvents.length > 0) &&
            <div>
            <div className="title">
              <h2><FormattedMessage id='events.title.futureEvents' values={{n: futureEvents.length}} defaultMessage={`Next {n, plural, one {event} other {events}}`} /></h2>
              <div className="action"><a href={`/${this.props.collectiveSlug}/events/new`} onClick={this.handleClick} target="_blank"><FormattedMessage id='events.widget.createEvent' defaultMessage={`Create an Event`} /></a></div>
            </div>
            <ul>
            {futureEvents.length === 0 &&
            <div>No event planned.</div>
            }
            {futureEvents.map(this.renderEventEntry)}
            </ul>
            {pastEvents.length > 0 &&
              <div className="pastEvents">
                <div className="title">
                  <h2><FormattedMessage id='events.title.pastEvents' values={{n: pastEvents.length}} defaultMessage={`Past {n, plural, one {event} other {events}}`} /></h2>
                </div>
                <ul>
                {pastEvents.map(this.renderEventEntry)}
                </ul>
              </div>
            }
          </div>
          }
        </div>
      </div>
    );
  }

}

const getEventsQuery = gql`
query allEvents($collectiveSlug: String) {
  allEvents(slug: $collectiveSlug) {
    id
    slug
    name
    description
    longDescription
    startsAt
    endsAt
    timezone
    location {
      name
      address
      lat
      long
    }
    tiers {
      id
      type
      name
      description
      amount
    }
    parentCollective {
      id
      slug
      name
      mission
      backgroundImage
      image
    }
  }
}
`;

const addEventsData = graphql(getEventsQuery);

export default addEventsData(EventsWithData);