import React from 'react';

const VALID_ENVS = ['production', 'development', 'staging', 'test'] as const;
type EnvType = typeof VALID_ENVS[number];

export type OpenCollectiveConfig = {
  env: EnvType;
  apiKey: string;
  apiUrl: string;
  pdfServiceUrl: string;
  websiteUrl: string;
  restUrl: string;
};

const isValidEnv = (env: string): boolean => {
  return VALID_ENVS.includes(env as EnvType);
};

const OpenCollectiveConfigContext = React.createContext<OpenCollectiveConfig>({
  env: isValidEnv(process.env.OC_ENV) ? (process.env.OC_ENV as EnvType) : 'development',
  apiKey: process.env.API_KEY || '',
  apiUrl: process.env.API_URL || '',
  pdfServiceUrl: process.env.PDF_SERVICE_URL || '',
  websiteUrl: process.env.WEBSITE_URL || '',
  restUrl: process.env.REST_URL || '',
});

// Provider
export const OpenCollectiveConfigProvider = OpenCollectiveConfigContext.Provider;

// Consumers
export const useOpenCollectiveConfig = (): OpenCollectiveConfig => {
  return React.useContext(OpenCollectiveConfigContext);
};

export const withOpenCollectiveConfig = <P extends OpenCollectiveConfig>(
  Component: React.ComponentType<P>,
): React.FC<Omit<P, keyof OpenCollectiveConfig>> => {
  const WithOpenCollectiveConfig = (props: Omit<P, keyof OpenCollectiveConfig>) => {
    return <Component {...(props as P)} {...useOpenCollectiveConfig()} />;
  };

  WithOpenCollectiveConfig.getInitialProps = Component['getInitialProps'];

  return WithOpenCollectiveConfig;
};
