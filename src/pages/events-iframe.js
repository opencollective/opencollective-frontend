import React from 'react';
import { addEventsData } from '../graphql/queries';
import withData from '../lib/withData';
import { IntlProvider, addLocaleData } from 'react-intl';
import { FormattedDate, FormattedMessage } from 'react-intl';
import Head from 'next/head';

import 'intl';
import 'intl/locale-data/jsonp/en.js'; // for old browsers without window.Intl
import en from 'react-intl/locale-data/en';
import enUS from '../lang/en-US.json';

addLocaleData([...en]);
addLocaleData({
    locale: 'en-US',
    parentLocale: 'en',
});

class Events extends React.Component {

  static getInitialProps ({ query: { collectiveSlug, id } }) {
    return { collectiveSlug, id }
  }

  renderEventEntry(event) {
    return (<li key={event.id}>
              <a href={`/${event.collective.slug}/events/${event.slug}`} target="_top">{event.name}</a>, &nbsp;
              <FormattedDate value={event.startsAt} day='numeric' month='long' />, &nbsp;
              {event.location.name}
            </li>);    
  }

  componentDidUpdate() {
    if (!window.parent) return;
    if (!this.refs.events) return;
    const message = `oc-${JSON.stringify({id: this.props.id, height: this.refs.events.offsetHeight})}`;
    window.parent.postMessage(message, "*");
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
      <IntlProvider locale="en-US" messages={enUS}>
        <div>
          <Head>
            <meta name="viewport" content="width=device-width, initial-scale=1" />
            <link rel="stylesheet" href="https://fonts.googleapis.com/css?family=Lato:400,700,900" />
            <title>{`${this.props.collectiveSlug} events`}</title>
          </Head>

          <style jsx global>{`
          @font-face {
            font-family: 'montserratlight';
            src: url('/static/fonts/montserrat/montserrat-light-webfont.eot');
            src: url('/static/fonts/montserrat/montserrat-light-webfont.eot?#iefix') format('embedded-opentype'),
              url('/static/fonts/montserrat/montserrat-light-webfont.woff2') format('woff2'),
              url('/static/fonts/montserrat/montserrat-light-webfont.woff') format('woff'),
              url('/static/fonts/montserrat/montserrat-light-webfont.ttf') format('truetype'),
              url('/static/fonts/montserrat/montserrat-light-webfont.svg#montserratlight') format('svg');
            font-weight: normal;
            font-style: normal;
          }
          @font-face {
            font-family: 'lato';
            src: url('/static/fonts/montserrat/lato-regular.ttf') format('truetype');
            font-weight: normal;
            font-style: normal;
          }

          body {
            width: 100%;
            height: 100%;
            padding: 0;
            margin: 0;
            font-family: Lato,Helvetica,sans-serif;
            font-weight: 300;
            font-size: 1rem;
            line-height: 1.5;
            overflow-x: hidden;
          }

          a {
            text-decoration: none;
          }

          .title {
            display: flex;
            align-items: baseline;
          }

          .title .action {
            font-size: 0.8rem;
          }

          h2 {
            font-size: 20px;
            margin-right: 1rem;
            margin-bottom: 0;
          }

          ul {
            list-style: none;
            padding: 0;
          }

          .events {
            padding: 10px;
            max-width: 450px;
            margin: 0 auto;
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
                <a href={`/${this.props.collectiveSlug}/events/new`} className="btn btn-default" target="_top"><FormattedMessage id='events.widget.createEvent' defaultMessage={`Create an Event`} /></a>
              </div>
            }
            { (futureEvents.length > 0 || pastEvents.length > 0) &&
              <div>
              <div className="title">
                <h2><FormattedMessage id='events.title.futureEvents' values={{n: futureEvents.length}} defaultMessage={`Next {n, plural, one {event} other {events}}`} /></h2>
                <div className="action"><a href={`/${this.props.collectiveSlug}/events/new`} target="_blank"><FormattedMessage id='events.widget.createEvent' defaultMessage={`Create an Event`} /></a></div>
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
      </IntlProvider>
    );
  }

}

export default withData(addEventsData(Events));