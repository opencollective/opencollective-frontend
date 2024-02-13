import React from 'react';
import PropTypes from 'prop-types';
import { Elements } from '@stripe/react-stripe-js';

import { getStripe } from '../lib/stripe';

const StripeLoaderContext = React.createContext({
  isStripeLoaded: false,
  loadStripe() {},
});

/**
 * A wrapPropTypesper around StriperProvider context that loads the external script
 * on the client.
 */
class StripeProvider extends React.Component {
  static propTypes = {
    /** If we should automatically load stripe JS on mount (useful for styledguidest) */
    loadOnMount: PropTypes.bool,
    token: PropTypes.string,
  };

  constructor(props) {
    super(props);
    this.state = { loading: false, stripe: null };
  }

  async componentDidMount() {
    if (this.props.loadOnMount) {
      await this.loadStripe();
    }
  }

  /**
   * Loads stripe asynchronously, then update the Stripe context
   */
  loadStripe = async () => {
    if (this.state.loading || this.state.isStripeLoaded) {
      return;
    }

    this.setState({ loading: true });
    const stripe = await getStripe(this.props.token);
    this.setState({ stripe, loading: false, isStripeLoaded: true });
  };

  render() {
    return (
      <StripeLoaderContext.Provider
        value={{
          loadStripe: this.loadStripe,
          isStripeLoaded: this.state.isStripeLoaded,
        }}
      >
        <Elements stripe={this.state.stripe} {...this.props} />
      </StripeLoaderContext.Provider>
    );
  }
}

const { Consumer: StripeConsumer } = StripeLoaderContext;

export const withStripeLoader = WrappedComponent => {
  const withStripeLoader = props => (
    <StripeConsumer>{context => <WrappedComponent {...context} {...props} />}</StripeConsumer>
  );

  withStripeLoader.getInitialProps = async context => {
    return WrappedComponent.getInitialProps ? await WrappedComponent.getInitialProps(context) : {};
  };

  return withStripeLoader;
};

export default StripeProvider;
