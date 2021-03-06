module.exports = {
  displayName: 'component-model-survey-response',
  rootDir: '../',
  setupTestFrameworkScriptFile: '<rootDir>/config/jest-setup.server.js',
  testMatch: ['<rootDir>/**/*.test.js'],
  transform: {}, // turn off babel for server code
  transformIgnorePatterns: ['/node_modules/(?!@?pubsweet)'],
  testEnvironment: 'node',
}
