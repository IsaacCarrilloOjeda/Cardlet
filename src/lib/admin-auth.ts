import { cookies } from 'next/headers'
import { createHash } from 'crypto'

const COOKIE = 'admin_auth'
const VALUE = 'ss_admin_1'

function hash(pw: string): string {
  return createHash('sha256').update(pw + 'cardlet_admin_salt').digest('hex')
}

export async function isAdminAuthenticated(): Promise<boolean> {
  const store = await cookies()
  return store.get(COOKIE)?.value === VALUE
}

export function verifyAdminPassword(input: string): boolean {
  const configured = process.env.ADMIN_PASSWORD
  if (!configured) return false
  return hash(input) === hash(configured)
}

export { COOKIE as ADMIN_COOKIE_NAME, VALUE as ADMIN_COOKIE_VALUE }
