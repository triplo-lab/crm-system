#!/bin/bash

# Script de Restauração Segura
# Use este script para restaurar backups com segurança

set -e

echo "🔒 RESTAURAÇÃO SEGURA DE BACKUP..."

# Verificar se há backups disponíveis
if [ ! -d "prisma/backups" ] || [ -z "$(ls -A prisma/backups 2>/dev/null)" ]; then
    echo "❌ ERRO: Nenhum backup encontrado!"
    exit 1
fi

# Listar backups disponíveis
echo "📋 Backups disponíveis:"
echo ""
ls -la prisma/backups/*.db | nl

echo ""
read -p "Digite o número do backup que deseja restaurar: " backup_number

# Obter o arquivo de backup selecionado
BACKUP_FILE=$(ls prisma/backups/*.db | sed -n "${backup_number}p")

if [ -z "$BACKUP_FILE" ]; then
    echo "❌ ERRO: Backup inválido selecionado!"
    exit 1
fi

echo ""
echo "📦 Backup selecionado: $BACKUP_FILE"
echo "📊 Tamanho: $(stat -f%z "$BACKUP_FILE" 2>/dev/null || stat -c%s "$BACKUP_FILE") bytes"
echo "🕒 Data: $(stat -f%Sm "$BACKUP_FILE" 2>/dev/null || stat -c%y "$BACKUP_FILE")"

# Criar backup do estado atual antes de restaurar
if [ -f "prisma/dev.db" ]; then
    CURRENT_BACKUP="prisma/backups/before_restore_$(date +%Y%m%d_%H%M%S).db"
    echo ""
    echo "💾 Criando backup do estado atual: $CURRENT_BACKUP"
    cp prisma/dev.db "$CURRENT_BACKUP"
fi

echo ""
echo "⚠️  ATENÇÃO: Esta operação irá substituir o banco de dados atual!"
echo "   Backup atual criado em: $CURRENT_BACKUP"
echo ""
read -p "Digite 'RESTAURAR' para confirmar: " confirmation

if [ "$confirmation" != "RESTAURAR" ]; then
    echo "❌ Restauração cancelada pelo utilizador"
    exit 1
fi

# Restaurar backup
echo "🚀 Restaurando backup..."
cp "$BACKUP_FILE" prisma/dev.db

# Verificar se restauração foi bem-sucedida
if [ ! -f "prisma/dev.db" ]; then
    echo "❌ ERRO: Falha na restauração!"
    if [ -f "$CURRENT_BACKUP" ]; then
        echo "🔄 Restaurando estado anterior..."
        cp "$CURRENT_BACKUP" prisma/dev.db
    fi
    exit 1
fi

echo "✅ Backup restaurado com sucesso!"
echo "📁 Backup do estado anterior: $CURRENT_BACKUP"
echo ""
echo "🎉 Restauração concluída com segurança!"
