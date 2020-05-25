import React from 'react';
import { useServerContext } from 'next-server-context';
import ErrorPage from 'next/error';
import { generateNotFoundError } from '../lib/errors';

const withError = Component => {
  return class WithError extends React.Component {
    static async getInitialProps(ctx) {
      console.log('STUFF');
      const props = (Component.getInitialProps ? await Component.getInitialProps(ctx) : null) || {};
      if (props.statusCode && ctx.res) {
        ctx.res.statusCode = props.statusCode;
      }
      console.log(props);
      return props;
    }

    state = { error: null };

    render() {
      if (this.props.statusCode) {
        return <ErrorPage error={generateNotFoundError()} log={false} />;
      }
      return <Component {...this.props} setError={error => this.setState({ error })} />;
    }
  };
};

export default withError;
