import React from 'react';
import PropTypes from 'prop-types';
import Header from './Header';
import Body from './Body';
import Footer from './Footer';
import { defineMessages } from 'react-intl';
import withIntl from '../lib/withIntl';
import { get } from 'lodash';
import Loading from './Loading';
import NotFound from './NotFound';
import getConfig from 'next/config'

const { publicRuntimeConfig } = getConfig();

class ErrorPage extends React.Component {

  static propTypes = {
    message: PropTypes.string,
    loading: PropTypes.bool,
    data: PropTypes.object, // we can pass the data object of Apollo to detect and handle GraphQL errors
    intl: PropTypes.object.isRequired,
  };

  constructor(props) {
    super(props);

    this.messages = defineMessages({
      'loading': { id: 'page.loading', defaultMessage: 'Loading' },
      'loading.description': { id: 'page.loading.description', defaultMessage: 'Please wait...' },
      'collective.is.not.host': { id: 'page.error.collective.is.not.host', defaultMessage: 'This page is only for hosts' },
      'networkError': { id: 'page.error.networkError', defaultMessage: 'The Open Collective Server is momentarily unreachable 🙀' },
      'networkError.description': { id: 'page.error.networkError.description', defaultMessage: 'Worry not! One of our engineers is probably already on it  👩🏻‍💻👨🏿‍💻. Please try again later. Thank you for your patience 🙏 (and sorry for the inconvenience!)' },
      'networkError.localhost': { id: 'page.error.networkError.localhost', defaultMessage: 'The Open Collective API is not reachable' },
      'networkError.localhost.description': { id: 'page.error.networkError.localhost.description', defaultMessage: 'Please make sure the Open Collective API is up and running on {api_url} or specify a different location with the environment variable API_URL' },
      'unknown': { id: 'page.error.unknown', defaultMessage: 'Unknown error' },
    });

  }

  getErrorComponent() {
    const { message, data, loading } = this.props;

    if (get(data, 'error')) {
      console.error(data.error);
    }

    this.message = this.messages[message] ? message : 'unknown';
    if (get(data, 'error.networkError')) {
      this.message = 'networkError';
      if (get(window, 'location.hostname') === 'localhost') {
        this.message = 'networkError.localhost';
      }
    }

    if (loading || get(data, 'loading')) {
      this.message = 'loading';
      return <Loading />;
    }

    if (get(data, 'error.message', '').includes('No collective found')) {
      return <NotFound slug={get(this.props.data, 'variables.slug')} />;
    }

    return this.defaultComponent();
  }

  defaultComponent() {
    const { intl } = this.props;
    return (
      <div>
        <style jsx>{`
          h1 {
            text-align:center;
            padding: 10rem;
          }
          p {
            text-align: center;
            max-width: 600px;
            margin: -5rem auto 10rem;
          }
        `}</style>
        <h1>{intl.formatMessage(this.messages[this.message])}</h1>
        {this.component}
        { this.messages[`${this.message}.description`] &&
          <p>{intl.formatMessage(this.messages[`${this.message}.description`], { api_url: publicRuntimeConfig.API_URL })}</p>
        }
      </div>
    )
  }

  render() {
    const component = this.getErrorComponent();

    return (
      <div className="ErrorPage">
        <Header />
        <Body>
          <div className="content">
            { component }
          </div>
        </Body>
        <Footer />
      </div>
    )
  }
}

export default withIntl(ErrorPage);
