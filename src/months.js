export const MONTHS = [
  'Հունվար', 'Փետրվար', 'Մարտ', 'Ապրիլ', 'Մայիս', 'Հունիս',
  'Հուլիս', 'Օգոստոս', 'Սեպտեմբեր', 'Հոկտեմբեր', 'Նոյեմբեր', 'Դեկտեմբեր',
]

// Սեռական հոլովով՝ «5 մարտի»
export const MONTHS_GENITIVE = [
  'հունվարի', 'փետրվարի', 'մարտի', 'ապրիլի', 'մայիսի', 'հունիսի',
  'հուլիսի', 'օգոստոսի', 'սեպտեմբերի', 'հոկտեմբերի', 'նոյեմբերի', 'դեկտեմբերի',
]

export const WEEKDAYS = ['Երկ', 'Երք', 'Չրք', 'Հնգ', 'Ուրբ', 'Շբթ', 'Կիր']

export const formatDay = (month, day) => `${day} ${MONTHS_GENITIVE[month - 1]}`

// Քանի օր է մնացել մինչև հաջորդ ծննդյան օրը (0՝ այսօր)
export function daysUntil(month, day, from = new Date()) {
  const today = new Date(from.getFullYear(), from.getMonth(), from.getDate())
  let next = new Date(today.getFullYear(), month - 1, day)
  if (next < today) next = new Date(today.getFullYear() + 1, month - 1, day)
  return Math.round((next - today) / 86_400_000)
}
