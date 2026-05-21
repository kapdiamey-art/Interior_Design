'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { projectsAPI } from '@/lib/api'
import { useAuthStore } from '@/stores/authStore'
import Navbar from '@/components/Navbar'
import toast from 'react-hot-toast'
import { motion } from 'framer-motion'
import {
  Plus, ArrowRight, Clock, CheckCircle2, FileText,
  Home, Sparkles, TrendingUp, Edit3, Activity, MapPin
} from 'lucide-react'
import Link from 'next/link'
import clsx from 'clsx'

const STATUS_CONFIG: Record<string, { label: string; color: string; icon: any }> = {
  draft:   { label: 'Draft',       color: 'bg-slate-100 text-slate-600',   icon: Edit3 },
  quoted:  { label: 'Quoted',      color: 'bg-amber-100 text-amber-700',   icon: FileText },
  ordered: { label: 'In Progress', color: 'bg-blue-100 text-blue-700',     icon: TrendingUp },
  done:    { label: 'Completed',   color: 'bg-emerald-100 text-emerald-700', icon: CheckCircle2 },
}

function ProjectCard({ project }: { project: any }) {
  const status = STATUS_CONFIG[project.status] || STATUS_CONFIG.draft
  const isExecution = ['ordered', 'done'].includes(project.status)

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-2xl shadow-card border border-slate-100 overflow-hidden card-hover"
    >
      {/* Color accent bar */}
      <div className={clsx(
        'h-1.5',
        project.status === 'done'    ? 'bg-gradient-to-r from-emerald-400 to-emerald-600' :
        project.status === 'ordered' ? 'bg-gradient-to-r from-blue-400 to-blue-600' :
        project.status === 'quoted'  ? 'bg-gradient-to-r from-amber-400 to-amber-600' :
        'bg-gradient-to-r from-indigo-500 to-indigo-700'
      )} />

      <div className="p-5">
        <div className="flex items-start justify-between mb-3">
          <div className="flex-1 min-w-0">
            <h3 className="font-bold text-slate-800 text-lg leading-tight truncate">{project.property_name}</h3>
            <div className="flex items-center gap-1.5 text-sm text-slate-500 mt-0.5">
              <span>{project.bhk_type}</span>
              <span>•</span>
              <MapPin className="w-3 h-3" />
              <span>{project.city}</span>
            </div>
          </div>
          <span className={clsx('badge ml-2 flex-shrink-0', status.color)}>
            <status.icon className="w-3 h-3 inline mr-1" />{status.label}
          </span>
        </div>

        <div className="grid grid-cols-2 gap-3 mb-4">
          {[
            { label: 'Budget', value: `₹${(project.budget / 100000).toFixed(1)}L` },
            { label: 'Created', value: new Date(project.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: '2-digit' }) },
          ].map((s) => (
            <div key={s.label} className="bg-slate-50 rounded-xl p-3">
              <div className="text-xs text-slate-400 mb-0.5">{s.label}</div>
              <div className="font-semibold text-slate-800 text-sm">{s.value}</div>
            </div>
          ))}
        </div>

        {/* Execution phase highlight */}
        {isExecution && (
          <div className="mb-4 flex items-center gap-2 bg-blue-50 border border-blue-100 rounded-xl px-3 py-2">
            <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
            <span className="text-xs font-medium text-blue-700">
              {project.status === 'done' ? '✅ Handover Complete' : '🔨 Execution In Progress'}
            </span>
          </div>
        )}

        <div className="flex gap-2">
          <Link href={`/customize/${project.id}`}
            className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-slate-100 text-slate-700 text-sm font-medium hover:bg-slate-200 transition">
            <Edit3 className="w-3.5 h-3.5" /> Customise
          </Link>
          <Link href={`/visualize/${project.id}`}
            className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-indigo-50 text-indigo-700 text-sm font-medium hover:bg-indigo-100 transition">
            <Sparkles className="w-3.5 h-3.5" /> AI View
          </Link>
          {project.status === 'draft' ? (
            <Link href={`/quotation/${project.id}`}
              className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-indigo-600 text-white text-sm font-medium hover:bg-indigo-700 transition">
              <FileText className="w-3.5 h-3.5" /> Quote
            </Link>
          ) : (
            <Link href={`/track/${project.id}`}
              className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-indigo-600 text-white text-sm font-medium hover:bg-indigo-700 transition">
              <Activity className="w-3.5 h-3.5" /> Track
            </Link>
          )}
        </div>
      </div>
    </motion.div>
  )
}

export default function DashboardPage() {
  const router = useRouter()
  const { isLoggedIn, user, fetchMe } = useAuthStore()
  const [projects, setProjects] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!isLoggedIn) { router.push('/login'); return }
    fetchMe()
    loadProjects()
  }, [isLoggedIn])

  const loadProjects = async () => {
    try {
      const res = await projectsAPI.list()
      setProjects(res.data.projects || [])
    } catch {
      toast.error('Failed to load projects')
    } finally {
      setLoading(false)
    }
  }

  const greeting = () => {
    const h = new Date().getHours()
    if (h < 12) return 'Good morning'
    if (h < 17) return 'Good afternoon'
    return 'Good evening'
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-24 pb-16">

        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">
              {greeting()}, {user?.name?.split(' ')[0] || 'Designer'} 👋
            </h1>
            <p className="text-slate-500 mt-1">All your design projects in one place</p>
          </div>
          <Link href="/onboarding" className="btn-primary">
            <Plus className="w-4 h-4" /> New Project
          </Link>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
          {[
            { icon: Home,         label: 'Total Projects', value: projects.length,                                        color: 'bg-indigo-50 text-indigo-600' },
            { icon: CheckCircle2, label: 'Completed',      value: projects.filter(p => p.status === 'done').length,      color: 'bg-emerald-50 text-emerald-600' },
            { icon: FileText,     label: 'Quoted',         value: projects.filter(p => p.status === 'quoted').length,    color: 'bg-amber-50 text-amber-600' },
            { icon: Activity,     label: 'In Progress',    value: projects.filter(p => p.status === 'ordered').length,   color: 'bg-blue-50 text-blue-600' },
          ].map((stat) => (
            <div key={stat.label} className="bg-white rounded-2xl p-5 shadow-card text-center">
              <div className={clsx('w-10 h-10 rounded-xl flex items-center justify-center mx-auto mb-3', stat.color)}>
                <stat.icon className="w-5 h-5" />
              </div>
              <div className="text-2xl font-black text-slate-900 mb-1">{stat.value}</div>
              <div className="text-xs text-slate-400">{stat.label}</div>
            </div>
          ))}
        </div>

        {/* Projects grid */}
        {loading ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-white rounded-2xl shadow-card h-60 shimmer" />
            ))}
          </div>
        ) : projects.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: 'spring', stiffness: 200 }}
              className="w-28 h-28 bg-indigo-50 rounded-3xl flex items-center justify-center mb-6"
            >
              <Home className="w-14 h-14 text-indigo-300" />
            </motion.div>
            <h3 className="text-xl font-bold text-slate-800 mb-2">No projects yet</h3>
            <p className="text-slate-500 mb-6 max-w-sm">
              Start your first interior design project and transform your home with AI — in under 10 minutes.
            </p>
            <Link href="/onboarding" className="btn-primary text-base px-8 py-3.5">
              <Plus className="w-5 h-5" /> Create Your First Project
            </Link>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {projects.map((project) => (
              <ProjectCard key={project.id} project={project} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
