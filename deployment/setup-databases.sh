#!/bin/bash

# 🗄️ Database Setup Script for Earnings App
# This script creates PostgreSQL databases and users

set -e

echo "=========================================="
echo "🗄️  Database Setup Script"
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

# Prompt for database password
echo "Enter a secure password for the database user 'earnings_user':"
read -s DB_PASSWORD
echo ""

if [ -z "$DB_PASSWORD" ]; then
    print_error "Password cannot be empty!"
    exit 1
fi

echo ""
echo "Setting up PostgreSQL databases..."

# Create databases and user
sudo -u postgres psql << EOF
-- Create databases
CREATE DATABASE earnings_authdb;
CREATE DATABASE earnings_admindb;

-- Create user
CREATE USER earnings_user WITH PASSWORD '$DB_PASSWORD';

-- Grant privileges
GRANT ALL PRIVILEGES ON DATABASE earnings_authdb TO earnings_user;
GRANT ALL PRIVILEGES ON DATABASE earnings_admindb TO earnings_user;
ALTER USER earnings_user CREATEDB;

-- Verify
\l
\du earnings_user
EOF

print_success "Databases created successfully!"
print_success "User 'earnings_user' created with password"

echo ""
print_info "Database names:"
echo "  - earnings_authdb (for auth service)"
echo "  - earnings_admindb (for admin service)"
echo ""
print_info "Database user: earnings_user"
print_info "Password: [the password you entered]"
echo ""
print_info "Save this password! You'll need it for .env files."
echo ""
echo "To test connection, run:"
echo "  psql -U earnings_user -d earnings_authdb -h localhost"
echo ""



