<script setup>
import { computed, onMounted, onUnmounted, ref } from 'vue'
import BirthdayCalendar from './components/BirthdayCalendar.vue'
import { fetchBirthdays, addBirthday, removeBirthday, loadTokens } from './api'
import { MONTHS, formatDay, daysUntil } from './months'
import { exportPdf } from './pdf'

const birthdays = ref([])
const loading = ref(true)
const loadError = ref('')
const myIds = ref(Object.keys(loadTokens()))

const form = ref({ firstName: '', lastName: '' })
const selected = ref(null)
const saving = ref(false)
const formError = ref('')
const success = ref('')
const exporting = ref(false)
const search = ref('')
const calendar = ref(null)

async function load() {
  try {
    birthdays.value = await fetchBirthdays()
    loadError.value = ''
  } catch (e) {
    loadError.value = e.message
  } finally {
    loading.value = false
  }
}

// Պարբերաբար թարմացնում ենք, որ բոլորը տեսնեն նոր ավելացածները
let timer
onMounted(() => {
  load()
  timer = setInterval(load, 15000)
})
onUnmounted(() => clearInterval(timer))

async function submit() {
  formError.value = ''
  success.value = ''
  if (!form.value.firstName.trim() || !form.value.lastName.trim()) {
    formError.value = 'Լրացրեք անունը և ազգանունը'
    return
  }
  if (!selected.value) {
    formError.value = 'Օրացույցում ընտրեք ձեր ծննդյան օրը'
    return
  }
  saving.value = true
  try {
    const entry = await addBirthday({ ...form.value, ...selected.value })
    birthdays.value.push(entry)
    myIds.value.push(entry.id)
    success.value = `Շնորհակալություն, ${entry.firstName}։ Ձեր ծննդյան օրը (${formatDay(entry.month, entry.day)}) պահպանված է 🎉`
    form.value = { firstName: '', lastName: '' }
    selected.value = null
  } catch (e) {
    formError.value = e.message
  } finally {
    saving.value = false
  }
}

async function remove(entry) {
  if (!confirm(`Ջնջե՞լ ${entry.firstName} ${entry.lastName}-ի գրառումը`)) return
  try {
    await removeBirthday(entry.id)
    birthdays.value = birthdays.value.filter((b) => b.id !== entry.id)
    myIds.value = myIds.value.filter((id) => id !== entry.id)
  } catch (e) {
    alert(e.message)
  }
}

async function downloadPdf() {
  exporting.value = true
  try {
    await exportPdf(birthdays.value)
  } finally {
    exporting.value = false
  }
}

const filtered = computed(() => {
  const q = search.value.trim().toLowerCase()
  return birthdays.value.filter((b) => !q || `${b.firstName} ${b.lastName}`.toLowerCase().includes(q))
})

const groupedByMonth = computed(() =>
  MONTHS.map((name, i) => ({
    month: i + 1,
    name,
    people: filtered.value
      .filter((b) => b.month === i + 1)
      .sort((a, b) => a.day - b.day || a.lastName.localeCompare(b.lastName, 'hy')),
  })).filter((m) => m.people.length),
)

const upcoming = computed(() =>
  birthdays.value
    .map((b) => ({ ...b, inDays: daysUntil(b.month, b.day) }))
    .filter((b) => b.inDays <= 30)
    .sort((a, b) => a.inDays - b.inDays)
    .slice(0, 6),
)

const selectedPeople = computed(() =>
  selected.value
    ? birthdays.value.filter((b) => b.month === selected.value.month && b.day === selected.value.day)
    : [],
)

const myEntries = computed(() =>
  birthdays.value
    .filter((b) => myIds.value.includes(b.id))
    .sort((a, b) => a.month - b.month || a.day - b.day),
)

const initials = (b) => (b.firstName[0] + b.lastName[0]).toUpperCase()
const inDaysLabel = (n) => (n === 0 ? 'Այսօր 🎉' : n === 1 ? 'Վաղը' : `${n} օրից`)
</script>

<template>
  <div class="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-pink-50">
    <header class="border-b border-slate-200/70 bg-white/70 backdrop-blur">
      <div class="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-4 py-4">
        <div class="flex items-center gap-3">
          <div class="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-500 to-pink-500 text-2xl shadow-lg shadow-indigo-200">
            🎂
          </div>
          <div>
            <h1 class="text-xl font-bold text-slate-900">Ծննդյան օրերի օրացույց</h1>
            <p class="text-sm text-slate-500">Նշեք ձեր ծննդյան օրը, որ ոչ ոք չմոռանա շնորհավորել</p>
          </div>
        </div>
        <button
          class="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-medium text-white shadow transition hover:bg-slate-700 disabled:opacity-50"
          :disabled="exporting || !birthdays.length"
          @click="downloadPdf"
        >
          <svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
            <path d="M12 4v12m0 0l-4-4m4 4l4-4M4 20h16" />
          </svg>
          {{ exporting ? 'Ստեղծվում է…' : 'Ներբեռնել PDF' }}
        </button>
      </div>
    </header>

    <main class="mx-auto grid max-w-6xl gap-6 px-4 py-6 lg:grid-cols-[400px_1fr]">
      <!-- Ձախ սյուն՝ ձև + օրացույց -->
      <section class="mx-auto h-fit w-full max-w-lg rounded-3xl border border-slate-200 bg-white p-5 shadow-sm lg:sticky lg:top-6 lg:max-w-none">
        <h2 class="mb-4 text-base font-semibold text-slate-900">Ավելացնել իմ ծննդյան օրը</h2>
        <form class="space-y-4" @submit.prevent="submit">
          <div class="grid grid-cols-2 gap-3">
            <label class="block">
              <span class="mb-1 block text-xs font-medium text-slate-600">Անուն</span>
              <input
                v-model="form.firstName"
                maxlength="60"
                class="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none transition focus:border-indigo-400 focus:ring-4 focus:ring-indigo-100"
                placeholder="Արամ"
              />
            </label>
            <label class="block">
              <span class="mb-1 block text-xs font-medium text-slate-600">Ազգանուն</span>
              <input
                v-model="form.lastName"
                maxlength="60"
                class="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none transition focus:border-indigo-400 focus:ring-4 focus:ring-indigo-100"
                placeholder="Պետրոսյան"
              />
            </label>
          </div>

          <div class="rounded-2xl border border-slate-100 bg-slate-50/50 p-3">
            <BirthdayCalendar ref="calendar" :birthdays="birthdays" :selected="selected" @select="selected = $event" />
          </div>

          <div class="min-h-5 text-sm">
            <p v-if="selected" class="text-slate-700">
              Ընտրված է՝ <span class="font-semibold text-indigo-600">{{ formatDay(selected.month, selected.day) }}</span>
              <span v-if="selectedPeople.length" class="text-slate-500">
                · նույն օրը՝ {{ selectedPeople.map((p) => p.firstName).join(', ') }}
              </span>
            </p>
            <p v-else class="text-slate-400">Սեղմեք օրացույցի վրա՝ ձեր ծննդյան օրն ընտրելու համար</p>
          </div>

          <p v-if="formError" class="rounded-xl bg-red-50 px-3 py-2 text-sm text-red-600">{{ formError }}</p>
          <p v-if="success" class="rounded-xl bg-emerald-50 px-3 py-2 text-sm text-emerald-700">{{ success }}</p>

          <button
            type="submit"
            :disabled="saving"
            class="w-full rounded-xl bg-indigo-600 px-4 py-3 text-sm font-semibold text-white shadow-md shadow-indigo-200 transition hover:bg-indigo-500 disabled:opacity-60"
          >
            {{ saving ? 'Պահպանվում է…' : 'Պահպանել' }}
          </button>
        </form>

        <div v-if="myEntries.length" class="mt-5 border-t border-slate-100 pt-4">
          <h3 class="mb-2 text-sm font-semibold text-slate-900">Իմ գրառումները</h3>
          <ul class="space-y-2">
            <li
              v-for="p in myEntries"
              :key="p.id"
              class="flex items-center gap-3 rounded-xl bg-slate-50 px-3 py-2"
            >
              <div class="min-w-0 flex-1">
                <div class="truncate text-sm font-medium text-slate-800">{{ p.firstName }} {{ p.lastName }}</div>
                <div class="text-xs text-slate-500">{{ formatDay(p.month, p.day) }}</div>
              </div>
              <button
                type="button"
                class="rounded-lg border border-red-200 bg-white px-3 py-1.5 text-xs font-medium text-red-600 transition hover:bg-red-50"
                @click="remove(p)"
              >
                Ջնջել
              </button>
            </li>
          </ul>
          <p class="mt-2 text-xs text-slate-400">Ջնջել կարող եք միայն այս բրաուզերից ավելացրած գրառումները։</p>
        </div>
      </section>

      <!-- Աջ սյուն՝ մոտականեր + ամբողջ ցուցակ -->
      <section class="space-y-6">
        <div v-if="upcoming.length" class="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 class="mb-3 text-base font-semibold text-slate-900">Մոտակա ծննդյան օրեր</h2>
          <div class="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            <div
              v-for="b in upcoming"
              :key="b.id"
              class="flex items-center gap-3 rounded-2xl p-3"
              :class="b.inDays === 0 ? 'bg-gradient-to-r from-pink-100 to-amber-100' : 'bg-slate-50'"
            >
              <div class="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white text-sm font-semibold text-indigo-600 shadow-sm">
                {{ initials(b) }}
              </div>
              <div class="min-w-0">
                <div class="truncate text-sm font-medium text-slate-900">{{ b.firstName }} {{ b.lastName }}</div>
                <div class="text-xs text-slate-500">{{ formatDay(b.month, b.day) }} · {{ inDaysLabel(b.inDays) }}</div>
              </div>
            </div>
          </div>
        </div>

        <div class="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
          <div class="mb-4 flex flex-wrap items-center justify-between gap-3">
            <h2 class="text-base font-semibold text-slate-900">
              Բոլորի ծննդյան օրերը
              <span class="ml-1 rounded-full bg-indigo-50 px-2 py-0.5 text-xs font-medium text-indigo-600">{{ birthdays.length }}</span>
            </h2>
            <input
              v-model="search"
              class="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none transition focus:border-indigo-400 focus:ring-4 focus:ring-indigo-100 sm:w-60"
              placeholder="Որոնել անունով…"
            />
          </div>

          <p v-if="loading" class="py-10 text-center text-sm text-slate-400">Բեռնվում է…</p>
          <p v-else-if="loadError" class="rounded-xl bg-red-50 px-3 py-2 text-sm text-red-600">{{ loadError }}</p>
          <div v-else-if="!groupedByMonth.length" class="py-12 text-center">
            <div class="text-4xl">🎈</div>
            <p class="mt-2 text-sm text-slate-500">
              {{ search ? 'Ոչինչ չի գտնվել' : 'Դեռ ոչ ոք չի ավելացրել իր ծննդյան օրը։ Եղեք առաջինը։' }}
            </p>
          </div>

          <div v-else class="grid gap-4 md:grid-cols-2">
            <div v-for="m in groupedByMonth" :key="m.month" class="overflow-hidden rounded-2xl border border-slate-100">
              <button
                type="button"
                class="flex w-full items-center justify-between bg-slate-50 px-4 py-2 text-left text-sm font-semibold text-slate-700 transition hover:bg-indigo-50"
                @click="calendar?.goTo(m.month)"
              >
                {{ m.name }}
                <span class="text-xs font-normal text-slate-400">{{ m.people.length }}</span>
              </button>
              <ul class="divide-y divide-slate-100">
                <li v-for="p in m.people" :key="p.id" class="group flex items-center gap-3 px-4 py-2">
                  <span class="w-7 shrink-0 text-center text-sm font-bold text-indigo-600">{{ p.day }}</span>
                  <span class="flex-1 truncate text-sm text-slate-800">{{ p.firstName }} {{ p.lastName }}</span>
                  <span v-if="myIds.includes(p.id)" class="rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-medium text-emerald-700">Ես</span>
                  <button
                    v-if="myIds.includes(p.id)"
                    class="rounded-lg px-2 py-1 text-xs font-medium text-red-500 transition hover:bg-red-50 hover:text-red-600"
                    @click="remove(p)"
                  >
                    Ջնջել
                  </button>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>
    </main>
  </div>
</template>
