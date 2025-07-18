#!/bin/bash

# 🚀 Script de Setup para GitHub - CRM System
# Este script automatiza o processo de preparação e envio do projeto para GitHub

set -e  # Parar em caso de erro

echo "🚀 Iniciando setup do projeto CRM para GitHub..."

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

# Verificar se estamos no diretório correto
if [ ! -f "package.json" ]; then
    print_error "package.json não encontrado. Execute este script na raiz do projeto CRM."
    exit 1
fi

print_status "Verificando se Git está instalado..."
if ! command -v git &> /dev/null; then
    print_error "Git não está instalado. Por favor, instale o Git primeiro."
    exit 1
fi

print_success "Git encontrado!"

# Inicializar Git se não existir
if [ ! -d ".git" ]; then
    print_status "Inicializando repositório Git..."
    git init
    print_success "Repositório Git inicializado!"
else
    print_warning "Repositório Git já existe."
fi

# Criar .gitignore se não existir
if [ ! -f ".gitignore" ]; then
    print_status "Criando .gitignore..."
    cat > .gitignore << 'EOF'
# Dependencies
node_modules/
npm-debug.log*
yarn-debug.log*
yarn-error.log*

# Environment variables
.env
.env.local
.env.development.local
.env.test.local
.env.production.local

# Database
prisma/dev.db
prisma/dev.db-journal

# Next.js
.next/
out/
build/

# Logs
logs
*.log

# Runtime data
pids
*.pid
*.seed
*.pid.lock

# Coverage directory used by tools like istanbul
coverage/

# OS generated files
.DS_Store
.DS_Store?
._*
.Spotlight-V100
.Trashes
ehthumbs.db
Thumbs.db

# IDE
.vscode/
.idea/
*.swp
*.swo

# Temporary files
*.tmp
*.temp
EOF
    print_success ".gitignore criado!"
else
    print_warning ".gitignore já existe."
fi

# Criar .env.example se não existir
if [ ! -f ".env.example" ]; then
    print_status "Criando .env.example..."
    cat > .env.example << 'EOF'
# Database
DATABASE_URL="file:./dev.db"

# NextAuth
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-secret-key-here"

# Optional: External Database
# DATABASE_URL="postgresql://user:password@localhost:5432/crm"
# DATABASE_URL="mysql://user:password@localhost:3306/crm"
EOF
    print_success ".env.example criado!"
else
    print_warning ".env.example já existe."
fi

# Verificar se .env existe e avisar
if [ -f ".env" ]; then
    print_warning "Ficheiro .env encontrado. Certifica-te de que não contém dados sensíveis antes do commit."
fi

# Adicionar ficheiros ao Git
print_status "Adicionando ficheiros ao Git..."
git add .

# Verificar se há mudanças para commit
if git diff --staged --quiet; then
    print_warning "Nenhuma mudança para commit."
else
    print_status "Fazendo commit inicial..."
    git commit -m "Initial commit: CRM System with all features

- Sistema CRM completo com gestão de clientes, leads e propostas
- Funcionalidades de PDF, lixeira e auditoria implementadas
- Interface moderna com Tailwind CSS
- Base de dados SQLite com Prisma ORM
- Autenticação com NextAuth.js"
    print_success "Commit realizado!"
fi

# Solicitar informações do repositório GitHub
echo ""
print_status "Configuração do repositório GitHub:"
echo "Por favor, cria um repositório no GitHub primeiro em: https://github.com/new"
echo ""

read -p "Digite o username do GitHub: " github_username
read -p "Digite o nome do repositório: " repo_name

if [ -z "$github_username" ] || [ -z "$repo_name" ]; then
    print_error "Username e nome do repositório são obrigatórios."
    exit 1
fi

# Configurar remote origin
github_url="https://github.com/${github_username}/${repo_name}.git"
print_status "Configurando remote origin: $github_url"

# Remover origin existente se houver
if git remote get-url origin &> /dev/null; then
    print_warning "Remote origin já existe. Removendo..."
    git remote remove origin
fi

git remote add origin "$github_url"

# Configurar branch principal
print_status "Configurando branch principal..."
git branch -M main

# Tentar fazer push
print_status "Enviando código para GitHub..."
if git push -u origin main; then
    print_success "Código enviado para GitHub com sucesso!"
    echo ""
    print_success "🎉 Setup completo!"
    echo ""
    echo "Próximos passos:"
    echo "1. Acede ao repositório: https://github.com/${github_username}/${repo_name}"
    echo "2. Para clonar noutro servidor: git clone $github_url"
    echo "3. Segue o guia GITHUB_DEPLOYMENT_GUIDE.md para deployment"
else
    print_error "Erro ao enviar para GitHub. Verifica se:"
    echo "  - O repositório foi criado no GitHub"
    echo "  - Tens permissões de escrita"
    echo "  - A autenticação está configurada (token ou SSH)"
    echo ""
    echo "Para configurar autenticação:"
    echo "  - Token: https://github.com/settings/tokens"
    echo "  - SSH: https://docs.github.com/en/authentication/connecting-to-github-with-ssh"
fi

echo ""
print_status "Script concluído!"
