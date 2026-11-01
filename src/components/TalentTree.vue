<script setup lang="ts">
import { computed } from 'vue'
import { specIconUrl, talentById, talentsOfTree } from '../data/talents'
import { MAX_POINTS, canAdd, pointsInTree } from '../planner'
import type { PlanState, TreeInfo } from '../types'
import TalentNode from './TalentNode.vue'

const CELL_WIDTH = 84
const CELL_HEIGHT = 106
const NODE_SIZE = 54
const NODE_TOP = 8
const COLUMNS = 4
const ROWS = 7

const props = defineProps<{
  tree: TreeInfo
  state: PlanState
  interactive: boolean
}>()

const emit = defineEmits<{
  activate: [talentId: string]
  remove: [talentId: string]
  inspect: [talentId: string]
}>()

const treeTalents = computed(() => talentsOfTree(props.tree.id))
const spent = computed(() => pointsInTree(props.state, props.tree.id))

/** Links run from the edge of the prerequisite's icon to the edge of the dependent's icon. */
const links = computed(() =>
  treeTalents.value
    .filter((t) => t.requires)
    .map((t) => {
      const from = talentById[t.requires as string]
      const fromX = from.col * CELL_WIDTH + CELL_WIDTH / 2
      const toX = t.col * CELL_WIDTH + CELL_WIDTH / 2
      const fromTop = (from.row - 1) * CELL_HEIGHT + NODE_TOP
      const toTop = (t.row - 1) * CELL_HEIGHT + NODE_TOP
      const horizontal = from.row === t.row
      const direction = toX > fromX ? 1 : -1
      return {
        id: `${from.id}-${t.id}`,
        x1: horizontal ? fromX + (direction * NODE_SIZE) / 2 : fromX,
        y1: horizontal ? fromTop + NODE_SIZE / 2 : fromTop + NODE_SIZE,
        x2: horizontal ? toX - (direction * NODE_SIZE) / 2 : toX,
        y2: horizontal ? toTop + NODE_SIZE / 2 : toTop - 2,
        done: (props.state.ranks[from.id] ?? 0) === from.maxRank,
      }
    }),
)
</script>

<template>
  <section class="tree" :class="`tree--${tree.id}`" :aria-label="`Árbol ${tree.name}`">
    <header class="tree__header">
      <img class="tree__spec" :src="specIconUrl(tree.icon)" alt="" />
      <h2>{{ tree.name }}</h2>
      <span class="tree__points">{{ spent }}<small> pts</small></span>
    </header>
    <div
      class="tree__bar"
      role="progressbar"
      :aria-valuenow="spent"
      aria-valuemin="0"
      :aria-valuemax="MAX_POINTS"
      :aria-label="`Puntos en ${tree.name}`"
    >
      <span :style="{ width: `${(spent / MAX_POINTS) * 100}%` }" />
    </div>
    <div
      class="tree__grid"
      :style="{ width: `${COLUMNS * CELL_WIDTH}px`, height: `${ROWS * CELL_HEIGHT}px` }"
    >
      <svg
        class="tree__links"
        :viewBox="`0 0 ${COLUMNS * CELL_WIDTH} ${ROWS * CELL_HEIGHT}`"
        aria-hidden="true"
      >
        <defs>
          <marker id="arrow-idle" markerWidth="8" markerHeight="8" refX="4" refY="4" orient="auto">
            <path d="M0,0 L8,4 L0,8 Z" class="arrow arrow--idle" />
          </marker>
          <marker id="arrow-done" markerWidth="8" markerHeight="8" refX="4" refY="4" orient="auto">
            <path d="M0,0 L8,4 L0,8 Z" class="arrow arrow--done" />
          </marker>
        </defs>
        <line
          v-for="link in links"
          :key="link.id"
          :x1="link.x1"
          :y1="link.y1"
          :x2="link.x2"
          :y2="link.y2"
          :class="link.done ? 'link link--done' : 'link'"
          :marker-end="link.done ? 'url(#arrow-done)' : 'url(#arrow-idle)'"
        />
      </svg>
      <div
        v-for="talent in treeTalents"
        :key="talent.id"
        class="tree__cell"
        :style="{
          left: `${talent.col * CELL_WIDTH}px`,
          top: `${(talent.row - 1) * CELL_HEIGHT}px`,
          width: `${CELL_WIDTH}px`,
          height: `${CELL_HEIGHT}px`,
          paddingTop: `${NODE_TOP}px`,
        }"
      >
        <TalentNode
          :talent="talent"
          :rank="state.ranks[talent.id] ?? 0"
          :available="canAdd(state, talent)"
          :interactive="interactive"
          @activate="emit('activate', talent.id)"
          @remove="emit('remove', talent.id)"
          @inspect="emit('inspect', talent.id)"
        />
        <span class="tree__name">{{ talent.name }}</span>
      </div>
    </div>
  </section>
</template>
