# Comprehensive Testing Guide - Admin Service

This document provides a complete guide to testing the Admin Service, including unit tests, integration tests, end-to-end tests, and performance tests.

## Table of Contents

1. [Overview](#overview)
2. [Test Structure](#test-structure)
3. [Running Tests](#running-tests)
4. [Test Types](#test-types)
5. [Test Coverage](#test-coverage)
6. [Best Practices](#best-practices)
7. [Test Utilities](#test-utilities)
8. [Troubleshooting](#troubleshooting)

## Overview

The Admin Service uses Jest as the primary testing framework with comprehensive coverage for:

- **Unit Tests**: Testing individual functions and methods
- **Integration Tests**: Testing service interactions
- **End-to-End Tests**: Testing complete API endpoints
- **Performance Tests**: Testing response times and load handling
- **Security Tests**: Testing for common vulnerabilities

## Test Structure

```
src/
├── test/
│   ├── setup.ts                 # Global test setup
│   ├── integration-setup.ts     # Integration test setup
│   ├── e2e-setup.ts            # E2E test setup
│   ├── env-setup.ts            # Environment setup
│   ├── global-setup.ts         # Global setup
│   ├── global-teardown.ts      # Global teardown
│   └── test-utils.ts           # Common test utilities
├── **/*.spec.ts                # Unit tests
├── **/*.integration-spec.ts    # Integration tests
└── **/*.e2e-spec.ts           # E2E tests

test/
├── admin.e2e-spec.ts          # Admin E2E tests
└── stock.e2e-spec.ts          # Stock E2E tests

scripts/
└── run-tests.sh               # Test runner script
```

## Running Tests

### Quick Start

```bash
# Run all tests
npm test

# Run tests with coverage
npm run test:cov

# Run specific test types
npm run test:unit
npm run test:integration
npm run test:e2e

# Run tests in watch mode
npm run test:watch

# Run tests with verbose output
npm run test:verbose
```

### Using the Test Script

```bash
# Run all tests
./scripts/run-tests.sh

# Run specific test types
./scripts/run-tests.sh unit
./scripts/run-tests.sh integration
./scripts/run-tests.sh e2e
./scripts/run-tests.sh performance
./scripts/run-tests.sh security
```

### Docker-based Testing

```bash
# Run tests in Docker container
docker-compose -f docker-compose.test.yml up --abort-on-container-exit

# Run tests with specific environment
docker-compose -f docker-compose.test.yml run --rm test npm test
```

## Test Types

### 1. Unit Tests

Unit tests focus on testing individual functions and methods in isolation.

**Location**: `src/**/*.spec.ts`

**Example**:
```typescript
describe('StockService', () => {
  let service: StockService;
  let prismaService: PrismaService;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [
        StockService,
        {
          provide: PrismaService,
          useValue: createMockPrismaService(),
        },
      ],
    }).compile();

    service = module.get<StockService>(StockService);
    prismaService = module.get<PrismaService>(PrismaService);
  });

  it('should return paginated results', async () => {
    const mockResult = createMockPaginatedResponse([], 0);
    jest.spyOn(prismaService.financialRecord, 'findMany').mockResolvedValue([]);
    jest.spyOn(prismaService.financialRecord, 'count').mockResolvedValue(0);

    const result = await service.getPaginated(1, 25);

    expect(result).toEqual(mockResult);
  });
});
```

### 2. Integration Tests

Integration tests focus on testing service interactions and database operations.

**Location**: `src/**/*.integration-spec.ts`

**Example**:
```typescript
describe('StockService Integration', () => {
  let app: INestApplication;
  let prismaService: PrismaService;

  beforeAll(async () => {
    const moduleFixture = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();

    prismaService = app.get<PrismaService>(PrismaService);
  });

  beforeEach(async () => {
    // Clean database before each test
    await prismaService.financialRecord.deleteMany();
  });

  it('should create and retrieve a record', async () => {
    const record = createMockFinancialRecord();
    
    const created = await prismaService.financialRecord.create({
      data: record,
    });

    const retrieved = await prismaService.financialRecord.findFirst({
      where: { id: created.id },
    });

    expect(retrieved).toEqual(created);
  });
});
```

### 3. End-to-End Tests

E2E tests focus on testing complete API endpoints and workflows.

**Location**: `test/**/*.e2e-spec.ts`

**Example**:
```typescript
describe('StockController (e2e)', () => {
  let app: INestApplication;

  beforeEach(async () => {
    const moduleFixture = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  it('/api/stock (GET) should return paginated results', () => {
    return request(app.getHttpServer())
      .get('/api/stock?page=1&pageSize=5')
      .expect(200)
      .expect((res) => {
        expect(res.body).toHaveProperty('data');
        expect(res.body).toHaveProperty('pagination');
      });
  });
});
```

### 4. Performance Tests

Performance tests focus on testing response times and load handling.

**Example**:
```typescript
describe('Performance Tests', () => {
  it('should handle large datasets efficiently', async () => {
    const startTime = Date.now();
    
    const response = await request(app.getHttpServer())
      .get('/api/stock?page=1&pageSize=1000')
      .expect(200);

    const endTime = Date.now();
    const responseTime = endTime - startTime;

    expect(responseTime).toBeLessThan(1000); // Should respond within 1 second
  });
});
```

### 5. Security Tests

Security tests focus on testing for common vulnerabilities.

**Example**:
```typescript
describe('Security Tests', () => {
  it('should handle SQL injection attempts', () => {
    return request(app.getHttpServer())
      .get('/api/stock/search?q=%27%3B%20DROP%20TABLE%20users%3B%20--')
      .expect(200)
      .expect((res) => {
        expect(Array.isArray(res.body)).toBe(true);
      });
  });

  it('should handle XSS attempts', () => {
    return request(app.getHttpServer())
      .get('/api/stock/search?q=<script>alert("xss")</script>')
      .expect(200)
      .expect((res) => {
        expect(Array.isArray(res.body)).toBe(true);
      });
  });
});
```

## Test Coverage

### Coverage Requirements

- **Lines**: 80% minimum
- **Functions**: 80% minimum
- **Branches**: 80% minimum
- **Statements**: 80% minimum

### Coverage Reports

Coverage reports are generated in multiple formats:

- **HTML**: `coverage/lcov-report/index.html`
- **LCOV**: `coverage/lcov.info`
- **JSON**: `coverage/coverage-final.json`
- **Cobertura**: `coverage/cobertura-coverage.xml`

### Viewing Coverage

```bash
# Open HTML coverage report
open coverage/lcov-report/index.html

# View coverage summary
npm run test:cov -- --coverageReporters=text-summary
```

## Best Practices

### 1. Test Organization

- Group related tests using `describe` blocks
- Use descriptive test names that explain the expected behavior
- Follow the AAA pattern: Arrange, Act, Assert

### 2. Mocking

- Mock external dependencies (databases, APIs, etc.)
- Use `jest.spyOn()` for method mocking
- Create reusable mock factories

### 3. Test Data

- Use factory functions to create test data
- Avoid hardcoded test data
- Clean up test data after each test

### 4. Async Testing

- Always await async operations
- Use `done` callback for complex async scenarios
- Set appropriate timeouts for long-running tests

### 5. Error Testing

- Test both success and error scenarios
- Verify error messages and status codes
- Test edge cases and boundary conditions

### 6. Database Testing

- Use test database for integration tests
- Clean up data between tests
- Use transactions for test isolation

## Test Utilities

### Mock Factories

```typescript
// Create mock PrismaService
export const createMockPrismaService = () => ({
  financialRecord: {
    findMany: jest.fn(),
    findFirst: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    deleteMany: jest.fn(),
    upsert: jest.fn(),
    count: jest.fn(),
  },
  // ... other models
});

// Create mock data
export const createMockFinancialRecord = (overrides = {}) => ({
  id: '1',
  ticker: 'AAPL',
  companyName: 'Apple Inc.',
  // ... other fields
  ...overrides,
});
```

### Helper Functions

```typescript
// Wait for async operations
export const waitFor = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// Validate UUID
export const isValidUUID = (uuid: string) => {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(uuid);
};

// Create test exceptions
export const createBadRequestException = (message: string) => {
  const { BadRequestException } = require('@nestjs/common');
  return new BadRequestException(message);
};
```

## Troubleshooting

### Common Issues

1. **Test Timeout**
   ```bash
   # Increase timeout in jest.config.js
   testTimeout: 30000
   ```

2. **Database Connection Issues**
   ```bash
   # Ensure test database is running
   docker-compose -f docker-compose.test.yml up -d postgres
   ```

3. **Mock Issues**
   ```bash
   # Clear mocks between tests
   beforeEach(() => {
     jest.clearAllMocks();
   });
   ```

4. **Coverage Issues**
   ```bash
   # Check coverage configuration
   npm run test:cov -- --verbose
   ```

### Debug Mode

```bash
# Run tests in debug mode
npm run test:debug

# Run specific test in debug mode
npm run test -- --testNamePattern="should create record"
```

### Continuous Integration

The test suite is configured to run in CI/CD pipelines:

```yaml
# .github/workflows/test.yml
- name: Run Tests
  run: |
    npm install
    npm run test:cov
    npm run test:e2e
```

## Test Commands Reference

| Command | Description |
|---------|-------------|
| `npm test` | Run all tests |
| `npm run test:cov` | Run tests with coverage |
| `npm run test:watch` | Run tests in watch mode |
| `npm run test:debug` | Run tests in debug mode |
| `npm run test:e2e` | Run end-to-end tests |
| `npm run test:integration` | Run integration tests |
| `npm run test:unit` | Run unit tests only |
| `npm run test:verbose` | Run tests with verbose output |

## Contributing

When adding new tests:

1. Follow the existing test structure
2. Use descriptive test names
3. Add appropriate coverage
4. Update this documentation if needed
5. Ensure all tests pass before submitting

## Resources

- [Jest Documentation](https://jestjs.io/docs/getting-started)
- [NestJS Testing](https://docs.nestjs.com/fundamentals/testing)
- [Supertest Documentation](https://github.com/visionmedia/supertest)
- [Testing Best Practices](https://github.com/goldbergyoni/javascript-testing-best-practices) 