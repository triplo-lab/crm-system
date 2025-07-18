# 🚀 CRM System - Sistema de Gestão Completo

Um sistema CRM moderno e completo desenvolvido com Next.js, React, TypeScript e Tailwind CSS.

## ✨ Funcionalidades

### 📊 Gestão de Leads
- **Kanban Board** com drag & drop
- **Estados personalizáveis** com cores
- **Atribuição de responsáveis**
- **Filtros e pesquisa avançada**

### 👥 Gestão de Clientes
- **Perfis completos** de clientes
- **Histórico de interações**
- **Documentos e anexos**
- **Soft delete** com lixeira

### 📄 Gestão de Propostas
- **Criação e edição** de propostas
- **Geração de PDF** profissional
- **Sistema de aprovações**
- **Controle de versões**
- **Lixeira com restauração**

### 🏗️ Gestão de Projetos
- **Acompanhamento de progresso**
- **Tarefas e milestones**
- **Relatórios de tempo**
- **Integração com clientes**

### 🔐 Sistema de Utilizadores
- **Autenticação segura** com NextAuth.js
- **Controle de permissões**
- **Perfis de utilizador**
- **Auditoria completa**

### 📈 Relatórios e Analytics
- **Dashboard interativo**
- **Métricas em tempo real**
- **Gráficos e estatísticas**
- **Exportação de dados**

## 🛠️ Tecnologias

### Frontend
- **Next.js 15** - Framework React
- **React 18** - Biblioteca de UI
- **TypeScript** - Tipagem estática
- **Tailwind CSS** - Framework de estilos
- **Lucide React** - Ícones

### Backend
- **Next.js API Routes** - API RESTful
- **Prisma ORM** - Gestão de base de dados
- **NextAuth.js** - Autenticação
- **SQLite** - Base de dados (desenvolvimento)

### Ferramentas
- **jsPDF + html2canvas** - Geração de PDF
- **React DnD** - Drag and drop
- **Date-fns** - Manipulação de datas

## 🚀 Deployment Rápido

### Opção 1: Script Automatizado
```bash
# Para enviar para GitHub
./scripts/setup-github.sh

# Para fazer deployment a partir do GitHub
./scripts/deploy-from-github.sh
```

### Opção 2: Manual
```bash
# Clonar repositório
git clone https://github.com/username/crm-system.git
cd crm-system

# Instalar dependências
npm install

# Configurar ambiente
cp .env.example .env
# Editar .env com suas configurações

# Configurar base de dados
npx prisma generate
npx prisma db push

# Iniciar aplicação
npm run dev  # Desenvolvimento
npm run build && npm start  # Produção
```

## 📋 Requisitos

- **Node.js 18+**
- **npm ou yarn**
- **Git**

## 🔧 Configuração

### Variáveis de Ambiente
```env
# Base de dados
DATABASE_URL="file:./dev.db"

# Autenticação
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-secret-key"
```

### Base de Dados
O sistema suporta:
- **SQLite** (desenvolvimento)
- **PostgreSQL** (produção recomendada)
- **MySQL** (alternativa)

## 📚 Documentação

- **[Guia de Deployment](DEPLOYMENT_GUIDE.md)** - Deployment manual completo
- **[Deployment via GitHub](GITHUB_DEPLOYMENT_GUIDE.md)** - Usando GitHub como intermediário
- **[Histórico de Desenvolvimento](DEVELOPMENT_HISTORY.md)** - Detalhes técnicos e correções

## 🔄 Atualizações

### Servidor Original
```bash
git add .
git commit -m "Descrição das mudanças"
git push origin main
```

### Servidor de Produção
```bash
git pull origin main
npm install
npx prisma generate
npx prisma db push
npm run build
# Reiniciar aplicação
```

## 🛡️ Segurança

- **Autenticação robusta** com sessões seguras
- **Validação de entrada** em todas as APIs
- **Controle de acesso** baseado em permissões
- **Auditoria completa** de ações
- **Sanitização** de dados sensíveis

## 📊 Performance

- **Server-side rendering** com Next.js
- **Otimização automática** de imagens
- **Code splitting** automático
- **Cache inteligente** de dados
- **Lazy loading** de componentes

## 🤝 Contribuição

1. Fork o projeto
2. Crie uma branch para sua feature (`git checkout -b feature/nova-funcionalidade`)
3. Commit suas mudanças (`git commit -m 'Adicionar nova funcionalidade'`)
4. Push para a branch (`git push origin feature/nova-funcionalidade`)
5. Abra um Pull Request

## 📄 Licença

Este projeto está sob a licença MIT. Veja o arquivo [LICENSE](LICENSE) para mais detalhes.

## 🆘 Suporte

Para suporte e dúvidas:
- Consulte a [documentação](DEPLOYMENT_GUIDE.md)
- Abra uma [issue](https://github.com/username/crm-system/issues)
- Verifique o [histórico de desenvolvimento](DEVELOPMENT_HISTORY.md)

## 🎯 Roadmap

### Próximas Funcionalidades
- [ ] **API REST completa** para integrações
- [ ] **App mobile** com React Native
- [ ] **Notificações push** em tempo real
- [ ] **Integração com email** marketing
- [ ] **Relatórios avançados** com BI
- [ ] **Multi-tenancy** para múltiplas empresas

### Melhorias Técnicas
- [ ] **Testes automatizados** (Jest + Cypress)
- [ ] **CI/CD pipeline** com GitHub Actions
- [ ] **Monitorização** com logs estruturados
- [ ] **Cache Redis** para performance
- [ ] **Backup automatizado** da base de dados

---

**Desenvolvido com ❤️ usando tecnologias modernas**
