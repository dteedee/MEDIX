#!/bin/bash

# MEDIX Test Runner Script
# This script runs all tests for both frontend and backend with coverage

echo "🧪 MEDIX Test Runner"
echo "==================="

# Check if we're in the correct directory
if [ ! -d "frontend" ] || [ ! -d "backend" ]; then
    echo "❌ Error: Please run this script from the MEDIX root directory"
    exit 1
fi

# Function to run frontend tests
run_frontend_tests() {
    echo ""
    echo "🚀 Running Frontend Tests..."
    echo "============================="
    
    cd frontend
    
    # Install dependencies if node_modules doesn't exist
    if [ ! -d "node_modules" ]; then
        echo "📦 Installing frontend dependencies..."
        npm install
    fi
    
    # Run tests with coverage
    echo "🧪 Running frontend unit and integration tests..."
    npm run test:coverage
    
    if [ $? -ne 0 ]; then
        echo "❌ Frontend tests failed!"
        cd ..
        return 1
    fi
    
    echo "✅ Frontend tests passed!"
    cd ..
    return 0
}

# Function to run backend tests
run_backend_tests() {
    echo ""
    echo "🚀 Running Backend Tests..."
    echo "==========================="
    
    cd backend
    
    # Restore packages
    echo "📦 Restoring backend packages..."
    dotnet restore
    
    # Run unit tests with coverage
    echo "🧪 Running backend unit tests..."
    dotnet test Medix.API.Tests.Unit --collect:"XPlat Code Coverage" --settings Medix.runsettings --logger "console;verbosity=normal"
    
    if [ $? -ne 0 ]; then
        echo "❌ Backend unit tests failed!"
        cd ..
        return 1
    fi
    
    # Run integration tests with coverage
    echo "🧪 Running backend integration tests..."
    dotnet test Medix.API.Tests.Integration --collect:"XPlat Code Coverage" --settings Medix.runsettings --logger "console;verbosity=normal"
    
    if [ $? -ne 0 ]; then
        echo "❌ Backend integration tests failed!"
        cd ..
        return 1
    fi
    
    echo "✅ Backend tests passed!"
    cd ..
    return 0
}

# Function to generate coverage report
generate_coverage_report() {
    echo ""
    echo "📊 Generating Coverage Report..."
    echo "================================="
    
    # Frontend coverage is already generated in frontend/coverage/
    if [ -d "frontend/coverage" ]; then
        echo "✅ Frontend coverage report: frontend/coverage/index.html"
    fi
    
    # Backend coverage is generated in TestResults/
    if [ -d "backend/TestResults" ]; then
        echo "✅ Backend coverage report: backend/TestResults/"
    fi
    
    echo ""
    echo "📈 Coverage Summary:"
    echo "Frontend: Check frontend/coverage/lcov-report/index.html"
    echo "Backend: Check backend/TestResults/ for coverage files"
}

# Main execution
run_frontend_tests
frontend_success=$?

run_backend_tests
backend_success=$?

if [ $frontend_success -eq 0 ] && [ $backend_success -eq 0 ]; then
    echo ""
    echo "🎉 All tests passed successfully!"
    generate_coverage_report
    exit 0
else
    echo ""
    echo "❌ Some tests failed!"
    if [ $frontend_success -ne 0 ]; then
        echo "  - Frontend tests failed"
    fi
    if [ $backend_success -ne 0 ]; then
        echo "  - Backend tests failed"
    fi
    exit 1
fi

