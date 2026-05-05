import React from 'react';
import hoistNonReactStatics from 'hoist-non-react-statics';
import { useIntl } from 'react-intl';

export default function withIntl(WrappedComponent, options = {}) {
  const InjectIntl = props => {
    const intl = useIntl();
    return <WrappedComponent {...props} intl={intl} />;
  };

  if (options && options.forwardRef) {
    const ForwardedComponent = React.forwardRef((props, ref) => (
      <InjectIntl {...props} forwardedRef={ref} />
    ));
    return hoistNonReactStatics(ForwardedComponent, WrappedComponent);
  }

  return hoistNonReactStatics(InjectIntl, WrappedComponent);
}
