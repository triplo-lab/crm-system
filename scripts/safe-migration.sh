#!/bin/bash

# Script de Migração Segura
# NUNCA execute migrações sem este script!

set -e  # Para na primeira falha

echo "🔒 INICIANDO MIGRAÇÃO SEGURA..."

# Verificar se o banco existe
if [ ! -f "prisma/dev.db" ]; then
    echo "❌ ERRO: Banco de dados não encontrado!"
    exit 1
fi

# Criar diretório de backups se não existir
mkdir -p prisma/backups

# Criar backup com timestamp
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
BACKUP_FILE="prisma/backups/backup_before_migration_${TIMESTAMP}.db"

echo "📦 Criando backup: $BACKUP_FILE"
cp prisma/dev.db "$BACKUP_FILE"

# Verificar se backup foi criado
if [ ! -f "$BACKUP_FILE" ]; then
    echo "❌ ERRO: Falha ao criar backup!"
    exit 1
fi

echo "✅ Backup criado com sucesso!"

# Verificar status das migrações
echo "🔍 Verificando status das migrações..."
npx prisma migrate status

# Perguntar confirmação
echo ""
echo "⚠️  ATENÇÃO: Tem certeza que deseja continuar com a migração?"
echo "   Backup criado em: $BACKUP_FILE"
echo ""
read -p "Digite 'CONFIRMO' para continuar: " confirmation

if [ "$confirmation" != "CONFIRMO" ]; then
    echo "❌ Migração cancelada pelo utilizador"
    exit 1
fi

# Executar migração
echo "🚀 Executando migração..."
if npx prisma migrate dev; then
    echo "✅ Migração executada com sucesso!"
    echo "📦 Backup disponível em: $BACKUP_FILE"
else
    echo "❌ ERRO na migração! Restaurando backup..."
    cp "$BACKUP_FILE" prisma/dev.db
    echo "✅ Banco restaurado do backup"
    exit 1
fi

echo "🎉 Migração concluída com segurança!"
