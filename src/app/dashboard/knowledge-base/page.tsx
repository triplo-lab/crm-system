"use client"

import { useEffect, useState } from "react"
import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { 
  Plus, 
  Search, 
  Filter, 
  BookOpen,
  FileText,
  Folder,
  Eye,
  Edit,
  Star,
  Calendar,
  User,
  Loader2,
  Tag
} from "lucide-react"
import { formatDate } from "@/lib/utils"
import Link from "next/link"

interface Article {
  id: string
  title: string
  content: string
  excerpt: string
  category: {
    id: string
    name: string
    color: string
  }
  tags: string[]
  author: {
    id: string
    name: string
  }
  status: 'DRAFT' | 'PUBLISHED' | 'ARCHIVED'
  featured: boolean
  views: number
  likes: number
  createdAt: string
  updatedAt: string
  publishedAt?: string
}

interface Category {
  id: string
  name: string
  description: string
  color: string
  articlesCount: number
}

export default function KnowledgeBasePage() {
  const [articles, setArticles] = useState<Article[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [categoryFilter, setCategoryFilter] = useState<string>("all")
  const [statusFilter, setStatusFilter] = useState<string>("all")

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      setLoading(true)
      const [articlesRes, categoriesRes] = await Promise.all([
        fetch('/api/knowledge-base/articles'),
        fetch('/api/knowledge-base/categories')
      ])
      
      if (articlesRes.ok) {
        const articlesData = await articlesRes.json()
        setArticles(articlesData.articles || [])
      }
      
      if (categoriesRes.ok) {
        const categoriesData = await categoriesRes.json()
        setCategories(categoriesData.categories || [])
      }
    } catch (error) {
      console.error('Error fetching knowledge base data:', error)
    } finally {
      setLoading(false)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'DRAFT':
        return 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20'
      case 'PUBLISHED':
        return 'bg-green-500/10 text-green-400 border-green-500/20'
      case 'ARCHIVED':
        return 'bg-slate-500/10 text-slate-400 border-slate-500/20'
      default:
        return 'bg-slate-500/10 text-slate-400 border-slate-500/20'
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case 'DRAFT':
        return 'Rascunho'
      case 'PUBLISHED':
        return 'Publicado'
      case 'ARCHIVED':
        return 'Arquivado'
      default:
        return status
    }
  }

  const filteredArticles = Array.isArray(articles) ? articles.filter(article => {
    const matchesSearch = article.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         article.content.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         article.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()))
    const matchesCategory = categoryFilter === "all" || article.category.id === categoryFilter
    const matchesStatus = statusFilter === "all" || article.status === statusFilter
    return matchesSearch && matchesCategory && matchesStatus
  }) : []

  if (loading) {
    return (
      <DashboardLayout title="Base de Conhecimento">
        <div className="flex items-center justify-center h-64">
          <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout title="Base de Conhecimento">
      <div className="space-y-6">
        {/* Categories Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {categories.slice(0, 4).map((category) => (
            <Card key={category.id} variant="elevated" hover>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div 
                    className="w-10 h-10 rounded-lg flex items-center justify-center"
                    style={{ backgroundColor: `${category.color}20`, color: category.color }}
                  >
                    <Folder className="w-5 h-5" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-slate-100">{category.name}</h3>
                    <p className="text-sm text-slate-400">
                      {category.articlesCount} artigo{category.articlesCount !== 1 ? 's' : ''}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Header Actions */}
        <div className="flex flex-col sm:flex-row gap-4 justify-between">
          <div className="flex flex-1 gap-4">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
              <Input
                placeholder="Pesquisar artigos..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">Todas as Categorias</option>
              {categories.map(category => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">Todos os Estados</option>
              <option value="PUBLISHED">Publicado</option>
              <option value="DRAFT">Rascunho</option>
              <option value="ARCHIVED">Arquivado</option>
            </select>
          </div>
          <Link href="/dashboard/knowledge-base/new">
            <Button className="gap-2">
              <Plus className="w-4 h-4" />
              Novo Artigo
            </Button>
          </Link>
        </div>

        {/* Articles Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredArticles.map((article) => (
            <Card key={article.id} variant="elevated" hover>
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="space-y-1 flex-1">
                    <div className="flex items-center gap-2">
                      {article.featured && (
                        <Star className="w-4 h-4 text-yellow-400 fill-current" />
                      )}
                      <CardTitle className="text-lg line-clamp-2">{article.title}</CardTitle>
                    </div>
                    <CardDescription className="line-clamp-3">
                      {article.excerpt}
                    </CardDescription>
                  </div>
                  <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border ${getStatusColor(article.status)}`}>
                    {getStatusText(article.status)}
                  </span>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Category */}
                <div className="flex items-center gap-2">
                  <div 
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: article.category.color }}
                  />
                  <span className="text-sm text-slate-400">{article.category.name}</span>
                </div>

                {/* Tags */}
                {article.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {article.tags.slice(0, 3).map((tag, index) => (
                      <span 
                        key={index}
                        className="inline-flex items-center gap-1 px-2 py-1 bg-slate-700 text-slate-300 text-xs rounded"
                      >
                        <Tag className="w-3 h-3" />
                        {tag}
                      </span>
                    ))}
                    {article.tags.length > 3 && (
                      <span className="text-xs text-slate-500">
                        +{article.tags.length - 3} mais
                      </span>
                    )}
                  </div>
                )}

                {/* Stats */}
                <div className="flex items-center justify-between text-sm text-slate-400">
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-1">
                      <Eye className="w-4 h-4" />
                      {article.views}
                    </div>
                    <div className="flex items-center gap-1">
                      <Star className="w-4 h-4" />
                      {article.likes}
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <User className="w-4 h-4" />
                    {article.author.name}
                  </div>
                </div>

                {/* Date */}
                <div className="text-xs text-slate-500">
                  {article.status === 'PUBLISHED' && article.publishedAt
                    ? `Publicado em ${formatDate(article.publishedAt)}`
                    : `Criado em ${formatDate(article.createdAt)}`
                  }
                </div>

                {/* Actions */}
                <div className="flex gap-2 pt-2">
                  <Link href={`/dashboard/knowledge-base/${article.id}`} className="flex-1">
                    <Button variant="outline" size="sm" className="w-full gap-2">
                      <Eye className="w-4 h-4" />
                      Ver
                    </Button>
                  </Link>
                  <Link href={`/dashboard/knowledge-base/${article.id}/edit`}>
                    <Button variant="ghost" size="sm">
                      <Edit className="w-4 h-4" />
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Empty State */}
        {filteredArticles.length === 0 && !loading && (
          <div className="text-center py-12">
            <div className="w-24 h-24 bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-4">
              <BookOpen className="w-12 h-12 text-slate-600" />
            </div>
            <h3 className="text-lg font-semibold text-slate-100 mb-2">
              {searchTerm || categoryFilter !== "all" || statusFilter !== "all" ? "Nenhum artigo encontrado" : "Nenhum artigo criado"}
            </h3>
            <p className="text-slate-400 mb-6">
              {searchTerm || categoryFilter !== "all" || statusFilter !== "all"
                ? "Tente ajustar os filtros de pesquisa" 
                : "Comece criando o seu primeiro artigo"}
            </p>
            {!searchTerm && categoryFilter === "all" && statusFilter === "all" && (
              <Link href="/dashboard/knowledge-base/new">
                <Button className="gap-2">
                  <Plus className="w-4 h-4" />
                  Criar Primeiro Artigo
                </Button>
              </Link>
            )}
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}
