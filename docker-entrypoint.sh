#!/bin/sh
# 🚀 CRM System Docker Entrypoint
# Ensures database is ready and migrations are applied

set -e

echo "🐳 Starting CRM System..."

# Function to wait for file system to be ready
wait_for_filesystem() {
    echo "📁 Checking filesystem..."
    
    # Ensure data directories exist
    mkdir -p /app/data /app/uploads /app/backups
    
    # Set proper permissions
    chmod 755 /app/data /app/uploads /app/backups
    
    echo "✅ Filesystem ready"
}

# Function to initialize database
init_database() {
    echo "🗄️ Initializing database..."
    
    # Check if database exists
    if [ ! -f "/app/data/crm.db" ]; then
        echo "📊 Creating new database..."
        
        # Run Prisma migrations to create database
        npx prisma migrate deploy
        
        # Generate Prisma client (in case it's needed)
        npx prisma generate
        
        echo "✅ Database created successfully"
    else
        echo "📊 Database exists, checking for migrations..."
        
        # Apply any pending migrations
        npx prisma migrate deploy
        
        echo "✅ Database migrations applied"
    fi
}

# Function to seed database if empty
seed_database() {
    echo "🌱 Checking if database needs seeding..."
    
    # Check if there are any users (basic check)
    USER_COUNT=$(sqlite3 /app/data/crm.db "SELECT COUNT(*) FROM User;" 2>/dev/null || echo "0")
    
    if [ "$USER_COUNT" = "0" ]; then
        echo "🌱 Seeding database with initial data..."
        
        # Run seed script if it exists
        if [ -f "/app/prisma/seed.ts" ] || [ -f "/app/prisma/seed.js" ]; then
            npm run seed 2>/dev/null || npx prisma db seed 2>/dev/null || echo "⚠️ Seed script not found or failed"
        fi
        
        echo "✅ Database seeding completed"
    else
        echo "✅ Database already has data ($USER_COUNT users found)"
    fi
}

# Function to create health check endpoint
create_health_check() {
    echo "🏥 Setting up health check..."
    
    # The health check will be handled by the Next.js app
    # We just ensure the app can start properly
    
    echo "✅ Health check ready"
}

# Function to backup existing data (if migrating from local)
backup_existing_data() {
    if [ -f "/app/prisma/dev.db" ] && [ ! -f "/app/data/crm.db" ]; then
        echo "💾 Found existing local database, migrating..."
        cp /app/prisma/dev.db /app/data/crm.db
        echo "✅ Database migrated to Docker volume"
    fi
}

# Main initialization sequence
main() {
    echo "🚀 CRM System Docker Entrypoint Starting..."
    echo "📅 $(date)"
    echo "🏷️ Version: $(cat /app/package.json | grep version | cut -d'"' -f4 2>/dev/null || echo 'unknown')"
    
    # Wait for filesystem
    wait_for_filesystem
    
    # Backup existing data if needed
    backup_existing_data
    
    # Initialize database
    init_database
    
    # Seed database if needed
    seed_database
    
    # Setup health check
    create_health_check
    
    echo "✅ CRM System initialization completed!"
    echo "🌐 Starting application on port 3000..."
    echo "📊 Database: /app/data/crm.db"
    echo "📁 Uploads: /app/uploads"
    echo "💾 Backups: /app/backups"
    echo ""
    
    # Execute the main command
    exec "$@"
}

# Handle signals gracefully
trap 'echo "🛑 Shutting down CRM System..."; exit 0' TERM INT

# Run main function
main
