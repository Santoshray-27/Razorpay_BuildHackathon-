/**
 * backend/jest.config.js
 * Jest test runner configuration for ESM Node environment.
 */

export default {
  testEnvironment: 'node',
  transform: {},
  testTimeout: 20000,
  verbose: true,
  roots: ['<rootDir>/tests']
};
