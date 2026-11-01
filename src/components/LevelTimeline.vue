<script setup lang="ts">
import { computed, nextTick, ref } from 'vue'
import { specIconUrl } from '../data/talents'
import {
  MAX_LEVEL,
  MIN_LEVEL,
  bestRankAt,
  coreSpells,
  eventsSource,
  markersAt,
  notesAt,
  rotationAt,
  rotationUpdates,
  spellById,
  talentEvents,
  wandEvents,
  type CoreSpell,
  type EffectKind,
  type RotationStep,
} from '../leveling'

const WAND_ICON = 'inv_wand_01'
const MELEE_ICON = 'inv_mace_01'

const levels = Array.from({ length: MAX_LEVEL - MIN_LEVEL + 1 }, (_, i) => MIN_LEVEL + i)
/** `?level=36` opens the timeline on that level, so a level can be linked or bookmarked. */
function initialLevel(): number {
  const requested = Number(new URLSearchParams(window.location.search).get('level'))
  return Number.isInteger(requested) && requested >= MIN_LEVEL && requested <= MAX_LEVEL ? requested : MIN_LEVEL
}

const selected = ref(initialLevel())
const track = ref<HTMLElement | null>(null)

const effectUnit: Record<EffectKind, string> = {
  damage: 'de daño',
  'damage-over-time': 'de daño total',
  absorb: 'de absorción',
}

function spellIcon(spell: CoreSpell): string {
  return spell.icon
    ? specIconUrl(spell.icon)
    : `${import.meta.env.BASE_URL}icons/${spell.iconId}.webp`
}

function stepIcon(step: RotationStep): string {
  if (step.spell === 'wand') return specIconUrl(WAND_ICON)
  if (step.spell === 'melee') return specIconUrl(MELEE_ICON)
  return spellIcon(spellById[step.spell])
}

function stepName(step: RotationStep): string {
  if (step.spell === 'wand') return 'Varita'
  if (step.spell === 'melee') return 'Arma cuerpo a cuerpo'
  return spellById[step.spell].name
}

const markers = computed(() => levels.map((level) => ({ level, ...markersAt(level) })))
const current = computed(() => markersAt(selected.value))
const notes = computed(() => [
  ...notesAt(wandEvents, selected.value).map((n) => ({ ...n, kind: 'wand' })),
  ...notesAt(talentEvents, selected.value).map((n) => ({ ...n, kind: 'talent' })),
  ...notesAt(rotationUpdates, selected.value).map((n) => ({ ...n, kind: 'rotation' })),
])
const table = computed(() =>
  coreSpells.flatMap((spell) => {
    const rank = bestRankAt(spell, selected.value)
    return rank ? [{ spell, rank, isNew: rank.level === selected.value }] : []
  }),
)
const rotation = computed(() => rotationAt(selected.value))
const sliderFill = computed(() => `${((selected.value - MIN_LEVEL) / (MAX_LEVEL - MIN_LEVEL)) * 100}%`)

function describe(level: number, m: ReturnType<typeof markersAt>): string {
  const parts: string[] = []
  if (m.ranks.length) parts.push(`${m.ranks.length} rango(s) nuevo(s)`)
  if (m.wands.length) parts.push('varita')
  if (m.talents.length) parts.push('talentos')
  if (m.rotation.length) parts.push('cambio de rotación')
  return `Nivel ${level}${parts.length ? ': ' + parts.join(', ') : ''}`
}

async function select(level: number, focus = false) {
  selected.value = Math.min(MAX_LEVEL, Math.max(MIN_LEVEL, level))
  if (focus) {
    await nextTick()
    track.value?.querySelector<HTMLButtonElement>(`[data-level="${selected.value}"]`)?.focus()
  }
}

function onKeydown(event: KeyboardEvent) {
  if (event.key === 'ArrowRight') {
    event.preventDefault()
    select(selected.value + 1, true)
  } else if (event.key === 'ArrowLeft') {
    event.preventDefault()
    select(selected.value - 1, true)
  }
}
</script>

<template>
  <section class="panel timeline" aria-labelledby="timeline-title">
    <header class="section-head">
      <h2 id="timeline-title">Línea de nivel · varitas y rotación</h2>
      <span class="section-head__sub">
        Rangos de
        <a href="https://talentsforever.com" target="_blank" rel="noopener noreferrer">talentsforever.com</a>;
        rotación y varitas según
        <a :href="eventsSource.video" target="_blank" rel="noopener noreferrer">AwesomeSP</a>
      </span>
    </header>

    <ul class="tl__legend" aria-label="Leyenda">
      <li><span class="mk mk--rank" />Rango nuevo</li>
      <li><span class="mk mk--wand" />Varita</li>
      <li><span class="mk mk--talent">★</span>Talento</li>
      <li><span class="mk mk--rotation">↻</span>Rotación</li>
    </ul>

    <div class="tl__scroll">
      <div ref="track" class="tl__track" role="group" aria-label="Niveles 1 a 60" @keydown="onKeydown">
        <button
          v-for="m in markers"
          :key="m.level"
          type="button"
          class="tl__col"
          :class="{ 'tl__col--selected': m.level === selected }"
          :data-level="m.level"
          :aria-label="describe(m.level, m)"
          :aria-current="m.level === selected ? 'true' : undefined"
          @click="select(m.level)"
        >
          <span class="tl__stack">
            <img
              v-for="r in m.ranks"
              :key="`${r.spell.id}-${r.rank.rank}`"
              class="mk mk--rank"
              :src="spellIcon(r.spell)"
              alt=""
              loading="lazy"
            />
            <img v-if="m.wands.length" class="mk mk--wand" :src="specIconUrl(WAND_ICON)" alt="" loading="lazy" />
            <span v-if="m.talents.length" class="mk mk--talent" aria-hidden="true">★</span>
            <span v-if="m.rotation.length" class="mk mk--rotation" aria-hidden="true">↻</span>
          </span>
          <span class="tl__tick" :class="{ 'tl__tick--label': m.level === 1 || m.level % 5 === 0 }">
            {{ m.level === 1 || m.level % 5 === 0 || m.level === selected ? m.level : '' }}
          </span>
        </button>
      </div>
    </div>

    <div class="tl__controls">
      <button type="button" class="btn" :disabled="selected <= MIN_LEVEL" @click="select(selected - 1)">←</button>
      <input
        :value="selected"
        type="range"
        class="slider"
        :min="MIN_LEVEL"
        :max="MAX_LEVEL"
        :style="{ '--fill': sliderFill }"
        aria-label="Nivel seleccionado"
        @input="select(Number(($event.target as HTMLInputElement).value))"
      />
      <button type="button" class="btn" :disabled="selected >= MAX_LEVEL" @click="select(selected + 1)">→</button>
    </div>

    <div class="tl__detail" aria-live="polite">
      <div class="tl__level">Nivel {{ selected }}</div>

      <ul v-if="current.ranks.length || notes.length" class="tl__chips">
        <li v-for="r in current.ranks" :key="`${r.spell.id}-${r.rank.rank}`" class="chip chip--rank">
          <img :src="spellIcon(r.spell)" alt="" />
          <span><small>Rango nuevo</small>{{ r.spell.name }} · rango {{ r.rank.rank }}</span>
        </li>
        <li v-for="n in notes" :key="n.kind + n.text" class="chip" :class="`chip--${n.kind}`">
          <span class="chip__mark" aria-hidden="true">{{ n.kind === 'talent' ? '★' : n.kind === 'rotation' ? '↻' : '' }}</span>
          <img v-if="n.kind === 'wand'" :src="specIconUrl(WAND_ICON)" alt="" />
          <span>
            <small>{{ n.kind === 'wand' ? 'Varita' : n.kind === 'talent' ? 'Talentos' : 'Cambio de rotación' }}</small>
            {{ n.text }}
            <ul v-if="n.details" class="chip__details">
              <li v-for="line in n.details" :key="line">{{ line }}</li>
            </ul>
          </span>
        </li>
      </ul>
      <p v-else class="tl__quiet">Sin cambios en este nivel: sigue con la rotación de abajo.</p>

      <div class="tl__cols">
        <div>
          <h3 class="tl__heading">Hechizos</h3>
          <table class="tl__table">
            <thead>
              <tr><th scope="col">Hechizo</th><th scope="col">Rango</th><th scope="col">Efecto</th><th scope="col">Maná</th></tr>
            </thead>
            <tbody>
              <tr v-for="row in table" :key="row.spell.id" :class="{ 'is-new': row.isNew }">
                <th scope="row">
                  <img :src="spellIcon(row.spell)" alt="" />
                  {{ row.spell.name }}
                </th>
                <td>{{ row.rank.rank }}</td>
                <td>{{ row.rank.effect }} <small>{{ effectUnit[row.spell.kind] }}</small></td>
                <td>{{ row.rank.mana }}</td>
              </tr>
            </tbody>
          </table>
          <p class="tl__fine">Las cifras son sin equipo; la varita y el poder de hechizo las cambian.</p>
        </div>

        <div>
          <h3 class="tl__heading">Rotación</h3>
          <ul v-if="rotation" class="tl__rows">
            <li v-for="(row, index) in rotation.rows" :key="index" class="tl__row">
              <div class="tl__rowlabel">
                {{ row.label }}
                <small v-if="row.sub">{{ row.sub }}</small>
              </div>
              <ol class="tl__steps">
                <li v-for="(step, i) in row.steps" :key="i" class="tl__step">
                  <span v-if="i > 0" class="tl__arrow" aria-hidden="true">›</span>
                  <span class="tl__icon">
                    <img :src="stepIcon(step)" :alt="stepName(step)" :title="stepName(step)" loading="lazy" />
                    <b v-if="step.times && step.times > 1">×{{ step.times }}</b>
                  </span>
                </li>
              </ol>
            </li>
          </ul>
        </div>
      </div>
    </div>
  </section>
</template>
