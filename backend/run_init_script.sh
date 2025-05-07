#!/bin/bash

# Get PostgreSQL connection details from environment or use defaults
DB_HOST=${DB_HOST:-postgres}
DB_PORT=${DB_PORT:-5432}
DB_USER=${DB_USER:-dao_user}
DB_PASSWORD=${DB_PASSWORD:-dao_password}
DB_NAME=${DB_NAME:-dao_portal}

# Run the SQL initialization script
echo "Initializing database with sample data..."
PGPASSWORD=$DB_PASSWORD psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -f init_db.sql

echo "Database initialization completed!"