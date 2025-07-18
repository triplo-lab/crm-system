# 🔒 PROTOCOLO DE SEGURANÇA DE DADOS - CRM

## ⚠️ AVISO CRÍTICO

**NUNCA execute alterações no banco de dados sem seguir este protocolo!**

## 📋 SITUAÇÃO ATUAL DOS DADOS

### ✅ DADOS CONFIRMADOS COMO MOCK/EXEMPLO:
- **Utilizadores:** admin@crm.com, manager@crm.com, employee@crm.com
- **Clientes:** joao@empresa.com, maria@xyz.com (fictícios)
- **Projetos:** "Sistema CRM", "Website Corporativo" (exemplos)
- **Status:** SEGURO para alterações (dados não são reais)

### 📊 BACKUP ATUAL:
- **Arquivo:** `prisma/backups/manual_backup_20250712_193108.db`
- **Tamanho:** 299,008 bytes
- **Data:** 12/07/2025 19:31:08

---

## 🛡️ PROTOCOLO OBRIGATÓRIO

### ANTES DE QUALQUER ALTERAÇÃO:

#### 1. **CRIAR BACKUP:**
```bash
./scripts/create-backup.sh
```

#### 2. **PARA MIGRAÇÕES:**
```bash
./scripts/safe-migration.sh
```

#### 3. **PARA RESTAURAR:**
```bash
./scripts/restore-backup.sh
```

---

## ❌ COMANDOS PROIBIDOS

### NUNCA EXECUTE:
```bash
rm -f prisma/dev.db                    # ❌ ELIMINA TUDO
npx prisma migrate reset --force       # ❌ RESET COMPLETO
npx prisma db push --force-reset       # ❌ FORÇA RESET
```

### ✅ COMANDOS SEGUROS:
```bash
./scripts/create-backup.sh             # ✅ Backup seguro
./scripts/safe-migration.sh            # ✅ Migração segura
npx prisma migrate status              # ✅ Verificar status
npx prisma studio                      # ✅ Visualizar dados
```

---

## 🚨 EM CASO DE EMERGÊNCIA

### SE ALGO CORRER MAL:

1. **PARAR IMEDIATAMENTE** qualquer operação
2. **NÃO EXECUTAR** mais comandos
3. **RESTAURAR** último backup:
   ```bash
   ./scripts/restore-backup.sh
   ```

### SE PERDER DADOS:

1. **Verificar backups disponíveis:**
   ```bash
   ls -la prisma/backups/
   ```

2. **Restaurar backup mais recente:**
   ```bash
   ./scripts/restore-backup.sh
   ```

3. **Verificar integridade:**
   ```bash
   npx prisma studio
   ```

---

## 📈 ESTRATÉGIA DE BACKUP

### FREQUÊNCIA:
- **Antes de cada migração:** OBRIGATÓRIO
- **Antes de alterações:** OBRIGATÓRIO  
- **Backup manual diário:** RECOMENDADO
- **Backup automático:** A IMPLEMENTAR

### RETENÇÃO:
- **Manter últimos 30 backups**
- **Backup semanal permanente**
- **Backup antes de releases**

---

## 🔍 VERIFICAÇÃO DE INTEGRIDADE

### COMANDOS DE VERIFICAÇÃO:
```bash
# Verificar tamanho do banco
ls -la prisma/dev.db

# Verificar estrutura
npx prisma db pull

# Verificar dados
npx prisma studio
```

### SINAIS DE PROBLEMAS:
- ❌ Banco com 0 bytes
- ❌ Erros de migração
- ❌ Tabelas em falta
- ❌ Dados corrompidos

---

## 📞 CONTACTOS DE EMERGÊNCIA

### EM CASO DE PERDA CRÍTICA:
1. **Parar sistema imediatamente**
2. **Não executar mais comandos**
3. **Contactar suporte técnico**
4. **Documentar o que aconteceu**

---

## ✅ CHECKLIST DE SEGURANÇA

Antes de qualquer alteração, confirmar:

- [ ] Backup criado e verificado
- [ ] Comando testado em ambiente de desenvolvimento
- [ ] Plano de rollback definido
- [ ] Tempo de manutenção agendado
- [ ] Utilizadores notificados (se necessário)

---

## 🎯 PRÓXIMOS PASSOS

### MELHORIAS A IMPLEMENTAR:
1. **Backup automático** antes de migrações
2. **Monitorização** de integridade
3. **Alertas** de problemas
4. **Backup remoto** (cloud)
5. **Testes** de restauração regulares

---

**🔒 LEMBRE-SE: A segurança dos dados é PRIORIDADE MÁXIMA!**
