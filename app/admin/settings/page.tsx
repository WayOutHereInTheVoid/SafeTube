import { createClient } from '@/lib/supabase/server'
import { CheckCircle2, AlertCircle } from 'lucide-react'
import { saveChildName, saveChildPin, saveParentPassword } from './actions'

interface Props {
  searchParams: { success?: string; error?: string; section?: string }
}

function Banner({ section, searchParams }: { section: string; searchParams: Props['searchParams'] }) {
  if (searchParams.success === section) {
    return (
      <div className="mb-4 flex items-center gap-2 rounded-lg bg-green-50 border border-green-200 px-4 py-3 text-sm text-green-700">
        <CheckCircle2 size={16} className="flex-shrink-0" />
        Saved successfully.
      </div>
    )
  }
  if (searchParams.section === section && searchParams.error) {
    return (
      <div className="mb-4 flex items-center gap-2 rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
        <AlertCircle size={16} className="flex-shrink-0" />
        {searchParams.error}
      </div>
    )
  }
  return null
}

export default async function SettingsPage({ searchParams }: Props) {
  const supabase = createClient()

  const { data: profile } = await supabase
    .from('child_profile')
    .select('id, name')
    .maybeSingle()

  return (
    <div className="max-w-2xl">
      <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
      <p className="mt-1 text-sm text-gray-500">Manage your child profile and account</p>

      <div className="mt-8 space-y-6">

        {/* ── Child Name ─────────────────────────────────────────── */}
        <section className="rounded-xl border border-gray-200 bg-white p-6">
          <h2 className="text-base font-semibold text-gray-900">Child Profile Name</h2>
          <p className="mt-1 text-sm text-gray-500">
            {profile
              ? 'Update the name shown in the admin panel.'
              : 'No child profile yet. Enter a name to create one, then set a PIN below.'}
          </p>

          <Banner section="profile" searchParams={searchParams} />

          <form action={saveChildName} className="mt-4 flex flex-col gap-4">
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                Child name
              </label>
              <input
                id="name"
                name="name"
                type="text"
                defaultValue={profile?.name ?? ''}
                required
                maxLength={50}
                placeholder="e.g. Emma"
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500"
              />
            </div>
            <div>
              <button
                type="submit"
                className="rounded-lg bg-teal-500 px-4 py-2 text-sm font-medium text-white hover:bg-teal-600 active:bg-teal-700 transition-colors"
              >
                Save name
              </button>
            </div>
          </form>
        </section>

        {/* ── Child PIN ──────────────────────────────────────────── */}
        <section className="rounded-xl border border-gray-200 bg-white p-6">
          <h2 className="text-base font-semibold text-gray-900">Child PIN</h2>
          <p className="mt-1 text-sm text-gray-500">
            The 4-digit PIN your child uses to unlock the player.
            {!profile && ' Set a name above before saving a PIN.'}
          </p>

          <Banner section="pin" searchParams={searchParams} />

          <form action={saveChildPin} className="mt-4 flex flex-col gap-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label htmlFor="pin" className="block text-sm font-medium text-gray-700 mb-1">
                  New PIN
                </label>
                <input
                  id="pin"
                  name="pin"
                  type="password"
                  inputMode="numeric"
                  pattern="\d{4}"
                  maxLength={4}
                  required
                  placeholder="••••"
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500"
                />
              </div>
              <div>
                <label htmlFor="pin_confirm" className="block text-sm font-medium text-gray-700 mb-1">
                  Confirm PIN
                </label>
                <input
                  id="pin_confirm"
                  name="pin_confirm"
                  type="password"
                  inputMode="numeric"
                  pattern="\d{4}"
                  maxLength={4}
                  required
                  placeholder="••••"
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500"
                />
              </div>
            </div>
            <div>
              <button
                type="submit"
                className="rounded-lg bg-teal-500 px-4 py-2 text-sm font-medium text-white hover:bg-teal-600 active:bg-teal-700 transition-colors"
              >
                Save PIN
              </button>
            </div>
          </form>
        </section>

        {/* ── Parent Password ────────────────────────────────────── */}
        <section className="rounded-xl border border-gray-200 bg-white p-6">
          <h2 className="text-base font-semibold text-gray-900">Parent Password</h2>
          <p className="mt-1 text-sm text-gray-500">
            Change the password you use to log in to the admin panel.
          </p>

          <Banner section="password" searchParams={searchParams} />

          <form action={saveParentPassword} className="mt-4 flex flex-col gap-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label htmlFor="new_password" className="block text-sm font-medium text-gray-700 mb-1">
                  New password
                </label>
                <input
                  id="new_password"
                  name="new_password"
                  type="password"
                  minLength={8}
                  required
                  placeholder="Min 8 characters"
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500"
                />
              </div>
              <div>
                <label htmlFor="confirm_password" className="block text-sm font-medium text-gray-700 mb-1">
                  Confirm password
                </label>
                <input
                  id="confirm_password"
                  name="confirm_password"
                  type="password"
                  minLength={8}
                  required
                  placeholder="Repeat password"
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500"
                />
              </div>
            </div>
            <div>
              <button
                type="submit"
                className="rounded-lg bg-teal-500 px-4 py-2 text-sm font-medium text-white hover:bg-teal-600 active:bg-teal-700 transition-colors"
              >
                Change password
              </button>
            </div>
          </form>
        </section>

      </div>
    </div>
  )
}
