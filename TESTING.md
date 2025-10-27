# 🧪 MEDIX Testing Guide

This document provides comprehensive information about the testing setup for the MEDIX project, including both frontend and backend testing strategies.

## 📋 Table of Contents

- [Overview](#overview)
- [Frontend Testing](#frontend-testing)
- [Backend Testing](#backend-testing)
- [Running Tests](#running-tests)
- [Coverage Reports](#coverage-reports)
- [CI/CD Integration](#cicd-integration)
- [Best Practices](#best-practices)

## 🎯 Overview

MEDIX implements a comprehensive testing strategy with:

- **Frontend**: React + TypeScript with Vitest, React Testing Library, and MSW
- **Backend**: ASP.NET Core 8 with xUnit, Moq, FluentAssertions, and InMemory Database
- **Coverage Target**: 85%+ for both frontend and backend
- **Test Types**: Unit Tests, Integration Tests, and End-to-End flows

## 🚀 Frontend Testing

### Tech Stack
- **Test Runner**: Vitest
- **Testing Library**: React Testing Library
- **Mocking**: MSW (Mock Service Worker)
- **Assertions**: Jest DOM matchers
- **Coverage**: V8 coverage provider

### Project Structure
```
frontend/
├── tests/
│   ├── unit/                 # Unit tests for components, hooks, utils
│   │   ├── components/       # Component tests
│   │   ├── contexts/         # Context tests
│   │   └── utils/            # Utility function tests
│   ├── integration/          # Integration tests for user flows
│   │   └── auth/             # Authentication flow tests
│   ├── mocks/                # MSW handlers and server setup
│   └── utils/                # Test utilities and helpers
├── vitest.config.ts          # Vitest configuration
└── tests/setupTests.ts       # Test setup and global mocks
```

### Key Features
- **Component Testing**: Tests all UI components with user interactions
- **Hook Testing**: Tests custom React hooks
- **Context Testing**: Tests React context providers
- **API Mocking**: MSW for realistic API responses
- **Coverage Reporting**: HTML, LCOV, and JSON formats

### Example Test
```typescript
// tests/unit/components/Button.test.tsx
import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import { Button } from '@/components/ui/Button'

describe('Button Component', () => {
  it('renders with default props', () => {
    render(<Button>Click me</Button>)
    
    const button = screen.getByRole('button', { name: /click me/i })
    expect(button).toBeInTheDocument()
    expect(button).toHaveClass('bg-blue-600', 'text-white')
  })
})
```

## 🔧 Backend Testing

### Tech Stack
- **Test Framework**: xUnit
- **Mocking**: Moq
- **Assertions**: FluentAssertions
- **Database**: InMemory Database for integration tests
- **Coverage**: Coverlet collector

### Project Structure
```
backend/
├── Medix.API.Tests.Unit/           # Unit test project
│   └── Services/                    # Service layer tests
├── Medix.API.Tests.Integration/    # Integration test project
│   ├── Controllers/                 # Controller integration tests
│   └── BaseIntegrationTest.cs      # Base class for integration tests
├── Medix.runsettings               # Coverage configuration
└── Medix.sln                       # Solution file with test projects
```

### Key Features
- **Service Testing**: Unit tests for business logic with mocked dependencies
- **Controller Testing**: Integration tests for API endpoints
- **Database Testing**: InMemory database for realistic data scenarios
- **Authentication Testing**: JWT token validation and user management
- **Coverage Reporting**: LCOV, OpenCover, and Cobertura formats

### Example Test
```csharp
// Medix.API.Tests.Unit/Services/AuthServiceTests.cs
[Fact]
public async Task LoginAsync_WithValidCredentials_ShouldReturnAuthResponse()
{
    // Arrange
    var loginRequest = new LoginRequestDto
    {
        Identifier = "test@example.com",
        Password = "password123"
    };
    
    var user = new User { /* ... */ };
    _userRepositoryMock.Setup(x => x.GetByEmailAsync(loginRequest.Identifier))
        .ReturnsAsync(user);
    
    // Act
    var result = await _authService.LoginAsync(loginRequest);
    
    // Assert
    result.Should().NotBeNull();
    result.AccessToken.Should().NotBeNullOrEmpty();
    result.User.Email.Should().Be("test@example.com");
}
```

## 🏃‍♂️ Running Tests

### Quick Start
```bash
# Run all tests (both frontend and backend)
./run-tests.sh          # Linux/Mac
.\run-tests.ps1         # Windows PowerShell

# Or run individually:
cd frontend && npm run test:coverage
cd backend && dotnet test --collect:"XPlat Code Coverage"
```

### Frontend Commands
```bash
cd frontend

# Run tests once with coverage
npm run test

# Run tests in watch mode
npm run test:watch

# Run tests with UI
npm run test:ui

# Run tests with detailed coverage
npm run test:coverage
```

### Backend Commands
```bash
cd backend

# Run all tests
dotnet test

# Run unit tests only
dotnet test Medix.API.Tests.Unit

# Run integration tests only
dotnet test Medix.API.Tests.Integration

# Run with coverage
dotnet test --collect:"XPlat Code Coverage" --settings Medix.runsettings

# Run specific test class
dotnet test --filter "ClassName=AuthServiceTests"
```

## 📊 Coverage Reports

### Frontend Coverage
- **Location**: `frontend/coverage/`
- **Formats**: HTML, LCOV, JSON
- **Target**: 85%+ coverage
- **View**: Open `frontend/coverage/lcov-report/index.html` in browser

### Backend Coverage
- **Location**: `backend/TestResults/`
- **Formats**: LCOV, OpenCover, Cobertura
- **Target**: 85%+ coverage
- **View**: Use tools like ReportGenerator or Visual Studio

### Coverage Thresholds
```typescript
// vitest.config.ts
coverage: {
  thresholds: {
    global: {
      branches: 85,
      functions: 85,
      lines: 85,
      statements: 85
    }
  }
}
```

## 🔄 CI/CD Integration

### GitHub Actions
The project includes a comprehensive GitHub Actions workflow (`.github/workflows/test.yml`) that:

1. **Frontend Tests**:
   - Sets up Node.js 18
   - Installs dependencies
   - Runs tests with coverage
   - Uploads coverage to Codecov

2. **Backend Tests**:
   - Sets up .NET 8
   - Restores dependencies
   - Runs unit and integration tests
   - Uploads coverage to Codecov

3. **Test Summary**:
   - Provides overall test status
   - Links to coverage reports

### Local Development
```bash
# Install dependencies
cd frontend && npm install
cd backend && dotnet restore

# Run tests before committing
./run-tests.sh
```

## 📚 Best Practices

### Frontend Testing
1. **Test User Behavior**: Focus on what users can see and do
2. **Mock External Dependencies**: Use MSW for API calls
3. **Test Accessibility**: Use `getByRole`, `getByLabelText` queries
4. **Clean Up**: Use `afterEach` to clean up DOM
5. **Test Error States**: Include error handling scenarios

### Backend Testing
1. **Arrange-Act-Assert**: Structure tests clearly
2. **Mock Dependencies**: Use Moq for external dependencies
3. **Test Edge Cases**: Include boundary conditions
4. **Use FluentAssertions**: Write readable assertions
5. **Test Both Success and Failure**: Cover all code paths

### General Guidelines
1. **Write Tests First**: Follow TDD when possible
2. **Keep Tests Fast**: Unit tests should run quickly
3. **Make Tests Reliable**: Avoid flaky tests
4. **Test Coverage**: Aim for 85%+ coverage
5. **Document Tests**: Use descriptive test names

## 🐛 Troubleshooting

### Common Issues

1. **Frontend Tests Failing**:
   ```bash
   # Clear cache and reinstall
   rm -rf node_modules package-lock.json
   npm install
   ```

2. **Backend Tests Failing**:
   ```bash
   # Clean and rebuild
   dotnet clean
   dotnet restore
   dotnet build
   ```

3. **Coverage Not Generating**:
   - Check that tests are actually running
   - Verify coverage configuration
   - Ensure proper file paths in config

4. **MSW Not Working**:
   - Check that handlers are properly set up
   - Verify API base URL matches
   - Ensure server is started in setup

## 📞 Support

For testing-related questions or issues:

1. Check this documentation
2. Review existing test examples
3. Check GitHub Issues
4. Contact the development team

---

**Happy Testing! 🧪✨**

