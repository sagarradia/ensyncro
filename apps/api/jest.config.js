/**
 * Jest config for the NestJS API. Unit tests live next to the code as
 * `*.spec.ts` under src/ (build already excludes them from dist).
 * @type {import('jest').Config}
 */
module.exports = {
  testEnvironment: 'node',
  rootDir: 'src',
  testRegex: '.*\\.spec\\.ts$',
  moduleFileExtensions: ['ts', 'js', 'json'],
  transform: {
    '^.+\\.ts$': ['ts-jest', { tsconfig: '<rootDir>/../tsconfig.json' }],
  },
};
