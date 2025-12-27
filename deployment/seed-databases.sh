#!/bin/bash

# 🌱 Database Seeding Script
# This script seeds the databases with initial admin user

set -e

echo "=========================================="
echo "🌱 Database Seeding Script"
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
if [ ! -d "backend" ]; then
    print_error "Please run this script from the project root directory!"
    exit 1
fi

PROJECT_ROOT=$(pwd)

# Seed Auth Service database
echo "Seeding Auth Service database..."
cd backend/authservice2

if [ -f "prisma/seed.js" ]; then
    node prisma/seed.js
    print_success "Auth Service database seeded"
elif [ -f "dist/prisma/seed.js" ]; then
    node dist/prisma/seed.js
    print_success "Auth Service database seeded"
elif command -v npx &> /dev/null; then
    npx prisma db seed || print_info "Seed command not configured, trying manual seed..."
    if [ -f "prisma/seed.js" ]; then
        node prisma/seed.js
        print_success "Auth Service database seeded"
    else
        print_error "Could not find seed script for auth service"
    fi
else
    print_error "Could not seed auth service database"
fi

cd "$PROJECT_ROOT"
echo ""

# Seed Admin Service database
echo "Seeding Admin Service database..."
cd backend/adminservice

if [ -f "src/prisma/seed.ts" ]; then
    # Try to run TypeScript seed
    if command -v ts-node &> /dev/null; then
        ts-node src/prisma/seed.ts
        print_success "Admin Service database seeded"
    else
        print_info "ts-node not found, trying compiled version..."
        if [ -f "dist/prisma/seed.js" ]; then
            node dist/prisma/seed.js
            print_success "Admin Service database seeded"
        else
            print_error "Could not find compiled seed script"
        fi
    fi
elif [ -f "dist/prisma/seed.js" ]; then
    node dist/prisma/seed.js
    print_success "Admin Service database seeded"
elif command -v npx &> /dev/null; then
    npx prisma db seed || print_info "Seed command not configured, trying manual seed..."
    if [ -f "dist/prisma/seed.js" ]; then
        node dist/prisma/seed.js
        print_success "Admin Service database seeded"
    else
        print_error "Could not find seed script for admin service"
    fi
else
    print_error "Could not seed admin service database"
fi

cd "$PROJECT_ROOT"
echo ""

echo "=========================================="
print_success "Database seeding completed!"
echo "=========================================="
echo ""
print_info "Default Admin Credentials:"
echo "  Email: sadmin@admin.com"
echo "  Password: Superadmin123!"
echo "  Role: SUPERADMIN"
echo ""
echo "⚠️  IMPORTANT: Change the default password after first login!"
echo ""



