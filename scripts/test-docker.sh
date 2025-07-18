#!/bin/bash

# 🧪 CRM System - Docker Test Script
# Quick test to verify Docker setup is working

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

print_status() {
    echo -e "${BLUE}[TEST]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[PASS]${NC} $1"
}

print_error() {
    echo -e "${RED}[FAIL]${NC} $1"
}

print_header() {
    echo -e "${YELLOW}=== $1 ===${NC}"
}

# Test Docker installation
test_docker() {
    print_header "Testing Docker Installation"
    
    if command -v docker >/dev/null 2>&1; then
        print_success "Docker is installed"
        docker --version
    else
        print_error "Docker is not installed"
        return 1
    fi
    
    if command -v docker-compose >/dev/null 2>&1; then
        print_success "Docker Compose is installed"
        docker-compose --version
    else
        print_error "Docker Compose is not installed"
        return 1
    fi
    
    if docker info >/dev/null 2>&1; then
        print_success "Docker daemon is running"
    else
        print_error "Docker daemon is not running"
        return 1
    fi
}

# Test Docker files
test_docker_files() {
    print_header "Testing Docker Configuration Files"
    
    local files=(
        "Dockerfile"
        "docker-compose.yml"
        "docker-entrypoint.sh"
        ".dockerignore"
        "nginx.conf"
        ".env.docker"
    )
    
    for file in "${files[@]}"; do
        if [ -f "$file" ]; then
            print_success "$file exists"
        else
            print_error "$file is missing"
            return 1
        fi
    done
}

# Test build process
test_build() {
    print_header "Testing Docker Build"
    
    print_status "Building Docker image..."
    if docker build -t crm-system:test . >/dev/null 2>&1; then
        print_success "Docker image built successfully"
    else
        print_error "Docker build failed"
        return 1
    fi
}

# Test health check API
test_health_check() {
    print_header "Testing Health Check API"
    
    if [ -f "src/app/api/health/route.ts" ]; then
        print_success "Health check API exists"
    else
        print_error "Health check API is missing"
        return 1
    fi
}

# Test Next.js configuration
test_nextjs_config() {
    print_header "Testing Next.js Configuration"
    
    if [ -f "next.config.js" ]; then
        if grep -q "output.*standalone" next.config.js; then
            print_success "Next.js configured for standalone output"
        else
            print_error "Next.js not configured for Docker"
            return 1
        fi
    else
        print_error "next.config.js is missing"
        return 1
    fi
}

# Test environment configuration
test_environment() {
    print_header "Testing Environment Configuration"
    
    if [ -f ".env.docker" ]; then
        if grep -q "DATABASE_URL" .env.docker && grep -q "NEXTAUTH_SECRET" .env.docker; then
            print_success "Environment configuration is valid"
        else
            print_error "Environment configuration is incomplete"
            return 1
        fi
    else
        print_error ".env.docker is missing"
        return 1
    fi
}

# Test scripts
test_scripts() {
    print_header "Testing Scripts"
    
    local scripts=(
        "scripts/docker-setup.sh"
        "scripts/docker-deploy.sh"
        "docker-entrypoint.sh"
    )
    
    for script in "${scripts[@]}"; do
        if [ -f "$script" ] && [ -x "$script" ]; then
            print_success "$script is executable"
        else
            print_error "$script is missing or not executable"
            return 1
        fi
    done
}

# Main test function
run_tests() {
    local failed=0
    
    echo "🧪 CRM System Docker Test Suite"
    echo "Testing Docker configuration and setup..."
    echo ""
    
    # Run all tests
    test_docker || failed=1
    echo ""
    
    test_docker_files || failed=1
    echo ""
    
    test_nextjs_config || failed=1
    echo ""
    
    test_environment || failed=1
    echo ""
    
    test_health_check || failed=1
    echo ""
    
    test_scripts || failed=1
    echo ""
    
    # Optional: Test build (can be slow)
    if [ "$1" = "--build" ]; then
        test_build || failed=1
        echo ""
    fi
    
    # Summary
    print_header "Test Results"
    if [ $failed -eq 0 ]; then
        print_success "All tests passed! ✅"
        echo ""
        echo "🚀 Your system is ready for Docker deployment!"
        echo ""
        echo "Next steps:"
        echo "  1. Run: ./scripts/docker-setup.sh"
        echo "  2. Or deploy to server: ./scripts/docker-deploy.sh"
        echo ""
        return 0
    else
        print_error "Some tests failed! ❌"
        echo ""
        echo "Please fix the issues above before proceeding."
        echo ""
        return 1
    fi
}

# Run tests
run_tests "$@"
