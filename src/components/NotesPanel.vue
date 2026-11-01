<script setup lang="ts">
defineProps<{
  notes: string
}>()

const emit = defineEmits<{
  change: [text: string]
}>()

function onInput(event: Event) {
  emit('change', (event.target as HTMLTextAreaElement).value)
}
</script>

<template>
  <section class="panel notes" aria-labelledby="notes-title">
    <header class="section-head">
      <h2 id="notes-title">Notas del build</h2>
      <span class="section-head__sub">Se guardan en este navegador</span>
    </header>
    <label class="notes__label" for="build-notes">
      Para qué es este build, qué quests hacer, cuándo cambiar de talentos…
    </label>
    <textarea
      id="build-notes"
      class="notes__text"
      rows="7"
      maxlength="4000"
      :value="notes"
      @input="onInput"
    />
  </section>
</template>
