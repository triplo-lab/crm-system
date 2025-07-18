# 🚀 GUIA DE DEPLOYMENT - CRM SYSTEM

## 📋 VISÃO GERAL

Este documento contém todas as instruções necessárias para migrar e inicializar o sistema CRM em qualquer servidor ou ambiente.

## 🎯 REQUISITOS DO SISTEMA

### Software Necessário
```bash
# Node.js (versão 18 ou superior)
node --version

# npm (incluído com Node.js)
npm --version

# Git (opcional, mas recomendado)
git --version
```

### Base de Dados
- **SQLite** (incluída no projeto) OU
- **PostgreSQL/MySQL** (se configurado)

## 📁 PROCESSO DE MIGRAÇÃO

### 1. Copiar Projeto Completo
```bash
# Copiar toda a pasta do projeto
cp -r /caminho/origem/crm /caminho/destino/crm

# OU usar rsync para cópia mais robusta
rsync -av /caminho/origem/crm/ /caminho/destino/crm/
```

### 2. Inicialização no Sistema Destino
```bash
# Navegar para a pasta do projeto
cd /caminho/destino/crm

# Instalar dependências
npm install

# Configurar variáveis de ambiente
cp .env.example .env
# Editar .env com configurações específicas

# Configurar base de dados
npx prisma generate
npx prisma db push

# (Opcional) Popular com dados iniciais
npx prisma db seed

# Iniciar o projeto
npm run dev
```

## 🔧 FICHEIROS IMPORTANTES

### Ficheiros de Configuração
```
.env                    # Variáveis de ambiente
.env.local             # Configurações locais
package.json           # Dependências do projeto
prisma/schema.prisma   # Schema da base de dados
next.config.js         # Configuração do Next.js
tailwind.config.js     # Configuração do Tailwind
```

### Base de Dados
```
prisma/dev.db          # Base de dados SQLite (se existir)
prisma/migrations/     # Migrações da base de dados
```

## ⚙️ CONFIGURAÇÕES ESPECÍFICAS

### Variáveis de Ambiente (.env)
```env
# Base de dados
DATABASE_URL="file:./dev.db"

# NextAuth
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-secret-key"

# Outras configurações específicas
```

### Portas Alternativas
```bash
# Se porta 3000 estiver ocupada
npm run dev -- -p 3001
npm run dev -- -p 8080
```

## 🛠️ COMANDOS DE MANUTENÇÃO

### Reinstalar Dependências
```bash
rm -rf node_modules package-lock.json
npm install
```

### Reset da Base de Dados
```bash
npx prisma generate
npx prisma db push
npx prisma db seed
```

### Verificar Estado do Sistema
```bash
npm run build    # Verificar se compila
npm run lint     # Verificar código
npm run type-check  # Verificar TypeScript
```

## 🔍 RESOLUÇÃO DE PROBLEMAS

### Problema: Dependências em falta
```bash
# Solução:
rm -rf node_modules package-lock.json
npm install
```

### Problema: Base de dados não funciona
```bash
# Solução:
npx prisma generate
npx prisma db push
npx prisma db seed
```

### Problema: Porta ocupada
```bash
# Solução: Usar porta diferente
npm run dev -- -p 3001
```

### Problema: Permissões
```bash
# Solução:
chmod -R 755 /caminho/para/crm
chown -R usuario:grupo /caminho/para/crm
```

## ✅ CHECKLIST DE VERIFICAÇÃO

### Pré-deployment
- [ ] Node.js instalado (v18+)
- [ ] npm funcionando
- [ ] Pasta do projeto copiada completamente
- [ ] Permissões de ficheiros corretas

### Pós-deployment
- [ ] `npm install` executado com sucesso
- [ ] `.env` configurado corretamente
- [ ] Base de dados inicializada
- [ ] `npm run dev` inicia sem erros
- [ ] Aplicação acessível em `http://localhost:3000`
- [ ] Login funciona corretamente
- [ ] Dados aparecem na interface
- [ ] Todas as funcionalidades testadas

## 🐳 DEPLOYMENT COM DOCKER (OPCIONAL)

### Dockerfile
```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npx prisma generate
RUN npm run build
EXPOSE 3000
CMD ["npm", "start"]
```

### Docker Compose
```yaml
version: '3.8'
services:
  crm:
    build: .
    ports:
      - "3000:3000"
    environment:
      - DATABASE_URL=file:./dev.db
      - NEXTAUTH_URL=http://localhost:3000
    volumes:
      - ./prisma:/app/prisma
```

## 📞 SUPORTE

### Como Obter Ajuda
1. **Copiar pasta completa** para o novo sistema
2. **Dar acesso** à pasta no novo sistema
3. **AI Assistant pode executar** todos os comandos necessários
4. **AI Assistant resolve** qualquer problema que apareça
5. **AI Assistant verifica** se tudo está funcionando

### Logs Importantes
```bash
# Logs do servidor
npm run dev

# Logs da base de dados
npx prisma studio

# Logs de build
npm run build
```

---

**🎉 O projeto funcionará perfeitamente no novo sistema seguindo este guia!**
