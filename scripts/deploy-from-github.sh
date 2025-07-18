#!/bin/bash

# 🚀 Script de Deployment do GitHub - CRM System
# Este script automatiza o deployment do projeto CRM a partir do GitHub

set -e  # Parar em caso de erro

echo "🚀 Iniciando deployment do CRM System a partir do GitHub..."

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Função para imprimir mensagens coloridas
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

# Verificar se Git está instalado
print_status "Verificando se Git está instalado..."
if ! command -v git &> /dev/null; then
    print_error "Git não está instalado. Por favor, instale o Git primeiro."
    exit 1
fi

# Verificar se Node.js está instalado
print_status "Verificando se Node.js está instalado..."
if ! command -v node &> /dev/null; then
    print_error "Node.js não está instalado. Por favor, instale Node.js 18+ primeiro."
    exit 1
fi

# Verificar versão do Node.js
node_version=$(node --version | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$node_version" -lt 18 ]; then
    print_error "Node.js versão 18+ é necessária. Versão atual: $(node --version)"
    exit 1
fi

print_success "Node.js $(node --version) encontrado!"

# Verificar se npm está instalado
if ! command -v npm &> /dev/null; then
    print_error "npm não está instalado."
    exit 1
fi

print_success "npm $(npm --version) encontrado!"

# Solicitar informações do repositório
echo ""
print_status "Configuração do deployment:"

read -p "Digite o URL do repositório GitHub (ex: https://github.com/user/crm-system.git): " repo_url
read -p "Digite o diretório de destino (ex: /home/user/crm): " target_dir

if [ -z "$repo_url" ] || [ -z "$target_dir" ]; then
    print_error "URL do repositório e diretório de destino são obrigatórios."
    exit 1
fi

# Criar diretório pai se não existir
parent_dir=$(dirname "$target_dir")
if [ ! -d "$parent_dir" ]; then
    print_status "Criando diretório pai: $parent_dir"
    mkdir -p "$parent_dir"
fi

# Clonar repositório
if [ -d "$target_dir" ]; then
    print_warning "Diretório $target_dir já existe."
    read -p "Deseja atualizar o código existente? (y/n): " update_existing
    
    if [ "$update_existing" = "y" ] || [ "$update_existing" = "Y" ]; then
        print_status "Atualizando código existente..."
        cd "$target_dir"
        git pull origin main
        print_success "Código atualizado!"
    else
        print_error "Deployment cancelado."
        exit 1
    fi
else
    print_status "Clonando repositório..."
    git clone "$repo_url" "$target_dir"
    print_success "Repositório clonado!"
    cd "$target_dir"
fi

# Instalar dependências
print_status "Instalando dependências..."
npm install
print_success "Dependências instaladas!"

# Configurar variáveis de ambiente
if [ ! -f ".env" ]; then
    if [ -f ".env.example" ]; then
        print_status "Criando ficheiro .env a partir do .env.example..."
        cp .env.example .env
        print_warning "Por favor, edite o ficheiro .env com as configurações específicas deste servidor:"
        echo "  - DATABASE_URL"
        echo "  - NEXTAUTH_URL"
        echo "  - NEXTAUTH_SECRET"
        echo ""
        read -p "Pressione Enter para continuar após editar o .env..."
    else
        print_error ".env.example não encontrado. Criando .env básico..."
        cat > .env << 'EOF'
# Database
DATABASE_URL="file:./dev.db"

# NextAuth
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="change-this-secret-key"
EOF
        print_warning "Ficheiro .env criado. Por favor, edite-o com as configurações corretas."
    fi
else
    print_success "Ficheiro .env já existe."
fi

# Verificar se Prisma está configurado
if [ -f "prisma/schema.prisma" ]; then
    print_status "Configurando base de dados com Prisma..."
    
    # Gerar cliente Prisma
    print_status "Gerando cliente Prisma..."
    npx prisma generate
    print_success "Cliente Prisma gerado!"
    
    # Aplicar schema à base de dados
    print_status "Aplicando schema à base de dados..."
    npx prisma db push
    print_success "Schema aplicado à base de dados!"
    
    # Verificar se existe seed
    if grep -q "prisma.*seed" package.json; then
        read -p "Deseja popular a base de dados com dados iniciais? (y/n): " run_seed
        if [ "$run_seed" = "y" ] || [ "$run_seed" = "Y" ]; then
            print_status "Populando base de dados..."
            npx prisma db seed
            print_success "Base de dados populada!"
        fi
    fi
else
    print_warning "Schema Prisma não encontrado. Pulando configuração da base de dados."
fi

# Verificar se deve fazer build para produção
read -p "Este é um ambiente de produção? (y/n): " is_production

if [ "$is_production" = "y" ] || [ "$is_production" = "Y" ]; then
    print_status "Fazendo build para produção..."
    npm run build
    print_success "Build de produção concluído!"
    
    print_status "Para iniciar em produção, use:"
    echo "  npm start"
    echo ""
    print_status "Para usar PM2 (recomendado para produção):"
    echo "  npm install -g pm2"
    echo "  pm2 start npm --name 'crm' -- start"
    echo "  pm2 save"
    echo "  pm2 startup"
else
    print_status "Iniciando em modo de desenvolvimento..."
    echo "Para iniciar o servidor de desenvolvimento, use:"
    echo "  npm run dev"
fi

# Verificar se tudo está funcionando
print_status "Verificando instalação..."

# Verificar se package.json existe e tem scripts necessários
if [ -f "package.json" ]; then
    if grep -q "\"dev\":" package.json && grep -q "\"build\":" package.json; then
        print_success "Scripts npm encontrados!"
    else
        print_warning "Alguns scripts npm podem estar em falta."
    fi
else
    print_error "package.json não encontrado!"
fi

# Mostrar informações finais
echo ""
print_success "🎉 Deployment concluído com sucesso!"
echo ""
echo "📁 Projeto instalado em: $target_dir"
echo "🌐 Para iniciar:"
if [ "$is_production" = "y" ] || [ "$is_production" = "Y" ]; then
    echo "   cd $target_dir && npm start"
else
    echo "   cd $target_dir && npm run dev"
fi
echo ""
echo "📋 Próximos passos:"
echo "1. Verificar configurações no ficheiro .env"
echo "2. Testar a aplicação"
echo "3. Configurar proxy reverso (nginx) se necessário"
echo "4. Configurar SSL/HTTPS para produção"
echo ""
echo "📚 Documentação disponível em:"
echo "   - DEPLOYMENT_GUIDE.md"
echo "   - GITHUB_DEPLOYMENT_GUIDE.md"
echo "   - DEVELOPMENT_HISTORY.md"

print_status "Script de deployment concluído!"
