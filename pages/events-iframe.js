import React from 'react';
import PropTypes from 'prop-types';
import Head from 'next/head';

import EventsWithData from '../components/EventsWithData';

class EventsIframe extends React.Component {
  static getInitialProps({ query: { collectiveSlug, id }, res }) {
    // Allow to be embeded as Iframe everywhere
    if (res) {
      res.removeHeader('X-Frame-Options');
    }
    return { collectiveSlug, id };
  }

  static propTypes = {
    collectiveSlug: PropTypes.string,
    id: PropTypes.string,
  };

  onChange = change => {
    if (!change) {
      return;
    }
    this.height = change.height;
    this.sendMessageToParentWindow();
  };

  sendMessageToParentWindow = () => {
    if (!window.parent) {
      return;
    }
    if (!this.height) {
      return;
    }
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
              font-family: 'Inter';
              font-style: normal;
              font-weight: 400;
              font-display: swap;
              src: url('/static/fonts/inter/Inter-Regular.woff2') format('woff2'),
                url('/static/fonts/inter/Inter-Regular.woff') format('woff');
            }
            @font-face {
              font-family: 'Inter';
              font-style: italic;
              font-weight: 400;
              font-display: swap;
              src: url('/static/fonts/inter/Inter-Italic.woff2') format('woff2'),
                url('/static/fonts/inter/Inter-Italic.woff') format('woff');
            }

            @font-face {
              font-family: 'Inter';
              font-style: normal;
              font-weight: 500;
              font-display: swap;
              src: url('/static/fonts/inter/Inter-Medium.woff2') format('woff2'),
                url('/static/fonts/inter/Inter-Medium.woff') format('woff');
            }
            @font-face {
              font-family: 'Inter';
              font-style: italic;
              font-weight: 500;
              font-display: swap;
              src: url('/static/fonts/inter/Inter-MediumItalic.woff2') format('woff2'),
                url('/static/fonts/inter/Inter-MediumItalic.woff') format('woff');
            }

            @font-face {
              font-family: 'Inter';
              font-style: normal;
              font-weight: 600;
              font-display: swap;
              src: url('/static/fonts/inter/Inter-SemiBold.woff2') format('woff2'),
                url('/static/fonts/inter/Inter-SemiBold.woff') format('woff');
            }
            @font-face {
              font-family: 'Inter';
              font-style: italic;
              font-weight: 600;
              font-display: swap;
              src: url('/static/fonts/inter/Inter-SemiBoldItalic.woff2') format('woff2'),
                url('/static/fonts/inter/Inter-SemiBoldItalic.woff') format('woff');
            }

            @font-face {
              font-family: 'Inter';
              font-style: normal;
              font-weight: 700;
              font-display: swap;
              src: url('/static/fonts/inter/Inter-Bold.woff2') format('woff2'),
                url('/static/fonts/inter/Inter-Bold.woff') format('woff');
            }
            @font-face {
              font-family: 'Inter';
              font-style: italic;
              font-weight: 700;
              font-display: swap;
              src: url('/static/fonts/inter/Inter-BoldItalic.woff2') format('woff2'),
                url('/static/fonts/inter/Inter-BoldItalic.woff') format('woff');
            }

            @font-face {
              font-family: 'Inter';
              font-style: normal;
              font-weight: 800;
              font-display: swap;
              src: url('/static/fonts/inter/Inter-ExtraBold.woff2') format('woff2'),
                url('/static/fonts/inter/Inter-ExtraBold.woff') format('woff');
            }
            @font-face {
              font-family: 'Inter';
              font-style: italic;
              font-weight: 800;
              font-display: swap;
              src: url('/static/fonts/inter/Inter-ExtraBoldItalic.woff2') format('woff2'),
                url('/static/fonts/inter/Inter-ExtraBoldItalic.woff') format('woff');
            }

            @font-face {
              font-family: 'Inter';
              font-style: normal;
              font-weight: 900;
              font-display: swap;
              src: url('/static/fonts/inter/Inter-Black.woff2') format('woff2'),
                url('/static/fonts/inter/Inter-Black.woff') format('woff');
            }
            @font-face {
              font-family: 'Inter';
              font-style: italic;
              font-weight: 900;
              font-display: swap;
              src: url('/static/fonts/inter/Inter-BlackItalic.woff2') format('woff2'),
                url('/static/fonts/inter/Inter-BlackItalic.woff') format('woff');
            }

            body {
              width: 100%;
              height: 100%;
              padding: 0;
              margin: 0;
              font-family: 'Inter', sans-serif;
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

export default EventsIframe;
