<script setup lang="ts">
import { computed, nextTick, ref } from 'vue'
import { iconUrl, talentById } from '../data/talents'
import { levelOfStep } from '../planner'

const props = defineProps<{
  order: string[]
  shownSteps: number
  levelNotes: Record<string, string>
}>()

const emit = defineEmits<{
  select: [level: number]
  move: [from: number, to: number]
  remove: [index: number]
  note: [level: number, text: string]
}>()

const editingLevel = ref<number | null>(null)
const noteInput = ref<HTMLInputElement[]>([])

const steps = computed(() => {
  const seen: Record<string, number> = {}
  return props.order.map((id, index) => {
    seen[id] = (seen[id] ?? 0) + 1
    const level = levelOfStep(index)
    return { index, talent: talentById[id], rank: seen[id], level, note: props.levelNotes[level] ?? '' }
  })
})

async function startEditing(level: number) {
  editingLevel.value = level
  await nextTick()
  noteInput.value[0]?.focus()
}

function saveNote(level: number, event: Event) {
  if (editingLevel.value !== level) return
  editingLevel.value = null
  emit('note', level, (event.target as HTMLInputElement).value)
}
</script>

<template>
  <section class="order" aria-label="Orden de subida">
    <header class="order__header">
      <h2>Orden de subida</h2>
      <span class="order__count">{{ steps.length }} / 51</span>
    </header>
    <p v-if="steps.length === 0" class="order__empty">
      Aún no has puesto ningún punto. Haz clic en un talento para empezar: el primer punto es del nivel 10.
    </p>
    <ol v-else class="order__list">
      <li
        v-for="step in steps"
        :key="step.index"
        class="order__item"
        :class="[
          `order__item--${step.talent.tree}`,
          {
            'order__item--current': step.index === shownSteps - 1,
            'order__item--future': step.index >= shownSteps,
          },
        ]"
      >
        <div class="order__row">
          <button type="button" class="order__main" @click="emit('select', step.level)">
            <span class="order__level">{{ step.level }}</span>
            <img class="order__icon" :src="iconUrl(step.talent)" alt="" loading="lazy" />
            <span class="order__talent">{{ step.talent.name }}</span>
            <span class="order__rank">{{ step.rank }}/{{ step.talent.maxRank }}</span>
          </button>
          <span class="order__actions">
            <button
              type="button"
              :class="{ 'order__note-btn--filled': step.note }"
              :aria-label="`Nota del nivel ${step.level}`"
              @click="startEditing(step.level)"
            >
              ✎
            </button>
            <button
              type="button"
              :disabled="step.index === 0"
              :aria-label="`Subir ${step.talent.name} un puesto`"
              @click="emit('move', step.index, step.index - 1)"
            >
              ↑
            </button>
            <button
              type="button"
              :disabled="step.index === steps.length - 1"
              :aria-label="`Bajar ${step.talent.name} un puesto`"
              @click="emit('move', step.index, step.index + 1)"
            >
              ↓
            </button>
            <button
              type="button"
              :aria-label="`Quitar este punto de ${step.talent.name}`"
              @click="emit('remove', step.index)"
            >
              ✕
            </button>
          </span>
        </div>
        <input
          v-if="editingLevel === step.level"
          ref="noteInput"
          class="order__note-input"
          type="text"
          maxlength="160"
          placeholder="Nota para este nivel (Enter para guardar)"
          :value="step.note"
          :aria-label="`Nota del nivel ${step.level}`"
          @keydown.enter.prevent="saveNote(step.level, $event)"
          @keydown.esc="editingLevel = null"
          @blur="saveNote(step.level, $event)"
        />
        <button
          v-else-if="step.note"
          type="button"
          class="order__note"
          @click="startEditing(step.level)"
        >
          {{ step.note }}
        </button>
      </li>
    </ol>
  </section>
</template>
