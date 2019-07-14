import React from 'react';
import PropTypes from 'prop-types';
import { FormattedDate } from 'react-intl';
import { graphql } from 'react-apollo';
import gql from 'graphql-tag';

import colors from '../lib/constants/colors';

import { firstSentence } from '../lib/utils';

class NametagsPage extends React.Component {
  static getInitialProps({ query: { collectiveSlug, eventSlug, template, format, nametagWidth, nametagHeight } }) {
    return {
      collectiveSlug,
      eventSlug,
      slug: eventSlug,
      template,
      format,
      nametagWidth,
      nametagHeight,
    };
  }

  static propTypes = {
    collectiveSlug: PropTypes.string,
    eventSlug: PropTypes.string,
    slug: PropTypes.string, // for addAttendeesData
    template: PropTypes.string,
    format: PropTypes.string, // Should that be pageFormat?
    nametagWidth: PropTypes.number,
    nametagHeight: PropTypes.number,
    pageFormat: PropTypes.string, // Should that be format?
    data: PropTypes.object.isRequired, // from withData
  };

  constructor(props) {
    super(props);
    const { pageFormat, nametagWidth, nametagHeight } = this.props;

    this.dimensions = {
      A4: {
        unit: 'mm',
        page: {
          width: 210,
          height: 297,
        },
        nametag: {
          width: nametagWidth || 100,
          height: nametagHeight || 57,
          padding: 5,
        },
      },
      US: {
        unit: 'in',
        page: {
          width: 8.5,
          height: 11,
        },
        nametag: {
          width: nametagWidth || 4,
          height: nametagHeight || 3,
          padding: 0.1,
        },
      },
    };

    this.dimensions = this.dimensions[pageFormat || 'US'];
    this.page = this.dimensions.page;
    this.cols = Math.floor(this.page.width / this.dimensions.nametag.width);
    this.rows = Math.floor(this.page.height / this.dimensions.nametag.height);

    this.nametagsPerPage = this.cols * this.rows;

    this.page.paddingTop = Math.floor((this.page.height - this.rows * this.dimensions.nametag.height) / 2);
  }

  renderNametag = (order, index) => {
    const userCollective = order.fromCollective || {};
    return (
      <div className="nametag" key={order.id || `empty-${index}`}>
        <h1>
          <span className="firstName">{userCollective.name}</span>
        </h1>
        {userCollective.company && <h2 className="company">{userCollective.company}</h2>}
        {userCollective.twitterHandle && <h2 className="twitterHandle">@{userCollective.twitterHandle}</h2>}
        <p className="description">{firstSentence(order.description || userCollective.description, 60)}</p>
        <div className="eventInfo">
          <FormattedDate
            value={this.event.startsAt}
            timeZone={this.event.timezone}
            day="numeric"
            month="long"
            year="numeric"
          />{' '}
          - &nbsp;
          {this.event.name} - {this.event.location.name}
        </div>
      </div>
    );
  };

  renderPage = (pageNumber, orders) => {
    while (orders.length < this.nametagsPerPage) {
      orders.push({});
    }
    return (
      <div className="page" key={pageNumber}>
        <div className="nametags">{orders.map(this.renderNametag)}</div>
      </div>
    );
  };

  render() {
    if (this.props.data.loading) return <div>Loading</div>;
    const orders = [];
    this.event = this.props.data.Collective;
    this.props.data.Collective.orders.map(r => orders.push(r));

    return (
      <div className={`NametagsPages ${this.props.collectiveSlug} ${this.props.eventSlug} ${this.props.template}`}>
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

            html {
              font-size: 62.5%;
              width: ${this.page.width} ${this.dimensions.unit};
              zoom: 0.75;
            }

            body {
              width: ${this.page.width} ${this.dimensions.unit};
              padding: 0;
              margin: 0;
              font-family: 'Inter UI', Helvetica, sans-serif;
              font-weight: 300;
              font-size: 1.6rem;
              line-height: 1.5;
            }

            .page {
              width: ${this.page.width} ${this.dimensions.unit};
              height: ${this.page.height} ${this.dimensions.unit};
              overflow: hidden;
              box-sizing: border-box;
              padding-top: ${this.page.paddingTop} ${this.dimensions.unit};
            }

            .nametags {
              margin: 0 auto;
              width: ${this.cols * this.dimensions.nametag.width} ${this.dimensions.unit};
            }

            .nametag {
              width: ${this.dimensions.nametag.width} ${this.dimensions.unit};
              height: ${this.dimensions.nametag.height} ${this.dimensions.unit};
              text-align: center;
              float: left;
              padding: ${this.dimensions.nametag.padding} ${this.dimensions.unit};
              box-sizing: border-box;
              overflow: hidden;
              display: flex;
              display: -webkit-flex;
              flex-direction: column;
              -webkit-flex-direction: column;
              justify-content: space-around;
              -webkit-justify-content: space-around;
              align-items: center;
              -webkit-align-items: center;
            }

            .nametag span {
              display: inline-block;
            }

            .showMarks .page {
              border: 1px solid red;
            }

            .showMarks .nametag {
              border: 1px dashed rgba(0, 0, 0, 0.3);
            }

            .nametag h1 {
              margin: 0;
            }

            .nametag h2 {
              color: ${colors.blue};
              margin: 0.5rem 0;
            }

            .nametag p {
              font-weight: 600;
            }

            .eventInfo {
              display: none;
            }

            .sustainoss .firstName {
              font-size: 5rem;
            }
            .sustainoss .lastName {
              display: none;
            }
            .sustainoss .description {
              display: none;
            }
            .sustainoss .twitterHandle {
              display: none;
            }
            .sustainoss .eventInfo {
              display: block;
            }
          `}
        </style>

        <div className="pages">
          {orders.map((order, index) => {
            if (index % this.nametagsPerPage === 0) {
              return this.renderPage(
                index / this.nametagsPerPage + 1,
                orders.slice(index, index + this.nametagsPerPage),
              );
            }
          })}
        </div>
      </div>
    );
  }
}

const getAttendeesQuery = gql`
  query Collective($slug: String) {
    Collective(slug: $slug) {
      slug
      name
      startsAt
      endsAt
      timezone
      location {
        name
        address
      }
      orders {
        id
        createdAt
        quantity
        description
        fromCollective {
          id
          name
          company
          image
          slug
          twitterHandle
          description
        }
        tier {
          id
          name
        }
      }
    }
  }
`;

export const addAttendeesData = graphql(getAttendeesQuery);

export default addAttendeesData(NametagsPage);
