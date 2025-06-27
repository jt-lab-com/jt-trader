// /** @type {import('ts-jest').JestConfigWithTsJest} */
// module.exports = {
//   preset: 'ts-jest',
//   testEnvironment: 'node',
// };
//
//

import type { Config } from 'jest';

const config: Config = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  testRegex: '(/__tests__/.*|(\\.|/)(spec))\\.[jt]sx?$',
  collectCoverage: false,
  setupFiles: ['./jest.setup.js'],
  globals: {
    ARGS: {},
  },
};

export default config;
