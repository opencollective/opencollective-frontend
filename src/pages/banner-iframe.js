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

  static getInitialProps ({ query: { collectiveSlug, id, style } }) {
    return { collectiveSlug, id, style }
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

  componentDidUpdate() {
    this.onChange();
  }

  render() {
    const { collectiveSlug, data } = this.props;

    let style;
    try {
      style = JSON.parse(this.props.style || '{}');
    } catch (e) {
      style = {};
    }

    if (data.loading) {
      return <div ref={(node) => this.node = node}><FormattedMessage id="loading" defaultMessage="loading" /></div>;
    }

    const collective = data.Collective;
    if (!collective) {
      return <div ref={(node) => this.node = node}><FormattedMessage id="notFound" defaultMessage="not found" /></div>;
    }

    const { backers } = collective.stats;

    return (
      <div className="iframeContainer" ref={(node) => this.node = node}>
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
          font-family: ${style.body && `${style.body.fontFamily},`}Lato,Helvetica,sans-serif;
          font-weight: 300;
          font-size: 1rem;
          line-height: 1.5;
          overflow-x: hidden;
        }

        .iframeContainer {
          overflow: hidden;
        }

        a {
          text-decoration: none;
          color: ${style.a && style.a.color || "#46b0ed"};
          cursor: pointer;
          font-size: 14px;
        }

        .actions {
          text-align: center;
        }

        .title {
          display: flex;
          align-items: baseline;
        }

        .title .action {
          font-size: 0.8rem;
        }

        h2 {
          font-size: 16px;
          margin-bottom: 0;
          font-weight: 300;
        }

        ul {
          list-style: none;
          padding: 0;
        }

        section h1, section h2 {
          text-align: center;
        }

        .btn { 
          width: 300px;
          height: 50px;
          overflow: hidden;
          margin: 0;
          padding: 0;
          background-repeat: no-repeat;
          float:left;
          border: none;
          background-color: transparent;
          cursor: pointer;
        }

        .btn.contribute {
          width: 338px;
        }
        .contribute.btn.blue {
          background-image: url(/static/images/buttons/contribute-button-blue.svg);
        }
        .btn:hover {
          background-position: 0 -50px;
        }
        .btn:active {
          background-position: 0 -100px;
        }
        .btn:focus {
          outline: 0;
        }

        .btn.hover {
          background-position: 0 -100px;
        }
        `}</style>

        { backers.organizations + backers.users === 0 &&
          <a type="button" className="btn blue contribute" target="_blank" href={`https://opencollective.com/${collectiveSlug}`} />
        }


        { backers.organizations > 0 &&
          <section id="organizations" className="tier">
            <h2 style={style.h2}>
              <FormattedMessage
                id="collective.section.backers.organizations.title"
                values={{ n: backers.organizations, collective: collective.name }}
                defaultMessage={`{n} {n, plural, one {organization is} other {organizations are}} supporting {collective}`}
                />
            </h2>
            <div className="actions">
              <a href={`https://opencollective.com/${collectiveSlug}`} target="_blank" style={style.a}><FormattedMessage id="widget.becomeSponsor" defaultMessage="Become a sponsor" /></a>
            </div>
            <MembersWithData
              collective={collective}
              onChange={this.onChange}
              type="ORGANIZATION"
              role='BACKER'
              limit={100}
              />
          </section>
        }

        { backers.users > 0 &&
          <section id="backers" className="tier">
            <h2 style={style.h2}>
              <FormattedMessage
                id="collective.section.backers.users.title"
                values={{ n: backers.users, collective: collective.name }}
                defaultMessage={`{n} {n, plural, one {person is} other {people are}} supporting {collective}`}
                />
            </h2>

            <div className="actions">
              <a href={`https://opencollective.com/${collectiveSlug}`} target="_blank" style={style.a}><FormattedMessage id="widget.becomeBacker" defaultMessage="Become a backer" /></a>
            </div>
            <MembersWithData
              collective={collective}
              onChange={this.onChange}
              type="USER"
              role='BACKER'
              limit={100}
              orderBy="totalDonations"
              />
          </section>
        }

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
