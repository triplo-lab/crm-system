#!/bin/bash

# Script de Backup Manual Seguro
# Use este script para criar backups manuais

set -e

echo "🔒 CRIANDO BACKUP SEGURO..."

# Verificar se o banco existe
if [ ! -f "prisma/dev.db" ]; then
    echo "❌ ERRO: Banco de dados não encontrado!"
    exit 1
fi

# Criar diretório de backups
mkdir -p prisma/backups

# Criar backup com timestamp detalhado
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
BACKUP_FILE="prisma/backups/manual_backup_${TIMESTAMP}.db"

echo "📦 Criando backup: $BACKUP_FILE"
cp prisma/dev.db "$BACKUP_FILE"

# Verificar integridade do backup
if [ ! -f "$BACKUP_FILE" ]; then
    echo "❌ ERRO: Falha ao criar backup!"
    exit 1
fi

# Verificar tamanho do backup
ORIGINAL_SIZE=$(stat -f%z prisma/dev.db 2>/dev/null || stat -c%s prisma/dev.db)
BACKUP_SIZE=$(stat -f%z "$BACKUP_FILE" 2>/dev/null || stat -c%s "$BACKUP_FILE")

if [ "$ORIGINAL_SIZE" != "$BACKUP_SIZE" ]; then
    echo "❌ ERRO: Tamanhos diferentes! Backup pode estar corrompido!"
    rm "$BACKUP_FILE"
    exit 1
fi

echo "✅ Backup criado com sucesso!"
echo "📁 Localização: $BACKUP_FILE"
echo "📊 Tamanho: $BACKUP_SIZE bytes"
echo "🕒 Data: $(date)"

# Listar backups existentes
echo ""
echo "📋 Backups disponíveis:"
ls -la prisma/backups/*.db 2>/dev/null || echo "   Nenhum backup anterior encontrado"

echo ""
echo "🎉 Backup concluído com segurança!"
