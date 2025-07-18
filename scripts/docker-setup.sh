#!/bin/bash

# 🐳 CRM System - Complete Docker Setup Script
# This script sets up everything needed to run the CRM system in Docker

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

print_header() {
    echo -e "${PURPLE}$1${NC}"
}

# Function to check if command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Function to check Docker installation
check_docker() {
    print_status "Checking Docker installation..."
    
    if ! command_exists docker; then
        print_error "Docker is not installed!"
        echo "Please install Docker first:"
        echo "  Ubuntu/Debian: curl -fsSL https://get.docker.com | sh"
        echo "  CentOS/RHEL: curl -fsSL https://get.docker.com | sh"
        echo "  Or visit: https://docs.docker.com/get-docker/"
        exit 1
    fi
    
    if ! command_exists docker-compose; then
        print_error "Docker Compose is not installed!"
        echo "Please install Docker Compose:"
        echo "  sudo curl -L \"https://github.com/docker/compose/releases/latest/download/docker-compose-\$(uname -s)-\$(uname -m)\" -o /usr/local/bin/docker-compose"
        echo "  sudo chmod +x /usr/local/bin/docker-compose"
        exit 1
    fi
    
    # Check if Docker daemon is running
    if ! docker info >/dev/null 2>&1; then
        print_error "Docker daemon is not running!"
        echo "Please start Docker service:"
        echo "  sudo systemctl start docker"
        echo "  sudo systemctl enable docker"
        exit 1
    fi
    
    print_success "Docker and Docker Compose are installed and running"
}

# Function to create necessary directories
create_directories() {
    print_status "Creating necessary directories..."
    
    # Create data directories
    mkdir -p docker-data/database
    mkdir -p docker-data/uploads
    mkdir -p docker-data/backups
    mkdir -p ssl
    
    # Set proper permissions
    chmod 755 docker-data/database
    chmod 755 docker-data/uploads
    chmod 755 docker-data/backups
    
    print_success "Directories created successfully"
}

# Function to backup existing data
backup_existing_data() {
    print_status "Checking for existing data to backup..."
    
    # Backup existing SQLite database
    if [ -f "prisma/dev.db" ]; then
        print_warning "Found existing database, creating backup..."
        cp prisma/dev.db docker-data/database/crm.db
        print_success "Database backed up to docker-data/database/crm.db"
    fi
    
    # Backup existing uploads
    if [ -d "public/uploads" ] && [ "$(ls -A public/uploads 2>/dev/null)" ]; then
        print_warning "Found existing uploads, creating backup..."
        cp -r public/uploads/* docker-data/uploads/ 2>/dev/null || true
        print_success "Uploads backed up to docker-data/uploads/"
    fi
}

# Function to configure environment
configure_environment() {
    print_status "Configuring environment..."
    
    if [ ! -f ".env.docker" ]; then
        print_warning ".env.docker not found, creating from template..."
        
        # Generate a random secret
        RANDOM_SECRET=$(openssl rand -base64 32 2>/dev/null || date +%s | sha256sum | base64 | head -c 32)
        
        # Create .env.docker with proper values
        cat > .env.docker << EOF
# 🐳 Docker Environment Configuration for CRM System
DATABASE_URL="file:/app/data/crm.db"
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="$RANDOM_SECRET"
NODE_ENV="production"
PORT="3000"
HOSTNAME="0.0.0.0"
NEXT_TELEMETRY_DISABLED="1"
EOF
        
        print_success ".env.docker created with secure random secret"
    else
        print_success ".env.docker already exists"
    fi
}

# Function to update Next.js config for Docker
update_nextjs_config() {
    print_status "Updating Next.js configuration for Docker..."
    
    # Check if next.config.js exists and update it
    if [ -f "next.config.js" ]; then
        # Backup original config
        cp next.config.js next.config.js.backup
        
        # Add standalone output if not present
        if ! grep -q "output.*standalone" next.config.js; then
            print_status "Adding standalone output to Next.js config..."
            
            # Create updated config
            cat > next.config.js << 'EOF'
/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  experimental: {
    serverComponentsExternalPackages: ['@prisma/client', 'prisma']
  },
  // Optimize for Docker
  swcMinify: true,
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production' ? {
      exclude: ['error']
    } : false,
  },
  // Image optimization
  images: {
    unoptimized: true
  }
}

module.exports = nextConfig
EOF
            print_success "Next.js config updated for Docker"
        else
            print_success "Next.js config already optimized for Docker"
        fi
    else
        print_warning "next.config.js not found, creating optimized version..."
        cat > next.config.js << 'EOF'
/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  experimental: {
    serverComponentsExternalPackages: ['@prisma/client', 'prisma']
  },
  swcMinify: true,
  images: {
    unoptimized: true
  }
}

module.exports = nextConfig
EOF
        print_success "Next.js config created"
    fi
}

# Function to create health check API
create_health_check() {
    print_status "Creating health check API..."
    
    mkdir -p src/app/api/health
    
    cat > src/app/api/health/route.ts << 'EOF'
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export async function GET() {
  try {
    // Check database connection
    await prisma.$queryRaw`SELECT 1`
    
    return NextResponse.json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      database: 'connected'
    })
  } catch (error) {
    return NextResponse.json({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      database: 'disconnected',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 503 })
  }
}
EOF
    
    print_success "Health check API created"
}

# Function to build Docker image
build_docker_image() {
    print_status "Building Docker image..."
    
    # Build the image
    docker build -t crm-system:latest . || {
        print_error "Docker build failed!"
        exit 1
    }
    
    print_success "Docker image built successfully"
}

# Function to start services
start_services() {
    print_status "Starting CRM system with Docker Compose..."
    
    # Stop any existing containers
    docker-compose down 2>/dev/null || true
    
    # Start services
    docker-compose up -d || {
        print_error "Failed to start services!"
        print_status "Checking logs..."
        docker-compose logs
        exit 1
    }
    
    print_success "Services started successfully"
}

# Function to wait for services to be ready
wait_for_services() {
    print_status "Waiting for services to be ready..."
    
    # Wait for the application to be healthy
    local max_attempts=30
    local attempt=1
    
    while [ $attempt -le $max_attempts ]; do
        if curl -f http://localhost:3000/api/health >/dev/null 2>&1; then
            print_success "CRM system is ready!"
            break
        fi
        
        if [ $attempt -eq $max_attempts ]; then
            print_error "Services failed to start within expected time"
            print_status "Checking logs..."
            docker-compose logs crm-app
            exit 1
        fi
        
        print_status "Attempt $attempt/$max_attempts - waiting for services..."
        sleep 10
        attempt=$((attempt + 1))
    done
}

# Function to show final information
show_final_info() {
    print_header "🎉 CRM System Docker Setup Complete!"
    echo ""
    print_success "✅ CRM System is now running in Docker!"
    echo ""
    echo -e "${CYAN}📊 Access Information:${NC}"
    echo "  🌐 Web Interface: http://localhost:3000"
    echo "  🏥 Health Check: http://localhost:3000/api/health"
    echo "  📊 System Status: docker-compose ps"
    echo ""
    echo -e "${CYAN}🛠️ Management Commands:${NC}"
    echo "  📋 View logs: docker-compose logs -f"
    echo "  🔄 Restart: docker-compose restart"
    echo "  🛑 Stop: docker-compose down"
    echo "  🚀 Start: docker-compose up -d"
    echo ""
    echo -e "${CYAN}📁 Data Locations:${NC}"
    echo "  💾 Database: ./docker-data/database/crm.db"
    echo "  📎 Uploads: ./docker-data/uploads/"
    echo "  🗄️ Backups: ./docker-data/backups/"
    echo ""
    echo -e "${CYAN}🔧 Configuration:${NC}"
    echo "  ⚙️ Environment: .env.docker"
    echo "  🐳 Docker Compose: docker-compose.yml"
    echo "  🌐 Nginx Config: nginx.conf"
    echo ""
    print_warning "🔐 Remember to:"
    echo "  1. Change NEXTAUTH_SECRET in .env.docker for production"
    echo "  2. Configure SSL certificates in ./ssl/ for HTTPS"
    echo "  3. Set up regular backups of ./docker-data/"
    echo ""
    print_success "🎯 Your CRM system is ready to use!"
}

# Main execution
main() {
    print_header "🐳 CRM System Docker Setup"
    echo "This script will set up your CRM system to run in Docker containers"
    echo ""
    
    # Check prerequisites
    check_docker
    
    # Setup process
    create_directories
    backup_existing_data
    configure_environment
    update_nextjs_config
    create_health_check
    build_docker_image
    start_services
    wait_for_services
    
    # Show final information
    show_final_info
}

# Run main function
main "$@"
