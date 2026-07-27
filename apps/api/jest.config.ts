import type { Config } from 'jest';

const config: Config = {
  rootDir: 'src',
  testEnvironment: 'node',
  testRegex: '.*\\.spec\\.ts$',
  moduleFileExtensions: ['js', 'json', 'ts'],
  transform: {
    '^.+\\.ts$': ['ts-jest', { tsconfig: '<rootDir>/../tsconfig.json' }],
  },
  collectCoverageFrom: ['**/*.(t|j)s'],
  coveragePathIgnorePatterns: ['\\.module\\.ts$', '\\.dto\\.ts$', 'main\\.ts$'],
  coverageDirectory: '../coverage',
  clearMocks: true,
};

export default config;
