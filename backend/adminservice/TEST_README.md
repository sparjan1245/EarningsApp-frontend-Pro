# Test Suite Documentation

This document provides comprehensive information about the test suite for the Admin Service.

## 🧪 Test Overview

The test suite covers all aspects of the application including:
- **Unit Tests**: Individual service and controller methods
- **Integration Tests**: API endpoint testing with real HTTP requests
- **Pagination Tests**: Comprehensive testing of pagination functionality
- **Error Handling Tests**: Validation and error scenarios
- **Database Tests**: Prisma service interactions

## 📁 Test Structure

```
src/
├── stock/
│   ├── stock.service.spec.ts      # Stock service unit tests
│   └── stock.controller.spec.ts   # Stock controller unit tests
├── admin/
│   ├── admin.service.spec.ts      # Admin service unit tests
│   └── admin.controller.spec.ts   # Admin controller unit tests
└── test/
    ├── setup.ts                   # Test environment setup
    └── stock.e2e-spec.ts         # End-to-end API tests
```

## 🚀 Running Tests

### Quick Start
```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:cov

# Run end-to-end tests
npm run test:e2e

# Run comprehensive test suite (includes linting and type checking)
./scripts/run-tests.sh
```

### Individual Test Commands

```bash
# Unit tests only
npm test

# Unit tests with coverage report
npm run test:cov

# End-to-end tests only
npm run test:e2e

# Debug tests
npm run test:debug
```

## 📊 Test Coverage

### Stock Service Tests
- ✅ `getPaginated()` - Pagination with search and date filters
- ✅ `getTodayPaginated()` - Today's records with pagination
- ✅ `getYesterdayPaginated()` - Yesterday's records with pagination
- ✅ `getTomorrowPaginated()` - Tomorrow's records with pagination
- ✅ `getByDateRangePaginated()` - Date range queries with pagination
- ✅ `getBySpecificDatePaginated()` - Specific date queries with pagination
- ✅ `getByMonthPaginated()` - Month-based queries with pagination
- ✅ `getByQuarterPaginated()` - Quarter-based queries with pagination
- ✅ `addSingleRecord()` - Single record creation
- ✅ `updateRecord()` - Record updates with validation
- ✅ `deleteRecord()` - Record deletion
- ✅ `bulkDeleteRecords()` - Bulk deletion operations
- ✅ `searchRecords()` - Search functionality
- ✅ `getAllRecords()` - All records retrieval
- ✅ `getPublicPreview()` - Public preview functionality

### Stock Controller Tests
- ✅ `getPaginated()` - Main paginated endpoint
- ✅ `getAllRecords()` - All records endpoint
- ✅ `searchRecords()` - Search endpoint
- ✅ `getToday()` - Today's records endpoint
- ✅ `getYesterday()` - Yesterday's records endpoint
- ✅ `getTomorrow()` - Tomorrow's records endpoint
- ✅ `getThisWeek()` - This week's records endpoint
- ✅ `getNextWeek()` - Next week's records endpoint
- ✅ `getPublicPreview()` - Public preview endpoint
- ✅ `getByDateRange()` - Date range endpoint with validation
- ✅ `getBySpecificDate()` - Specific date endpoint with validation
- ✅ `getByMonth()` - Month endpoint with validation
- ✅ `getByQuarter()` - Quarter endpoint with validation
- ✅ `addRecord()` - Single record addition
- ✅ `bulkUpload()` - Bulk upload functionality
- ✅ `chunkedBulkUpload()` - Chunked bulk upload
- ✅ `deleteRecord()` - Record deletion
- ✅ `bulkDeleteRecords()` - Bulk deletion with validation
- ✅ `updateRecord()` - Record updates

### Admin Service Tests
- ✅ `getAllUsersPaginated()` - User pagination
- ✅ `setRoleByEmail()` - Role management
- ✅ `getAllUsers()` - All users retrieval
- ✅ `getLoginActivity()` - Login activity tracking

### Admin Controller Tests
- ✅ `getAllUsers()` - User listing with pagination
- ✅ `promoteToAdmin()` - User promotion
- ✅ `demoteToUser()` - User demotion
- ✅ `setUserRole()` - Role setting
- ✅ `getLoginActivity()` - Activity tracking

### End-to-End Tests
- ✅ Pagination functionality across all endpoints
- ✅ Search functionality
- ✅ Date filtering
- ✅ CRUD operations
- ✅ Validation and error handling
- ✅ API response structure validation

## 🔧 Test Configuration

### Jest Configuration
- **Unit Tests**: `jest.config.js`
- **E2E Tests**: `test/jest-e2e.json`
- **Coverage**: Generated in `coverage/` directory

### Test Environment
- **Database**: Uses test database configuration
- **Mocking**: Comprehensive mocking of external dependencies
- **Setup**: Global test setup in `src/test/setup.ts`

## 📈 Coverage Reports

After running `npm run test:cov`, coverage reports are generated in:
- **HTML**: `coverage/lcov-report/index.html`
- **JSON**: `coverage/coverage-final.json`
- **LCOV**: `coverage/lcov.info`

## 🐛 Debugging Tests

### Debug Mode
```bash
npm run test:debug
```

### Individual Test Debugging
```bash
# Debug specific test file
npm test -- --testNamePattern="StockService"

# Debug with verbose output
npm test -- --verbose

# Debug specific test case
npm test -- --testNamePattern="should return paginated results"
```

## 🔍 Test Patterns

### Pagination Testing
All pagination tests verify:
- Correct data structure with `data` and `pagination` properties
- Accurate pagination metadata (currentPage, pageSize, total, etc.)
- Proper skip/take calculations
- Navigation flags (hasNextPage, hasPrevPage)
- Start/end index calculations

### Error Handling Testing
Error tests verify:
- Proper HTTP status codes
- Validation error messages
- Exception handling
- Input sanitization

### Mock Testing
Mock tests ensure:
- Service method calls with correct parameters
- Database query construction
- Response transformation
- Error propagation

## 🚨 Common Issues

### Database Connection
If tests fail due to database connection:
1. Ensure test database is running
2. Check environment variables
3. Verify Prisma schema

### TypeScript Errors
If TypeScript compilation fails:
1. Run `npm run lint` to check for issues
2. Verify all imports are correct
3. Check Jest configuration

### Test Timeouts
If tests timeout:
1. Increase Jest timeout in configuration
2. Check for hanging database connections
3. Verify mock cleanup

## 📝 Adding New Tests

### Unit Test Template
```typescript
describe('ServiceName', () => {
  let service: ServiceName;
  let mockDependency: MockType;

  beforeEach(async () => {
    // Setup
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('methodName', () => {
    it('should do something', async () => {
      // Arrange
      // Act
      // Assert
    });
  });
});
```

### E2E Test Template
```typescript
describe('ControllerName (e2e)', () => {
  let app: INestApplication;

  beforeEach(async () => {
    // Setup
  });

  afterEach(async () => {
    await app.close();
  });

  describe('/endpoint (METHOD)', () => {
    it('should do something', () => {
      return request(app.getHttpServer())
        .method('/endpoint')
        .expect(200)
        .expect((res) => {
          // Assertions
        });
    });
  });
});
```

## 🎯 Best Practices

1. **Test Isolation**: Each test should be independent
2. **Mock External Dependencies**: Don't rely on external services
3. **Clear Test Names**: Use descriptive test names
4. **Arrange-Act-Assert**: Follow AAA pattern
5. **Coverage**: Aim for high test coverage
6. **Error Scenarios**: Test both success and failure cases
7. **Validation**: Test input validation thoroughly
8. **Pagination**: Test all pagination scenarios

## 📞 Support

For test-related issues:
1. Check this documentation
2. Review Jest documentation
3. Check test logs for specific errors
4. Verify test environment setup 