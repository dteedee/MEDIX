# MEDIX Test Runner Script
# This script runs all tests for both frontend and backend with coverage

Write-Host "🧪 MEDIX Test Runner" -ForegroundColor Cyan
Write-Host "===================" -ForegroundColor Cyan

# Check if we're in the correct directory
if (-not (Test-Path "frontend") -or -not (Test-Path "backend")) {
    Write-Host "❌ Error: Please run this script from the MEDIX root directory" -ForegroundColor Red
    exit 1
}

# Function to run frontend tests
function Run-FrontendTests {
    Write-Host "`n🚀 Running Frontend Tests..." -ForegroundColor Yellow
    Write-Host "=============================" -ForegroundColor Yellow
    
    Set-Location "frontend"
    
    # Install dependencies if node_modules doesn't exist
    if (-not (Test-Path "node_modules")) {
        Write-Host "📦 Installing frontend dependencies..." -ForegroundColor Blue
        npm install
    }
    
    # Run tests with coverage
    Write-Host "🧪 Running frontend unit and integration tests..." -ForegroundColor Blue
    npm run test:coverage
    
    if ($LASTEXITCODE -ne 0) {
        Write-Host "❌ Frontend tests failed!" -ForegroundColor Red
        Set-Location ".."
        return $false
    }
    
    Write-Host "✅ Frontend tests passed!" -ForegroundColor Green
    Set-Location ".."
    return $true
}

# Function to run backend tests
function Run-BackendTests {
    Write-Host "`n🚀 Running Backend Tests..." -ForegroundColor Yellow
    Write-Host "===========================" -ForegroundColor Yellow
    
    Set-Location "backend"
    
    # Restore packages
    Write-Host "📦 Restoring backend packages..." -ForegroundColor Blue
    dotnet restore
    
    # Run unit tests with coverage
    Write-Host "🧪 Running backend unit tests..." -ForegroundColor Blue
    dotnet test Medix.API.Tests.Unit --collect:"XPlat Code Coverage" --settings Medix.runsettings --logger "console;verbosity=normal"
    
    if ($LASTEXITCODE -ne 0) {
        Write-Host "❌ Backend unit tests failed!" -ForegroundColor Red
        Set-Location ".."
        return $false
    }
    
    # Run integration tests with coverage
    Write-Host "🧪 Running backend integration tests..." -ForegroundColor Blue
    dotnet test Medix.API.Tests.Integration --collect:"XPlat Code Coverage" --settings Medix.runsettings --logger "console;verbosity=normal"
    
    if ($LASTEXITCODE -ne 0) {
        Write-Host "❌ Backend integration tests failed!" -ForegroundColor Red
        Set-Location ".."
        return $false
    }
    
    Write-Host "✅ Backend tests passed!" -ForegroundColor Green
    Set-Location ".."
    return $true
}

# Function to generate coverage report
function Generate-CoverageReport {
    Write-Host "`n📊 Generating Coverage Report..." -ForegroundColor Yellow
    Write-Host "=================================" -ForegroundColor Yellow
    
    # Frontend coverage is already generated in frontend/coverage/
    if (Test-Path "frontend/coverage") {
        Write-Host "✅ Frontend coverage report: frontend/coverage/index.html" -ForegroundColor Green
    }
    
    # Backend coverage is generated in TestResults/
    if (Test-Path "backend/TestResults") {
        Write-Host "✅ Backend coverage report: backend/TestResults/" -ForegroundColor Green
    }
    
    Write-Host "`n📈 Coverage Summary:" -ForegroundColor Cyan
    Write-Host "Frontend: Check frontend/coverage/lcov-report/index.html" -ForegroundColor White
    Write-Host "Backend: Check backend/TestResults/ for coverage files" -ForegroundColor White
}

# Main execution
$frontendSuccess = Run-FrontendTests
$backendSuccess = Run-BackendTests

if ($frontendSuccess -and $backendSuccess) {
    Write-Host "`n🎉 All tests passed successfully!" -ForegroundColor Green
    Generate-CoverageReport
    exit 0
} else {
    Write-Host "`n❌ Some tests failed!" -ForegroundColor Red
    if (-not $frontendSuccess) {
        Write-Host "  - Frontend tests failed" -ForegroundColor Red
    }
    if (-not $backendSuccess) {
        Write-Host "  - Backend tests failed" -ForegroundColor Red
    }
    exit 1
}

