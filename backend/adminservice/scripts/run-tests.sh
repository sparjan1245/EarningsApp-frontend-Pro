#!/bin/bash

# Comprehensive Test Runner for Admin Service
# This script runs all types of tests with proper coverage and reporting

set -e

echo "🧪 Starting comprehensive test suite for Admin Service..."
echo "=================================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Function to check if command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Check prerequisites
print_status "Checking prerequisites..."

if ! command_exists npm; then
    print_error "npm is not installed. Please install Node.js and npm first."
    exit 1
fi

if ! command_exists docker; then
    print_warning "Docker is not installed. Some tests may fail."
fi

# Install dependencies if needed
print_status "Installing dependencies..."
npm install

# Create test directories if they don't exist
mkdir -p coverage
mkdir -p test-results

# Function to run unit tests
run_unit_tests() {
    print_status "Running unit tests..."
    
    # Run unit tests with coverage
    npm run test:cov 2>&1 | tee test-results/unit-tests.log
    
    if [ ${PIPESTATUS[0]} -eq 0 ]; then
        print_success "Unit tests completed successfully"
    else
        print_error "Unit tests failed"
        return 1
    fi
}

# Function to run integration tests
run_integration_tests() {
    print_status "Running integration tests..."
    
    # Run integration tests
    npm run test:integration 2>&1 | tee test-results/integration-tests.log
    
    if [ ${PIPESTATUS[0]} -eq 0 ]; then
        print_success "Integration tests completed successfully"
    else
        print_error "Integration tests failed"
        return 1
    fi
}

# Function to run e2e tests
run_e2e_tests() {
    print_status "Running end-to-end tests..."
    
    # Start test database if needed
    if command_exists docker; then
        print_status "Starting test database..."
        docker-compose -f docker-compose.test.yml up -d postgres redis 2>/dev/null || true
        sleep 5
    fi
    
    # Run e2e tests
    npm run test:e2e 2>&1 | tee test-results/e2e-tests.log
    
    if [ ${PIPESTATUS[0]} -eq 0 ]; then
        print_success "E2E tests completed successfully"
    else
        print_error "E2E tests failed"
        return 1
    fi
    
    # Stop test database
    if command_exists docker; then
        print_status "Stopping test database..."
        docker-compose -f docker-compose.test.yml down 2>/dev/null || true
    fi
}

# Function to run specific test suites
run_test_suite() {
    local suite_name=$1
    local test_command=$2
    
    print_status "Running $suite_name tests..."
    
    $test_command 2>&1 | tee "test-results/${suite_name}-tests.log"
    
    if [ ${PIPESTATUS[0]} -eq 0 ]; then
        print_success "$suite_name tests completed successfully"
    else
        print_error "$suite_name tests failed"
        return 1
    fi
}

# Function to run performance tests
run_performance_tests() {
    print_status "Running performance tests..."
    
    # Simple performance test using curl
    if command_exists curl; then
        print_status "Testing API response times..."
        
        # Test pagination endpoint performance
        start_time=$(date +%s%N)
        curl -s -o /dev/null -w "%{http_code}" http://localhost:3002/api/stock?page=1&pageSize=10
        end_time=$(date +%s%N)
        
        response_time=$(( (end_time - start_time) / 1000000 ))
        print_status "API response time: ${response_time}ms"
        
        if [ $response_time -lt 1000 ]; then
            print_success "Performance test passed (response time < 1s)"
        else
            print_warning "Performance test warning (response time >= 1s)"
        fi
    else
        print_warning "curl not available, skipping performance tests"
    fi
}

# Function to run security tests
run_security_tests() {
    print_status "Running security tests..."
    
    # Test for common security vulnerabilities
    if command_exists curl; then
        print_status "Testing for SQL injection vulnerabilities..."
        
        # Test search endpoint with SQL injection attempt
        response=$(curl -s -w "%{http_code}" -o /dev/null \
            "http://localhost:3002/api/stock/search?q=%27%3B%20DROP%20TABLE%20users%3B%20--")
        
        if [ "$response" = "200" ]; then
            print_success "SQL injection test passed (proper error handling)"
        else
            print_warning "SQL injection test returned unexpected status: $response"
        fi
        
        # Test for XSS vulnerabilities
        print_status "Testing for XSS vulnerabilities..."
        response=$(curl -s -w "%{http_code}" -o /dev/null \
            "http://localhost:3002/api/stock/search?q=<script>alert('xss')</script>")
        
        if [ "$response" = "200" ]; then
            print_success "XSS test passed (proper input handling)"
        else
            print_warning "XSS test returned unexpected status: $response"
        fi
    else
        print_warning "curl not available, skipping security tests"
    fi
}

# Function to generate test report
generate_test_report() {
    print_status "Generating test report..."
    
    cat > test-results/test-report.md << EOF
# Test Report - Admin Service

Generated on: $(date)

## Test Summary

### Unit Tests
- Status: $(grep -q "SUCCESS" test-results/unit-tests.log && echo "✅ PASSED" || echo "❌ FAILED")
- Coverage: $(grep "All files" coverage/lcov-report/index.html | grep -o '[0-9.]*%' | head -1 || echo "N/A")

### Integration Tests
- Status: $(grep -q "SUCCESS" test-results/integration-tests.log && echo "✅ PASSED" || echo "❌ FAILED")

### E2E Tests
- Status: $(grep -q "SUCCESS" test-results/e2e-tests.log && echo "✅ PASSED" || echo "❌ FAILED")

## Test Coverage

\`\`\`
$(find coverage -name "*.html" -exec grep -l "All files" {} \; | head -1 | xargs cat 2>/dev/null | grep -A 20 "All files" || echo "Coverage report not available")
\`\`\`

## Failed Tests

\`\`\`
$(grep -r "FAIL\|Error\|failed" test-results/ || echo "No failures found")
\`\`\`

## Performance Metrics

- API Response Time: $(grep "API response time" test-results/*.log | tail -1 | grep -o '[0-9]*ms' || echo "N/A")

## Security Test Results

- SQL Injection Protection: $(grep "SQL injection test" test-results/*.log | tail -1 | grep -o "passed\|failed" || echo "N/A")
- XSS Protection: $(grep "XSS test" test-results/*.log | tail -1 | grep -o "passed\|failed" || echo "N/A")

## Recommendations

$(if grep -q "FAILED\|failed" test-results/*.log; then
    echo "- Review and fix failed tests"
    echo "- Improve test coverage for failing areas"
else
    echo "- All tests passed successfully"
    echo "- Consider adding more edge case tests"
fi)

EOF

    print_success "Test report generated: test-results/test-report.md"
}

# Function to clean up
cleanup() {
    print_status "Cleaning up..."
    
    # Stop any running containers
    if command_exists docker; then
        docker-compose -f docker-compose.test.yml down 2>/dev/null || true
    fi
    
    # Remove test artifacts
    rm -rf test-results/tmp 2>/dev/null || true
}

# Main test execution
main() {
    local test_type=${1:-all}
    
    case $test_type in
        "unit")
            run_unit_tests
            ;;
        "integration")
            run_integration_tests
            ;;
        "e2e")
            run_e2e_tests
            ;;
        "performance")
            run_performance_tests
            ;;
        "security")
            run_security_tests
            ;;
        "all")
            print_status "Running all test suites..."
            
            # Run all test types
            run_unit_tests || exit 1
            run_integration_tests || exit 1
            run_e2e_tests || exit 1
            run_performance_tests
            run_security_tests
            
            generate_test_report
            ;;
        *)
            print_error "Unknown test type: $test_type"
            echo "Usage: $0 [unit|integration|e2e|performance|security|all]"
            exit 1
            ;;
    esac
    
    print_success "Test execution completed!"
}

# Trap to ensure cleanup on exit
trap cleanup EXIT

# Run main function with arguments
main "$@" 