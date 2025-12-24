module.exports = {
  // Test environment
  testEnvironment: 'node',
  
  // Test file patterns
  testMatch: [
    '**/__tests__/**/*.ts',
    '**/?(*.)+(spec|test).ts',
    '**/src/**/*.spec.ts',
    '**/src/**/*.test.ts',
  ],
  
  // Test file extensions
  moduleFileExtensions: ['js', 'json', 'ts'],
  
  // Root directory
  rootDir: '.',
  
  // Coverage configuration
  collectCoverage: true,
  collectCoverageFrom: [
    'src/**/*.ts',
    '!src/**/*.dto.ts',
    '!src/**/*.entity.ts',
    '!src/**/*.interface.ts',
    '!src/**/*.enum.ts',
    '!src/**/*.decorator.ts',
    '!src/**/*.guard.ts',
    '!src/**/*.strategy.ts',
    '!src/**/*.module.ts',
    '!src/main.ts',
    '!src/test/**',
    '!src/**/index.ts',
    '!src/**/*.spec.ts',
    '!src/**/*.test.ts',
  ],
  
  // Coverage thresholds
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80,
    },
  },
  
  // Coverage reporters
  coverageReporters: [
    'text',
    'text-summary',
    'lcov',
    'html',
    'json',
  ],
  
  // Coverage directory
  coverageDirectory: 'coverage',
  
  // Setup files
  setupFilesAfterEnv: ['<rootDir>/src/test/setup.ts'],
  
  // Test timeout
  testTimeout: 30000,
  
  // Verbose output
  verbose: true,
  
  // Clear mocks between tests
  clearMocks: true,
  
  // Restore mocks between tests
  restoreMocks: true,
  
  // Reset modules between tests
  resetModules: true,
  
  // Transform configuration
  transform: {
    '^.+\\.(t|j)s$': 'ts-jest',
  },
  
  // Module name mapping
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
  },
  
  // Test path ignore patterns
  testPathIgnorePatterns: [
    '/node_modules/',
    '/dist/',
    '/coverage/',
    '/.git/',
  ],
  
  // Force exit
  forceExit: true,
  
  // Detect open handles
  detectOpenHandles: true,
  
  // Max workers
  maxWorkers: '50%',
  
  // Coverage provider
  coverageProvider: 'v8',
  
  // Extensions to treat as ES modules
  extensionsToTreatAsEsm: ['.ts'],
  
  // Globals
  globals: {
    'ts-jest': {
      useESM: false,
      tsconfig: 'tsconfig.json',
    },
  },
}; 