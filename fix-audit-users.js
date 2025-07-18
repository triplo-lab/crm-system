const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function fixAuditUsers() {
  try {
    console.log('🔍 Verificando problemas de auditoria...')
    
    // 1. Find all unique user IDs referenced in system activities
    const auditUserIds = await prisma.systemActivity.findMany({
      select: { userId: true },
      distinct: ['userId']
    })
    
    console.log(`📊 Encontrados ${auditUserIds.length} IDs únicos de usuários em logs de auditoria`)
    
    // 2. Check which users actually exist
    const existingUsers = await prisma.user.findMany({
      select: { id: true, name: true, email: true }
    })
    
    const existingUserIds = new Set(existingUsers.map(u => u.id))
    console.log(`👥 Encontrados ${existingUsers.length} usuários válidos na base de dados`)
    
    // 3. Find orphaned audit logs
    const orphanedUserIds = auditUserIds
      .map(a => a.userId)
      .filter(userId => userId !== 'system' && !existingUserIds.has(userId))
    
    if (orphanedUserIds.length > 0) {
      console.log(`⚠️ Encontrados ${orphanedUserIds.length} IDs de usuários órfãos em logs de auditoria:`)
      orphanedUserIds.forEach(id => console.log(`   - ${id}`))
      
      // 4. Update orphaned audit logs to use 'system' user
      const updateResult = await prisma.systemActivity.updateMany({
        where: {
          userId: {
            in: orphanedUserIds
          }
        },
        data: {
          userId: 'system',
          userName: 'Sistema (usuário removido)'
        }
      })
      
      console.log(`✅ Atualizados ${updateResult.count} logs de auditoria órfãos`)
    } else {
      console.log('✅ Nenhum log de auditoria órfão encontrado')
    }
    
    // 5. Check for other tables with user references
    console.log('\n🔍 Verificando outras tabelas com referências de usuários...')
    
    // Check leads
    const leadsWithInvalidUsers = await prisma.lead.findMany({
      where: {
        OR: [
          {
            assignedTo: {
              not: null,
              notIn: Array.from(existingUserIds)
            }
          },
          {
            deletedBy: {
              not: null,
              notIn: Array.from(existingUserIds).concat(['system'])
            }
          }
        ]
      },
      select: { id: true, name: true, assignedTo: true, deletedBy: true }
    })

    if (leadsWithInvalidUsers.length > 0) {
      console.log(`⚠️ Encontrados ${leadsWithInvalidUsers.length} leads com referências de usuários inválidas`)

      // Fix leads with invalid assigned users
      for (const lead of leadsWithInvalidUsers) {
        if (lead.assignedTo && !existingUserIds.has(lead.assignedTo)) {
          await prisma.lead.update({
            where: { id: lead.id },
            data: { assignedTo: null }
          })
          console.log(`   ✅ Removida referência inválida de assignedTo do lead: ${lead.name}`)
        }

        if (lead.deletedBy && lead.deletedBy !== 'system' && !existingUserIds.has(lead.deletedBy)) {
          await prisma.lead.update({
            where: { id: lead.id },
            data: { deletedBy: 'system' }
          })
          console.log(`   ✅ Corrigida referência de deletedBy do lead: ${lead.name}`)
        }
      }
    } else {
      console.log('✅ Todas as referências de usuários em leads estão válidas')
    }
    
    // Check proposals
    const proposalsWithInvalidUsers = await prisma.proposal.findMany({
      where: {
        OR: [
          { createdBy: { notIn: Array.from(existingUserIds) } },
          { deletedBy: { notIn: Array.from(existingUserIds).concat(['system']) } }
        ]
      },
      select: { id: true, title: true, createdBy: true, deletedBy: true }
    })
    
    if (proposalsWithInvalidUsers.length > 0) {
      console.log(`⚠️ Encontradas ${proposalsWithInvalidUsers.length} propostas com referências de usuários inválidas`)
      
      // Get the first valid user as fallback
      const fallbackUser = existingUsers[0]
      
      for (const proposal of proposalsWithInvalidUsers) {
        if (!existingUserIds.has(proposal.createdBy)) {
          await prisma.proposal.update({
            where: { id: proposal.id },
            data: { createdBy: fallbackUser.id }
          })
          console.log(`   ✅ Corrigida referência de createdBy da proposta: ${proposal.title}`)
        }
        
        if (proposal.deletedBy && proposal.deletedBy !== 'system' && !existingUserIds.has(proposal.deletedBy)) {
          await prisma.proposal.update({
            where: { id: proposal.id },
            data: { deletedBy: 'system' }
          })
          console.log(`   ✅ Corrigida referência de deletedBy da proposta: ${proposal.title}`)
        }
      }
    } else {
      console.log('✅ Todas as referências de usuários em propostas estão válidas')
    }
    
    // 6. Summary
    console.log('\n📊 Resumo da correção:')
    console.log(`   👥 Usuários válidos: ${existingUsers.length}`)
    console.log(`   🔧 Logs de auditoria corrigidos: ${orphanedUserIds.length > 0 ? 'Sim' : 'Não'}`)
    console.log(`   📋 Leads corrigidos: ${leadsWithInvalidUsers.length > 0 ? 'Sim' : 'Não'}`)
    console.log(`   📄 Propostas corrigidas: ${proposalsWithInvalidUsers.length > 0 ? 'Sim' : 'Não'}`)
    
    console.log('\n✅ Correção de auditoria concluída!')
    
  } catch (error) {
    console.error('❌ Erro durante a correção:', error)
  } finally {
    await prisma.$disconnect()
  }
}

fixAuditUsers()
