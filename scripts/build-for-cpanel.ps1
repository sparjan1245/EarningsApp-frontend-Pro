# Build script for cPanel deployment (PowerShell)

$ErrorActionPreference = "Stop"

Write-Host "Starting cPanel Build Process..."
Write-Host "===================================="

# Get script directory and root directory
$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$RootDir = Split-Path -Parent $ScriptDir

# --------------------------------------------------
# Create deployment directory
# --------------------------------------------------
$DeployDir = Join-Path $RootDir "deployment"

if (Test-Path $DeployDir) {
    Remove-Item $DeployDir -Recurse -Force
}

New-Item -ItemType Directory -Path $DeployDir | Out-Null
Write-Host "Deployment directory created: $DeployDir"

# --------------------------------------------------
# Check Node.js
# --------------------------------------------------
Write-Host ""
Write-Host "Checking prerequisites..."

$nodeVersion = node --version 2>$null
if (-not $nodeVersion) {
    Write-Host "ERROR: Node.js is not installed or not in PATH" -ForegroundColor Red
    exit 1
}

Write-Host "Node.js version: $nodeVersion"

$nodeMajor = ($nodeVersion -replace 'v', '').Split('.')[0]
if ($nodeMajor -ne "16") {
    Write-Host "WARNING: Node.js 16.x is recommended (current: $nodeVersion)" -ForegroundColor Yellow
    Write-Host "Continuing with current Node.js version..." -ForegroundColor Yellow
    # Note: For production deployment, ensure Node.js 16 is used on cPanel server
}

# --------------------------------------------------
# Build Frontend
# --------------------------------------------------
Write-Host ""
Write-Host "Building Frontend..."

$FrontendDir = Join-Path $RootDir "frontend\earnings-calendar"
Push-Location $FrontendDir

Write-Host "Installing dependencies..."
npm install
if ($LASTEXITCODE -ne 0) {
    Write-Host "ERROR: Frontend npm install failed" -ForegroundColor Red
    Pop-Location
    exit 1
}

Write-Host "Building frontend..."
npm run build
if ($LASTEXITCODE -ne 0) {
    Write-Host "ERROR: Frontend build failed" -ForegroundColor Red
    Pop-Location
    exit 1
}

if (-not (Test-Path "dist")) {
    Write-Host "ERROR: Frontend build failed (dist not found)" -ForegroundColor Red
    Pop-Location
    exit 1
}

Write-Host "Creating frontend archive..."
$FrontendZip = Join-Path $DeployDir "frontend-build.zip"
Compress-Archive "dist\*" $FrontendZip -Force
Pop-Location

Write-Host "Frontend build completed" -ForegroundColor Green

# --------------------------------------------------
# Build Gateway
# --------------------------------------------------
Write-Host ""
Write-Host "Building Gateway..."

$GatewayDir = Join-Path $RootDir "backend\gateway"
Push-Location $GatewayDir

Write-Host "Installing dependencies..."
npm install
if ($LASTEXITCODE -ne 0) {
    Write-Host "ERROR: Gateway npm install failed" -ForegroundColor Red
    Pop-Location
    exit 1
}

Write-Host "Building gateway..."
npm run build
if ($LASTEXITCODE -ne 0) {
    Write-Host "ERROR: Gateway build failed" -ForegroundColor Red
    Pop-Location
    exit 1
}

if (-not (Test-Path "dist")) {
    Write-Host "ERROR: Gateway build failed (dist not found)" -ForegroundColor Red
    Pop-Location
    exit 1
}

# Copy proto files (proto is at backend/proto)
$ProtoDir = Join-Path $RootDir "backend\proto"
if (Test-Path $ProtoDir) {
    Write-Host "Copying proto files..."
    Copy-Item $ProtoDir "." -Recurse -Force
}

# Create archive - only include proto if it exists
Write-Host "Creating gateway archive..."
$GatewayZip = Join-Path $DeployDir "gateway.zip"
$GatewayFiles = @("dist", "package.json")
if (Test-Path "proto") {
    $GatewayFiles += "proto"
}
Compress-Archive $GatewayFiles $GatewayZip -Force
Pop-Location

Write-Host "Gateway build completed" -ForegroundColor Green

# --------------------------------------------------
# Build Auth Service
# --------------------------------------------------
Write-Host ""
Write-Host "Building Auth Service..."

$AuthDir = Join-Path $RootDir "backend\authservice2"
Push-Location $AuthDir

Write-Host "Installing dependencies..."
npm install
if ($LASTEXITCODE -ne 0) {
    Write-Host "ERROR: Auth service npm install failed" -ForegroundColor Red
    Pop-Location
    exit 1
}

Write-Host "Building auth service..."
npm run build
if ($LASTEXITCODE -ne 0) {
    Write-Host "ERROR: Auth service build failed" -ForegroundColor Red
    Pop-Location
    exit 1
}

if (-not (Test-Path "dist")) {
    Write-Host "ERROR: Auth service build failed (dist not found)" -ForegroundColor Red
    Pop-Location
    exit 1
}

# Copy proto files
if (Test-Path $ProtoDir) {
    Write-Host "Copying proto files..."
    Copy-Item $ProtoDir "." -Recurse -Force
}

# Create archive
Write-Host "Creating auth service archive..."
$AuthZip = Join-Path $DeployDir "authservice.zip"
$AuthFiles = @("dist", "package.json", "prisma")
if (Test-Path "proto") {
    $AuthFiles += "proto"
}
Compress-Archive $AuthFiles $AuthZip -Force
Pop-Location

Write-Host "Auth service build completed" -ForegroundColor Green

# --------------------------------------------------
# Build Admin Service
# --------------------------------------------------
Write-Host ""
Write-Host "Building Admin Service..."

$AdminDir = Join-Path $RootDir "backend\adminservice"
Push-Location $AdminDir

Write-Host "Installing dependencies..."
npm install
if ($LASTEXITCODE -ne 0) {
    Write-Host "ERROR: Admin service npm install failed" -ForegroundColor Red
    Pop-Location
    exit 1
}

Write-Host "Building admin service..."
npm run build
if ($LASTEXITCODE -ne 0) {
    Write-Host "ERROR: Admin service build failed" -ForegroundColor Red
    Pop-Location
    exit 1
}

if (-not (Test-Path "dist")) {
    Write-Host "ERROR: Admin service build failed (dist not found)" -ForegroundColor Red
    Pop-Location
    exit 1
}

# Copy proto files
if (Test-Path $ProtoDir) {
    Write-Host "Copying proto files..."
    Copy-Item $ProtoDir "." -Recurse -Force
}

# Create archive
Write-Host "Creating admin service archive..."
$AdminZip = Join-Path $DeployDir "adminservice.zip"
$AdminFiles = @("dist", "package.json", "prisma")
if (Test-Path "proto") {
    $AdminFiles += "proto"
}
Compress-Archive $AdminFiles $AdminZip -Force
Pop-Location

Write-Host "Admin service build completed" -ForegroundColor Green

# --------------------------------------------------
# Environment template files
# --------------------------------------------------
Write-Host ""
Write-Host "Creating environment templates..."

$GatewayEnvFile = Join-Path $DeployDir "gateway.env.example"
@"
PORT=3000
NODE_ENV=production
AUTHSERVICE_HOST=localhost
AUTHSERVICE_PORT=3001
ADMINSERVICE_HOST=localhost
ADMINSERVICE_PORT=3002

# Low memory optimization (adjust based on available RAM)
# 1GB server: --max-old-space-size=256
# 2GB server: --max-old-space-size=512
# 4GB+ server: --max-old-space-size=1024
NODE_OPTIONS=--max-old-space-size=256 --max-semi-space-size=64
"@ | Out-File -FilePath $GatewayEnvFile -Encoding UTF8

$AuthEnvFile = Join-Path $DeployDir "authservice.env.example"
@"
PORT=3001
NODE_ENV=production

# Database Configuration (PostgreSQL 13.22)
# Replace 'user', 'password', 'localhost', '5432', 'earnings_authdb' with your actual values
# connection_limit=5 and pool_timeout=20 are optimized for low memory environments
DATABASE_URL=postgresql://user:password@localhost:5432/earnings_authdb?connection_limit=5&pool_timeout=20
DATABASE_POOL_SIZE=5

# Redis Configuration (optional - can use in-memory cache if Redis not available)
REDIS_HOST=localhost
REDIS_PORT=6379

# JWT Configuration
# IMPORTANT: Change JWT_SECRET to a strong, random string (minimum 32 characters)
JWT_SECRET=change-this-in-production-minimum-32-characters-long
JWT_EXPIRATION=15m

# Google OAuth Configuration
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
GOOGLE_CALLBACK_URL=https://yourdomain.com/api/auth/oauth/google/callback

# Email Configuration (Resend)
RESEND_API_KEY=your-resend-api-key
EMAIL_FROM=your-email@domain.com

# Low memory optimization (adjust based on available RAM)
# 1GB server: --max-old-space-size=256
# 2GB server: --max-old-space-size=512
# 4GB+ server: --max-old-space-size=1024
NODE_OPTIONS=--max-old-space-size=256 --max-semi-space-size=64
"@ | Out-File -FilePath $AuthEnvFile -Encoding UTF8

$AdminEnvFile = Join-Path $DeployDir "adminservice.env.example"
@"
PORT=3002
NODE_ENV=production

# Database Configuration (PostgreSQL 13.22)
# Replace 'user', 'password', 'localhost', '5432', 'earnings_admindb' with your actual values
# connection_limit=5 and pool_timeout=20 are optimized for low memory environments
DATABASE_URL=postgresql://user:password@localhost:5432/earnings_admindb?connection_limit=5&pool_timeout=20
DATABASE_POOL_SIZE=5

# Redis Configuration (optional - can use in-memory cache if Redis not available)
REDIS_HOST=localhost
REDIS_PORT=6379

# JWT Configuration
# IMPORTANT: Change JWT_SECRET to a strong, random string (minimum 32 characters)
JWT_SECRET=change-this-in-production-minimum-32-characters-long
JWT_EXPIRATION=30m

# Refresh Token Configuration
REFRESH_TOKEN_SECRET=your-refresh-token-secret-change-this-minimum-32-chars
REFRESH_TOKEN_EXPIRATION=7d

# Low memory optimization (adjust based on available RAM)
# 1GB server: --max-old-space-size=256
# 2GB server: --max-old-space-size=512
# 4GB+ server: --max-old-space-size=1024
NODE_OPTIONS=--max-old-space-size=256 --max-semi-space-size=64
"@ | Out-File -FilePath $AdminEnvFile -Encoding UTF8

Write-Host "Environment templates created" -ForegroundColor Green

# --------------------------------------------------
# Summary
# --------------------------------------------------
Write-Host ""
Write-Host "====================================" -ForegroundColor Green
Write-Host "BUILD COMPLETED SUCCESSFULLY!" -ForegroundColor Green
Write-Host "====================================" -ForegroundColor Green
Write-Host ""
Write-Host "Deployment packages created in:" -ForegroundColor Cyan
Write-Host $DeployDir -ForegroundColor Yellow
Write-Host ""

Write-Host "Files created:" -ForegroundColor Cyan
Get-ChildItem -Path $DeployDir | Format-Table Name, @{Label="Size (MB)"; Expression={[math]::Round($_.Length/1MB, 2)}} -AutoSize

Write-Host ""
Write-Host "Next steps:" -ForegroundColor Yellow
Write-Host "1. Review .env.example files and update with production values"
Write-Host "2. Upload packages to your cPanel server"
Write-Host "3. Extract files in appropriate directories"
Write-Host "4. Create .env files from .env.example templates"
Write-Host "5. Install dependencies: npm install --production"
Write-Host "6. Generate Prisma clients: npx prisma generate"
Write-Host "7. Run database migrations: npx prisma migrate deploy"
Write-Host "8. Configure Node.js applications in cPanel"
Write-Host ""
Write-Host "See CPANEL_DEPLOYMENT_NODE16_PG13.md for detailed instructions" -ForegroundColor Cyan
Write-Host ""
