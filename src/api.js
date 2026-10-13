const TOKENS_KEY = 'birthday-tokens'

async function request(url, options = {}) {
  const res = await fetch(url, {
    ...options,
    headers: { 'Content-Type': 'application/json', ...options.headers },
  })
  const data = await res.json().catch(() => ({}))
  if (!res.ok) throw new Error(data.error || 'Սերվերի հետ կապի խնդիր')
  return data
}

// Ջնջելու բանալիները պահվում են միայն տվյալ բրաուզերում,
// որպեսզի մարդը կարողանա ջնջել միայն իր ավելացրած գրառումը։
export function loadTokens() {
  try {
    return JSON.parse(localStorage.getItem(TOKENS_KEY)) || {}
  } catch {
    return {}
  }
}

function saveTokens(tokens) {
  try {
    localStorage.setItem(TOKENS_KEY, JSON.stringify(tokens))
  } catch {}
}

export const fetchBirthdays = () => request('/api/birthdays')

export async function addBirthday(payload) {
  const entry = await request('/api/birthdays', { method: 'POST', body: JSON.stringify(payload) })
  const tokens = loadTokens()
  tokens[entry.id] = entry.deleteToken
  saveTokens(tokens)
  delete entry.deleteToken
  return entry
}

export async function removeBirthday(id) {
  const tokens = loadTokens()
  await request(`/api/birthdays/${id}`, {
    method: 'DELETE',
    headers: { 'X-Delete-Token': tokens[id] || '' },
  })
  delete tokens[id]
  saveTokens(tokens)
}
