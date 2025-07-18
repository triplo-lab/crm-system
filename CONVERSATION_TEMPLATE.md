# 🎯 TEMPLATE PARA NOVA CONVERSA - CRM SYSTEM

## **CONTEXTO ATUAL:**
Sistema CRM Laravel/Node.js + React + Tailwind CSS com funcionalidades completas de gestão.

## **✅ STATUS IMPLEMENTADO:**

### **🗑️ SOFT DELETE SYSTEM - COMPLETO**
- **Schema:** Campos `deletedAt`, `deletedBy` nos modelos Lead/Proposal
- **APIs:** Lixeira completa para leads (/api/leads/trash)
- **Interface:** Página lixeira leads (/dashboard/leads/trash) funcionando
- **Kanban:** Botões lixeira nos cards com confirmação
- **Filtros:** Soft delete ativo em todas as APIs principais
- **Segurança:** Auditoria completa, apenas admins eliminam permanentemente

### **👥 GESTÃO DE CLIENTES - COMPLETO**
- **CRUD completo:** Criar, visualizar, editar, eliminar clientes
- **Validações:** Não permite eliminar clientes com projetos/leads
- **Interface:** Cards modernos, formulários profissionais
- **Segurança:** Confirmações obrigatórias para eliminação

### **📊 LEADS KANBAN - COMPLETO**
- **Kanban moderno:** Drag & drop, colunas personalizáveis
- **Cards elegantes:** Hover effects, quick actions
- **Responsabilidade:** Avatares de utilizadores responsáveis
- **Estados visuais:** Cores diferentes para aprovação/não aprovação

### **📋 PROPOSTAS - COMPLETO**
- **Gestão completa:** CRUD, PDF generation, impressão
- **Aprovações:** Secções admin e cliente (internas)
- **Layout:** Lista profissional (não cards)
- **Headers:** Editáveis para logos e endereços empresa

### **🔐 SISTEMA BASE - COMPLETO**
- **Autenticação:** NextAuth funcionando
- **Permissões:** Sistema de roles (falta implementar funções)
- **Base dados:** PostgreSQL/SQLite com Prisma
- **Auditoria:** Activity logging system-wide

## **⏳ PRÓXIMOS OBJETIVOS IDENTIFICADOS:**
- [ ] Página lixeira para propostas (/dashboard/proposals/trash)
- [ ] Implementar funções/capacidades no sistema de permissões
- [ ] Backup/restore manual na Administração
- [ ] Auto-limpeza lixeira após X dias
- [ ] Melhorar estrutura UI das secções mal organizadas

## **🎯 OBJETIVO ATUAL:**
[DESCREVER O QUE QUER FAZER AGORA]

## **📁 ARQUIVOS PRINCIPAIS MODIFICADOS:**
```
prisma/schema.prisma - Schema com soft delete
src/app/api/leads/ - APIs com filtros soft delete
src/app/api/proposals/ - APIs propostas
src/app/api/clients/ - APIs clientes com validações
src/components/kanban/ - Cards modernos com lixeira
src/app/dashboard/leads/ - Páginas leads + lixeira
src/app/dashboard/clients/ - Gestão completa clientes
src/app/dashboard/proposals/ - Gestão propostas
```

## **🚨 REQUISITOS CRÍTICOS:**
- **Preservar dados:** Nunca eliminar dados reais durante modificações
- **Usar package managers:** npm/yarn para dependências (não editar package.json)
- **Segurança:** Confirmações obrigatórias para ações destrutivas
- **Consistência:** Manter design dark theme + Tailwind CSS

## **💾 DADOS ATUAIS:**
- Sistema conectado à base dados real (não mock data)
- Leads, clientes, utilizadores existem e devem ser preservados
- Todas as funcionalidades testadas e funcionais

---

**USAR ESTE TEMPLATE:** Copie e cole numa nova conversa, substitua [OBJETIVO ATUAL] pelo que quer implementar.
