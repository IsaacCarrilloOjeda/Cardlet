import { cookies } from 'next/headers'
import { createHash } from 'crypto'

const COOKIE = 'admin_auth'
const VALUE = 'ss_admin_1'

function hash(pw: string): string {
  return createHash('sha256').update(pw + 'smartstack_salt').digest('hex')
}

export async function isAdminAuthenticated(): Promise<boolean> {
  const store = await cookies()
  return store.get(COOKIE)?.value === VALUE
}

export function verifyAdminPassword(input: string): boolean {
  return hash(input) === hash(process.env.ADMIN_PASSWORD ?? '123123')
}

export { COOKIE as ADMIN_COOKIE_NAME, VALUE as ADMIN_COOKIE_VALUE }
