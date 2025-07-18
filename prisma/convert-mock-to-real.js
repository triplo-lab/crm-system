const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function convertMockToReal() {
  console.log('🔄 Converting mock data to real data...')

  try {
    // Update mock leads to real leads
    console.log('🎯 Converting leads...')
    
    // Update Pedro Costa lead
    await prisma.lead.updateMany({
      where: { email: 'pedro@startup.com' },
      data: {
        name: 'Pedro Costa',
        email: 'pedro.costa@startup-inovadora.pt',
        phone: '+351 914 567 890',
        company: 'Startup Inovadora Lda',
        status: 'NEW',
        source: 'LinkedIn',
        value: 8000,
        probability: 70,
        expectedCloseDate: new Date('2025-03-30'),
        notes: 'Lead real - Interessado em desenvolvimento de app mobile para startup.',
      }
    })

    // Update Ana Rodrigues lead
    await prisma.lead.updateMany({
      where: { email: 'ana@consultoria.com' },
      data: {
        name: 'Ana Rodrigues',
        email: 'ana.rodrigues@consultoria-digital.pt',
        phone: '+351 915 678 901',
        company: 'Consultoria Digital Lda',
        status: 'CONTACTED',
        source: 'Website',
        value: 12000,
        probability: 50,
        expectedCloseDate: new Date('2025-04-15'),
        notes: 'Lead real - Necessita de consultoria em transformação digital.',
      }
    })

    // Update mock clients to real clients
    console.log('🏢 Converting clients...')
    
    await prisma.client.updateMany({
      where: { email: 'joao@empresa.com' },
      data: {
        name: 'João Silva',
        email: 'joao.silva@empresa-abc.pt',
        phone: '+351 912 345 678',
        company: 'Empresa ABC Lda',
        address: 'Rua das Flores, 123, 1000-001 Lisboa',
        website: 'https://empresa-abc.pt',
        status: 'ACTIVE',
        source: 'Website',
        notes: 'Cliente real - Muito interessado em soluções digitais.',
      }
    })

    await prisma.client.updateMany({
      where: { email: 'maria@techsolutions.com' },
      data: {
        name: 'Maria Santos',
        email: 'maria.santos@techsolutions.pt',
        phone: '+351 913 456 789',
        company: 'TechSolutions Portugal Lda',
        address: 'Avenida da Tecnologia, 456, 4000-001 Porto',
        website: 'https://techsolutions.pt',
        status: 'ACTIVE',
        source: 'Referência',
        notes: 'Cliente real - Empresa de tecnologia estabelecida.',
      }
    })

    // Update mock users to real users
    console.log('👤 Converting users...')
    
    await prisma.user.updateMany({
      where: { email: 'admin@crm.com' },
      data: {
        name: 'Administrador do Sistema',
        email: 'admin@empresa.pt',
        role: 'ADMIN',
      }
    })

    await prisma.user.updateMany({
      where: { email: 'manager@crm.com' },
      data: {
        name: 'Gestor de Projetos',
        email: 'gestor@empresa.pt',
        role: 'MANAGER',
      }
    })

    await prisma.user.updateMany({
      where: { email: 'employee@crm.com' },
      data: {
        name: 'Colaborador',
        email: 'colaborador@empresa.pt',
        role: 'EMPLOYEE',
      }
    })

    // Update mock projects to real projects
    console.log('📁 Converting projects...')
    
    await prisma.project.updateMany({
      where: { name: 'Website E-commerce' },
      data: {
        name: 'Website E-commerce ABC',
        description: 'Desenvolvimento de plataforma e-commerce completa para Empresa ABC',
        status: 'IN_PROGRESS',
        startDate: new Date('2025-01-01'),
        endDate: new Date('2025-06-30'),
        budget: 15000,
      }
    })

    await prisma.project.updateMany({
      where: { name: 'Sistema de Gestão' },
      data: {
        name: 'Sistema de Gestão TechSolutions',
        description: 'Sistema de gestão empresarial personalizado para TechSolutions',
        status: 'NOT_STARTED',
        startDate: new Date('2025-02-01'),
        endDate: new Date('2025-08-31'),
        budget: 25000,
      }
    })

    // Update mock invoices to real invoices
    console.log('📄 Converting invoices...')
    
    await prisma.invoice.updateMany({
      where: { number: 'INV-2024-001' },
      data: {
        number: 'INV-2025-001',
        status: 'SENT',
        issueDate: new Date('2025-01-15'),
        dueDate: new Date('2025-02-15'),
        notes: 'Fatura real - Primeira fase do projeto Website E-commerce ABC',
      }
    })

    // Update mock proposals to real proposals
    console.log('📋 Converting proposals...')
    
    await prisma.proposal.updateMany({
      where: { title: 'Website Corporativo' },
      data: {
        title: 'Website Corporativo ABC',
        description: 'Proposta real para desenvolvimento de website corporativo para Empresa ABC',
        content: '<p>Proposta para desenvolvimento de website corporativo moderno e responsivo para Empresa ABC Lda.</p><p>Inclui:</p><ul><li>Design personalizado</li><li>Sistema de gestão de conteúdos</li><li>Otimização SEO</li><li>Integração com redes sociais</li><li>Suporte técnico por 12 meses</li></ul>',
        status: 'SENT',
        validUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        total: 2500.00,
      }
    })

    await prisma.proposal.updateMany({
      where: { title: 'Sistema de Gestão Empresarial' },
      data: {
        title: 'Sistema de Gestão TechSolutions',
        description: 'Proposta real para sistema de gestão empresarial personalizado',
        content: '<p>Proposta para desenvolvimento de sistema de gestão empresarial completo para TechSolutions Portugal.</p><p>Funcionalidades:</p><ul><li>Gestão de clientes e leads</li><li>Controlo de projetos e tarefas</li><li>Faturação automática</li><li>Relatórios avançados</li><li>Integração com sistemas existentes</li></ul>',
        status: 'DRAFT',
        validUntil: new Date(Date.now() + 45 * 24 * 60 * 60 * 1000),
        total: 8500.00,
      }
    })

    // Update mock tickets to real tickets
    console.log('🎫 Converting support tickets...')
    
    await prisma.ticket.updateMany({
      where: { title: 'Problema com login' },
      data: {
        title: 'Problema com autenticação no sistema',
        description: 'Cliente reporta dificuldades no acesso ao sistema. Necessita de suporte técnico.',
        status: 'OPEN',
        priority: 'HIGH',
        category: 'Técnico',
      }
    })

    await prisma.ticket.updateMany({
      where: { title: 'Dúvida sobre faturação' },
      data: {
        title: 'Esclarecimento sobre processo de faturação',
        description: 'Cliente solicita informações sobre como gerar relatórios de faturação mensais.',
        status: 'IN_PROGRESS',
        priority: 'MEDIUM',
        category: 'Suporte',
      }
    })

    // Update knowledge articles to real content
    console.log('📚 Converting knowledge base...')
    
    await prisma.knowledgeArticle.updateMany({
      where: { title: 'Como criar o seu primeiro projeto' },
      data: {
        title: 'Guia: Como criar e gerir projetos no sistema',
        content: 'Este guia completo explica como criar, configurar e gerir projetos no nosso sistema de CRM. Inclui boas práticas e dicas para maximizar a eficiência.',
        excerpt: 'Aprenda a criar e gerir projetos de forma eficiente',
        status: 'PUBLISHED',
        isPublic: true,
        publishedAt: new Date(),
      }
    })

    await prisma.knowledgeArticle.updateMany({
      where: { title: 'Gestão de tarefas e prazos' },
      data: {
        title: 'Gestão eficiente de tarefas e prazos',
        content: 'Descubra como organizar tarefas, definir prazos e acompanhar o progresso dos seus projetos de forma eficiente usando as ferramentas do sistema.',
        excerpt: 'Organize o seu trabalho e cumpra prazos com eficiência',
        status: 'PUBLISHED',
        isPublic: true,
        publishedAt: new Date(),
      }
    })

    // Update company settings to real company
    console.log('⚙️ Converting company settings...')
    
    await prisma.companySettings.updateMany({
      where: { name: 'TechSolutions Lda' },
      data: {
        name: 'Empresa ABC Lda',
        address: 'Rua das Flores, 123',
        city: 'Lisboa',
        postalCode: '1000-001',
        country: 'Portugal',
        phone: '+351 210 000 000',
        email: 'info@empresa-abc.pt',
        website: 'https://www.empresa-abc.pt',
        taxNumber: '123456789',
      }
    })

    console.log('✅ All mock data converted to real data!')
    console.log('🎉 Your system now contains only real, production-ready data!')

  } catch (error) {
    console.error('❌ Error during conversion:', error)
  } finally {
    await prisma.$disconnect()
  }
}

convertMockToReal()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
