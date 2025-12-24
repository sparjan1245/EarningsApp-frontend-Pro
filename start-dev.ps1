# PowerShell script to start development environment
# This starts backend services in Docker and frontend directly

Write-Host "🚀 Starting Development Environment..." -ForegroundColor Green
Write-Host ""

# Check if Docker is running
$dockerRunning = docker info 2>&1
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Docker is not running. Please start Docker Desktop." -ForegroundColor Red
    exit 1
}

Write-Host "📦 Starting backend services (Docker)..." -ForegroundColor Yellow
docker-compose up -d postgres redis gateway auth-service adminservice

Write-Host ""
Write-Host "✅ Backend services started!" -ForegroundColor Green
Write-Host ""
Write-Host "🎨 Starting frontend dev server..." -ForegroundColor Yellow
Write-Host "   (This will open in a new terminal window)" -ForegroundColor Gray
Write-Host ""

# Start frontend in new PowerShell window
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$PSScriptRoot\frontend\earnings-calendar'; Write-Host '🎨 Frontend Dev Server' -ForegroundColor Cyan; Write-Host 'Access at: http://localhost:5173' -ForegroundColor Green; Write-Host ''; npm run dev"

Write-Host ""
Write-Host "✨ Development environment ready!" -ForegroundColor Green
Write-Host ""
Write-Host "📍 Frontend: http://localhost:5173" -ForegroundColor Cyan
Write-Host "📍 Gateway API: http://localhost:3000" -ForegroundColor Cyan
Write-Host ""
Write-Host "💡 Tip: Changes to frontend code will hot-reload automatically!" -ForegroundColor Yellow
Write-Host ""

