<script setup lang="ts">
import raw from '../data/bonus.json'
import { specIconUrl } from '../data/talents'

interface BonusItem {
  name: string
  icon?: string
  /** File data id, served from public/icons. */
  iconId?: string
  caption?: string
}
interface BonusGroup {
  items: BonusItem[]
  caption?: string
  warn?: boolean
}
interface BonusRow {
  label: string
  accent?: boolean
  groups: BonusGroup[]
}
type StatKey = 'power' | 'spirit' | 'intellect' | 'stamina'

const bonus = raw
const heal = raw.dungeon.heal as { title: string; rows: BonusRow[] }
const dps = raw.dungeon.dps as { title: string; rows: BonusRow[] }
const statRows = [raw.stats.pve, raw.stats.pvp] as { label: string; order: StatKey[] }[]
const statItems = raw.stats.items as Record<StatKey, BonusItem>

function iconSrc(item: BonusItem): string {
  return item.icon ? specIconUrl(item.icon) : `${import.meta.env.BASE_URL}icons/${item.iconId}.webp`
}
</script>

<template>
  <section class="panel bonus" aria-labelledby="bonus-title">
    <header class="section-head">
      <h2 id="bonus-title">Bonus: mazmorras, estadísticas y Legacy</h2>
      <span class="section-head__sub">
        Opinión de
        <a :href="bonus.video" target="_blank" rel="noopener noreferrer">AwesomeSP</a>
        y
        <a :href="bonus.video2" target="_blank" rel="noopener noreferrer">Toleduck</a>
        sobre la beta, no datos oficiales
      </span>
    </header>

    <div class="bx__card">
      <p class="bx__kicker">Mazmorra</p>
      <div class="bx__dungeon">
        <div v-for="block in [heal, dps]" :key="block.title" class="bx__block">
          <h3>{{ block.title }}</h3>
          <div v-for="row in block.rows" :key="row.label" class="bx__row">
            <span class="bx__label" :class="{ 'bx__label--accent': row.accent }">{{ row.label }}</span>
            <ol class="bx__groups">
              <li v-for="(group, g) in row.groups" :key="g" class="bx__groupwrap">
                <span v-if="g > 0" class="bx__arrow" aria-hidden="true">›</span>
                <div class="bx__group" :class="{ 'bx__group--warn': group.warn }">
                  <div class="bx__icons">
                    <figure v-for="item in group.items" :key="item.name" class="bx__item">
                      <img :src="iconSrc(item)" :alt="item.name" :title="item.name" loading="lazy" />
                      <figcaption v-if="item.caption">{{ item.caption }}</figcaption>
                    </figure>
                  </div>
                  <span v-if="group.caption" class="bx__caption">{{ group.caption }}</span>
                </div>
              </li>
            </ol>
          </div>
        </div>
      </div>
    </div>

    <div class="bx__card">
      <p class="bx__kicker">Estadísticas</p>
      <div v-for="row in statRows" :key="row.label" class="bx__row bx__row--stats">
        <span class="bx__label">{{ row.label }}</span>
        <ol class="bx__chain">
          <li v-for="(key, i) in row.order" :key="key" class="bx__stat">
            <span v-if="i > 0" class="bx__arrow" aria-hidden="true">›</span>
            <img :src="iconSrc(statItems[key])" alt="" loading="lazy" />
            <strong>{{ statItems[key].name }}</strong>
          </li>
        </ol>
      </div>
    </div>

    <div class="bonus__legacy">
      <h3 class="tl__heading">{{ bonus.legacy.title }}</h3>
      <p class="bonus__intro">{{ bonus.legacy.intro }}</p>
      <div class="bonus__perks">
        <article v-for="perk in bonus.legacy.perks" :key="perk.name" class="perk">
          <img class="perk__icon" :src="specIconUrl(perk.icon)" alt="" loading="lazy" />
          <div>
            <h4>{{ perk.name }}</h4>
            <p class="perk__advice">{{ perk.advice }}</p>
            <p>{{ perk.text }}</p>
            <p class="perk__warning">{{ perk.warning }}</p>
          </div>
        </article>
      </div>
    </div>

    <details class="bonus__more">
      <summary>Ver el detalle explicado</summary>
      <div class="bonus__grid">
        <article v-for="section in bonus.sections" :key="section.id" class="bonus__card">
          <h3>{{ section.title }}</h3>
          <ul>
            <li v-for="line in section.items" :key="line">{{ line }}</li>
          </ul>
        </article>
      </div>
    </details>
  </section>
</template>
