const nextJest = require('next/jest');

const createJestConfig = nextJest({ dir: './' });

module.exports = async () => {
  const nextConfig = await createJestConfig({
    setupFilesAfterEnv: ['<rootDir>/test/setup.ts'],
    testEnvironment: 'jsdom',
  })();

  // Override transformIgnorePatterns to include @scure, @otplib, @noble, and uuid packages
  // These packages use ES modules and need to be transformed
  nextConfig.transformIgnorePatterns = [
    '^.+\\.module\\.(css|sass|scss)$',
    'node_modules/(?!(@scure|@otplib|@noble|uuid)/)',
  ];

  // Map lodash-es to CJS lodash in the test environment to avoid ESM parse errors.
  // The second entry handles sub-path imports like `lodash-es/range`.
  nextConfig.moduleNameMapper = {
    ...nextConfig.moduleNameMapper,
    '^lodash-es$': '<rootDir>/node_modules/lodash',
    '^lodash-es/(.*)$': '<rootDir>/node_modules/lodash/$1',
  };

  return nextConfig;
};
