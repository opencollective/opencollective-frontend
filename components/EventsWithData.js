import React from 'react';
import PropTypes from 'prop-types';
import { FormattedDate, FormattedMessage } from 'react-intl';
import { graphql } from 'react-apollo';
import gql from 'graphql-tag';
import { Router } from '../server/pages';

class EventsWithData extends React.Component {
  static propTypes = {
    collectiveSlug: PropTypes.string.isRequired,
    onChange: PropTypes.func,
    data: PropTypes.object,
  };

  constructor(props) {
    super(props);
    this.renderEventEntry = this.renderEventEntry.bind(this);
    this.createEvent = this.createEvent.bind(this);
    this.openEvent = this.openEvent.bind(this);
  }

  componentDidMount() {
    const { onChange } = this.props;
    this.isIframe = window.self !== window.top && window.location.hostname !== 'localhost'; // cypress is using an iframe for e2e testing;
    onChange && this.node && onChange({ height: this.node.offsetHeight });
  }

  createEvent(e) {
    if (this.isIframe) {
      return;
    }
    Router.pushRoute('createEvent').then(() => {
      window.scrollTo(0, 0);
    });
    e.preventDefault();
  }

  openEvent(e, eventSlug) {
    if (this.isIframe) {
      return; // continue with default behavior of <a href>
    }
    const { collectiveSlug } = this.props;
    Router.pushRoute('event', {
      parentCollectiveSlug: collectiveSlug,
      eventSlug,
    }).then(() => {
      window.scrollTo(0, 0);
    });
    e.preventDefault();
  }

  renderEventEntry(event) {
    return (
      <li key={event.id}>
        <a
          href={`/${event.parentCollective.slug}/events/${event.slug}`}
          onClick={e => this.openEvent(e, event.slug)}
          target="_top"
        >
          {event.name}
        </a>
        , &nbsp;
        {!event.startsAt && console.warn(`EventsWithData: event.startsAt should not be empty. event.id: ${event.id}`)}
        {event.startsAt && (
          <React.Fragment>
            <FormattedDate value={event.startsAt} timeZone={event.timezone} day="numeric" month="long" year="numeric" />
            , &nbsp;
          </React.Fragment>
        )}
        {event.location.name}
      </li>
    );
  }

  render() {
    const { loading, allEvents } = this.props.data;

    if (loading || !allEvents) return <div />;

    const now = new Date(),
      pastEvents = [],
      futureEvents = [];
    allEvents.map(event => {
      if (new Date(event.startsAt) > now) futureEvents.push(event);
      else pastEvents.push(event);
    });
    pastEvents.reverse();

    return (
      <div className="Events" ref={node => (this.node = node)}>
        <style jsx>
          {`
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

            .createEvent {
              text-align: center;
            }
          `}
        </style>
        <div className="events">
          {futureEvents.length === 0 && pastEvents.length === 0 && this.isIframe && (
            <div className="createEvent">
              <p>
                <FormattedMessage
                  id="events.widget.noEventScheduled"
                  defaultMessage={'No event has been scheduled yet.'}
                />
              </p>
              <a
                href={`/${this.props.collectiveSlug}/events/new`}
                onClick={this.createEvent}
                className="btn btn-default"
                target="_top"
              >
                <FormattedMessage id="events.create" defaultMessage={'Create an Event'} />
              </a>
            </div>
          )}
          {(futureEvents.length > 0 || pastEvents.length > 0) && (
            <div>
              <div className="title">
                <h2>
                  <FormattedMessage
                    id="events.title.futureEvents"
                    values={{ n: futureEvents.length }}
                    defaultMessage={'Next {n, plural, one {event} other {events}}'}
                  />
                </h2>
                {this.isIframe && (
                  <div className="action">
                    <a
                      href={`/${this.props.collectiveSlug}/events/new`}
                      onClick={this.createEvent}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <FormattedMessage id="events.create" defaultMessage={'Create an Event'} />
                    </a>
                  </div>
                )}
              </div>
              <ul>
                {futureEvents.length === 0 && <div>No event planned.</div>}
                {futureEvents.map(this.renderEventEntry)}
              </ul>
              {pastEvents.length > 0 && (
                <div className="pastEvents">
                  <div className="title">
                    <h2>
                      <FormattedMessage
                        id="events.title.pastEvents"
                        values={{ n: pastEvents.length }}
                        defaultMessage={'Past {n, plural, one {event} other {events}}'}
                      />
                    </h2>
                  </div>
                  <ul>{pastEvents.map(this.renderEventEntry)}</ul>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    );
  }
}

const getEventsQuery = gql`
  query allEvents($collectiveSlug: String) {
    allEvents(slug: $collectiveSlug, isArchived: false) {
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
        imageUrl
        backgroundImage
      }
    }
  }
`;

const addEventsData = graphql(getEventsQuery);

export default addEventsData(EventsWithData);
