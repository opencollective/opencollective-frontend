import React from 'react';
import PropTypes from 'prop-types';
import ErrorPage from 'next/error';

const withSSRError = Component => {
  return class WithError extends React.Component {
    static async getInitialProps(ctx) {
      const props = (Component.getInitialProps ? await Component.getInitialProps(ctx) : null) || {};
      if (props.statusCode && ctx.res) {
        ctx.res.statusCode = props.statusCode;
      }
      return props;
    }

    static propTypes = {
      statusCode: PropTypes.string,
    };

    render() {
      if (this.props.statusCode) {
        return <ErrorPage statusCode={this.props.statusCode} />;
      } else {
        return <Component {...this.props} />;
      }
    }
  };
};

export default withSSRError;
