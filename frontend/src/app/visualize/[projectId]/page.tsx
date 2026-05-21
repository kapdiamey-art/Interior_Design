'use client'
import { useState, useEffect, useRef } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { projectsAPI, aiAPI } from '@/lib/api'
import Navbar from '@/components/Navbar'
import toast from 'react-hot-toast'
import { motion, AnimatePresence } from 'framer-motion'
import { Sparkles, ArrowRight, ChevronDown, Clock, CheckCircle2, Download, Image as ImageIcon } from 'lucide-react'
import clsx from 'clsx'

const STYLES = [
  { id: 'modern',              label: 'Modern',              emoji: '🔲' },
  { id: 'scandinavian',        label: 'Scandinavian',        emoji: '🪵' },
  { id: 'indian_contemporary', label: 'Indian Contemporary', emoji: '🪔' },
  { id: 'luxury',              label: 'Luxury',              emoji: '💎' },
  { id: 'mediterranean',       label: 'Mediterranean',       emoji: '🌊' },
  { id: 'boho',                label: 'Boho',                emoji: '🪴' },
]

const ROOM_LABELS: Record<string, string> = {
  living_room: 'Living Room', bedroom_master: 'Master Bedroom',
  bedroom_2: 'Bedroom 2', kitchen: 'Kitchen', bathroom: 'Bathroom', balcony: 'Balcony',
}

const PALETTES = [
  { name: 'Neutral', colors: ['#F5F5F0', '#C4B9A8', '#8B7355'] },
  { name: 'Ocean',   colors: ['#E0F2FE', '#7DD3FC', '#0EA5E9'] },
  { name: 'Forest',  colors: ['#DCFCE7', '#86EFAC', '#16A34A'] },
  { name: 'Blush',   colors: ['#FDF2F8', '#F9A8D4', '#DB2777'] },
  { name: 'Amber',   colors: ['#FFFBEB', '#FCD34D', '#D97706'] },
  { name: 'Slate',   colors: ['#F1F5F9', '#94A3B8', '#334155'] },
]

export default function VisualizePage() {
  const params = useParams()
  const router = useRouter()
  const projectId = params.projectId as string

  const [project, setProject] = useState<any>(null)
  const [activeRoomIdx, setActiveRoomIdx] = useState(0)
  const [selectedStyle, setSelectedStyle] = useState('modern')
  const [selectedPalette, setSelectedPalette] = useState(0)
  const [renders, setRenders] = useState<any[]>([])
  const [currentRender, setCurrentRender] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [generating, setGenerating] = useState(false)
  const [pollInterval, setPollInterval] = useState<NodeJS.Timeout | null>(null)
  const [showComparison, setShowComparison] = useState(false)

  useEffect(() => {
    const load = async () => {
      try {
        const res = await projectsAPI.get(projectId)
        setProject(res.data)
      } catch {
        toast.error('Failed to load project')
      } finally {
        setLoading(false)
      }
    }
    load()
    return () => { if (pollInterval) clearInterval(pollInterval) }
  }, [projectId])

  const activeRoom = project?.rooms?.[activeRoomIdx]

  const loadRoomRenders = async (roomId: string) => {
    try {
      const res = await aiAPI.roomRenders(roomId)
      setRenders(res.data.renders || [])
    } catch {}
  }

  useEffect(() => {
    if (activeRoom) {
      loadRoomRenders(activeRoom.id)
      setCurrentRender(null)
    }
  }, [activeRoomIdx, activeRoom?.id])

  const handleGenerate = async () => {
    if (!activeRoom) return
    setGenerating(true)
    setCurrentRender(null)

    try {
      const palette = PALETTES[selectedPalette].colors
      const res = await aiAPI.render({
        room_id: activeRoom.id,
        mode: 'sdxl',
        style: selectedStyle,
        color_palette: palette,
        products: [],
      })

      const jobId = res.data.job_id
      toast.success(`Render queued! ETA ~${res.data.eta_seconds}s`)

      // Poll for completion
      const interval = setInterval(async () => {
        try {
          const status = await aiAPI.renderStatus(jobId)
          if (status.data.status === 'completed') {
            clearInterval(interval)
            setCurrentRender(status.data)
            setGenerating(false)
            setRenders((prev) => [status.data, ...prev])
            toast.success('✨ Render complete!')
          }
        } catch {
          clearInterval(interval)
          setGenerating(false)
        }
      }, 2500)
      setPollInterval(interval)
    } catch (err: any) {
      toast.error(err?.response?.data?.detail || 'Failed to queue render')
      setGenerating(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="spinner w-12 h-12" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-900">
      <Navbar />
      <div className="max-w-screen-2xl mx-auto px-4 pt-24 pb-8">

        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-white mb-1">AI Visualisation</h1>
            <p className="text-slate-400 text-sm">{project?.property_name} • {project?.bhk_type}</p>
          </div>
          <button
            onClick={() => router.push(`/quotation/${projectId}`)}
            className="btn-primary"
          >
            Generate Quotation <ArrowRight className="w-4 h-4" />
          </button>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">

          {/* Left: Controls + Room tabs */}
          <div className="space-y-4">
            {/* Room selector */}
            <div className="bg-slate-800 rounded-2xl p-4 border border-white/10">
              <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">Select Room</div>
              <div className="space-y-1">
                {project?.rooms?.map((room: any, i: number) => (
                  <button key={room.id} onClick={() => setActiveRoomIdx(i)}
                    className={clsx('w-full text-left px-3 py-2.5 rounded-lg text-sm transition-all',
                      i === activeRoomIdx ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:bg-white/5 hover:text-white')}>
                    {ROOM_LABELS[room.room_type] || room.room_type}
                  </button>
                ))}
              </div>
            </div>

            {/* Style selector */}
            <div className="bg-slate-800 rounded-2xl p-4 border border-white/10">
              <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">Design Style</div>
              <div className="grid grid-cols-2 gap-2">
                {STYLES.map((s) => (
                  <button key={s.id} onClick={() => setSelectedStyle(s.id)}
                    className={clsx('flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-medium border transition-all',
                      selectedStyle === s.id
                        ? 'border-indigo-500 bg-indigo-600 text-white'
                        : 'border-white/10 text-slate-400 hover:border-white/30 hover:text-white')}>
                    <span>{s.emoji}</span>{s.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Color palette */}
            <div className="bg-slate-800 rounded-2xl p-4 border border-white/10">
              <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">Color Palette</div>
              <div className="space-y-2">
                {PALETTES.map((pal, i) => (
                  <button key={pal.name} onClick={() => setSelectedPalette(i)}
                    className={clsx('w-full flex items-center gap-3 px-3 py-2 rounded-xl border transition-all',
                      selectedPalette === i ? 'border-indigo-500 bg-indigo-900/30' : 'border-white/10 hover:border-white/20')}>
                    <div className="flex gap-1">
                      {pal.colors.map((c) => (
                        <div key={c} className="w-5 h-5 rounded-full border border-white/20" style={{ backgroundColor: c }} />
                      ))}
                    </div>
                    <span className="text-sm text-slate-300">{pal.name}</span>
                    {selectedPalette === i && <CheckCircle2 className="w-4 h-4 text-indigo-400 ml-auto" />}
                  </button>
                ))}
              </div>
            </div>

            {/* Generate button */}
            <button
              id="generate-render-btn"
              onClick={handleGenerate}
              disabled={generating}
              className={clsx(
                'w-full py-4 rounded-2xl font-bold text-base transition-all flex items-center justify-center gap-2',
                generating
                  ? 'bg-slate-700 text-slate-400 cursor-not-allowed'
                  : 'bg-gradient-to-r from-indigo-600 to-indigo-500 text-white hover:from-indigo-500 hover:to-indigo-400 shadow-glow-indigo'
              )}
            >
              {generating ? (
                <>
                  <div className="spinner w-5 h-5" />
                  Generating AI Render…
                </>
              ) : (
                <>
                  <Sparkles className="w-5 h-5" />
                  Generate Realistic View
                </>
              )}
            </button>

            {generating && (
              <div className="bg-slate-800 rounded-xl p-3 border border-indigo-500/30 text-center">
                <div className="text-xs text-indigo-300">
                  <Clock className="w-3 h-3 inline mr-1" />
                  Processing via Stable Diffusion XL + ControlNet…
                </div>
              </div>
            )}
          </div>

          {/* Right: Render output */}
          <div className="lg:col-span-2 space-y-4">

            {/* Main render view */}
            <div className="bg-slate-800 rounded-2xl overflow-hidden border border-white/10 aspect-video relative">
              <AnimatePresence mode="wait">
                {generating && !currentRender ? (
                  <motion.div key="generating"
                    initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                    className="absolute inset-0 flex flex-col items-center justify-center render-loading">
                    <div className="relative mb-6">
                      <div className="w-20 h-20 rounded-full border-4 border-indigo-500/30 border-t-indigo-500 animate-spin" />
                      <Sparkles className="w-8 h-8 text-indigo-400 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
                    </div>
                    <h3 className="text-white font-bold text-lg mb-2">Generating Your Room</h3>
                    <p className="text-slate-400 text-sm text-center max-w-xs">
                      Our AI is crafting a photorealistic render of your {ROOM_LABELS[activeRoom?.room_type] || 'room'} in {STYLES.find(s => s.id === selectedStyle)?.label} style…
                    </p>
                    <div className="mt-4 flex gap-1">
                      {[0, 1, 2].map((i) => (
                        <div key={i} className="w-2 h-2 rounded-full bg-indigo-500 animate-bounce" style={{ animationDelay: `${i * 0.2}s` }} />
                      ))}
                    </div>
                  </motion.div>
                ) : currentRender?.image_url ? (
                  <motion.div key="rendered" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="absolute inset-0">
                    <img src={currentRender.image_url} alt="AI Generated Interior" className="w-full h-full object-cover" />
                    <div className="absolute top-3 right-3 flex gap-2">
                      <a href={currentRender.image_url} download target="_blank"
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-black/50 backdrop-blur text-white text-xs rounded-lg hover:bg-black/70 transition">
                        <Download className="w-3 h-3" /> Save
                      </a>
                    </div>
                    <div className="absolute bottom-3 left-3 glass px-3 py-1.5 rounded-lg">
                      <span className="text-white text-xs font-medium">
                        {STYLES.find(s => s.id === selectedStyle)?.emoji} {STYLES.find(s => s.id === selectedStyle)?.label} • AI Generated
                      </span>
                    </div>
                  </motion.div>
                ) : (
                  <motion.div key="empty" initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                    className="absolute inset-0 flex flex-col items-center justify-center text-center p-8">
                    <div className="w-20 h-20 rounded-2xl bg-indigo-900/50 border border-indigo-500/30 flex items-center justify-center mb-4">
                      <ImageIcon className="w-10 h-10 text-indigo-400" />
                    </div>
                    <h3 className="text-white font-bold text-lg mb-2">No Render Yet</h3>
                    <p className="text-slate-400 text-sm">
                      Select a style and palette, then click "Generate Realistic View"
                    </p>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Previous renders gallery */}
            {renders.length > 0 && (
              <div>
                <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">Previous Renders</div>
                <div className="grid grid-cols-3 gap-3">
                  {renders.slice(0, 6).map((r: any, i) => (
                    <button key={r.id || i} onClick={() => setCurrentRender(r)}
                      className={clsx('rounded-xl overflow-hidden aspect-video border-2 transition-all',
                        currentRender?.image_url === r.image_url ? 'border-indigo-500' : 'border-transparent hover:border-white/30')}>
                      <img src={r.thumbnail_url || r.image_url} alt="Render" className="w-full h-full object-cover" />
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
