import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Seeding database...')

  // Create admin user
  const hashedPassword = await bcrypt.hash('admin123', 12)
  
  const adminUser = await prisma.user.upsert({
    where: { email: 'admin@crm.com' },
    update: {},
    create: {
      email: 'admin@crm.com',
      name: 'Administrador',
      password: hashedPassword,
      role: 'ADMIN',
    },
  })

  // Create manager user
  const managerUser = await prisma.user.upsert({
    where: { email: 'manager@crm.com' },
    update: {},
    create: {
      email: 'manager@crm.com',
      name: 'Gestor de Projetos',
      password: hashedPassword,
      role: 'MANAGER',
    },
  })

  // Create employee user
  const employeeUser = await prisma.user.upsert({
    where: { email: 'employee@crm.com' },
    update: {},
    create: {
      email: 'employee@crm.com',
      name: 'Colaborador',
      password: hashedPassword,
      role: 'EMPLOYEE',
    },
  })

  console.log('👤 Users created')

  // Create clients
  const client1 = await prisma.client.upsert({
    where: { email: 'joao@empresa.com' },
    update: {},
    create: {
      name: 'João Silva',
      email: 'joao@empresa.com',
      phone: '+351 912 345 678',
      company: 'Empresa ABC Lda.',
      address: 'Rua das Flores, 123, Lisboa',
      website: 'https://empresa-abc.pt',
      status: 'ACTIVE',
      source: 'Website',
      assignedTo: managerUser.id,
      notes: 'Cliente muito interessado em soluções digitais.',
    },
  })

  const client2 = await prisma.client.upsert({
    where: { email: 'maria@xyz.com' },
    update: {},
    create: {
      name: 'Maria Santos',
      email: 'maria@xyz.com',
      phone: '+351 913 456 789',
      company: 'XYZ Solutions',
      address: 'Avenida da Liberdade, 456, Porto',
      website: 'https://xyz-solutions.pt',
      status: 'ACTIVE',
      source: 'Referência',
      assignedTo: managerUser.id,
      notes: 'Necessita de sistema de gestão completo.',
    },
  })

  console.log('🏢 Clients created')

  // Create projects
  const project1 = await prisma.project.create({
    data: {
      name: 'Website E-commerce',
      description: 'Desenvolvimento de plataforma de e-commerce completa',
      status: 'IN_PROGRESS',
      priority: 'HIGH',
      startDate: new Date('2024-01-15'),
      endDate: new Date('2024-03-15'),
      budget: 15000,
      progress: 65,
      clientId: client1.id,
      managerId: managerUser.id,
    },
  })

  const project2 = await prisma.project.create({
    data: {
      name: 'Sistema CRM',
      description: 'Implementação de sistema de gestão de clientes',
      status: 'IN_PROGRESS',
      priority: 'MEDIUM',
      startDate: new Date('2024-02-01'),
      endDate: new Date('2024-04-30'),
      budget: 25000,
      progress: 30,
      clientId: client2.id,
      managerId: managerUser.id,
    },
  })

  console.log('📁 Projects created')

  // Create tasks
  await prisma.task.createMany({
    data: [
      {
        title: 'Design da Homepage',
        description: 'Criar design responsivo para a página inicial',
        status: 'DONE',
        priority: 'HIGH',
        estimatedHours: 16,
        actualHours: 18,
        projectId: project1.id,
        assigneeId: employeeUser.id,
        completedAt: new Date('2024-01-25'),
      },
      {
        title: 'Desenvolvimento do Carrinho',
        description: 'Implementar funcionalidade de carrinho de compras',
        status: 'IN_PROGRESS',
        priority: 'HIGH',
        estimatedHours: 24,
        actualHours: 12,
        projectId: project1.id,
        assigneeId: employeeUser.id,
        dueDate: new Date('2024-02-15'),
      },
      {
        title: 'Análise de Requisitos',
        description: 'Levantamento detalhado dos requisitos do sistema',
        status: 'DONE',
        priority: 'HIGH',
        estimatedHours: 20,
        actualHours: 22,
        projectId: project2.id,
        assigneeId: managerUser.id,
        completedAt: new Date('2024-02-10'),
      },
      {
        title: 'Desenvolvimento da API',
        description: 'Criar API REST para o sistema CRM',
        status: 'IN_PROGRESS',
        priority: 'MEDIUM',
        estimatedHours: 40,
        actualHours: 15,
        projectId: project2.id,
        assigneeId: employeeUser.id,
        dueDate: new Date('2024-03-01'),
      },
    ],
  })

  console.log('✅ Tasks created')

  // Create leads
  await prisma.lead.createMany({
    data: [
      {
        name: 'Pedro Costa',
        email: 'pedro@startup.com',
        phone: '+351 914 567 890',
        company: 'Startup Inovadora',
        status: 'NEW',
        source: 'LinkedIn',
        value: 8000,
        probability: 70,
        expectedCloseDate: new Date('2024-03-30'),
        assignedTo: managerUser.id,
        notes: 'Interessado em desenvolvimento de app mobile.',
      },
      {
        name: 'Ana Rodrigues',
        email: 'ana@consultoria.com',
        phone: '+351 915 678 901',
        company: 'Consultoria Digital',
        status: 'CONTACTED',
        source: 'Website',
        value: 12000,
        probability: 50,
        expectedCloseDate: new Date('2024-04-15'),
        assignedTo: managerUser.id,
        notes: 'Necessita de consultoria em transformação digital.',
      },
    ],
  })

  console.log('🎯 Leads created')

  // Create invoices
  const invoice1 = await prisma.invoice.create({
    data: {
      number: 'INV-2024-001',
      status: 'SENT',
      issueDate: new Date('2024-01-30'),
      dueDate: new Date('2024-02-29'),
      subtotal: 5000,
      taxRate: 23,
      taxAmount: 1150,
      total: 6150,
      currency: 'EUR',
      clientId: client1.id,
      projectId: project1.id,
      notes: 'Primeira fase do projeto - Design e prototipagem',
    },
  })

  await prisma.invoiceItem.createMany({
    data: [
      {
        description: 'Design da Interface',
        quantity: 1,
        unitPrice: 3000,
        total: 3000,
        invoiceId: invoice1.id,
      },
      {
        description: 'Prototipagem Interativa',
        quantity: 1,
        unitPrice: 2000,
        total: 2000,
        invoiceId: invoice1.id,
      },
    ],
  })

  console.log('💰 Invoices created')

  // Create knowledge base categories and articles
  const category1 = await prisma.knowledgeCategory.create({
    data: {
      name: 'Primeiros Passos',
      description: 'Guias para começar a usar o sistema',
      order: 1,
      isPublic: true,
    },
  })

  const category2 = await prisma.knowledgeCategory.create({
    data: {
      name: 'Gestão de Projetos',
      description: 'Como gerir projetos eficientemente',
      order: 2,
      isPublic: true,
    },
  })

  await prisma.knowledgeArticle.createMany({
    data: [
      {
        title: 'Como criar o seu primeiro projeto',
        content: 'Este guia explica como criar e configurar o seu primeiro projeto no sistema...',
        excerpt: 'Aprenda a criar projetos passo a passo',
        status: 'PUBLISHED',
        isPublic: true,
        views: 45,
        helpful: 12,
        notHelpful: 2,
        categoryId: category1.id,
        authorId: adminUser.id,
        publishedAt: new Date(),
      },
      {
        title: 'Gestão de tarefas e prazos',
        content: 'Descubra como organizar tarefas e gerir prazos de forma eficiente...',
        excerpt: 'Organize o seu trabalho com eficiência',
        status: 'PUBLISHED',
        isPublic: true,
        views: 32,
        helpful: 8,
        notHelpful: 1,
        categoryId: category2.id,
        authorId: managerUser.id,
        publishedAt: new Date(),
      },
    ],
  })

  console.log('📚 Knowledge base created')

  // Create support tickets
  await prisma.ticket.createMany({
    data: [
      {
        title: 'Problema com login',
        description: 'Não consigo fazer login no sistema. Aparece erro de credenciais inválidas.',
        status: 'OPEN',
        priority: 'HIGH',
        category: 'Técnico',
        clientId: client1.id,
        assignedTo: employeeUser.id,
        createdBy: adminUser.id,
      },
      {
        title: 'Dúvida sobre faturação',
        description: 'Como posso gerar relatórios de faturação mensais?',
        status: 'IN_PROGRESS',
        priority: 'MEDIUM',
        category: 'Suporte',
        clientId: client2.id,
        assignedTo: managerUser.id,
        createdBy: adminUser.id,
      },
    ],
  })

  console.log('🎫 Support tickets created')

  // Create proposals
  const proposals = await Promise.all([
    prisma.proposal.create({
      data: {
        title: 'Website Corporativo',
        description: 'Desenvolvimento de website corporativo moderno e responsivo',
        content: '<p>Proposta para desenvolvimento de website corporativo com design moderno, responsivo e otimizado para SEO.</p><p>Inclui:</p><ul><li>Design personalizado</li><li>Sistema de gestão de conteúdos</li><li>Otimização SEO</li><li>Integração com redes sociais</li></ul>',
        status: 'SENT',
        validUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
        total: 2500.00,
        clientId: client1.id,
        createdBy: adminUser.id,
      },
    }),
    prisma.proposal.create({
      data: {
        title: 'Sistema de Gestão',
        description: 'Sistema de gestão personalizado para controlo de inventário',
        content: '<p>Desenvolvimento de sistema de gestão completo para controlo de inventário e vendas.</p>',
        status: 'DRAFT',
        total: 5000.00,
        clientId: client2.id,
        createdBy: managerUser.id,
      },
    }),
  ])

  // Create proposal items
  await Promise.all([
    prisma.proposalItem.create({
      data: {
        title: 'Design e Layout',
        description: 'Criação de design personalizado e layout responsivo',
        quantity: 1,
        unitPrice: 800.00,
        total: 800.00,
        proposalId: proposals[0].id,
      },
    }),
    prisma.proposalItem.create({
      data: {
        title: 'Desenvolvimento Frontend',
        description: 'Implementação do frontend em React/Next.js',
        quantity: 1,
        unitPrice: 1200.00,
        total: 1200.00,
        proposalId: proposals[0].id,
      },
    }),
    prisma.proposalItem.create({
      data: {
        title: 'Sistema de Gestão de Conteúdos',
        description: 'CMS personalizado para gestão de conteúdos',
        quantity: 1,
        unitPrice: 500.00,
        total: 500.00,
        proposalId: proposals[0].id,
      },
    }),
    prisma.proposalItem.create({
      data: {
        title: 'Análise e Planeamento',
        description: 'Análise de requisitos e planeamento do sistema',
        quantity: 40,
        unitPrice: 50.00,
        total: 2000.00,
        proposalId: proposals[1].id,
      },
    }),
    prisma.proposalItem.create({
      data: {
        title: 'Desenvolvimento Backend',
        description: 'Desenvolvimento da API e base de dados',
        quantity: 60,
        unitPrice: 50.00,
        total: 3000.00,
        proposalId: proposals[1].id,
      },
    }),
  ])

  // Create company settings
  await prisma.companySettings.create({
    data: {
      name: 'TechSolutions Lda',
      address: 'Rua da Tecnologia, 123',
      city: 'Lisboa',
      postalCode: '1000-001',
      country: 'Portugal',
      phone: '+351 210 000 000',
      email: 'info@techsolutions.pt',
      website: 'https://www.techsolutions.pt',
      taxNumber: '123456789',
    },
  })

  console.log('💼 Proposals created')
  console.log('🏢 Company settings created')

  // Create default Kanban columns for leads
  await prisma.kanbanColumn.createMany({
    data: [
      { columnId: 'NEW', title: 'Novos', color: 'bg-blue-500', order: 0, boardType: 'leads' },
      { columnId: 'CONTACTED', title: 'Contactados', color: 'bg-yellow-500', order: 1, boardType: 'leads' },
      { columnId: 'QUALIFIED', title: 'Qualificados', color: 'bg-green-500', order: 2, boardType: 'leads' },
      { columnId: 'PROPOSAL', title: 'Propostas', color: 'bg-purple-500', order: 3, boardType: 'leads' },
      { columnId: 'NEGOTIATION', title: 'Negociação', color: 'bg-orange-500', order: 4, boardType: 'leads' },
      { columnId: 'WON', title: 'Ganhos', color: 'bg-emerald-500', order: 5, boardType: 'leads' },
      { columnId: 'LOST', title: 'Perdidos', color: 'bg-red-500', order: 6, boardType: 'leads' }
    ]
  })

  console.log('📋 Kanban columns created')
  console.log('✨ Database seeded successfully!')
  console.log('\n📧 Login credentials:')
  console.log('Admin: admin@crm.com / admin123')
  console.log('Manager: manager@crm.com / admin123')
  console.log('Employee: employee@crm.com / admin123')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
