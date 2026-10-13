// Ընդհանուր օգնականներ Cloudflare Pages Functions-ի համար։
// Տվյալները պահվում են D1 տվյալների բազայում (binding-ի անունը՝ DB)։

let ready = false

// Աղյուսակը ստեղծվում է ինքնաշխատ, առաջին հարցման ժամանակ
export async function db(env) {
  if (!env.DB) throw new Error('D1 binding "DB" is not configured')
  if (!ready) {
    await env.DB.prepare(
      `CREATE TABLE IF NOT EXISTS birthdays (
        id TEXT PRIMARY KEY,
        first_name TEXT NOT NULL,
        last_name TEXT NOT NULL,
        month INTEGER NOT NULL,
        day INTEGER NOT NULL,
        created_at TEXT NOT NULL,
        delete_token TEXT NOT NULL
      )`,
    ).run()
    ready = true
  }
  return env.DB
}

export const toPublic = (row) => ({
  id: row.id,
  firstName: row.first_name,
  lastName: row.last_name,
  month: row.month,
  day: row.day,
  createdAt: row.created_at,
})

export const json = (body, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json; charset=utf-8' },
  })

export function isValidDay(month, day) {
  if (!Number.isInteger(month) || !Number.isInteger(day)) return false
  if (month < 1 || month > 12 || day < 1) return false
  const daysInMonth = new Date(2024, month, 0).getDate() // 2024՝ նահանջ տարի, փետրվարի 29-ի համար
  return day <= daysInMonth
}

// Սխալների ընդհանուր մշակում
export const handle = (fn) => async (context) => {
  try {
    return await fn(context)
  } catch (err) {
    console.error(err)
    return json({ error: 'Սերվերի սխալ' }, 500)
  }
}
