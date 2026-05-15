'use server'

import bcrypt from 'bcryptjs'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

/**
 * Redirects with an error message encoded in search parameters.
 *
 * @param msg - The error message to display.
 * @param section - The settings section where the error occurred.
 */
function encErr(msg: string, section: string): never {
  redirect(`/admin/settings?error=${encodeURIComponent(msg)}&section=${section}`)
}

/**
 * Redirects with a success message encoded in search parameters.
 *
 * @param section - The settings section that was successfully updated.
 */
function encOk(section: string): never {
  redirect(`/admin/settings?success=${section}`)
}

/**
 * Authenticates the current user and returns the Supabase client and user object.
 * Redirects to login if no session is found.
 *
 * @returns A promise resolving to an object containing the Supabase client and user.
 */
async function getUser() {
  const supabase = createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')
  return { supabase, user }
}

/**
 * Server action to save or update the child's profile name.
 *
 * @param formData - Form data containing the 'name' field.
 */
export async function saveChildName(formData: FormData) {
  const name = (formData.get('name') as string | null)?.trim()
  if (!name) encErr('Name is required', 'profile')

  const { supabase, user } = await getUser()

  const { data: existing } = await supabase
    .from('child_profile')
    .select('id')
    .eq('parent_id', user.id)
    .maybeSingle()

  let error

  if (existing) {
    ;({ error } = await supabase
      .from('child_profile')
      .update({ name })
      .eq('parent_id', user.id))
  } else {
    // Create profile with no PIN yet — child cannot log in until PIN is set
    ;({ error } = await supabase
      .from('child_profile')
      .insert({ parent_id: user.id, name, pin_hash: '' }))
  }

  if (error) encErr(error.message, 'profile')
  encOk('profile')
}

/**
 * Server action to update the child's PIN.
 *
 * @param formData - Form data containing 'pin' and 'pin_confirm'.
 */
export async function saveChildPin(formData: FormData) {
  const pin = formData.get('pin') as string | null
  const confirm = formData.get('pin_confirm') as string | null

  if (!pin || !/^\d{4}$/.test(pin)) encErr('PIN must be exactly 4 digits', 'pin')
  if (pin !== confirm) encErr('PINs do not match', 'pin')

  const { supabase, user } = await getUser()

  const { data: existing } = await supabase
    .from('child_profile')
    .select('id')
    .eq('parent_id', user.id)
    .maybeSingle()

  if (!existing) encErr('Set a child name first before saving a PIN', 'pin')

  const hash = await bcrypt.hash(pin, 10)
  const { error } = await supabase
    .from('child_profile')
    .update({ pin_hash: hash })
    .eq('parent_id', user.id)

  if (error) encErr(error.message, 'pin')
  encOk('pin')
}

/**
 * Server action to update the parent's login password.
 *
 * @param formData - Form data containing 'new_password' and 'confirm_password'.
 */
export async function saveParentPassword(formData: FormData) {
  const newPassword = formData.get('new_password') as string | null
  const confirm = formData.get('confirm_password') as string | null

  if (!newPassword || newPassword.length < 8)
    encErr('Password must be at least 8 characters', 'password')
  if (newPassword !== confirm) encErr('Passwords do not match', 'password')

  const { supabase } = await getUser()
  const { error } = await supabase.auth.updateUser({ password: newPassword })

  if (error) encErr(error.message, 'password')
  encOk('password')
}
