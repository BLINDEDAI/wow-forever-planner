<script setup lang="ts">
import { racialIconUrl, racials, race } from '../data/racials'
import { spellUrl } from '../data/talents'
import type { RacialKind } from '../types'

const kindLabel: Record<RacialKind, string> = {
  racial: 'Racial',
  passive: 'Pasiva racial',
  'class-spell': 'Hechizo de entrenador',
}
</script>

<template>
  <section class="panel racials" aria-labelledby="racials-title">
    <header class="section-head">
      <h2 id="racials-title">Raciales · {{ race }}</h2>
      <span class="section-head__sub">Datos de la beta; confírmalos en el juego</span>
    </header>
    <ul class="racials__grid">
      <li v-for="racial in racials" :key="racial.id" class="racial">
        <img class="racial__icon" :src="racialIconUrl(racial)" alt="" loading="lazy" />
        <div class="racial__body">
          <h3>{{ racial.name }}</h3>
          <p class="racial__tag">
            {{ kindLabel[racial.kind] }}<template v-if="racial.level"> · nivel {{ racial.level }}</template>
          </p>
          <p v-if="racial.details" class="racial__details">{{ racial.details }}</p>
          <p class="racial__text">{{ racial.description }}</p>
          <p v-if="racial.note" class="racial__note">{{ racial.note }}</p>
          <a
            class="racial__link"
            :href="spellUrl(racial)"
            target="_blank"
            rel="noopener noreferrer"
          >
            Ver en ForeverDB
          </a>
        </div>
      </li>
    </ul>
  </section>
</template>
