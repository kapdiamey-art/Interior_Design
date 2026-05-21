'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { authAPI } from '@/lib/api'
import { useAuthStore } from '@/stores/authStore'
import toast from 'react-hot-toast'
import { Sparkles, Phone, Mail, ArrowRight, RefreshCw } from 'lucide-react'
import Link from 'next/link'

type Step = 'contact' | 'otp'
type Method = 'phone' | 'email'

export default function LoginPage() {
  const router = useRouter()
  const { setToken } = useAuthStore()

  const [step, setStep] = useState<Step>('contact')
  const [method, setMethod] = useState<Method>('phone')
  const [contact, setContact] = useState('')
  const [name, setName] = useState('')
  const [otp, setOtp] = useState('')
  const [loading, setLoading] = useState(false)
  const [devOtp, setDevOtp] = useState('')

  const handleSendOtp = async () => {
    if (!contact.trim()) return toast.error('Enter your phone or email')
    setLoading(true)
    try {
      const payload = method === 'phone'
        ? { phone: contact, name }
        : { email: contact, name }
      const res = await authAPI.signup(payload)
      setDevOtp(res.data.dev_otp || '')
      toast.success(`OTP sent! Check console for dev OTP.`)
      setStep('otp')
    } catch (err: any) {
      toast.error(err?.response?.data?.detail || 'Failed to send OTP')
    } finally {
      setLoading(false)
    }
  }

  const handleVerify = async () => {
    if (otp.length < 6) return toast.error('Enter 6-digit OTP')
    setLoading(true)
    try {
      const payload = method === 'phone'
        ? { phone: contact, otp }
        : { email: contact, otp }
      const res = await authAPI.verifyOtp(payload)
      setToken(res.data.access_token, res.data.user_id)
      toast.success('Welcome to InteriorAI! 🎉')
      router.push('/onboarding')
    } catch (err: any) {
      toast.error(err?.response?.data?.detail || 'Invalid OTP')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex">
      {/* Left panel – form */}
      <div className="flex-1 flex items-center justify-center px-6 py-12 bg-white">
        <div className="w-full max-w-md">

          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 mb-10">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-400 to-indigo-700 flex items-center justify-center shadow-glow-indigo">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <span className="font-bold text-xl text-slate-800">
              Interior<span className="text-indigo-600">AI</span>
            </span>
          </Link>

          <AnimatePresence mode="wait">
            {step === 'contact' ? (
              <motion.div
                key="contact"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
              >
                <h1 className="text-3xl font-bold text-slate-900 mb-2">Sign In / Register</h1>
                <p className="text-slate-500 mb-8">Enter your details to get a one-time password.</p>

                {/* Name */}
                <div className="mb-4">
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">Your Name</label>
                  <input
                    id="name-input"
                    type="text"
                    placeholder="Rahul Sharma"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="input"
                  />
                </div>

                {/* Method toggle */}
                <div className="flex gap-2 mb-4">
                  <button
                    onClick={() => setMethod('phone')}
                    className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl border-2 text-sm font-medium transition-all ${method === 'phone' ? 'border-indigo-500 bg-indigo-50 text-indigo-700' : 'border-slate-200 text-slate-500 hover:border-slate-300'}`}
                  >
                    <Phone className="w-4 h-4" /> Phone
                  </button>
                  <button
                    onClick={() => setMethod('email')}
                    className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl border-2 text-sm font-medium transition-all ${method === 'email' ? 'border-indigo-500 bg-indigo-50 text-indigo-700' : 'border-slate-200 text-slate-500 hover:border-slate-300'}`}
                  >
                    <Mail className="w-4 h-4" /> Email
                  </button>
                </div>

                {/* Contact input */}
                <div className="mb-6">
                  <input
                    id="contact-input"
                    type={method === 'phone' ? 'tel' : 'email'}
                    placeholder={method === 'phone' ? '+91 98765 43210' : 'rahul@example.com'}
                    value={contact}
                    onChange={(e) => setContact(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSendOtp()}
                    className="input"
                  />
                </div>

                <button
                  id="send-otp-btn"
                  onClick={handleSendOtp}
                  disabled={loading}
                  className="btn-primary w-full justify-center py-3.5 text-base"
                >
                  {loading ? (
                    <div className="spinner w-5 h-5" />
                  ) : (
                    <>Send OTP <ArrowRight className="w-5 h-5" /></>
                  )}
                </button>

                <p className="text-center text-xs text-slate-400 mt-6">
                  By continuing, you agree to our Terms of Service and Privacy Policy.
                </p>
              </motion.div>
            ) : (
              <motion.div
                key="otp"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
              >
                <h1 className="text-3xl font-bold text-slate-900 mb-2">Enter OTP</h1>
                <p className="text-slate-500 mb-2">
                  We sent a 6-digit code to <strong className="text-slate-700">{contact}</strong>
                </p>

                {/* Dev OTP hint */}
                {devOtp && (
                  <div className="mb-6 p-3 bg-amber-50 border border-amber-200 rounded-xl text-sm text-amber-700">
                    <strong>🔐 Dev Mode OTP:</strong> <span className="font-mono font-bold tracking-widest">{devOtp}</span>
                  </div>
                )}

                <div className="mb-6">
                  <input
                    id="otp-input"
                    type="text"
                    maxLength={6}
                    placeholder="482913"
                    value={otp}
                    onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                    onKeyDown={(e) => e.key === 'Enter' && handleVerify()}
                    className="input text-center text-2xl tracking-[0.4em] font-mono"
                    autoFocus
                  />
                </div>

                <button
                  id="verify-otp-btn"
                  onClick={handleVerify}
                  disabled={loading}
                  className="btn-primary w-full justify-center py-3.5 text-base mb-4"
                >
                  {loading ? <div className="spinner w-5 h-5" /> : <>Verify & Continue <ArrowRight className="w-5 h-5" /></>}
                </button>

                <button
                  onClick={() => { setStep('contact'); setOtp('') }}
                  className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-indigo-600 transition mx-auto"
                >
                  <RefreshCw className="w-4 h-4" /> Back / Resend OTP
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Right panel – visual */}
      <div className="hidden lg:flex flex-1 relative overflow-hidden">
        <img
          src="https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=900&h=1200&fit=crop&q=85"
          alt="Beautiful interior design"
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-l from-indigo-950/60 to-transparent" />
        <div className="absolute bottom-12 left-8 right-8 glass rounded-2xl p-6">
          <p className="text-white font-medium">&quot;Designed my entire 2BHK in 20 minutes with InteriorAI. The renders blew my mind!&quot;</p>
          <div className="flex items-center gap-2 mt-3">
            <div className="w-8 h-8 rounded-full bg-indigo-400 flex items-center justify-center text-white text-xs font-bold">PM</div>
            <div>
              <div className="text-white text-sm font-medium">Priya Mehta</div>
              <div className="text-indigo-300 text-xs">Bangalore</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
