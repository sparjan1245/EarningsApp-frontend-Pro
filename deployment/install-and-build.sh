#!/bin/bash

# 📦 Install Dependencies and Build Script
# This script installs all dependencies and builds all services

set -e

echo "=========================================="
echo "📦 Install & Build Script"
echo "=========================================="
echo ""

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

print_success() {
    echo -e "${GREEN}✓ $1${NC}"
}

print_info() {
    echo -e "${YELLOW}ℹ $1${NC}"
}

print_error() {
    echo -e "${RED}✗ $1${NC}"
}

# Check if we're in the project root
if [ ! -d "backend" ] || [ ! -d "frontend" ]; then
    print_error "Please run this script from the project root directory!"
    print_info "Expected structure: backend/, frontend/, deployment/"
    exit 1
fi

PROJECT_ROOT=$(pwd)
echo "Project root: $PROJECT_ROOT"
echo ""

# Install root dependencies (if package.json exists)
if [ -f "package.json" ]; then
    echo "Installing root dependencies..."
    npm install
    print_success "Root dependencies installed"
    echo ""
fi

# Install Gateway dependencies
echo "Installing Gateway dependencies..."
cd backend/gateway
npm install
print_success "Gateway dependencies installed"
cd "$PROJECT_ROOT"
echo ""

# Install Auth Service dependencies
echo "Installing Auth Service dependencies..."
cd backend/authservice2
npm install
print_success "Auth Service dependencies installed"
cd "$PROJECT_ROOT"
echo ""

# Install Admin Service dependencies
echo "Installing Admin Service dependencies..."
cd backend/adminservice
npm install
print_success "Admin Service dependencies installed"
cd "$PROJECT_ROOT"
echo ""

# Install Frontend dependencies
echo "Installing Frontend dependencies..."
cd frontend/earnings-calendar
npm install
print_success "Frontend dependencies installed"
cd "$PROJECT_ROOT"
echo ""

# Build Gateway
echo "Building Gateway..."
cd backend/gateway
npm run build
print_success "Gateway built successfully"
cd "$PROJECT_ROOT"
echo ""

# Build Auth Service
echo "Building Auth Service..."
cd backend/authservice2
npm run build
print_success "Auth Service built successfully"
echo "Generating Prisma client..."
npx prisma generate
print_success "Prisma client generated"
echo "Running migrations..."
npx prisma migrate deploy
print_success "Migrations deployed"
cd "$PROJECT_ROOT"
echo ""

# Build Admin Service
echo "Building Admin Service..."
cd backend/adminservice
npm run build
print_success "Admin Service built successfully"
echo "Running migrations..."
npx prisma migrate deploy
print_success "Migrations deployed"
cd "$PROJECT_ROOT"
echo ""

# Build Frontend
echo "Building Frontend..."
cd frontend/earnings-calendar
npm run build
print_success "Frontend built successfully"
cd "$PROJECT_ROOT"
echo ""

echo "=========================================="
print_success "All dependencies installed and applications built!"
echo "=========================================="
echo ""
echo "Next steps:"
echo "1. Seed databases (run: ./seed-databases.sh)"
echo "2. Create PM2 ecosystem file"
echo "3. Start services with PM2"
echo ""



