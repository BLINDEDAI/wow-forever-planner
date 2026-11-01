import { computed, ref, watch } from 'vue'
import {
  FIRST_LEVEL,
  MAX_LEVEL,
  buildState,
  tryAdd,
  tryMove,
  tryRemove,
  tryRemoveStep,
} from './planner'
import { decodeOrder, encodeOrder } from './share'
import { loadBuilds, saveBuilds } from './storage'
import type { Build } from './types'

const SHARE_PARAM = 'b'

function newBuild(name: string, order: string[] = [], notes = '', levelNotes = {}): Build {
  return { id: crypto.randomUUID(), name, order, notes, levelNotes }
}

function readSharedOrder(): string[] | null {
  const encoded = new URLSearchParams(window.location.hash.slice(1)).get(SHARE_PARAM)
  return encoded ? decodeOrder(encoded) : null
}

export function usePlanner() {
  const builds = ref<Build[]>(loadBuilds())
  const shared = readSharedOrder()
  if (shared) builds.value.push(newBuild('Build compartido', shared))
  if (builds.value.length === 0) builds.value.push(newBuild('Mi build'))

  const activeId = ref(builds.value[builds.value.length - 1].id)
  const viewLevel = ref(MAX_LEVEL)
  const rejected = ref(false)

  const active = computed(() => builds.value.find((b) => b.id === activeId.value) ?? builds.value[0])
  const order = computed(() => active.value.order)
  const shownSteps = computed(() => Math.min(order.value.length, viewLevel.value - FIRST_LEVEL + 1))
  const state = computed(() => buildState(order.value, shownSteps.value))
  const editable = computed(() => shownSteps.value === order.value.length)

  watch(builds, (value) => saveBuilds(value), { deep: true })

  function apply(next: string[] | null) {
    rejected.value = next === null
    if (next) active.value.order = next
  }

  function addPoint(talentId: string) {
    if (!editable.value) return
    apply(tryAdd(order.value, talentId))
    if (!rejected.value) viewLevel.value = MAX_LEVEL
  }
  function removePoint(talentId: string) {
    if (editable.value) apply(tryRemove(order.value, talentId))
  }
  function removeStep(index: number) {
    apply(tryRemoveStep(order.value, index))
  }
  function moveStep(from: number, to: number) {
    apply(tryMove(order.value, from, to))
  }
  function reset() {
    active.value.order = []
    rejected.value = false
  }

  function createBuild() {
    const build = newBuild(`Build ${builds.value.length + 1}`)
    builds.value.push(build)
    activeId.value = build.id
    viewLevel.value = MAX_LEVEL
  }
  function duplicateBuild() {
    const build = newBuild(
      `${active.value.name} (copia)`,
      [...order.value],
      active.value.notes ?? '',
      { ...active.value.levelNotes },
    )
    builds.value.push(build)
    activeId.value = build.id
  }
  function setBuildNotes(text: string) {
    active.value.notes = text
  }
  function setLevelNote(level: number, text: string) {
    const notes = { ...active.value.levelNotes }
    const trimmed = text.trim()
    if (trimmed) notes[level] = trimmed
    else delete notes[level]
    active.value.levelNotes = notes
  }
  function renameBuild(name: string) {
    active.value.name = name.trim() || active.value.name
  }
  function deleteBuild() {
    builds.value = builds.value.filter((b) => b.id !== activeId.value)
    if (builds.value.length === 0) builds.value.push(newBuild('Mi build'))
    activeId.value = builds.value[0].id
  }

  const shareUrl = computed(() => {
    const { origin, pathname } = window.location
    return `${origin}${pathname}#${SHARE_PARAM}=${encodeOrder(order.value)}`
  })

  return {
    builds,
    activeId,
    active,
    order,
    state,
    viewLevel,
    shownSteps,
    editable,
    rejected,
    shareUrl,
    addPoint,
    removePoint,
    removeStep,
    moveStep,
    reset,
    createBuild,
    duplicateBuild,
    renameBuild,
    setBuildNotes,
    setLevelNote,
    deleteBuild,
  }
}
