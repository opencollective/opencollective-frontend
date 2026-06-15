import React from 'react';
import { type IntlShape, useIntl } from 'react-intl';

type InjectIntlConfig = {
  intlPropName?: string;
  forwardRef?: boolean;
};

const STATIC_HOIST_KEYS = [
  'getInitialProps',
  'getStaticProps',
  'getServerSideProps',
  'displayName',
  'defaultProps',
  'propTypes',
];

function hoistNonReactStatics<T extends React.ComponentType<unknown>>(
  targetComponent: T,
  sourceComponent: React.ComponentType<unknown>,
): T {
  for (const key of STATIC_HOIST_KEYS) {
    const descriptor = Object.getOwnPropertyDescriptor(sourceComponent, key);
    if (descriptor) {
      Object.defineProperty(targetComponent, key, descriptor);
    }
  }

  return targetComponent;
}

/**
 * Compatibility layer for react-intl's removed injectIntl HOC.
 * @see https://formatjs.github.io/docs/react-intl/upgrade-guide-10.x
 */
function injectIntl(
  WrappedComponent: React.ComponentType<{ intl?: IntlShape }>,
  options: InjectIntlConfig = {},
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
): React.ComponentType<any> {
  const { intlPropName = 'intl', forwardRef = false } = options;
  const displayName = WrappedComponent.displayName || WrappedComponent.name || 'Component';

  const InjectIntl = (props: Record<string, unknown>, ref?: React.Ref<unknown>) => {
    const intl = useIntl();
    const injectedProps = { ...props, [intlPropName]: intl };

    if (forwardRef) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      return <WrappedComponent {...(injectedProps as any)} ref={ref} />;
    }

    return <WrappedComponent {...injectedProps} />;
  };

  InjectIntl.displayName = `injectIntl(${displayName})`;

  const Wrapped = forwardRef
    ? React.forwardRef(InjectIntl)
    : (InjectIntl as React.ComponentType<Record<string, unknown>>);

  Wrapped.displayName = `injectIntl(${displayName})`;

  return hoistNonReactStatics(Wrapped, WrappedComponent);
}

export default injectIntl;
