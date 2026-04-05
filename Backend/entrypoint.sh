#!/bin/sh
set -e

echo "========================================="
echo "  VietFuture - Database Migration"
echo "========================================="

echo "🔄 Running database migrations..."
node scripts/migrate.js

echo ""
echo "========================================="
echo "  VietFuture - Starting Server"
echo "========================================="

exec npm run dev
