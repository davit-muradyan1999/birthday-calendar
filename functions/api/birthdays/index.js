import { db, toPublic, json, isValidDay, handle } from '../../../server/db.js'

export const onRequestGet = handle(async ({ env }) => {
  const { results } = await (await db(env))
    .prepare('SELECT * FROM birthdays ORDER BY month, day, last_name')
    .all()
  return json(results.map(toPublic))
})

export const onRequestPost = handle(async ({ request, env }) => {
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
})
