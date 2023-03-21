import React from 'react';
import PropTypes from 'prop-types';

class TwoFactorAuthPrompt {
  constructor(onChange) {
    this.resolvePromise = () => {};
    this.rejectPromise = () => {};
    this.isOpen = false;
    this.onChange = onChange;
    this.supportedMethods = [];
  }

  open = async ({ supportedMethods } = {}) => {
    if (this.isOpen) {
      return;
    }

    this.supportedMethods = supportedMethods || [];

    this.setIsOpen(true);

    try {
      const code = await new Promise((resolve, reject) => {
        this.resolvePromise = resolve;
        this.rejectPromise = reject;
      });

      this.setIsOpen(false);
      return code;
    } finally {
      this.setIsOpen(false);
    }
  };

  resolveAuth = args => this?.resolvePromise(args);

  rejectAuth = args => this?.rejectPromise(args);

  setIsOpen = value => {
    this.isOpen = value;
    this.onChange(value);
  };
}

export const TwoFactorAuthContext = React.createContext({
  prompt: {
    open: () => {},
    resolveAuth: () => {},
    rejectAuth: () => {},
    isOpen: false,
  },
});

export function useTwoFactorAuthenticationPrompt() {
  const twoFactorAuthContext = React.useContext(TwoFactorAuthContext);
  return twoFactorAuthContext.prompt;
}

export function withTwoFactorAuthenticationPrompt(WrappedComponent) {
  const withTwoFactorAuthenticationPrompt = function W(props) {
    return (
      <TwoFactorAuthContext.Consumer>
        {context => {
          return <WrappedComponent {...props} twoFactorAuthPrompt={context.prompt} />;
        }}
      </TwoFactorAuthContext.Consumer>
    );
  };

  return withTwoFactorAuthenticationPrompt;
}

export function withTwoFactorAuthentication(WrappedComponent) {
  const withTwoFactorAuthentication = function W(props) {
    return (
      <TwoFactorAuthProvider>
        <TwoFactorAuthContext.Consumer>
          {context => {
            return <WrappedComponent {...props} twoFactorAuthContext={context} />;
          }}
        </TwoFactorAuthContext.Consumer>
      </TwoFactorAuthProvider>
    );
  };

  withTwoFactorAuthentication.getInitialProps = async context => {
    return WrappedComponent.getInitialProps ? await WrappedComponent.getInitialProps(context) : {};
  };

  return withTwoFactorAuthentication;
}

export default function TwoFactorAuthProvider({ children }) {
  const [contextChanged, setContextChanged] = React.useState(0);

  const twoFactorAuthPrompt = React.useMemo(() => {
    return new TwoFactorAuthPrompt(() => {
      setContextChanged(new Date().getTime());
    });
  }, []);

  return (
    <TwoFactorAuthContext.Provider
      value={{
        prompt: twoFactorAuthPrompt,
        contextChanged,
      }}
    >
      {children}
    </TwoFactorAuthContext.Provider>
  );
}

TwoFactorAuthProvider.propTypes = {
  children: PropTypes.node,
};
