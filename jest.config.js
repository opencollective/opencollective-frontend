const nextJest = require('next/jest');

const createJestConfig = nextJest({ dir: './' });

module.exports = async () => {
  const nextConfig = await createJestConfig({
    setupFilesAfterEnv: ['<rootDir>/test/setup.ts'],
    testEnvironment: 'jsdom',
  })();

  // Override transformIgnorePatterns to include ESM-only packages that need to be transformed.
  // `(?:.+/)?` covers nested copies (e.g. sanitize-html → htmlparser2@12).
  nextConfig.transformIgnorePatterns = [
    '^.+\\.module\\.(css|sass|scss)$',
    'node_modules/(?!(?:.+/)?(?:@scure|@otplib|@noble|uuid|react-intl|intl-messageformat|@formatjs|cookie|htmlparser2|domhandler|domutils|domelementtype|entities|dom-serializer)/)',
  ];

  // Map lodash-es to CJS lodash in the test environment to avoid ESM parse errors.
  // The second entry handles sub-path imports like `lodash-es/range`.
  nextConfig.moduleNameMapper = {
    ...nextConfig.moduleNameMapper,
    '^@/(.*)$': '<rootDir>/$1',
    '^lodash-es$': '<rootDir>/node_modules/lodash',
    '^lodash-es/(.*)$': '<rootDir>/node_modules/lodash/$1',
  };

  return nextConfig;
};
