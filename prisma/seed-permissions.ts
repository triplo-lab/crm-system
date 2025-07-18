import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

const PERMISSIONS = [
  // Leads
  { name: 'leads.view', description: 'Visualizar leads', module: 'leads', action: 'view' },
  { name: 'leads.create', description: 'Criar leads', module: 'leads', action: 'create' },
  { name: 'leads.edit', description: 'Editar leads', module: 'leads', action: 'edit' },
  { name: 'leads.delete', description: 'Eliminar leads', module: 'leads', action: 'delete' },
  { name: 'leads.assign', description: 'Atribuir leads', module: 'leads', action: 'assign' },
  { name: 'leads.export', description: 'Exportar leads', module: 'leads', action: 'export' },

  // Clientes
  { name: 'clients.view', description: 'Visualizar clientes', module: 'clients', action: 'view' },
  { name: 'clients.create', description: 'Criar clientes', module: 'clients', action: 'create' },
  { name: 'clients.edit', description: 'Editar clientes', module: 'clients', action: 'edit' },
  { name: 'clients.delete', description: 'Eliminar clientes', module: 'clients', action: 'delete' },

  // Projetos
  { name: 'projects.view', description: 'Visualizar projetos', module: 'projects', action: 'view' },
  { name: 'projects.create', description: 'Criar projetos', module: 'projects', action: 'create' },
  { name: 'projects.edit', description: 'Editar projetos', module: 'projects', action: 'edit' },
  { name: 'projects.delete', description: 'Eliminar projetos', module: 'projects', action: 'delete' },
  { name: 'projects.manage', description: 'Gerir projetos', module: 'projects', action: 'manage' },

  // Propostas
  { name: 'proposals.view', description: 'Visualizar propostas', module: 'proposals', action: 'view' },
  { name: 'proposals.create', description: 'Criar propostas', module: 'proposals', action: 'create' },
  { name: 'proposals.edit', description: 'Editar propostas', module: 'proposals', action: 'edit' },
  { name: 'proposals.delete', description: 'Eliminar propostas', module: 'proposals', action: 'delete' },
  { name: 'proposals.approve', description: 'Aprovar propostas', module: 'proposals', action: 'approve' },
  { name: 'proposals.send', description: 'Enviar propostas', module: 'proposals', action: 'send' },

  // Tarefas
  { name: 'tasks.view', description: 'Visualizar tarefas', module: 'tasks', action: 'view' },
  { name: 'tasks.create', description: 'Criar tarefas', module: 'tasks', action: 'create' },
  { name: 'tasks.edit', description: 'Editar tarefas', module: 'tasks', action: 'edit' },
  { name: 'tasks.delete', description: 'Eliminar tarefas', module: 'tasks', action: 'delete' },
  { name: 'tasks.assign', description: 'Atribuir tarefas', module: 'tasks', action: 'assign' },

  // Faturas
  { name: 'invoices.view', description: 'Visualizar faturas', module: 'invoices', action: 'view' },
  { name: 'invoices.create', description: 'Criar faturas', module: 'invoices', action: 'create' },
  { name: 'invoices.edit', description: 'Editar faturas', module: 'invoices', action: 'edit' },
  { name: 'invoices.delete', description: 'Eliminar faturas', module: 'invoices', action: 'delete' },
  { name: 'invoices.send', description: 'Enviar faturas', module: 'invoices', action: 'send' },

  // Tickets
  { name: 'tickets.view', description: 'Visualizar tickets', module: 'tickets', action: 'view' },
  { name: 'tickets.create', description: 'Criar tickets', module: 'tickets', action: 'create' },
  { name: 'tickets.edit', description: 'Editar tickets', module: 'tickets', action: 'edit' },
  { name: 'tickets.assign', description: 'Atribuir tickets', module: 'tickets', action: 'assign' },
  { name: 'tickets.close', description: 'Fechar tickets', module: 'tickets', action: 'close' },

  // Utilizadores
  { name: 'users.view', description: 'Visualizar utilizadores', module: 'users', action: 'view' },
  { name: 'users.create', description: 'Criar utilizadores', module: 'users', action: 'create' },
  { name: 'users.edit', description: 'Editar utilizadores', module: 'users', action: 'edit' },
  { name: 'users.delete', description: 'Eliminar utilizadores', module: 'users', action: 'delete' },
  { name: 'users.manage_permissions', description: 'Gerir permissões', module: 'users', action: 'manage_permissions' },

  // Relatórios
  { name: 'reports.view', description: 'Visualizar relatórios', module: 'reports', action: 'view' },
  { name: 'reports.export', description: 'Exportar relatórios', module: 'reports', action: 'export' },
  { name: 'reports.financial', description: 'Ver dados financeiros', module: 'reports', action: 'financial' },

  // Sistema
  { name: 'system.admin', description: 'Acesso administrativo', module: 'system', action: 'admin' },
  { name: 'system.backup', description: 'Fazer backups', module: 'system', action: 'backup' },
  { name: 'system.settings', description: 'Configurações do sistema', module: 'system', action: 'settings' },
  { name: 'system.audit', description: 'Ver logs de auditoria', module: 'system', action: 'audit' }
]

const ROLES = [
  {
    name: 'Representante de Vendas',
    description: 'Acesso básico a leads e propostas',
    baseRole: 'EMPLOYEE',
    permissions: [
      'leads.view', 'leads.create', 'leads.edit',
      'clients.view', 'clients.create', 'clients.edit',
      'proposals.view', 'proposals.create', 'proposals.edit',
      'tasks.view', 'tasks.create', 'tasks.edit'
    ]
  },
  {
    name: 'Gestor de Vendas',
    description: 'Gestão completa de vendas e equipas',
    baseRole: 'MANAGER',
    permissions: [
      'leads.view', 'leads.create', 'leads.edit', 'leads.delete', 'leads.assign', 'leads.export',
      'clients.view', 'clients.create', 'clients.edit', 'clients.delete',
      'proposals.view', 'proposals.create', 'proposals.edit', 'proposals.approve', 'proposals.send',
      'projects.view', 'projects.create', 'projects.edit', 'projects.manage',
      'tasks.view', 'tasks.create', 'tasks.edit', 'tasks.assign',
      'users.view', 'reports.view', 'reports.export'
    ]
  },
  {
    name: 'Gestor de Projetos',
    description: 'Gestão de projetos e tarefas',
    baseRole: 'MANAGER',
    permissions: [
      'projects.view', 'projects.create', 'projects.edit', 'projects.manage',
      'tasks.view', 'tasks.create', 'tasks.edit', 'tasks.assign',
      'clients.view', 'users.view', 'reports.view'
    ]
  },
  {
    name: 'Administrador do Sistema',
    description: 'Acesso total ao sistema',
    baseRole: 'ADMIN',
    permissions: PERMISSIONS.map(p => p.name) // Todas as permissões
  }
]

async function seedPermissions() {
  console.log('🔐 Seeding permissions...')

  // Create permissions
  for (const permission of PERMISSIONS) {
    await prisma.permission.upsert({
      where: { name: permission.name },
      update: permission,
      create: permission
    })
  }

  console.log(`✅ Created ${PERMISSIONS.length} permissions`)

  // Create roles
  for (const roleData of ROLES) {
    const { permissions, ...roleInfo } = roleData
    
    const role = await prisma.role.upsert({
      where: { name: roleInfo.name },
      update: roleInfo,
      create: roleInfo
    })

    // Clear existing permissions for this role
    await prisma.rolePermission.deleteMany({
      where: { roleId: role.id }
    })

    // Add permissions to role
    for (const permissionName of permissions) {
      const permission = await prisma.permission.findUnique({
        where: { name: permissionName }
      })

      if (permission) {
        await prisma.rolePermission.create({
          data: {
            roleId: role.id,
            permissionId: permission.id,
            granted: true
          }
        })
      }
    }
  }

  console.log(`✅ Created ${ROLES.length} roles with permissions`)
}

async function main() {
  try {
    await seedPermissions()
    console.log('🎉 Permissions seeded successfully!')
  } catch (error) {
    console.error('❌ Error seeding permissions:', error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

if (require.main === module) {
  main()
    .catch((e) => {
      console.error(e)
      process.exit(1)
    })
}

export { seedPermissions }
