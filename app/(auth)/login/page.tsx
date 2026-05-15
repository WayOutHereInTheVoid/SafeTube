import { login } from './actions'

/**
 * Renders the parent login page.
 *
 * @param props - Component properties.
 * @param props.searchParams - URL search parameters for error or informational messages.
 * @returns A login page component with a form.
 */
export default function LoginPage({
  searchParams,
}: {
  searchParams: { error?: string; message?: string }
}) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-sm border border-gray-200 p-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-1">Parent Login</h1>
        <p className="text-sm text-gray-500 mb-6">Sign in to manage SafeTube</p>

        {searchParams.error && (
          <div className="mb-4 rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
            {searchParams.error}
          </div>
        )}

        {searchParams.message && (
          <div className="mb-4 rounded-lg bg-blue-50 border border-blue-200 px-4 py-3 text-sm text-blue-700">
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
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
              Password
            </label>
            <input
              id="password"
              name="password"
              type="password"
              required
              autoComplete="current-password"
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <button
            type="submit"
            className="w-full rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 transition-colors"
          >
            Sign in
          </button>
        </form>

        <p className="mt-5 text-center text-sm text-gray-500">
          No account?{' '}
          <a href="/signup" className="font-medium text-blue-600 hover:underline">
            Sign up
          </a>
        </p>
      </div>
    </div>
  )
}
