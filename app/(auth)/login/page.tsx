'use client'

import { useState } from 'react'
import { Eye, EyeOff } from 'lucide-react'
import { login } from './actions'

export default function LoginPage({
  searchParams,
}: {
  searchParams: { error?: string; message?: string }
}) {
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState(searchParams.error)

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-lg border border-gray-200 p-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-1">Parent Login</h1>
        <p className="text-sm text-gray-500 mb-6">Sign in to manage SafeTube</p>

        {searchParams.message && (
          <div className="mb-4 rounded-lg bg-teal-50 border border-teal-200 px-4 py-3 text-sm text-teal-700">
            {searchParams.message}
          </div>
        )}

        <form action={login} className="space-y-4">
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
              Email
            </label>
            <input
              id="email"
              name="email"
              type="email"
              required
              autoComplete="email"
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
            />
          </div>

          <div>
            <div className="flex justify-between items-center mb-1">
              <label htmlFor="password" name="password" className="block text-sm font-medium text-gray-700">
                Password
              </label>
              <a href="/forgot-password" size="sm" className="text-xs text-teal-600 hover:underline font-medium">Forgot password?</a>
            </div>
            <div className="relative">
              <input
                id="password"
                name="password"
                type={showPassword ? "text" : "password"}
                required
                autoComplete="current-password"
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent pr-10"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          {error && (
            <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
              {error}
            </div>
          )}

          <button
            type="submit"
            className="w-full rounded-lg bg-teal-500 px-4 py-2 text-sm font-semibold text-white hover:bg-teal-600 transition-colors"
          >
            Sign in
          </button>
        </form>

        <p className="mt-5 text-center text-sm text-gray-500">
          No account?{' '}
          <a href="/signup" className="font-medium text-teal-600 hover:underline">
            Sign up
          </a>
        </p>
      </div>
    </div>
  )
}
