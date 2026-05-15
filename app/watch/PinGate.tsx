'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Shield, Delete, Loader2 } from 'lucide-react'

const PIN_LENGTH = 4
const DIGITS = ['1', '2', '3', '4', '5', '6', '7', '8', '9', null, '0', 'del'] as const

export default function PinGate() {
  const router = useRouter()
  const [pin, setPin] = useState('')
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  async function submitPin(p: string) {
    setSubmitting(true)
    try {
      const res = await fetch('/api/child/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pin: p }),
      })
      if (res.ok) {
        router.replace('/watch/play')
      } else {
        setPin('')
        setError('Incorrect PIN — try again')
      }
    } catch {
      setPin('')
      setError('Something went wrong — try again')
    } finally {
      setSubmitting(false)
    }
  }

  function pressDigit(d: string) {
    if (submitting || pin.length >= PIN_LENGTH) return
    const next = pin + d
    setPin(next)
    setError('')
    if (next.length === PIN_LENGTH) submitPin(next)
  }

  function pressBack() {
    if (submitting) return
    setPin((p) => p.slice(0, -1))
    setError('')
  }

  return (
    <div
      className="min-h-screen bg-gray-950 flex flex-col items-center justify-center select-none"
      style={{ touchAction: 'none' }}
    >
      <Shield className="text-blue-400" size={44} />
      <h1 className="mt-4 text-3xl font-bold text-white tracking-tight">SafeTube</h1>
      <p className="mt-2 text-gray-400 text-base">Enter your PIN to watch</p>

      {/* PIN dots */}
      <div className="mt-10 flex gap-5" aria-label="PIN entered">
        {Array.from({ length: PIN_LENGTH }).map((_, i) => (
          <div
            key={i}
            className={`w-5 h-5 rounded-full border-2 transition-all duration-150 ${
              i < pin.length ? 'bg-blue-400 border-blue-400 scale-110' : 'border-gray-600'
            }`}
          />
        ))}
      </div>

      {/* Error */}
      <div className="mt-4 h-6">
        {error && <p className="text-red-400 text-sm animate-pulse">{error}</p>}
        {submitting && <Loader2 className="text-blue-400 animate-spin mx-auto" size={20} />}
      </div>

      {/* Number pad */}
      <div className="mt-6 grid grid-cols-3 gap-4">
        {DIGITS.map((d, i) => {
          if (d === null) {
            return <div key={i} />
          }
          if (d === 'del') {
            return (
              <button
                key={i}
                onPointerDown={pressBack}
                disabled={submitting || pin.length === 0}
                className="w-24 h-24 rounded-2xl bg-gray-800 text-gray-300 flex items-center justify-center active:bg-gray-700 disabled:opacity-30 transition-colors"
                aria-label="Delete"
              >
                <Delete size={28} />
              </button>
            )
          }
          return (
            <button
              key={i}
              onPointerDown={() => pressDigit(d)}
              disabled={submitting || pin.length >= PIN_LENGTH}
              className="w-24 h-24 rounded-2xl bg-gray-800 text-white text-4xl font-light active:bg-gray-700 disabled:opacity-30 transition-colors"
              aria-label={d}
            >
              {d}
            </button>
          )
        })}
      </div>
    </div>
  )
}
