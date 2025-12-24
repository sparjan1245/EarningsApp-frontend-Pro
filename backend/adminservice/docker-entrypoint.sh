#!/bin/sh
set -e

# Run Prisma migrations
npx prisma migrate deploy --schema prisma/schema.prisma

# Seed the database using compiled JS
node dist/prisma/seed.js || echo "Seed script failed or already seeded. Continuing..."

# Start the app
exec node dist/main.js 