<script setup lang="ts">
import { computed, ref } from 'vue'
import AddonsPanel from './components/AddonsPanel.vue'
import BonusPanel from './components/BonusPanel.vue'
import GearPanel from './components/GearPanel.vue'
import LevelTimeline from './components/LevelTimeline.vue'
import NotesPanel from './components/NotesPanel.vue'
import OrderList from './components/OrderList.vue'
import RacialsPanel from './components/RacialsPanel.vue'
import SpellShopPanel from './components/SpellShopPanel.vue'
import TalentDetail from './components/TalentDetail.vue'
import TalentTree from './components/TalentTree.vue'
import { specIconUrl, talentById, trees } from './data/talents'
import { FIRST_LEVEL, MAX_LEVEL, MAX_POINTS } from './planner'
import { usePlanner } from './usePlanner'

const planner = usePlanner()
const removeMode = ref(false)
const copied = ref(false)
const inspectedId = ref<string | null>(null)
const inspected = computed(() => (inspectedId.value ? talentById[inspectedId.value] : null))

const pointsLeft = computed(() => MAX_POINTS - planner.state.value.total)
const levelHint = computed(() => planner.viewLevel.value < MAX_LEVEL && !planner.editable.value)
const sliderFill = computed(
  () => `${((planner.viewLevel.value - FIRST_LEVEL) / (MAX_LEVEL - FIRST_LEVEL)) * 100}%`,
)

function onActivate(talentId: string) {
  if (removeMode.value) planner.removePoint(talentId)
  else planner.addPoint(talentId)
}

function onRename(event: Event) {
  planner.renameBuild((event.target as HTMLInputElement).value)
}

async function copyShareLink() {
  try {
    await navigator.clipboard.writeText(planner.shareUrl.value)
    copied.value = true
    setTimeout(() => (copied.value = false), 2000)
  } catch {
    window.prompt('Copia este enlace:', planner.shareUrl.value)
  }
}

function confirmDelete() {
  if (window.confirm(`¿Borrar "${planner.active.value.name}"?`)) planner.deleteBuild()
}

function confirmReset() {
  if (planner.order.value.length === 0 || window.confirm('¿Quitar todos los puntos de este build?')) {
    planner.reset()
  }
}
</script>

<template>
  <div class="app">
    <header class="brand">
      <img class="brand__crest" :src="specIconUrl('spell_holy_holybolt')" alt="" />
      <div>
        <h1>WoW Forever</h1>
        <p class="brand__sub">Planificador de talentos · Priest</p>
      </div>
      <div class="builds">
        <label class="field">
          <span>Build</span>
          <select v-model="planner.activeId.value">
            <option v-for="build in planner.builds.value" :key="build.id" :value="build.id">
              {{ build.name }}
            </option>
          </select>
        </label>
        <label class="field">
          <span>Nombre</span>
          <input type="text" :value="planner.active.value.name" maxlength="40" @change="onRename" />
        </label>
        <button type="button" class="btn" @click="planner.createBuild()">Nuevo</button>
        <button type="button" class="btn" @click="planner.duplicateBuild()">Duplicar</button>
        <button type="button" class="btn btn--danger" @click="confirmDelete">Borrar</button>
      </div>
    </header>

    <section class="panel stats" aria-label="Resumen y controles">
      <div class="stats__points" role="status">
        <strong>{{ pointsLeft }}</strong>
        <span>puntos restantes<br />de {{ MAX_POINTS }}</span>
      </div>

      <label class="stats__level">
        <span>Nivel <strong>{{ planner.viewLevel.value }}</strong></span>
        <input
          v-model.number="planner.viewLevel.value"
          type="range"
          class="slider"
          :min="FIRST_LEVEL"
          :max="MAX_LEVEL"
          :style="{ '--fill': sliderFill }"
          aria-label="Nivel mostrado"
        />
      </label>

      <div class="stats__actions">
        <div class="segmented" role="group" aria-label="Qué hace el clic en un talento">
          <button type="button" :aria-pressed="!removeMode" @click="removeMode = false">Añadir</button>
          <button type="button" :aria-pressed="removeMode" @click="removeMode = true">Quitar</button>
        </div>
        <button type="button" class="btn" @click="confirmReset">Reiniciar</button>
        <button type="button" class="btn btn--primary" @click="copyShareLink">
          {{ copied ? '¡Enlace copiado!' : 'Copiar enlace' }}
        </button>
      </div>
    </section>

    <p v-if="planner.rejected.value" class="notice notice--warn" role="alert">
      Ese cambio rompe los requisitos del build, no se ha aplicado.
    </p>
    <p v-if="levelHint" class="notice">
      Estás viendo el build a nivel {{ planner.viewLevel.value }}. Sube el deslizador al máximo para editar.
    </p>
    <p class="hint">Clic: añadir punto · Clic derecho o Supr: quitar el último punto del talento.</p>

    <main class="layout">
      <div class="trees">
        <TalentTree
          v-for="tree in trees"
          :key="tree.id"
          :tree="tree"
          :state="planner.state.value"
          :interactive="planner.editable.value"
          @activate="onActivate"
          @remove="planner.removePoint"
          @inspect="inspectedId = $event"
        />
      </div>
      <aside class="side">
        <TalentDetail :talent="inspected" :rank="inspected ? (planner.state.value.ranks[inspected.id] ?? 0) : 0" />
        <OrderList
          :order="planner.order.value"
          :shown-steps="planner.shownSteps.value"
          :level-notes="planner.active.value.levelNotes ?? {}"
          @select="planner.viewLevel.value = $event"
          @move="planner.moveStep"
          @remove="planner.removeStep"
          @note="planner.setLevelNote"
        />
      </aside>
    </main>

    <div class="extras">
      <RacialsPanel />
      <NotesPanel :notes="planner.active.value.notes ?? ''" @change="planner.setBuildNotes" />
    </div>

    <LevelTimeline />

    <GearPanel />

    <BonusPanel />

    <SpellShopPanel />

    <AddonsPanel />

    <footer class="credits">
      Talentos y textos: <a href="https://foreverdb.net" target="_blank" rel="noopener noreferrer">ForeverDB</a>.
      Raciales y hechizos de entrenador:
      <a href="https://talentsforever.com" target="_blank" rel="noopener noreferrer">talentsforever.com</a>
      (<a href="https://creativecommons.org/licenses/by/4.0/" target="_blank" rel="noopener noreferrer">CC BY 4.0</a>).
      Datos de la beta, sujetos a cambios. Proyecto de fan, sin relación con Blizzard Entertainment.
    </footer>
  </div>
</template>
