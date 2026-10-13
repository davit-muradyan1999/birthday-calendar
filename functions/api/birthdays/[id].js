import { db, json, handle } from '../../../server/db.js'

export const onRequestDelete = handle(async ({ request, env, params }) => {
  const database = await db(env)
  const row = await database.prepare('SELECT delete_token FROM birthdays WHERE id = ?').bind(params.id).first()
  if (!row) return json({ error: 'Չի գտնվել' }, 404)
  if (row.delete_token !== request.headers.get('X-Delete-Token')) {
    return json({ error: 'Կարող եք ջնջել միայն ձեր գրառումը' }, 403)
  }
  await database.prepare('DELETE FROM birthdays WHERE id = ?').bind(params.id).run()
  return json({ ok: true })
})
