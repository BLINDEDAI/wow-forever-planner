<script setup lang="ts">
import { computed, ref } from 'vue'
import {
  GEAR_FIRST_LEVEL,
  GEAR_LAST_LEVEL,
  gearAt,
  gearSpecs,
  itemIconUrl,
  itemUrl,
  type Difficulty,
  type GearSpec,
} from '../data/gear'

const difficultyLabel: Record<Difficulty, string> = {
  easy: 'Fácil',
  some: 'Con esfuerzo',
  hard: 'Difícil',
  unknown: 'Desconocido',
}
const qualityName = ['Pobre', 'Común', 'Poco común', 'Raro', 'Épico', 'Legendario']

const spec = ref<GearSpec>('shadow')
const level = ref(20)

const slots = computed(() => gearAt(spec.value, level.value))
const sliderFill = computed(
  () => `${((level.value - GEAR_FIRST_LEVEL) / (GEAR_LAST_LEVEL - GEAR_FIRST_LEVEL)) * 100}%`,
)
</script>

<template>
  <section class="panel gear" aria-labelledby="gear-title">
    <header class="section-head">
      <h2 id="gear-title">Equipo por nivel</h2>
      <div class="segmented" role="group" aria-label="Especialización">
        <button
          v-for="option in gearSpecs"
          :key="option.value"
          type="button"
          :aria-pressed="spec === option.value"
          @click="spec = option.value"
        >
          {{ option.label }}
        </button>
      </div>
    </header>

    <p class="shop__intro">
      Mejor objeto para cada hueco según tu nivel, calculado por
      <a href="https://foreverdb.net/bis/priest/shadow" target="_blank" rel="noopener noreferrer">ForeverDB</a>
      en modo subida de nivel. La puntuación es de su cálculo, no un dato del juego, y varias fuentes todavía no se
      conocen: mira siempre la dificultad antes de ir a por algo.
    </p>
    <p class="shop__intro">
      Ojo con lo fabricado: tener la profesión no basta, hace falta la receta. Muchas se compran con
      <strong>Merchant's Favor</strong>, una moneda nueva de Forever que se gana llenando y entregando cajas del mundo
      (en Alianza, en el campamento de Three Corners, Redridge Mountains). De otras todavía no se sabe dónde salen.
      Cada pieza fabricada indica de dónde sale su receta.
    </p>

    <label class="gear__level">
      <span>Nivel <strong>{{ level }}</strong></span>
      <input
        v-model.number="level"
        type="range"
        class="slider"
        :min="GEAR_FIRST_LEVEL"
        :max="GEAR_LAST_LEVEL"
        :style="{ '--fill': sliderFill }"
        aria-label="Nivel del equipo"
      />
    </label>

    <ul class="gear__grid">
      <li
        v-for="slot in slots"
        :key="slot.key"
        class="gear__item"
        :class="slot.entry ? `gear__item--${slot.entry.difficulty}` : 'gear__item--empty'"
      >
        <p class="gear__slot">{{ slot.label }}</p>

        <template v-if="slot.entry && slot.item">
          <div class="gear__main">
            <img
              class="gear__icon"
              :class="`gear__icon--q${slot.item.quality}`"
              :src="itemIconUrl(slot.item)"
              :alt="qualityName[slot.item.quality]"
              :title="qualityName[slot.item.quality]"
              loading="lazy"
            />
            <div>
              <h3>
                <a :href="itemUrl(slot.entry.id)" target="_blank" rel="noopener noreferrer">{{ slot.item.name }}</a>
                <span v-if="slot.entry.hordeName" class="gear__alt-name">(Horda: {{ slot.entry.hordeName }})</span>
              </h3>
              <p class="gear__meta">
                {{ slot.item.requiredLevel ? `Nivel ${slot.item.requiredLevel}` : 'Sin requisito de nivel' }}
                · puntuación {{ slot.entry.score.toString().replace('.', ',') }}
              </p>
            </div>
          </div>

          <p class="gear__stats">{{ slot.entry.stats }}</p>
          <p class="gear__source">{{ slot.entry.source }}</p>
          <p v-if="slot.entry.recipe" class="gear__source gear__recipe" :class="{ 'gear__recipe--unknown': slot.entry.recipeKind === 'unknown' }">
            {{ slot.entry.recipe }}
          </p>
          <p class="gear__effort">
            <span class="gear__badge">{{ difficultyLabel[slot.entry.difficulty] }}</span>
            {{ slot.entry.effort }}
          </p>
          <p v-if="slot.entry.recipeKind === 'unknown' && slot.alternatives.length" class="gear__warn">
            Nadie sabe aún dónde conseguir su receta: mira las alternativas.
          </p>
          <p v-else-if="slot.entry.difficulty === 'hard' && slot.alternatives.length" class="gear__warn">
            Casi imposible de conseguir a tiempo: mira las alternativas.
          </p>
          <p v-if="slot.entry.faction === 'Horde'" class="gear__warn">
            Solo Horda: tu personaje es de Alianza, usa una alternativa.
          </p>
          <p v-if="slot.entry.enchant" class="gear__enchant">
            Encantamiento: {{ slot.entry.enchant }}
            <template v-if="slot.entry.enchantUpgradeLevel">
              (hay uno mejor a nivel {{ slot.entry.enchantUpgradeLevel }})
            </template>
          </p>

          <ul v-if="slot.alternatives.length" class="gear__alts">
            <li class="gear__alts-title">Alternativas</li>
            <li v-for="alt in slot.alternatives" :key="alt.id">
              <img v-if="alt.item" :src="itemIconUrl(alt.item)" alt="" loading="lazy" />
              <div>
                <a :href="itemUrl(alt.id)" target="_blank" rel="noopener noreferrer">
                  {{ alt.item?.name ?? `Objeto ${alt.id}` }}
                </a>
                <em :title="`Un ${alt.percent}% peor que la primera opción`">−{{ alt.percent }}%</em>
                <span v-if="alt.source" :class="{ 'gear__alts-warn': alt.source.faction === 'Horde' }">
                  {{ alt.source.text }}
                </span>
                <span v-if="alt.source?.recipe" :class="{ 'gear__alts-warn': alt.source.recipeKind === 'unknown' }">
                  {{ alt.source.recipe }}
                </span>
              </div>
            </li>
          </ul>
        </template>
        <p v-else class="gear__none">Nada recomendado a este nivel.</p>
      </li>
    </ul>
  </section>
</template>
