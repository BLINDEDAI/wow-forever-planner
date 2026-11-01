<script setup lang="ts">
import { computed, ref } from 'vue'
import { iconUrl } from '../data/talents'
import type { Talent } from '../types'

const props = defineProps<{
  talent: Talent
  rank: number
  available: boolean
  interactive: boolean
}>()

const emit = defineEmits<{
  activate: []
  remove: []
  inspect: []
}>()

const imageFailed = ref(false)
const initials = computed(() =>
  props.talent.name
    .split(/\s+/)
    .map((word) => word[0])
    .join('')
    .slice(0, 3),
)
const maxed = computed(() => props.rank === props.talent.maxRank)
const label = computed(() => `${props.talent.name}, rango ${props.rank} de ${props.talent.maxRank}`)

function onKeydown(event: KeyboardEvent) {
  if (event.key === 'Delete' || event.key === 'Backspace') {
    event.preventDefault()
    emit('remove')
  }
}
</script>

<template>
  <button
    type="button"
    class="node"
    :class="{
      'node--maxed': maxed,
      'node--partial': rank > 0 && !maxed,
      'node--available': available && rank === 0,
      'node--locked': !available && rank === 0,
    }"
    :aria-label="label"
    :title="label"
    :disabled="!interactive"
    @click="emit('activate')"
    @contextmenu.prevent="emit('remove')"
    @mouseenter="emit('inspect')"
    @focus="emit('inspect')"
    @keydown="onKeydown"
  >
    <img
      v-if="!imageFailed"
      class="node__icon"
      :src="iconUrl(talent)"
      alt=""
      loading="lazy"
      @error="imageFailed = true"
    />
    <span v-else class="node__icon node__icon--fallback" aria-hidden="true">{{ initials }}</span>
    <span class="node__rank" aria-hidden="true">{{ rank }}/{{ talent.maxRank }}</span>
  </button>
</template>
