import React from 'react';
import Head from 'next/head';
import MembersWithData from '../components/MembersWithData';
import withData from '../lib/withData';
import withIntl from '../lib/withIntl';
import { FormattedMessage } from 'react-intl';
import { graphql } from 'react-apollo'
import gql from 'graphql-tag'

class Banner extends React.Component {

  constructor(props) {
    super(props);
    this.sendMessageToParentWindow = this.sendMessageToParentWindow.bind(this);
    this.onChange = this.onChange.bind(this);
  }

  static getInitialProps ({ query: { collectiveSlug, id, role, orderBy, limit } }) {
    return { collectiveSlug, id, role, orderBy, limit }
  }

  sendMessageToParentWindow() {
    if (!window.parent) return;
    if (!this.height) return;
    const message = `oc-${JSON.stringify({id: this.props.id, height: this.height})}`;
    window.parent.postMessage(message, "*");
  }

  onChange() {
    this.height = this.node && this.node.offsetHeight;
    this.sendMessageToParentWindow();
  }

  componentWillReceiveProps() {
    this.onChange();
  }

  render() {
    const { collectiveSlug, data } = this.props;

    if (data.loading) {
      return <div><FormattedMessage id="loading" defaultMessage="loading" /></div>;
    }

    const collective = data.Collective;
    if (!collective) {
      return <div><FormattedMessage id="notFound" defaultMessage="not found" /></div>;
    }

    return (
      <div ref={(node) => this.node = node}>
        <Head>
          <meta name="viewport" content="width=device-width, initial-scale=1" />
          <link rel="stylesheet" href="https://fonts.googleapis.com/css?family=Lato:400,700,900" />
          <title>{`${this.props.collectiveSlug} collectives`}</title>
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
          color: #46b0ed;
          cursor: pointer;
        }

        .title {
          display: flex;
          align-items: baseline;
        }

        .title .action {
          font-size: 0.8rem;
        }

        h2 {
          font-size: 18px;
          margin-top: 0;
        }

        ul {
          list-style: none;
          padding: 0;
        }

        h1 {
          font-size: 24px;
          margin-bottom: 0;
        }

        section h1, section h2 {
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

        <section id="organizations" className="tier">
          <h1>
            <FormattedMessage
              id="collective.section.backers.organizations.title"
              values={{ n: collective.stats.backers.organizations, collective: collective.name }}
              defaultMessage={`{n} {n, plural, one {organization is} other {organizations are}} supporting {collective}`}
              />
          </h1>
          <h2><a href={`https://opencollective.com/${collectiveSlug}`} target="_blank"><FormattedMessage id="widget.becomeSponsor" defaultMessage="Become a sponsor" /></a></h2>
          <MembersWithData
            collective={collective}
            onChange={this.onChange}
            type="ORGANIZATION"
            role='BACKER'
            limit={100}
            />
        </section>

        <section id="backers" className="tier">
          <h1>
            <FormattedMessage
              id="collective.section.backers.users.title"
              values={{ n: collective.stats.backers.users, collective: collective.name }}
              defaultMessage={`{n} {n, plural, one {person is} other {people are}} supporting {collective}`}
              />
          </h1>

          <h2><a href={`https://opencollective.com/${collectiveSlug}`} target="_blank"><FormattedMessage id="widget.becomeBacker" defaultMessage="Become a backer" /></a></h2>
          <MembersWithData
            collective={collective}
            onChange={this.onChange}
            type="USER"
            role='BACKER'
            limit={100}
            orderBy="totalDonations"
            />
        </section>

      </div>
    );
  }

}

const getMembersQuery = gql`
query Collective($collectiveSlug: String!) {
  Collective(slug: $collectiveSlug) {
    id
    name
    currency
    stats {
      id
      backers {
        id
        users
        organizations
      }
    }
  }
}
`;

export const addCollectiveData = graphql(getMembersQuery);
export default withData(withIntl(addCollectiveData(Banner)));