import React from 'react';
import hoistNonReactStatics from 'hoist-non-react-statics';
import { useIntl } from 'react-intl';

export default function withIntl(WrappedComponent: any, options?: { forwardRef?: boolean }) {
  const InjectIntl = (props: any) => {
    const intl = useIntl();
    const mergedProps = options?.forwardRef ? { ...props, ref: props.forwardedRef } : props;
    return <WrappedComponent {...mergedProps} intl={intl} />;
  };

  if (options && options.forwardRef) {
    const ForwardedComponent = React.forwardRef((props: any, ref) => <InjectIntl {...props} forwardedRef={ref} />);
    return hoistNonReactStatics(ForwardedComponent, WrappedComponent) as any;
  }

  return hoistNonReactStatics(InjectIntl, WrappedComponent) as any;
}
