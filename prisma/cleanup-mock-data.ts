import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function cleanupMockData() {
  console.log('🧹 Removing mock data only...')

  try {
    // Remove specific mock leads by email
    const mockLeadEmails = [
      'pedro@startup.com',
      'ana@consultoria.com'
    ]

    const deletedLeads = await prisma.lead.deleteMany({
      where: {
        email: {
          in: mockLeadEmails
        }
      }
    })
    console.log(`🎯 Removed ${deletedLeads.count} mock leads`)

    // Remove specific mock clients by email
    const mockClientEmails = [
      'joao@empresa.com',
      'maria@techsolutions.com'
    ]

    const deletedClients = await prisma.client.deleteMany({
      where: {
        email: {
          in: mockClientEmails
        }
      }
    })
    console.log(`🏢 Removed ${deletedClients.count} mock clients`)

    // Remove specific mock users by email (keep your real users)
    const mockUserEmails = [
      'admin@crm.com',
      'manager@crm.com',
      'employee@crm.com'
    ]

    const deletedUsers = await prisma.user.deleteMany({
      where: {
        email: {
          in: mockUserEmails
        }
      }
    })
    console.log(`👤 Removed ${deletedUsers.count} mock users`)

    // Remove mock projects by name
    const mockProjectNames = [
      'Website E-commerce',
      'Sistema de Gestão'
    ]

    const deletedProjects = await prisma.project.deleteMany({
      where: {
        name: {
          in: mockProjectNames
        }
      }
    })
    console.log(`📁 Removed ${deletedProjects.count} mock projects`)

    // Remove mock invoices by number pattern
    const deletedInvoices = await prisma.invoice.deleteMany({
      where: {
        number: {
          startsWith: 'INV-2024-'
        }
      }
    })
    console.log(`📄 Removed ${deletedInvoices.count} mock invoices`)

    // Remove mock proposals by title
    const mockProposalTitles = [
      'Website Corporativo',
      'Sistema de Gestão Empresarial'
    ]

    const deletedProposals = await prisma.proposal.deleteMany({
      where: {
        title: {
          in: mockProposalTitles
        }
      }
    })
    console.log(`📋 Removed ${deletedProposals.count} mock proposals`)

    // Remove mock tickets by title pattern
    const deletedTickets = await prisma.ticket.deleteMany({
      where: {
        OR: [
          { title: 'Problema com login' },
          { title: 'Dúvida sobre faturação' }
        ]
      }
    })
    console.log(`🎫 Removed ${deletedTickets.count} mock tickets`)

    // Remove mock knowledge articles
    const deletedArticles = await prisma.knowledgeArticle.deleteMany({
      where: {
        OR: [
          { title: 'Como criar o seu primeiro projeto' },
          { title: 'Gestão de tarefas e prazos' }
        ]
      }
    })
    console.log(`📚 Removed ${deletedArticles.count} mock knowledge articles`)

    // Remove mock company settings (if it's the mock one)
    const deletedCompanySettings = await prisma.companySettings.deleteMany({
      where: {
        name: 'TechSolutions Lda'
      }
    })
    console.log(`⚙️ Removed ${deletedCompanySettings.count} mock company settings`)

    console.log('✅ Mock data cleanup completed!')
    console.log('🎉 Your real data is preserved!')

  } catch (error) {
    console.error('❌ Error during cleanup:', error)
  } finally {
    await prisma.$disconnect()
  }
}

cleanupMockData()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
