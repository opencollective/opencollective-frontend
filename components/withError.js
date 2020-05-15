import React from 'react';
import ErrorPage from 'next/error';
import { generateNotFoundError } from '../lib/errors';

export default Component => {
  return class WithError extends React.Component {
    static async getInitialProps(ctx) {
      const props = (Component.getInitialProps ? await Component.getInitialProps(ctx) : null) || {};
      if (props.statusCode && ctx.res) {
        ctx.res.statusCode = props.statusCode;
      }
      console.log(props);
      return props;
    }

    render() {
      if (this.props.statusCode) {
        return <ErrorPage error={generateNotFoundError()} log={false} />;
      }
      return <Component {...this.props} />;
    }
  };
};
