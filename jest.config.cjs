module.exports = {
  
  preset: 'ts-jest/presets/default-esm', // for TS + ESM

  testEnvironment: "node",
  
  //maxWorkers: 1, // Run tests serially, not in parallel
  maxWorkers: '100%',
  
  // Updated ts-jest configuration (new syntax)
  transform: {
    '^.+\\.ts$': ['ts-jest', {
      tsconfig: 'tsconfig.jest.json',
      useESM: true
    }]
  },

  moduleNameMapper: {
    "^@/(.*)$": "<rootDir>/src/$1",
    "keycloak-public-key": "<rootDir>/src/tests/__mocks__/keycloak-public-key.js",
    "^@keycloak/keycloak-admin-client$": "<rootDir>/src/tests/__mocks__/keycloak-admin-client.js",
    "^@keycloak/keycloak-admin-client/lib/utils/auth$": "<rootDir>/src/tests/__mocks__/keycloak-admin-auth.js"
  },

  testMatch: ["**/tests/**/*.test.ts"], // optional, matches your test files
  
  roots: ["<rootDir>/src"],

  collectCoverage: true,
  coverageProvider: "v8",

  collectCoverageFrom: [
    "src/**/*.ts",
    "!src/**/*.test.ts",
    "!src/**/index.ts",
    "!src/**/types.ts"
  ],

  coverageDirectory: "coverage",

  coverageReporters: ["text", "html", "lcov"],

  // Handle ESM modules that Jest has trouble with
  extensionsToTreatAsEsm: ['.ts'],
  
  // Transform node_modules that use ESM
  transformIgnorePatterns: [
    'node_modules/(?!(yaml|jsonwebtoken|keycloak-public-key)/)'
  ]
};
