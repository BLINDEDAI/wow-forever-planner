<script setup lang="ts">
import { computed, ref } from 'vue'
import { shopping, shoppingIconUrl, type ShoppingVerdict } from '../data/spellShopping'

type Filter = 'all' | ShoppingVerdict

const filters: { value: Filter; label: string }[] = [
  { value: 'all', label: 'Todos' },
  { value: 'buy', label: 'Comprar' },
  { value: 'nuance', label: 'Con matices' },
  { value: 'skip', label: 'Saltar' },
]
const verdictLabel: Record<ShoppingVerdict, string> = {
  buy: 'Comprar',
  nuance: 'Con matices',
  skip: 'Saltar',
}

const filter = ref<Filter>('all')
const visible = computed(() =>
  filter.value === 'all' ? shopping.spells : shopping.spells.filter((s) => s.verdict === filter.value),
)
</script>

<template>
  <section class="panel shop" aria-labelledby="shop-title">
    <header class="section-head">
      <h2 id="shop-title">Hechizos: qué comprar</h2>
      <div class="segmented" role="group" aria-label="Filtrar hechizos">
        <button
          v-for="option in filters"
          :key="option.value"
          type="button"
          :aria-pressed="filter === option.value"
          @click="filter = option.value"
        >
          {{ option.label }}
        </button>
      </div>
    </header>
    <p class="shop__intro">
      {{ shopping.saving }} Es la opinión del autor de
      <a :href="shopping.video" target="_blank" rel="noopener noreferrer">esta guía de AwesomeSP</a>
      sobre la beta, no datos oficiales.
    </p>
    <ul class="shop__grid">
      <li v-for="spell in visible" :key="spell.id" class="shop__item" :class="`shop__item--${spell.verdict}`">
        <img class="shop__icon" :src="shoppingIconUrl(spell)" alt="" loading="lazy" />
        <div>
          <h3>
            {{ spell.name }}
            <span class="shop__badge">{{ verdictLabel[spell.verdict] }}</span>
          </h3>
          <p>{{ spell.note }}</p>
        </div>
      </li>
    </ul>
  </section>
</template>
