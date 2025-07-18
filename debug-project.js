const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function debugProject() {
  const projectId = 'cmd0hpolj000ak0r71smdgtvp'
  
  try {
    console.log(`🔍 Investigando projeto: ${projectId}`)
    
    // Get project details
    const project = await prisma.project.findUnique({
      where: { id: projectId },
      include: {
        _count: {
          select: {
            tasks: true,
            timeEntries: true,
            proposals: true,
            invoices: true
          }
        },
        client: {
          select: {
            id: true,
            name: true,
            email: true
          }
        },
        manager: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      }
    })

    if (!project) {
      console.log('❌ Projeto não encontrado!')
      return
    }

    console.log('📊 Detalhes do projeto:')
    console.log(`   Nome: ${project.name}`)
    console.log(`   Status: ${project.status}`)
    console.log(`   Cliente: ${project.client?.name || 'N/A'}`)
    console.log(`   Gestor: ${project.manager?.name || 'N/A'}`)
    console.log(`   Criado em: ${project.createdAt}`)
    
    console.log('\n📈 Contadores:')
    console.log(`   Tarefas: ${project._count.tasks}`)
    console.log(`   Entradas de tempo: ${project._count.timeEntries}`)
    console.log(`   Propostas: ${project._count.proposals}`)
    console.log(`   Faturas: ${project._count.invoices}`)

    // Get specific associated data
    if (project._count.tasks > 0) {
      const tasks = await prisma.task.findMany({
        where: { projectId },
        select: {
          id: true,
          title: true,
          status: true,
          createdAt: true
        }
      })
      console.log('\n📋 Tarefas associadas:')
      tasks.forEach(task => {
        console.log(`   - ${task.title} (${task.status})`)
      })
    }

    if (project._count.timeEntries > 0) {
      const timeEntries = await prisma.timeEntry.findMany({
        where: { projectId },
        select: {
          id: true,
          description: true,
          startTime: true,
          duration: true
        }
      })
      console.log('\n⏰ Entradas de tempo associadas:')
      timeEntries.forEach(entry => {
        console.log(`   - ${entry.description || 'Sem descrição'} (${entry.duration || 'N/A'} min)`)
      })
    }

    if (project._count.proposals > 0) {
      const proposals = await prisma.proposal.findMany({
        where: { projectId },
        select: {
          id: true,
          title: true,
          status: true,
          deletedAt: true
        }
      })
      console.log('\n📋 Propostas associadas:')
      proposals.forEach(proposal => {
        console.log(`   - ${proposal.title} (${proposal.status}) ${proposal.deletedAt ? '[ELIMINADA]' : ''}`)
      })
    }

    if (project._count.invoices > 0) {
      const invoices = await prisma.invoice.findMany({
        where: { projectId },
        select: {
          id: true,
          number: true,
          status: true,
          total: true
        }
      })
      console.log('\n💰 Faturas associadas:')
      invoices.forEach(invoice => {
        console.log(`   - ${invoice.number} (${invoice.status}) - €${invoice.total}`)
      })
    }

    // Check if any associated data prevents deletion
    const hasBlockingData = 
      project._count.tasks > 0 ||
      project._count.timeEntries > 0 ||
      project._count.proposals > 0 ||
      project._count.invoices > 0

    console.log(`\n🚫 Pode ser eliminado? ${hasBlockingData ? 'NÃO' : 'SIM'}`)
    
    if (hasBlockingData) {
      console.log('\n💡 Para eliminar este projeto:')
      if (project._count.tasks > 0) {
        console.log(`   1. Elimine as ${project._count.tasks} tarefa(s) associada(s)`)
      }
      if (project._count.timeEntries > 0) {
        console.log(`   2. Elimine as ${project._count.timeEntries} entrada(s) de tempo`)
      }
      if (project._count.proposals > 0) {
        console.log(`   3. Elimine as ${project._count.proposals} proposta(s) associada(s)`)
      }
      if (project._count.invoices > 0) {
        console.log(`   4. Elimine as ${project._count.invoices} fatura(s) associada(s)`)
      }
    }

  } catch (error) {
    console.error('❌ Erro:', error)
  } finally {
    await prisma.$disconnect()
  }
}

debugProject()
