'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { useProjectStore } from '@/stores/projectStore'
import { useAuthStore } from '@/stores/authStore'
import { projectsAPI } from '@/lib/api'
import BhkSelector from '@/components/BhkSelector'
import Navbar from '@/components/Navbar'
import toast from 'react-hot-toast'
import { ArrowRight, ArrowLeft, CheckCircle2, Home, Sparkles, Wrench } from 'lucide-react'
import clsx from 'clsx'

const STYLE_OPTIONS = [
  { id: 'modern',              label: 'Modern',              emoji: '🔲', desc: 'Clean lines, neutral tones' },
  { id: 'scandinavian',        label: 'Scandinavian',        emoji: '🪵', desc: 'Light wood, cozy textures' },
  { id: 'indian_contemporary', label: 'Indian Contemporary', emoji: '🪔', desc: 'Warm tones, brass accents' },
  { id: 'luxury',              label: 'Luxury',              emoji: '💎', desc: 'Marble, velvet, bespoke' },
  { id: 'mediterranean',       label: 'Mediterranean',       emoji: '🌊', desc: 'Arches, terracotta, sea palette' },
  { id: 'boho',                label: 'Boho',                emoji: '🪴', desc: 'Rattan, macramé, warm amber' },
]

const BUDGET_RANGES = [
  { id: '300000',  label: '₹3L – ₹5L',   min: 300000,  max: 500000 },
  { id: '500000',  label: '₹5L – ₹8L',   min: 500000,  max: 800000 },
  { id: '800000',  label: '₹8L – ₹12L',  min: 800000,  max: 1200000 },
  { id: '1200000', label: '₹12L – ₹20L', min: 1200000, max: 2000000 },
  { id: '2000000', label: '₹20L+',        min: 2000000, max: 9999999 },
]

const TIMELINE_OPTIONS = [
  { id: '1_month',  label: 'ASAP (< 1 month)' },
  { id: '3_months', label: '1–3 months' },
  { id: '6_months', label: '3–6 months' },
  { id: 'flexible', label: 'Flexible / Planning' },
]

const MATERIAL_OPTIONS = [
  { id: 'budget',   label: 'Budget',   desc: 'Durable & affordable finishes',       emoji: '💡' },
  { id: 'standard', label: 'Standard', desc: 'Quality materials, great value',       emoji: '⭐' },
  { id: 'premium',  label: 'Premium',  desc: 'High-end materials & craftsmanship', emoji: '💎' },
]

const FURNISHING_OPTIONS = [
  { id: 'new',     label: 'New Home',    desc: 'Moving into a new property', icon: Home },
  { id: 'upgrade', label: 'Upgrading',   desc: 'Renovating an existing space', icon: Wrench },
]

const CITIES = ['Bangalore', 'Mumbai', 'Delhi', 'Chennai', 'Hyderabad', 'Pune', 'Kolkata', 'Ahmedabad', 'Other']

const STEPS = ['Style', 'BHK', 'Budget', 'Preferences', 'Details']

export default function OnboardingPage() {
  const router = useRouter()
  const { onboarding, setOnboarding } = useProjectStore()
  const { isLoggedIn } = useAuthStore()

  const [step, setStep] = useState(0)
  const [loading, setLoading] = useState(false)
  const [local, setLocal] = useState({
    style_tags:          [] as string[],
    bhk:                 '',
    budget:              '',
    timeline:            '',
    material_preference: '',
    furnishing_type:     '',
    city:                '',
    property_name:       '',
    pincode:             '',
  })

  if (!isLoggedIn) {
    if (typeof window !== 'undefined') router.push('/login')
    return null
  }

  const toggleStyle = (id: string) => {
    setLocal((s) => ({
      ...s,
      style_tags: s.style_tags.includes(id)
        ? s.style_tags.filter((x) => x !== id)
        : [...s.style_tags, id],
    }))
  }

  const canNext = () => {
    if (step === 0) return local.style_tags.length > 0
    if (step === 1) return !!local.bhk
    if (step === 2) return !!local.budget && !!local.timeline
    if (step === 3) return !!local.material_preference && !!local.furnishing_type
    if (step === 4) return !!local.city && !!local.property_name
    return false
  }

  const handleSubmit = async () => {
    setLoading(true)
    try {
      const budgetObj = BUDGET_RANGES.find((b) => b.id === local.budget)
      const res = await projectsAPI.create({
        bhk_type:            local.bhk,
        property_name:       local.property_name,
        city:                local.city,
        budget:              budgetObj?.max || 1000000,
        material_preference: local.material_preference,
        furnishing_type:     local.furnishing_type,
        pincode:             local.pincode || undefined,
      })
      setOnboarding({
        bhk:       local.bhk,
        style_tags: local.style_tags,
        budget:    budgetObj?.max,
        city:      local.city,
      })
      toast.success('Project created! 🎉')
      router.push(`/packages?projectId=${res.data.project_id}&bhk=${local.bhk}&budget=${budgetObj?.max || 1000000}&style=${local.style_tags.join(',')}`)
    } catch (err: any) {
      toast.error(err?.response?.data?.detail || 'Failed to create project')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />
      <div className="max-w-3xl mx-auto px-4 pt-28 pb-16">

        {/* Progress */}
        <div className="flex items-center justify-between mb-10">
          {STEPS.map((s, i) => (
            <div key={s} className="flex items-center gap-2">
              <div className={clsx(
                'w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-all',
                i < step  ? 'bg-indigo-600 text-white' :
                i === step ? 'bg-indigo-600 text-white ring-4 ring-indigo-100' :
                'bg-slate-200 text-slate-400'
              )}>
                {i < step ? <CheckCircle2 className="w-4 h-4" /> : i + 1}
              </div>
              <span className={clsx('text-sm font-medium hidden sm:block', i <= step ? 'text-indigo-700' : 'text-slate-400')}>{s}</span>
              {i < STEPS.length - 1 && (
                <div className={clsx('flex-1 h-0.5 w-8 sm:w-16 ml-2', i < step ? 'bg-indigo-600' : 'bg-slate-200')} />
              )}
            </div>
          ))}
        </div>

        <AnimatePresence mode="wait">

          {/* Step 0: Style */}
          {step === 0 && (
            <motion.div key="style" initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30 }}>
              <h2 className="text-3xl font-bold text-slate-900 mb-2">What's your style vibe?</h2>
              <p className="text-slate-500 mb-8">Select one or more. We'll recommend packages that match.</p>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                {STYLE_OPTIONS.map((opt) => (
                  <button
                    key={opt.id}
                    onClick={() => toggleStyle(opt.id)}
                    className={clsx(
                      'p-4 rounded-2xl border-2 text-left transition-all duration-200',
                      local.style_tags.includes(opt.id)
                        ? 'border-indigo-500 bg-indigo-50'
                        : 'border-slate-200 bg-white hover:border-indigo-300'
                    )}
                  >
                    <div className="text-3xl mb-2">{opt.emoji}</div>
                    <div className="font-semibold text-slate-800">{opt.label}</div>
                    <div className="text-xs text-slate-500 mt-1">{opt.desc}</div>
                  </button>
                ))}
              </div>
            </motion.div>
          )}

          {/* Step 1: BHK */}
          {step === 1 && (
            <motion.div key="bhk" initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30 }}>
              <h2 className="text-3xl font-bold text-slate-900 mb-2">What's your home configuration?</h2>
              <p className="text-slate-500 mb-8">We'll auto-configure your rooms based on the selection.</p>
              <BhkSelector selected={local.bhk} onSelect={(bhk) => setLocal((s) => ({ ...s, bhk }))} />
            </motion.div>
          )}

          {/* Step 2: Budget & Timeline */}
          {step === 2 && (
            <motion.div key="budget" initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30 }}>
              <h2 className="text-3xl font-bold text-slate-900 mb-2">Budget & Timeline</h2>
              <p className="text-slate-500 mb-6">This helps us recommend the right packages.</p>
              <div className="mb-8">
                <div className="text-sm font-semibold text-slate-700 mb-3">Total Interior Budget</div>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {BUDGET_RANGES.map((b) => (
                    <button key={b.id} onClick={() => setLocal((s) => ({ ...s, budget: b.id }))}
                      className={clsx('p-3 rounded-xl border-2 text-sm font-medium transition-all',
                        local.budget === b.id ? 'border-indigo-500 bg-indigo-50 text-indigo-700' : 'border-slate-200 text-slate-600 hover:border-indigo-300')}>
                      {b.label}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <div className="text-sm font-semibold text-slate-700 mb-3">When do you want to start?</div>
                <div className="grid grid-cols-2 gap-3">
                  {TIMELINE_OPTIONS.map((t) => (
                    <button key={t.id} onClick={() => setLocal((s) => ({ ...s, timeline: t.id }))}
                      className={clsx('p-3 rounded-xl border-2 text-sm font-medium transition-all',
                        local.timeline === t.id ? 'border-indigo-500 bg-indigo-50 text-indigo-700' : 'border-slate-200 text-slate-600 hover:border-indigo-300')}>
                      {t.label}
                    </button>
                  ))}
                </div>
              </div>
            </motion.div>
          )}

          {/* Step 3: Preferences */}
          {step === 3 && (
            <motion.div key="prefs" initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30 }}>
              <h2 className="text-3xl font-bold text-slate-900 mb-2">Your Preferences</h2>
              <p className="text-slate-500 mb-8">Help us tailor the perfect interior for you.</p>

              <div className="mb-8">
                <div className="text-sm font-semibold text-slate-700 mb-3">Material Quality Preference</div>
                <div className="grid grid-cols-3 gap-4">
                  {MATERIAL_OPTIONS.map((m) => (
                    <button key={m.id} onClick={() => setLocal((s) => ({ ...s, material_preference: m.id }))}
                      className={clsx('p-4 rounded-2xl border-2 text-center transition-all',
                        local.material_preference === m.id ? 'border-indigo-500 bg-indigo-50' : 'border-slate-200 bg-white hover:border-indigo-300')}>
                      <div className="text-2xl mb-2">{m.emoji}</div>
                      <div className="font-semibold text-slate-800 text-sm">{m.label}</div>
                      <div className="text-xs text-slate-500 mt-1">{m.desc}</div>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <div className="text-sm font-semibold text-slate-700 mb-3">Are you furnishing a new home or upgrading?</div>
                <div className="grid grid-cols-2 gap-4">
                  {FURNISHING_OPTIONS.map((f) => (
                    <button key={f.id} onClick={() => setLocal((s) => ({ ...s, furnishing_type: f.id }))}
                      className={clsx('p-4 rounded-2xl border-2 text-left transition-all flex items-center gap-3',
                        local.furnishing_type === f.id ? 'border-indigo-500 bg-indigo-50' : 'border-slate-200 bg-white hover:border-indigo-300')}>
                      <div className={clsx('w-10 h-10 rounded-xl flex items-center justify-center',
                        local.furnishing_type === f.id ? 'bg-indigo-500 text-white' : 'bg-slate-100 text-slate-500')}>
                        <f.icon className="w-5 h-5" />
                      </div>
                      <div>
                        <div className="font-semibold text-slate-800 text-sm">{f.label}</div>
                        <div className="text-xs text-slate-500">{f.desc}</div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            </motion.div>
          )}

          {/* Step 4: Property Details */}
          {step === 4 && (
            <motion.div key="details" initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30 }}>
              <h2 className="text-3xl font-bold text-slate-900 mb-2">Property Details</h2>
              <p className="text-slate-500 mb-8">Tell us a little about your property.</p>
              <div className="space-y-5">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">Property Name / Society</label>
                  <input id="property-name" type="text" placeholder="e.g. Prestige Lakeside Unit 4B"
                    value={local.property_name} onChange={(e) => setLocal((s) => ({ ...s, property_name: e.target.value }))}
                    className="input" />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">Pincode <span className="text-slate-400">(optional)</span></label>
                  <input id="pincode" type="text" placeholder="e.g. 560001"
                    value={local.pincode} onChange={(e) => setLocal((s) => ({ ...s, pincode: e.target.value }))}
                    className="input" maxLength={6} />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">City</label>
                  <div className="grid grid-cols-3 gap-2">
                    {CITIES.map((city) => (
                      <button key={city} onClick={() => setLocal((s) => ({ ...s, city }))}
                        className={clsx('p-2.5 rounded-xl border-2 text-sm font-medium transition-all',
                          local.city === city ? 'border-indigo-500 bg-indigo-50 text-indigo-700' : 'border-slate-200 text-slate-600 hover:border-indigo-300')}>
                        {city}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Navigation */}
        <div className="flex justify-between mt-10">
          <button onClick={() => setStep((s) => Math.max(0, s - 1))} disabled={step === 0}
            className="btn-ghost flex items-center gap-2 disabled:opacity-30">
            <ArrowLeft className="w-4 h-4" /> Back
          </button>

          {step < STEPS.length - 1 ? (
            <button onClick={() => setStep((s) => s + 1)} disabled={!canNext()}
              className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed">
              Next <ArrowRight className="w-4 h-4" />
            </button>
          ) : (
            <button onClick={handleSubmit} disabled={!canNext() || loading}
              className="btn-primary disabled:opacity-50">
              {loading
                ? <div className="spinner w-5 h-5" />
                : <><Sparkles className="w-4 h-4" /> Find Packages <ArrowRight className="w-4 h-4" /></>
              }
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
