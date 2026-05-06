const nextJest = require('next/jest');

const createJestConfig = nextJest({ dir: './' });

module.exports = async () => {
  const nextConfig = await createJestConfig({
    setupFilesAfterEnv: ['<rootDir>/test/setup.ts'],
    testEnvironment: 'jsdom',
  })();

  // Override transformIgnorePatterns to include @scure, @otplib, @noble, uuid, react-intl, and @formatjs packages
  // These packages use ES modules and need to be transformed
  nextConfig.transformIgnorePatterns = [
    '^.+\\.module\\.(css|sass|scss)$',
    'node_modules/(?!(@scure|@otplib|@noble|uuid|react-intl|intl-messageformat|@formatjs)/)',
  ];

  return nextConfig;
};
