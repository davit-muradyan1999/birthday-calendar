// Cloudflare Worker՝ API-ի համար։ Կայքի ֆայլերը (dist/) մատուցում է Cloudflare-ը ինքը,
// իսկ /api/* հարցումները գալիս են այստեղ (տե՛ս wrangler.jsonc → run_worker_first)։
import { db, toPublic, json, isValidDay } from './db.js'

async function list(env) {
  const { results } = await (await db(env))
    .prepare('SELECT * FROM birthdays ORDER BY month, day, last_name')
    .all()
  return json(results.map(toPublic))
}

async function create(request, env) {
  let body
  try {
    body = await request.json()
  } catch {
    return json({ error: 'Սխալ հարցում' }, 400)
  }
  const firstName = String(body.firstName ?? '').trim().slice(0, 60)
  const lastName = String(body.lastName ?? '').trim().slice(0, 60)
  const month = Number(body.month)
  const day = Number(body.day)
  if (!firstName || !lastName) return json({ error: 'Լրացրեք անունը և ազգանունը' }, 400)
  if (!isValidDay(month, day)) return json({ error: 'Ընտրեք ճիշտ ամսաթիվ' }, 400)

  const entry = {
    id: crypto.randomUUID(),
    first_name: firstName,
    last_name: lastName,
    month,
    day,
    created_at: new Date().toISOString(),
    delete_token: crypto.randomUUID(),
  }
  await (await db(env))
    .prepare(
      'INSERT INTO birthdays (id, first_name, last_name, month, day, created_at, delete_token) VALUES (?, ?, ?, ?, ?, ?, ?)',
    )
    .bind(entry.id, entry.first_name, entry.last_name, entry.month, entry.day, entry.created_at, entry.delete_token)
    .run()

  return json({ ...toPublic(entry), deleteToken: entry.delete_token }, 201)
}

async function remove(id, request, env) {
  const database = await db(env)
  const row = await database.prepare('SELECT delete_token FROM birthdays WHERE id = ?').bind(id).first()
  if (!row) return json({ error: 'Չի գտնվել' }, 404)
  if (row.delete_token !== request.headers.get('X-Delete-Token')) {
    return json({ error: 'Կարող եք ջնջել միայն ձեր գրառումը' }, 403)
  }
  await database.prepare('DELETE FROM birthdays WHERE id = ?').bind(id).run()
  return json({ ok: true })
}

export default {
  async fetch(request, env) {
    const { pathname } = new URL(request.url)
    try {
      if (pathname === '/api/birthdays') {
        if (request.method === 'GET') return await list(env)
        if (request.method === 'POST') return await create(request, env)
      }
      const match = pathname.match(/^\/api\/birthdays\/([\w-]+)$/)
      if (match && request.method === 'DELETE') return await remove(match[1], request, env)
      return json({ error: 'Not found' }, 404)
    } catch (err) {
      console.error(err)
      return json({ error: 'Սերվերի սխալ' }, 500)
    }
  },
}
