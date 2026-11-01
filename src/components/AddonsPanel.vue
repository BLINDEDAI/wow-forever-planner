<script setup lang="ts">
import { computed, ref } from 'vue'
import raw from '../data/addons.json'

const STORAGE_KEY = 'wow-forever-planner.addons.v1'

function loadDone(): string[] {
  try {
    const parsed: unknown = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '[]')
    return Array.isArray(parsed) ? parsed.filter((id): id is string => typeof id === 'string') : []
  } catch {
    return []
  }
}

const done = ref(new Set(loadDone()))
const doneCount = computed(() => raw.steps.filter((step) => done.value.has(step.id)).length)

function toggle(id: string) {
  const next = new Set(done.value)
  if (next.has(id)) next.delete(id)
  else next.add(id)
  done.value = next
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify([...next]))
  } catch {
    // Private mode or blocked storage: the checklist still works for this visit.
  }
}
</script>

<template>
  <section class="panel addons" aria-labelledby="addons-title">
    <header class="section-head">
      <h2 id="addons-title">Addons: dos y listo</h2>
      <span class="section-head__sub">
        Según
        <a :href="raw.video" target="_blank" rel="noopener noreferrer">Broog</a>
        · datos de la beta
      </span>
    </header>

    <p class="shop__intro">{{ raw.intro }}</p>

    <div class="addons__cards">
      <article v-for="addon in raw.addons" :key="addon.id" class="addons__card">
        <h3>
          <a :href="addon.url" target="_blank" rel="noopener noreferrer">{{ addon.name }}</a>
          <span class="addons__ver">v{{ addon.version }} · {{ addon.date }}</span>
        </h3>
        <p class="addons__role">{{ addon.role }}</p>
        <ul>
          <li v-for="line in addon.covers" :key="line">{{ line }}</li>
        </ul>
      </article>
    </div>

    <h3 class="tl__heading">Perfiles ya preparados</h3>
    <ul class="addons__profiles">
      <li v-for="profile in raw.profiles" :key="profile.id">
        <div>
          <strong>{{ profile.name }}</strong>
          <p>{{ profile.text }}</p>
        </div>
        <a class="btn" :href="profile.url" target="_blank" rel="noopener noreferrer">Abrir cadena</a>
      </li>
    </ul>
    <p class="addons__note">
      Se abren como texto: selecciona todo (Ctrl+A), copia (Ctrl+C) y pega en el juego. Repositorio completo:
      <a :href="raw.profilesRepo" target="_blank" rel="noopener noreferrer">broogWoW/WoW-UI</a>.
    </p>

    <h3 class="tl__heading">
      Pasos del día de lanzamiento
      <span class="addons__count">{{ doneCount }} de {{ raw.steps.length }}</span>
    </h3>
    <ol class="addons__steps">
      <li v-for="step in raw.steps" :key="step.id" :class="{ 'addons__step--done': done.has(step.id) }">
        <label>
          <input type="checkbox" :checked="done.has(step.id)" @change="toggle(step.id)" />
          <span>
            <strong>{{ step.title }}</strong>
            <em>{{ step.text }}</em>
          </span>
        </label>
      </li>
    </ol>

    <h3 class="tl__heading">{{ raw.split.title }}</h3>
    <div class="addons__cards">
      <article class="addons__card">
        <h3>Ellesmere UI</h3>
        <ul>
          <li v-for="line in raw.split.eui" :key="line">{{ line }}</li>
        </ul>
      </article>
      <article class="addons__card">
        <h3>Naowh Forever</h3>
        <ul>
          <li v-for="line in raw.split.nf" :key="line">{{ line }}</li>
        </ul>
      </article>
    </div>

    <details class="bonus__more">
      <summary>Consejos y avisos</summary>
      <div class="bonus__grid">
        <article class="bonus__card">
          <h3>Consejos</h3>
          <ul>
            <li v-for="tip in raw.tips" :key="tip.title">
              <strong>{{ tip.title }}.</strong> {{ tip.text }}
            </li>
          </ul>
        </article>
        <article class="bonus__card">
          <h3>Avisos</h3>
          <ul>
            <li v-for="line in raw.caveats" :key="line">{{ line }}</li>
          </ul>
        </article>
      </div>
    </details>
  </section>
</template>
