import React from 'react';
import PropTypes from 'prop-types';
import Head from 'next/head';

import { FormattedMessage } from 'react-intl';
import { graphql } from 'react-apollo';
import gql from 'graphql-tag';

import MembersWithData from '../components/MembersWithData';

import withData from '../lib/withData';
import withIntl from '../lib/withIntl';

class BannerIframe extends React.Component {
  static getInitialProps({ query: { collectiveSlug, id, style } }) {
    return { collectiveSlug, id, style };
  }

  static propTypes = {
    collectiveSlug: PropTypes.string, // from getInitialProps, for addCollectiveData
    id: PropTypes.string, // from getInitialProps
    style: PropTypes.object, // from getInitialProps
    data: PropTypes.object.isRequired, // from withData
  };

  constructor(props) {
    super(props);
    this.onChange = this.onChange.bind(this);
  }

  componentDidMount() {
    this.onChange();
  }

  UNSAFE_componentWillReceiveProps() {
    this.onChange();
  }

  componentDidUpdate() {
    this.onChange();
  }

  onChange = () => {
    this.height = this.node && this.node.offsetHeight;
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
    const { collectiveSlug, data } = this.props;

    let style;
    try {
      style = JSON.parse(this.props.style || '{}');
    } catch (e) {
      style = {};
    }

    if (data.loading) {
      return (
        <div ref={node => (this.node = node)}>
          <FormattedMessage id="loading" defaultMessage="loading" />
        </div>
      );
    }

    const collective = data.Collective;
    if (!collective) {
      return (
        <div ref={node => (this.node = node)}>
          <FormattedMessage id="notFound" defaultMessage="not found" />
        </div>
      );
    }

    const { backers } = collective.stats;

    return (
      <div className="iframeContainer" ref={node => (this.node = node)}>
        <Head>
          <meta name="viewport" content="width=device-width, initial-scale=1" />
          <link rel="stylesheet" href="https://fonts.googleapis.com/css?family=Lato:400,700,900" />
          <title>{`${collectiveSlug} collectives`}</title>
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
              font-family: ${style.body && `${style.body.fontFamily},`} 'Inter UI', Helvetica, sans-serif;
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
              color: ${(style.a && style.a.color) || '#46b0ed'};
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

            section h1,
            section h2 {
              text-align: center;
            }

            .button {
              width: 300px;
              height: 50px;
              overflow: hidden;
              margin: 0;
              padding: 0;
              background-repeat: no-repeat;
              float: left;
              border: none;
              background-color: transparent;
              cursor: pointer;
            }

            .button.contribute {
              width: 338px;
            }
            .contribute.button.blue {
              background-image: url(/static/images/buttons/contribute-button-blue.svg);
            }
            .button:hover {
              background-position: 0 -50px;
            }
            .button:active {
              background-position: 0 -100px;
            }
            .button:focus {
              outline: 0;
            }

            .button.hover {
              background-position: 0 -100px;
            }
          `}
        </style>

        {backers.organizations + backers.users === 0 && (
          <a
            type="button"
            className="button blue contribute"
            target="_blank"
            rel="noopener noreferrer"
            href={`https://opencollective.com/${collectiveSlug}`}
          />
        )}

        {backers.organizations > 0 && (
          <section id="organizations" className="tier">
            <h2 style={style.h2}>
              <FormattedMessage
                id="collective.section.backers.organizations.title"
                values={{
                  n: backers.organizations,
                  collective: collective.name,
                }}
                defaultMessage={
                  '{n} {n, plural, one {organization is} other {organizations are}} supporting {collective}'
                }
              />
            </h2>
            <div className="actions">
              <a
                href={`https://opencollective.com/${collectiveSlug}`}
                target="_blank"
                rel="noopener noreferrer"
                style={style.a}
              >
                <FormattedMessage id="widget.becomeSponsor" defaultMessage="Become a sponsor" />
              </a>
            </div>
            <MembersWithData
              collective={collective}
              onChange={this.onChange}
              type="ORGANIZATION"
              role="BACKER"
              limit={100}
            />
          </section>
        )}

        {backers.users > 0 && (
          <section id="backers" className="tier">
            <h2 style={style.h2}>
              <FormattedMessage
                id="collective.section.backers.users.title"
                values={{ n: backers.users, collective: collective.name }}
                defaultMessage={'{n} {n, plural, one {person is} other {people are}} supporting {collective}'}
              />
            </h2>

            <div className="actions">
              <a
                href={`https://opencollective.com/${collectiveSlug}`}
                target="_blank"
                rel="noopener noreferrer"
                style={style.a}
              >
                <FormattedMessage id="widget.becomeBacker" defaultMessage="Become a backer" />
              </a>
            </div>
            <MembersWithData
              collective={collective}
              onChange={this.onChange}
              type="USER"
              role="BACKER"
              limit={100}
              orderBy="totalDonations"
            />
          </section>
        )}
      </div>
    );
  }
}

const getMembersQuery = gql`
  query Collective($collectiveSlug: String) {
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

export default withData(withIntl(addCollectiveData(BannerIframe)));
