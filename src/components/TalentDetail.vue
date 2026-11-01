<script setup lang="ts">
import { computed } from 'vue'
import { iconUrl, spellUrl, talentById } from '../data/talents'
import { rowRequirement } from '../planner'
import type { Talent } from '../types'

const props = defineProps<{
  talent: Talent | null
  rank: number
}>()

const prerequisite = computed(() =>
  props.talent?.requires ? talentById[props.talent.requires] : null,
)
const pointsNeeded = computed(() => (props.talent ? rowRequirement(props.talent) : 0))
const current = computed(() =>
  props.talent && props.rank > 0 ? props.talent.descriptions.es[props.rank - 1] : null,
)
const next = computed(() =>
  props.talent && props.rank < props.talent.maxRank ? props.talent.descriptions.es[props.rank] : null,
)
</script>

<template>
  <section class="detail" :class="{ 'detail--empty': !talent }" aria-label="Detalle del talento" aria-live="polite">
    <p v-if="!talent" class="detail__empty">
      Pasa el ratón o enfoca un talento para ver qué hace.
    </p>
    <template v-else>
      <div class="detail__head">
        <img class="detail__icon" :src="iconUrl(talent)" alt="" />
        <div>
          <h2>{{ talent.name }}</h2>
          <p class="detail__meta">Rango {{ rank }} de {{ talent.maxRank }} · Nivel {{ 5 + talent.row * 5 }}</p>
        </div>
      </div>
      <p v-if="current" class="detail__text">
        <strong>Ahora (rango {{ rank }}):</strong> {{ current }}
      </p>
      <p v-if="next" class="detail__text" :class="{ 'detail__text--next': current }">
        <strong>{{ current ? `Siguiente (rango ${rank + 1})` : 'Rango 1' }}:</strong> {{ next }}
      </p>
      <details v-if="talent.maxRank > 1" class="detail__ranks">
        <summary>Todos los rangos</summary>
        <ol>
          <li v-for="(text, index) in talent.descriptions.es" :key="index">{{ text }}</li>
        </ol>
      </details>
      <ul class="detail__reqs">
        <li v-if="pointsNeeded > 0">Requiere {{ pointsNeeded }} puntos en este árbol.</li>
        <li v-if="prerequisite">Requiere {{ prerequisite.name }} al máximo.</li>
      </ul>
      <a class="detail__link" :href="spellUrl(talent)" target="_blank" rel="noopener noreferrer">
        Ver en ForeverDB
      </a>
    </template>
  </section>
</template>
