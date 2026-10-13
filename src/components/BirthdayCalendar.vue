<script setup>
import { computed, ref } from 'vue'
import { MONTHS, WEEKDAYS } from '../months'

const props = defineProps({
  birthdays: { type: Array, required: true },
  selected: { type: Object, default: null }, // { month, day }
})
const emit = defineEmits(['select'])

const today = new Date()
const month = ref(props.selected?.month ?? today.getMonth() + 1)

const cells = computed(() => {
  const year = today.getFullYear()
  const daysInMonth = new Date(2024, month.value, 0).getDate() // փետրվարի 29-ը միշտ հասանելի է
  const offset = (new Date(year, month.value - 1, 1).getDay() + 6) % 7 // երկուշաբթիից սկսած
  const result = Array.from({ length: offset }, () => null)
  for (let day = 1; day <= daysInMonth; day++) {
    result.push({
      day,
      people: props.birthdays.filter((b) => b.month === month.value && b.day === day),
      isToday: month.value === today.getMonth() + 1 && day === today.getDate(),
      isSelected: props.selected?.month === month.value && props.selected?.day === day,
    })
  }
  return result
})

const monthCount = computed(() => props.birthdays.filter((b) => b.month === month.value).length)

function shift(delta) {
  month.value = ((month.value - 1 + delta + 12) % 12) + 1
}

defineExpose({ goTo: (m) => (month.value = m) })
</script>

<template>
  <div>
    <div class="mb-4 flex items-center justify-between">
      <button
        type="button"
        class="rounded-full p-2 text-slate-500 transition hover:bg-slate-100 hover:text-slate-900"
        aria-label="Նախորդ ամիս"
        @click="shift(-1)"
      >
        <svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path d="M15 19l-7-7 7-7" /></svg>
      </button>
      <div class="text-center">
        <div class="text-lg font-semibold text-slate-900">{{ MONTHS[month - 1] }}</div>
        <div class="text-xs text-slate-500">{{ monthCount }} ծննդյան օր</div>
      </div>
      <button
        type="button"
        class="rounded-full p-2 text-slate-500 transition hover:bg-slate-100 hover:text-slate-900"
        aria-label="Հաջորդ ամիս"
        @click="shift(1)"
      >
        <svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path d="M9 5l7 7-7 7" /></svg>
      </button>
    </div>

    <div class="grid grid-cols-7 gap-1 text-center text-xs font-medium text-slate-400">
      <div v-for="w in WEEKDAYS" :key="w" class="py-1">{{ w }}</div>
    </div>

    <div class="mt-1 grid grid-cols-7 gap-1">
      <template v-for="(cell, i) in cells" :key="i">
        <div v-if="!cell" />
        <button
          v-else
          type="button"
          :title="cell.people.map((p) => `${p.firstName} ${p.lastName}`).join(', ')"
          class="relative flex aspect-square flex-col items-center justify-center rounded-xl text-sm transition"
          :class="[
            cell.isSelected
              ? 'bg-indigo-600 font-semibold text-white shadow-md shadow-indigo-200'
              : cell.people.length
                ? 'bg-pink-50 font-semibold text-pink-700 hover:bg-pink-100'
                : 'text-slate-700 hover:bg-slate-100',
            cell.isToday && !cell.isSelected ? 'ring-2 ring-indigo-400' : '',
          ]"
          @click="emit('select', { month, day: cell.day })"
        >
          {{ cell.day }}
          <span
            v-if="cell.people.length"
            class="absolute bottom-1 flex items-center gap-0.5 text-[10px] leading-none"
            :class="cell.isSelected ? 'text-indigo-100' : 'text-pink-500'"
          >
            🎂<span v-if="cell.people.length > 1">{{ cell.people.length }}</span>
          </span>
        </button>
      </template>
    </div>
  </div>
</template>
