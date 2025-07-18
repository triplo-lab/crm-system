# 🐙 GUIA DE DEPLOYMENT VIA GITHUB - CRM SYSTEM

## 🎯 VISÃO GERAL

Este guia mostra como usar GitHub como intermediário para migrar o projeto CRM para qualquer servidor, mantendo controle de versão e facilitando futuras atualizações.

## 📋 VANTAGENS DO DEPLOYMENT VIA GITHUB

### ✅ Benefícios
- **Controle de Versão:** Histórico completo de mudanças
- **Backup Automático:** Código seguro na nuvem
- **Colaboração:** Múltiplos desenvolvedores podem contribuir
- **CI/CD:** Possibilidade de automação de deployment
- **Rollback Fácil:** Voltar a versões anteriores rapidamente
- **Sincronização:** Manter múltiplos servidores atualizados

## 🚀 PROCESSO COMPLETO

### FASE 1: PREPARAR PROJETO PARA GITHUB

#### 1. Inicializar Git (se não existir)
```bash
cd /home/ncsys/Desktop/crm
git init
```

#### 2. Criar .gitignore
```bash
# Criar ficheiro .gitignore
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
```

#### 3. Criar .env.example
```bash
# Criar template de variáveis de ambiente
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
```

### FASE 2: ENVIAR PARA GITHUB

#### 1. Adicionar ficheiros ao Git
```bash
git add .
git commit -m "Initial commit: CRM System with all features"
```

#### 2. Criar repositório no GitHub
- Ir para https://github.com
- Clicar em "New repository"
- Nome: `crm-system` (ou outro nome)
- Descrição: "Sistema CRM completo com gestão de clientes, propostas e projetos"
- Escolher: **Private** (recomendado) ou Public
- **NÃO** inicializar com README (já temos ficheiros)

#### 3. Conectar repositório local ao GitHub
```bash
# Substituir 'username' pelo teu username do GitHub
git remote add origin https://github.com/username/crm-system.git
git branch -M main
git push -u origin main
```

### FASE 3: DEPLOYMENT NO SERVIDOR DESTINO

#### 1. Clonar do GitHub
```bash
# No servidor destino
cd /caminho/desejado
git clone https://github.com/username/crm-system.git
cd crm-system
```

#### 2. Configurar ambiente
```bash
# Instalar dependências
npm install

# Configurar variáveis de ambiente
cp .env.example .env
nano .env  # Editar com configurações específicas do servidor
```

#### 3. Configurar base de dados
```bash
# Gerar cliente Prisma
npx prisma generate

# Aplicar schema à base de dados
npx prisma db push

# (Opcional) Popular com dados iniciais
npx prisma db seed
```

#### 4. Iniciar aplicação
```bash
# Desenvolvimento
npm run dev

# Produção
npm run build
npm start
```

## 🔄 ATUALIZAÇÕES FUTURAS

### No Servidor Original (onde desenvolves)
```bash
# Fazer mudanças no código
# ...

# Commit das mudanças
git add .
git commit -m "Descrição das mudanças"
git push origin main
```

### No Servidor de Produção
```bash
# Atualizar código
git pull origin main

# Reinstalar dependências (se necessário)
npm install

# Atualizar base de dados (se houve mudanças no schema)
npx prisma generate
npx prisma db push

# Reiniciar aplicação
npm run build  # Se em produção
# Reiniciar processo (PM2, systemd, etc.)
```

## 🔐 CONFIGURAÇÕES DE SEGURANÇA

### Variáveis de Ambiente por Servidor
```bash
# Servidor de Desenvolvimento
DATABASE_URL="file:./dev.db"
NEXTAUTH_URL="http://localhost:3000"

# Servidor de Produção
DATABASE_URL="postgresql://user:pass@prod-db:5432/crm"
NEXTAUTH_URL="https://crm.empresa.com"
NEXTAUTH_SECRET="super-secret-production-key"
```

### Ficheiros Sensíveis
```bash
# NUNCA commitar estes ficheiros:
.env
.env.local
prisma/dev.db
node_modules/
```

## 🛠️ AUTOMAÇÃO COM GITHUB ACTIONS (OPCIONAL)

### Criar .github/workflows/deploy.yml
```yaml
name: Deploy to Production

on:
  push:
    branches: [ main ]

jobs:
  deploy:
    runs-on: ubuntu-latest
    
    steps:
    - uses: actions/checkout@v3
    
    - name: Setup Node.js
      uses: actions/setup-node@v3
      with:
        node-version: '18'
        
    - name: Install dependencies
      run: npm install
      
    - name: Build application
      run: npm run build
      
    - name: Deploy to server
      run: |
        # Comandos para deployment automático
        echo "Deploy to production server"
```

## 📊 GESTÃO DE BRANCHES

### Estratégia Recomendada
```bash
# Branch principal (produção)
main

# Branch de desenvolvimento
git checkout -b development
git push -u origin development

# Features específicas
git checkout -b feature/nova-funcionalidade
git push -u origin feature/nova-funcionalidade
```

### Workflow de Desenvolvimento
```bash
# 1. Criar feature branch
git checkout -b feature/melhorias-pdf

# 2. Desenvolver e testar
# ... fazer mudanças ...

# 3. Commit e push
git add .
git commit -m "Melhorias na geração de PDF"
git push origin feature/melhorias-pdf

# 4. Criar Pull Request no GitHub
# 5. Merge para main após revisão
# 6. Deploy automático ou manual
```

## 🔍 COMANDOS ÚTEIS

### Verificar estado do repositório
```bash
git status                    # Estado atual
git log --oneline            # Histórico de commits
git remote -v                # Repositórios remotos
git branch -a                # Todas as branches
```

### Resolver conflitos
```bash
git pull origin main         # Atualizar com mudanças remotas
# Resolver conflitos manualmente
git add .
git commit -m "Resolver conflitos"
git push origin main
```

### Rollback para versão anterior
```bash
git log --oneline            # Ver commits
git checkout <commit-hash>   # Voltar a commit específico
git checkout -b hotfix       # Criar branch para correção
```

## ✅ CHECKLIST DE DEPLOYMENT

### Preparação
- [ ] .gitignore configurado corretamente
- [ ] .env.example criado
- [ ] Ficheiros sensíveis não commitados
- [ ] Código testado localmente

### GitHub
- [ ] Repositório criado no GitHub
- [ ] Código enviado com sucesso
- [ ] README.md atualizado
- [ ] Releases taggeadas (opcional)

### Servidor Destino
- [ ] Código clonado do GitHub
- [ ] Dependências instaladas
- [ ] .env configurado para o ambiente
- [ ] Base de dados configurada
- [ ] Aplicação iniciada com sucesso
- [ ] Todas as funcionalidades testadas

---

**🎉 DEPLOYMENT VIA GITHUB CONFIGURADO!**

Agora podes migrar o projeto para qualquer servidor usando GitHub como intermediário, mantendo controle de versão e facilitando futuras atualizações!
