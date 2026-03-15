# Testing Guide

This guide covers the comprehensive test suite for the SearXNG Tools plugin.

## Test Framework

We use [Vitest](https://vitest.dev/) for testing with:
- **100% code coverage** requirement
- **v8** coverage provider
- **Node.js** test environment

## Running Tests

### Run all tests once
```bash
npm test
```

### Run tests in watch mode (development)
```bash
npm run test:watch
```

### Run tests with coverage report
```bash
npm run test:coverage
```

### Run tests with UI
```bash
npm run test:ui
```

## Test Structure

```
src/__tests__/
├── test-utils.ts           # Test utilities and mocks
├── searxng-client.test.ts  # SearXNG client tests
├── tools.test.ts           # All 7 tool tests
├── error-handling.test.ts  # Error message tests
├── cache.test.ts           # Caching functionality tests
└── plugin-init.test.ts     # Plugin initialization tests
```

## Test Coverage

Our test suite covers:

### 1. SearXNG Client Tests (`searxng-client.test.ts`)
- ✅ Initialization with default and custom config
- ✅ Search requests with correct URL construction
- ✅ Optional parameter handling
- ✅ Health check functionality
- ✅ Autocomplete functionality
- ✅ Error handling (HTTP errors, timeouts)
- ✅ Timeout configuration

### 2. Tool Tests (`tools.test.ts`)
All 7 tools tested:
- ✅ `web_search` - Parameter mapping, result formatting
- ✅ `image_search` - Tool definition, result formatting
- ✅ `news_search` - Tool definition, result formatting
- ✅ `video_search` - Tool definition, result formatting
- ✅ `technical_search` - IT category search
- ✅ `search_suggestions` - Suggestion formatting, empty handling
- ✅ `fetch_url` - URL validation, max_length handling

### 3. Error Handling Tests (`error-handling.test.ts`)
- ✅ Connection refused error detection
- ✅ Timeout error detection
- ✅ Setup instructions in error messages
- ✅ Documentation links in errors
- ✅ Plugin vs server separation messaging
- ✅ HTTP error code handling
- ✅ Safe search mapping errors
- ✅ URL validation errors

### 4. Cache Tests (`cache.test.ts`)
- ✅ Store and retrieve values
- ✅ Missing key handling
- ✅ Expired entry handling
- ✅ Valid entries before expiration
- ✅ Clear all entries
- ✅ Cache key generation
- ✅ TTL configuration
- ✅ Cache hit/miss scenarios

### 5. Plugin Initialization Tests (`plugin-init.test.ts`)
- ✅ Configuration loading
- ✅ Default values
- ✅ Tool registration (all 7 tools)
- ✅ Logging during initialization
- ✅ Hook registration
- ✅ Health check on startup
- ✅ Config validation

## Coverage Thresholds

We enforce 100% coverage across all metrics:

```typescript
// vitest.config.ts
coverage: {
  thresholds: {
    lines: 100,
    functions: 100,
    branches: 100,
    statements: 100,
  },
}
```

## Writing New Tests

### Test Template

```typescript
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { mockLogger, mockApi, resetAllMocks } from './test-utils';

describe('Feature Name', () => {
  beforeEach(() => {
    resetAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should do something specific', () => {
    // Arrange
    const input = 'test';
    
    // Act
    const result = functionUnderTest(input);
    
    // Assert
    expect(result).toBe('expected output');
  });
});
```

### Mocking fetch

```typescript
import { createMockFetchResponse } from './test-utils';

beforeEach(() => {
  global.fetch = vi.fn().mockResolvedValue(
    createMockFetchResponse({ data: 'test' })
  );
});
```

### Testing async functions

```typescript
it('should handle async operations', async () => {
  const result = await asyncFunction();
  expect(result).toBeDefined();
});
```

## Continuous Integration

Tests run automatically on:
- Push to `main` or `develop` branches
- Pull requests to `main`

Matrix testing across Node.js versions: 18.x, 20.x, 22.x

## Coverage Reports

Coverage reports are generated in multiple formats:
- **Terminal** - Text output
- **JSON** - `coverage/coverage-final.json`
- **HTML** - `coverage/index.html`
- **LCOV** - For Codecov integration

View HTML report locally:
```bash
npm run test:coverage
open coverage/index.html
```

## Best Practices

1. **Test behavior, not implementation** - Focus on what the code does, not how
2. **One assertion per test** - Keep tests focused and readable
3. **Use descriptive test names** - Clear descriptions help debugging
4. **Mock external dependencies** - Don't make real network calls
5. **Reset mocks between tests** - Prevent test pollution
6. **Aim for 100% coverage** - Every line, branch, and function

## Troubleshooting

### Tests failing locally

```bash
# Clear node_modules and reinstall
rm -rf node_modules package-lock.json
npm install

# Run tests with verbose output
npm test -- --reporter=verbose
```

### Coverage not 100%

Check the coverage report:
```bash
npm run test:coverage
```

Look for:
- Uncovered lines (red)
- Uncovered branches (yellow)
- Uncovered functions

Add tests for missing coverage.

### Mock issues

If mocks aren't working:
- Ensure `vi.clearAllMocks()` in `beforeEach`
- Ensure `vi.restoreAllMocks()` in `afterEach`
- Check mock setup is correct

## CI/CD Integration

The test suite runs in GitHub Actions with:
- Type checking
- Linting
- Unit tests
- Coverage reporting
- Build verification

See `.github/workflows/test.yml` for configuration.

## Contributing

When contributing:
1. Write tests for new features
2. Ensure all tests pass
3. Maintain 100% coverage
4. Update this documentation if needed

## Resources

- [Vitest Documentation](https://vitest.dev/)
- [Testing Best Practices](https://vitest.dev/guide/best-practices.html)
- [Mocking Guide](https://vitest.dev/guide/mocking.html)
