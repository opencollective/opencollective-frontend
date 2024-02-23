import React from 'react';
import PropTypes from 'prop-types';

class TwoFactorAuthPrompt {
  constructor() {
    this.resolvePromise = () => {};
    this.rejectPromise = () => {};
    this.isOpen = false;
    this.allowRecovery = false;
    this.supportedMethods = [];
    this.listeners = [];
    this.authenticationOptions = {};
  }

  open = async ({ supportedMethods, authenticationOptions, allowRecovery } = {}) => {
    if (this.isOpen) {
      return;
    }

    this.supportedMethods = supportedMethods || [];
    this.authenticationOptions = authenticationOptions || {};
    this.allowRecovery = allowRecovery || false;

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
    for (const listener of this.listeners) {
      listener?.(value);
    }
  };

  addOnPromptOpenListener = listener => {
    this.listeners = [...this.listeners, listener];
  };

  removeOnPromptOpenListener = listener => {
    this.listeners = this.listeners.filter(l => l !== listener);
  };
}

// ignore unused exports TwoFactorAuthContext
// used in Stories mdx

export const TwoFactorAuthContext = React.createContext({
  prompt: {
    // eslint-disable-next-line no-unused-vars
    open: options => {
      return {
        code: '',
        type: '',
      };
    },
    // eslint-disable-next-line no-unused-vars
    resolveAuth: result => {},
    // eslint-disable-next-line no-unused-vars
    rejectAuth: error => {},
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

const prompt = new TwoFactorAuthPrompt();

// ignore unused exports default
// used in Stories mdx

export default function TwoFactorAuthProvider({ children }) {
  const [contextChanged, setContextChanged] = React.useState(0);

  React.useEffect(() => {
    function onContextChanged() {
      setContextChanged(new Date().getTime());
    }

    prompt.addOnPromptOpenListener(onContextChanged);

    return () => prompt.removeOnPromptOpenListener(onContextChanged);
  }, [setContextChanged]);

  return (
    <TwoFactorAuthContext.Provider
      value={{
        prompt: prompt,
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
