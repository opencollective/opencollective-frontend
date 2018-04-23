import React from 'react';
import Head from 'next/head';
import EventsWithData from '../components/EventsWithData';
import withData from '../lib/withData'
import withIntl from '../lib/withIntl'

class Events extends React.Component {

  constructor(props) {
    super(props);
    this.sendMessageToParentWindow = this.sendMessageToParentWindow.bind(this);
    this.onChange = this.onChange.bind(this);
  }

  static getInitialProps ({ query: { collectiveSlug, id } }) {
    return { collectiveSlug, id }
  }

  sendMessageToParentWindow() {
    if (!window.parent) return;
    if (!this.height) return;
    const message = `oc-${JSON.stringify({id: this.props.id, height: this.height})}`;
    window.parent.postMessage(message, "*");
  }

  onChange(change) {
    if (!change) return;
    this.height = change.height;
    this.sendMessageToParentWindow();
  }

  render() {
    return (
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
        <EventsWithData
          collectiveSlug={this.props.collectiveSlug}
          onChange={this.onChange}
          />
      </div>
    );
  }

}

export default withData(withIntl(Events));
