import React from 'react';
import PropTypes from 'prop-types';
import Head from 'next/head';

import EventsWithData from '../components/EventsWithData';

import withData from '../lib/withData';
import withIntl from '../lib/withIntl';

class EventsIframe extends React.Component {
  static getInitialProps({ query: { collectiveSlug, id } }) {
    return { collectiveSlug, id };
  }

  static propTypes = {
    collectiveSlug: PropTypes.string,
    id: PropTypes.string,
  };

  onChange = change => {
    if (!change) return;
    this.height = change.height;
    this.sendMessageToParentWindow();
  };

  sendMessageToParentWindow = () => {
    if (!window.parent) return;
    if (!this.height) return;
    const message = `oc-${JSON.stringify({
      id: this.props.id,
      height: this.height,
    })}`;
    window.parent.postMessage(message, '*');
  };

  render() {
    const { collectiveSlug } = this.props;
    return (
      <div>
        <Head>
          <meta name="viewport" content="width=device-width, initial-scale=1" />
          <link rel="stylesheet" href="https://fonts.googleapis.com/css?family=Lato:400,700,900" />
          <title>{`${collectiveSlug} events`}</title>
        </Head>

        <style jsx global>
          {`
            @font-face {
              font-family: 'Inter UI';
              font-style: normal;
              font-weight: 400;
              src: url('/static/fonts/inter-ui/Inter-UI-Regular.woff2') format('woff2'),
                url('/static/fonts/inter-ui/Inter-UI-Regular.woff') format('woff');
            }

            @font-face {
              font-family: 'Inter UI';
              font-style: italic;
              font-weight: 400;
              src: url('/static/fonts/inter-ui/Inter-UI-Italic.woff2') format('woff2'),
                url('/static/fonts/inter-ui/Inter-UI-Italic.woff') format('woff');
            }

            @font-face {
              font-family: 'Inter UI';
              font-style: normal;
              font-weight: 500;
              src: url('/static/fonts/inter-ui/Inter-UI-Medium.woff2') format('woff2'),
                url('/static/fonts/inter-ui/Inter-UI-Medium.woff') format('woff');
            }

            @font-face {
              font-family: 'Inter UI';
              font-style: italic;
              font-weight: 500;
              src: url('/static/fonts/inter-ui/Inter-UI-MediumItalic.woff2') format('woff2'),
                url('/static/fonts/inter-ui/Inter-UI-MediumItalic.woff') format('woff');
            }

            @font-face {
              font-family: 'Inter UI';
              font-style: normal;
              font-weight: 700;
              src: url('/static/fonts/inter-ui/Inter-UI-Bold.woff2') format('woff2'),
                url('/static/fonts/inter-ui/Inter-UI-Bold.woff') format('woff');
            }

            @font-face {
              font-family: 'Inter UI';
              font-style: italic;
              font-weight: 700;
              src: url('/static/fonts/inter-ui/Inter-UI-BoldItalic.woff2') format('woff2'),
                url('/static/fonts/inter-ui/Inter-UI-BoldItalic.woff') format('woff');
            }

            @font-face {
              font-family: 'Inter UI';
              font-style: normal;
              font-weight: 900;
              src: url('/static/fonts/inter-ui/Inter-UI-Black.woff2') format('woff2'),
                url('/static/fonts/inter-ui/Inter-UI-Black.woff') format('woff');
            }

            @font-face {
              font-family: 'Inter UI';
              font-style: italic;
              font-weight: 900;
              src: url('/static/fonts/inter-ui/Inter-UI-BlackItalic.woff2') format('woff2'),
                url('/static/fonts/inter-ui/Inter-UI-BlackItalic.woff') format('woff');
            }

            body {
              width: 100%;
              height: 100%;
              padding: 0;
              margin: 0;
              font-family: 'Inter UI', sans-serif;
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
        <EventsWithData collectiveSlug={collectiveSlug} onChange={this.onChange} />
      </div>
    );
  }
}

export default withData(withIntl(EventsIframe));
