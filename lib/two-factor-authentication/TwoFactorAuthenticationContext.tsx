import React from 'react';

type TwoFactorAuthCode = { type: string; code: string };

/** The prompt returns nothing when it is already open (e.g. React strict-mode double mounts). */
type TwoFactorAuthResult = TwoFactorAuthCode | undefined;

type TwoFactorAuthenticationOptions = {
  webauthn?: { challenge: string; [key: string]: unknown };
};

type TwoFactorAuthPromptOptions = {
  supportedMethods?: string[];
  authenticationOptions?: TwoFactorAuthenticationOptions;
  allowRecovery?: boolean;
};

class TwoFactorAuthPrompt {
  resolvePromise: (value: TwoFactorAuthCode) => void;
  rejectPromise: (reason?: unknown) => void;
  isOpen: boolean;
  allowRecovery: boolean;
  supportedMethods: string[];
  listeners: ((isOpen: boolean) => void)[];
  authenticationOptions: TwoFactorAuthenticationOptions;

  constructor() {
    this.resolvePromise = () => {};
    this.rejectPromise = () => {};
    this.isOpen = false;
    this.allowRecovery = false;
    this.supportedMethods = [];
    this.listeners = [];
    this.authenticationOptions = {};
  }

  open = async ({
    supportedMethods,
    authenticationOptions,
    allowRecovery,
  }: TwoFactorAuthPromptOptions = {}): Promise<TwoFactorAuthResult> => {
    if (this.isOpen) {
      return;
    }

    this.supportedMethods = supportedMethods || [];
    this.authenticationOptions = authenticationOptions || {};
    this.allowRecovery = allowRecovery || false;

    this.setIsOpen(true);

    try {
      const code = await new Promise<TwoFactorAuthCode>((resolve, reject) => {
        this.resolvePromise = resolve;
        this.rejectPromise = reject;
      });

      this.setIsOpen(false);
      return code;
    } finally {
      this.setIsOpen(false);
    }
  };

  resolveAuth = (args: TwoFactorAuthCode) => this?.resolvePromise(args);

  rejectAuth = (args: unknown) => this?.rejectPromise(args);

  setIsOpen = (value: boolean) => {
    this.isOpen = value;
    for (const listener of this.listeners) {
      listener?.(value);
    }
  };

  addOnPromptOpenListener = (listener: (isOpen: boolean) => void) => {
    this.listeners = [...this.listeners, listener];
  };

  removeOnPromptOpenListener = (listener: (isOpen: boolean) => void) => {
    this.listeners = this.listeners.filter(l => l !== listener);
  };
}

type TwoFactorAuthPromptApi = {
  open: (options?: TwoFactorAuthPromptOptions) => Promise<TwoFactorAuthResult>;
  resolveAuth: (args: TwoFactorAuthCode) => void;
  rejectAuth: (args: unknown) => void;
  isOpen: boolean;
  supportedMethods?: string[];
  allowRecovery?: boolean;
  authenticationOptions?: TwoFactorAuthenticationOptions;
};

export type TwoFactorAuthContextValue = {
  prompt: TwoFactorAuthPromptApi;
  contextChanged?: number;
};

const TwoFactorAuthContext = React.createContext<TwoFactorAuthContextValue>({
  prompt: {
    // fallback stub: the real prompt is always provided by `TwoFactorAuthProvider`
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    open: async options => {
      return {
        code: '',
        type: '',
      };
    },
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    resolveAuth: result => {},
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
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

// used in Stories mdx
// ts-unused-exports:disable-next-line
export default function TwoFactorAuthProvider({ children }: { children?: React.ReactNode }) {
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
