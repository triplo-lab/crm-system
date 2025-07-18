#!/bin/bash

# 🚀 CRM System - Docker Deployment Script
# Deploy CRM system to any server with Docker

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Configuration
REPO_URL="https://github.com/username/crm-system.git"  # Change this to your repo
DEPLOY_DIR="/opt/crm-system"
BACKUP_DIR="/opt/crm-backups"
SERVICE_NAME="crm-system"

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

# Function to check if running as root
check_root() {
    if [ "$EUID" -ne 0 ]; then
        print_error "This script must be run as root (use sudo)"
        exit 1
    fi
}

# Function to install Docker if not present
install_docker() {
    if ! command -v docker >/dev/null 2>&1; then
        print_status "Installing Docker..."
        
        # Update package index
        apt-get update
        
        # Install prerequisites
        apt-get install -y \
            apt-transport-https \
            ca-certificates \
            curl \
            gnupg \
            lsb-release
        
        # Add Docker's official GPG key
        curl -fsSL https://download.docker.com/linux/ubuntu/gpg | gpg --dearmor -o /usr/share/keyrings/docker-archive-keyring.gpg
        
        # Set up stable repository
        echo \
            "deb [arch=$(dpkg --print-architecture) signed-by=/usr/share/keyrings/docker-archive-keyring.gpg] https://download.docker.com/linux/ubuntu \
            $(lsb_release -cs) stable" | tee /etc/apt/sources.list.d/docker.list > /dev/null
        
        # Install Docker Engine
        apt-get update
        apt-get install -y docker-ce docker-ce-cli containerd.io
        
        # Install Docker Compose
        curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
        chmod +x /usr/local/bin/docker-compose
        
        # Start and enable Docker
        systemctl start docker
        systemctl enable docker
        
        print_success "Docker installed successfully"
    else
        print_success "Docker is already installed"
    fi
}

# Function to create deployment user
create_deploy_user() {
    if ! id "crm" &>/dev/null; then
        print_status "Creating deployment user..."
        useradd -r -s /bin/bash -d /opt/crm-system -m crm
        usermod -aG docker crm
        print_success "User 'crm' created"
    else
        print_success "User 'crm' already exists"
    fi
}

# Function to setup directories
setup_directories() {
    print_status "Setting up directories..."
    
    # Create main directories
    mkdir -p $DEPLOY_DIR
    mkdir -p $BACKUP_DIR
    mkdir -p /var/log/crm
    
    # Set ownership
    chown -R crm:crm $DEPLOY_DIR
    chown -R crm:crm $BACKUP_DIR
    chown -R crm:crm /var/log/crm
    
    print_success "Directories created"
}

# Function to clone or update repository
deploy_code() {
    print_status "Deploying code..."
    
    if [ -d "$DEPLOY_DIR/.git" ]; then
        print_status "Updating existing repository..."
        cd $DEPLOY_DIR
        sudo -u crm git pull origin main
    else
        print_status "Cloning repository..."
        sudo -u crm git clone $REPO_URL $DEPLOY_DIR
        cd $DEPLOY_DIR
    fi
    
    # Make scripts executable
    chmod +x scripts/*.sh
    
    print_success "Code deployed"
}

# Function to configure environment
configure_environment() {
    print_status "Configuring environment..."
    
    # Create production environment file
    if [ ! -f "$DEPLOY_DIR/.env.docker" ]; then
        print_status "Creating production environment file..."
        
        # Generate secure random secret
        RANDOM_SECRET=$(openssl rand -base64 32)
        
        cat > $DEPLOY_DIR/.env.docker << EOF
# 🐳 Production Environment Configuration
DATABASE_URL="file:/app/data/crm.db"
NEXTAUTH_URL="http://$(hostname -I | awk '{print $1}'):3000"
NEXTAUTH_SECRET="$RANDOM_SECRET"
NODE_ENV="production"
PORT="3000"
HOSTNAME="0.0.0.0"
NEXT_TELEMETRY_DISABLED="1"

# Production optimizations
LOG_LEVEL="warn"
CACHE_TTL="7200"
SESSION_TIMEOUT="86400"
RATE_LIMIT_ENABLED="true"
EOF
        
        chown crm:crm $DEPLOY_DIR/.env.docker
        print_success "Environment configured"
    else
        print_success "Environment file already exists"
    fi
}

# Function to setup systemd service
setup_systemd_service() {
    print_status "Setting up systemd service..."
    
    cat > /etc/systemd/system/crm-system.service << EOF
[Unit]
Description=CRM System Docker Compose
Requires=docker.service
After=docker.service

[Service]
Type=oneshot
RemainAfterExit=yes
WorkingDirectory=$DEPLOY_DIR
ExecStart=/usr/local/bin/docker-compose up -d
ExecStop=/usr/local/bin/docker-compose down
TimeoutStartSec=0
User=crm
Group=crm

[Install]
WantedBy=multi-user.target
EOF
    
    # Reload systemd and enable service
    systemctl daemon-reload
    systemctl enable crm-system.service
    
    print_success "Systemd service configured"
}

# Function to setup log rotation
setup_log_rotation() {
    print_status "Setting up log rotation..."
    
    cat > /etc/logrotate.d/crm-system << EOF
/var/log/crm/*.log {
    daily
    missingok
    rotate 30
    compress
    delaycompress
    notifempty
    create 644 crm crm
    postrotate
        docker-compose -f $DEPLOY_DIR/docker-compose.yml restart crm-app >/dev/null 2>&1 || true
    endscript
}
EOF
    
    print_success "Log rotation configured"
}

# Function to setup backup cron job
setup_backup_cron() {
    print_status "Setting up automated backups..."
    
    # Create backup script
    cat > /usr/local/bin/crm-backup.sh << EOF
#!/bin/bash
# CRM System Backup Script

BACKUP_DIR="$BACKUP_DIR"
DEPLOY_DIR="$DEPLOY_DIR"
DATE=\$(date +%Y%m%d_%H%M%S)

# Create backup directory
mkdir -p \$BACKUP_DIR/\$DATE

# Backup database
cp \$DEPLOY_DIR/docker-data/database/crm.db \$BACKUP_DIR/\$DATE/

# Backup uploads
cp -r \$DEPLOY_DIR/docker-data/uploads \$BACKUP_DIR/\$DATE/

# Backup configuration
cp \$DEPLOY_DIR/.env.docker \$BACKUP_DIR/\$DATE/

# Create archive
cd \$BACKUP_DIR
tar -czf crm_backup_\$DATE.tar.gz \$DATE
rm -rf \$DATE

# Keep only last 30 backups
ls -t crm_backup_*.tar.gz | tail -n +31 | xargs -r rm

echo "Backup completed: crm_backup_\$DATE.tar.gz"
EOF
    
    chmod +x /usr/local/bin/crm-backup.sh
    
    # Add to crontab for crm user
    (crontab -u crm -l 2>/dev/null; echo "0 2 * * * /usr/local/bin/crm-backup.sh") | crontab -u crm -
    
    print_success "Backup cron job configured (daily at 2 AM)"
}

# Function to setup firewall
setup_firewall() {
    print_status "Configuring firewall..."
    
    if command -v ufw >/dev/null 2>&1; then
        # Allow SSH
        ufw allow ssh
        
        # Allow HTTP and HTTPS
        ufw allow 80/tcp
        ufw allow 443/tcp
        
        # Allow CRM application port
        ufw allow 3000/tcp
        
        # Enable firewall
        ufw --force enable
        
        print_success "Firewall configured"
    else
        print_warning "UFW not installed, skipping firewall configuration"
    fi
}

# Function to build and start services
start_services() {
    print_status "Building and starting services..."
    
    cd $DEPLOY_DIR
    
    # Build and start as crm user
    sudo -u crm docker-compose build
    sudo -u crm docker-compose up -d
    
    # Wait for services to be ready
    print_status "Waiting for services to start..."
    sleep 30
    
    # Check if services are running
    if sudo -u crm docker-compose ps | grep -q "Up"; then
        print_success "Services started successfully"
    else
        print_error "Services failed to start"
        sudo -u crm docker-compose logs
        exit 1
    fi
}

# Function to show deployment information
show_deployment_info() {
    local server_ip=$(hostname -I | awk '{print $1}')
    
    print_header "🎉 CRM System Deployment Complete!"
    echo ""
    print_success "✅ CRM System is now running on this server!"
    echo ""
    echo -e "${CYAN}📊 Access Information:${NC}"
    echo "  🌐 Web Interface: http://$server_ip:3000"
    echo "  🏥 Health Check: http://$server_ip:3000/api/health"
    echo ""
    echo -e "${CYAN}🛠️ Management Commands:${NC}"
    echo "  📋 View logs: sudo -u crm docker-compose -f $DEPLOY_DIR/docker-compose.yml logs -f"
    echo "  🔄 Restart: sudo systemctl restart crm-system"
    echo "  🛑 Stop: sudo systemctl stop crm-system"
    echo "  🚀 Start: sudo systemctl start crm-system"
    echo "  📊 Status: sudo systemctl status crm-system"
    echo ""
    echo -e "${CYAN}📁 Important Locations:${NC}"
    echo "  📂 Application: $DEPLOY_DIR"
    echo "  💾 Database: $DEPLOY_DIR/docker-data/database/crm.db"
    echo "  📎 Uploads: $DEPLOY_DIR/docker-data/uploads/"
    echo "  🗄️ Backups: $BACKUP_DIR"
    echo "  📝 Logs: /var/log/crm/"
    echo ""
    echo -e "${CYAN}🔧 Configuration Files:${NC}"
    echo "  ⚙️ Environment: $DEPLOY_DIR/.env.docker"
    echo "  🐳 Docker Compose: $DEPLOY_DIR/docker-compose.yml"
    echo "  🔧 Service: /etc/systemd/system/crm-system.service"
    echo ""
    print_warning "🔐 Security Notes:"
    echo "  1. Change default passwords in .env.docker"
    echo "  2. Configure SSL certificates for HTTPS"
    echo "  3. Review firewall settings"
    echo "  4. Set up monitoring and alerting"
    echo ""
    print_success "🎯 Your CRM system is ready for production use!"
}

# Main execution
main() {
    print_header "🚀 CRM System Production Deployment"
    echo "This script will deploy the CRM system to this server"
    echo ""
    
    # Check if running as root
    check_root
    
    # Installation and setup
    install_docker
    create_deploy_user
    setup_directories
    deploy_code
    configure_environment
    setup_systemd_service
    setup_log_rotation
    setup_backup_cron
    setup_firewall
    start_services
    
    # Show final information
    show_deployment_info
}

# Run main function
main "$@"
