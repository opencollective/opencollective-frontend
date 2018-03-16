import React from 'react'
import withData from '../lib/withData';
import withIntl from '../lib/withIntl';
import { capitalize, firstSentence } from '../lib/utils';
import colors from '../constants/colors';
import { FormattedDate } from 'react-intl';
import { graphql } from 'react-apollo'
import gql from 'graphql-tag'

class Nametags extends React.Component {

  static getInitialProps ({ query: { collectiveSlug, eventSlug, template, format, nametagWidth, nametagHeight } }) {
    return { collectiveSlug, eventSlug, slug: eventSlug, template, format, nametagWidth, nametagHeight }
  }

  constructor(props) {
    super(props);
    const { pageFormat, nametagWidth, nametagHeight } = this.props;

    this.renderPage = this.renderPage.bind(this);
    this.renderNametag = this.renderNametag.bind(this);

    this.dimensions = {
      'A4': {
        unit: 'mm',
        page: {
          width: 210,
          height: 297
        },
        nametag: {
          width: nametagWidth || 100,
          height: nametagHeight || 57,
          padding: 5
        }
      },
     'US': {
        unit: 'in',
        page: {
          width: 8.5,
          height: 11
        },
        nametag: {
          width: nametagWidth || 4,
          height: nametagHeight || 3,
          padding: 0.1
        }
      }
    };

    this.dimensions = this.dimensions[pageFormat || 'US'];
    this.page = this.dimensions.page;
    this.cols = Math.floor(this.page.width / this.dimensions.nametag.width);
    this.rows = Math.floor(this.page.height / this.dimensions.nametag.height);

    this.nametagsPerPage = this.cols * this.rows;

    this.page.paddingTop = Math.floor((this.page.height - this.rows * this.dimensions.nametag.height) / 2);
  }

  renderPage(pageNumber, orders) {
    while (orders.length < this.nametagsPerPage) {
      orders.push({});
    }
    return (
      <div className="page" key={this.pageNumber}>
        <div className="nametags">
          {orders.map(this.renderNametag)}
        </div>
      </div>
    )
  }

  renderNametag(order, index) {
    const userCollective = order.fromCollective || {};
    return (
      <div className="nametag" key={index}>
        <h1><span className="firstName">{userCollective.name}</span></h1>
        {userCollective.company && <h2 className="company">{userCollective.company}</h2> }
        {userCollective.twitterHandle && <h2 className="twitterHandle">@{userCollective.twitterHandle}</h2> }
        <p className="description">{firstSentence(order.description || userCollective.description, 60)}</p>
        <div className="eventInfo">
          <FormattedDate value={this.event.startsAt} day='numeric' month='long' year='numeric' /> - &nbsp;
          {this.event.name} - {this.event.location.name}
        </div>
      </div>
    )
  }

  render() {
    if (this.props.data.loading) return <div>Loading</div>
    const orders = [];
    this.event = this.props.data.Collective;
    this.props.data.Collective.orders.map(r => orders.push(r));

    return (
      <div className={`NametagsPages ${this.props.collectiveSlug} ${this.props.eventSlug} ${this.props.template}`}>
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

          html {
            font-size: 62.5%;
            width:${this.page.width}${this.dimensions.unit};
            zoom: .75;
          }

          body {
            width:${this.page.width}${this.dimensions.unit};
            padding: 0;
            margin: 0;
            font-family: Lato,Helvetica,sans-serif;
            font-weight: 300;
            font-size: 1.6rem;
            line-height: 1.5;
          }

          .page {
            width: ${this.page.width}${this.dimensions.unit};
            height: ${this.page.height}${this.dimensions.unit};
            overflow: hidden;
            box-sizing: border-box;
            padding-top: ${this.page.paddingTop}${this.dimensions.unit};
          }

          .nametags {
            margin: 0 auto;
            width: ${this.cols * this.dimensions.nametag.width}${this.dimensions.unit};
          }

          .nametag {
            width: ${this.dimensions.nametag.width}${this.dimensions.unit};
            height: ${this.dimensions.nametag.height}${this.dimensions.unit};
            text-align: center;
            float: left;
            padding: ${this.dimensions.nametag.padding}${this.dimensions.unit};
            box-sizing: border-box;
            overflow: hidden;
            display: flex;
            display:  -webkit-flex;
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
            border: 1px dashed rgba(0,0,0,0.3);
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
        `}</style>

        <div className="pages">
          {orders.map((order, index) => {
            if (index % this.nametagsPerPage === 0) {
              return this.renderPage(index/this.nametagsPerPage + 1, orders.slice(index, index + this.nametagsPerPage));
            }
          })}
        </div>
      </div>
    );
  }
}

const getAttendeesQuery = gql`
query Collective($slug: String!) {
  Collective(slug: $slug) {
    slug
    name
    startsAt
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

export default withData(withIntl(addAttendeesData(Nametags)));