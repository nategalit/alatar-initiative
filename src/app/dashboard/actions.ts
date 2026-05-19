"use server"

import { revalidatePath } from "next/cache"
import { prisma } from "@/lib/prisma"
import { getDefaultUserId } from "@/lib/current-user"
import { toSnapshot, type CombatantSnapshot } from "@/lib/encounter"

type ActionField = "actionUsed" | "bonusActionUsed" | "reactionUsed"

export async function addCombatant(formData: FormData) {
  const userId = await getDefaultUserId()

  const name = formData.get("name") as string
  const type = (formData.get("type") as string) || "MONSTER"
  const initiative = type === "LAIR_ACTION" ? 20 : (parseInt(formData.get("initiative") as string, 10) || 0)
  const hpMax = Math.max(1, parseInt(formData.get("hpMax") as string, 10) || 1)
  const ac = Math.max(0, parseInt(formData.get("ac") as string, 10) || 10)
  const legendaryResistanceMax = Math.max(0, parseInt(formData.get("legendaryResistanceMax") as string, 10) || 0)
  const legendaryActionsMax = Math.max(0, parseInt(formData.get("legendaryActionsMax") as string, 10) || 0)
  const strMod = parseInt(formData.get("strMod") as string, 10) || 0
  const dexMod = parseInt(formData.get("dexMod") as string, 10) || 0
  const conMod = parseInt(formData.get("conMod") as string, 10) || 0
  const intMod = parseInt(formData.get("intMod") as string, 10) || 0
  const wisMod = parseInt(formData.get("wisMod") as string, 10) || 0
  const chaMod = parseInt(formData.get("chaMod") as string, 10) || 0

  const base = name.trim()
  if (!base) return

  const existing = await prisma.combatant.findMany({
    where: { userId, name: { startsWith: base } },
    select: { name: true },
  })
  const finalName = existing.length === 0 ? base : `${base} ${existing.length + 1}`

  await prisma.combatant.create({
    data: {
      userId,
      name: finalName,
      type: type as "MONSTER" | "PLAYER" | "LAIR_ACTION",
      initiative,
      hpCurrent: hpMax,
      hpMax,
      ac,
      legendaryResistanceMax,
      legendaryActionsMax,
      strMod, dexMod, conMod, intMod, wisMod, chaMod,
    },
  })

  revalidatePath("/dashboard")
}

export async function clearEncounter() {
  const userId = await getDefaultUserId()
  await prisma.combatant.deleteMany({ where: { userId } })
  revalidatePath("/dashboard")
}

export async function updateCombatantStats(
  id: string,
  data: {
    initiative: number
    hpMax: number
    ac: number
    strMod: number
    dexMod: number
    conMod: number
    intMod: number
    wisMod: number
    chaMod: number
    legendaryResistanceMax: number
    legendaryActionsMax: number
  }
) {
  const userId = await getDefaultUserId()
  await prisma.combatant.updateMany({ where: { id, userId }, data })
  revalidatePath("/dashboard")
}

export async function deleteCombatant(id: string) {
  const userId = await getDefaultUserId()

  await prisma.combatant.deleteMany({ where: { id, userId } })

  revalidatePath("/dashboard")
}

export async function toggleCombatantAction(id: string, field: ActionField, value: boolean) {
  const userId = await getDefaultUserId()

  await prisma.combatant.updateMany({
    where: { id, userId },
    data: { [field]: value },
  })
}

export async function updateHpCurrent(id: string, newHp: number) {
  const userId = await getDefaultUserId()

  await prisma.combatant.updateMany({
    where: { id, userId },
    data: { hpCurrent: newHp },
  })
}

export async function updateLegendaryResistance(id: string, max: number, used: number) {
  const userId = await getDefaultUserId()

  await prisma.combatant.updateMany({
    where: { id, userId },
    data: { legendaryResistanceMax: max, legendaryResistanceUsed: used },
  })
}

export async function updateConditions(id: string, conditions: string[]) {
  const userId = await getDefaultUserId()

  await prisma.combatant.updateMany({
    where: { id, userId },
    data: { conditions: JSON.stringify(conditions) },
  })
}

export async function updateLegendaryActionsUsed(id: string, used: number) {
  const userId = await getDefaultUserId()

  await prisma.combatant.updateMany({
    where: { id, userId },
    data: { legendaryActionsUsed: used },
  })
}

export async function updateLegendaryActionsList(
  id: string,
  actions: { name: string; cost: number }[]
) {
  const userId = await getDefaultUserId()

  await prisma.combatant.updateMany({
    where: { id, userId },
    data: { legendaryActions: JSON.stringify(actions) },
  })
}

export async function updateMapPosition(id: string, x: number | null, y: number | null) {
  const userId = await getDefaultUserId()

  await prisma.combatant.updateMany({
    where: { id, userId },
    data: { mapX: x, mapY: y },
  })
}

export async function addFromLibrary(entryId: string) {
  const userId = await getDefaultUserId()

  const entry = await prisma.libraryEntry.findFirst({ where: { id: entryId, userId } })
  if (!entry) return

  const base = entry.name
  const existing = await prisma.combatant.findMany({
    where: { userId, name: { startsWith: base } },
    select: { name: true },
  })
  const finalName = existing.length === 0 ? base : `${base} ${existing.length + 1}`

  await prisma.combatant.create({
    data: {
      userId,
      name: finalName,
      type: entry.type,
      shorthand: entry.shorthand,
      initiative: entry.initiative,
      initiativeBonus: entry.initiativeBonus,
      hpCurrent: entry.hpMax,
      hpMax: entry.hpMax,
      ac: entry.ac,
      strMod: entry.strMod,
      dexMod: entry.dexMod,
      conMod: entry.conMod,
      intMod: entry.intMod,
      wisMod: entry.wisMod,
      chaMod: entry.chaMod,
      strSave: entry.strSave,
      dexSave: entry.dexSave,
      conSave: entry.conSave,
      intSave: entry.intSave,
      wisSave: entry.wisSave,
      chaSave: entry.chaSave,
      legendaryResistanceMax: entry.legendaryResistanceMax,
      notes: entry.notes,
    },
  })

  revalidatePath("/dashboard")
}

export async function saveToLibrary(combatantId: string) {
  const userId = await getDefaultUserId()

  const combatant = await prisma.combatant.findFirst({ where: { id: combatantId, userId } })
  if (!combatant) return

  await prisma.libraryEntry.create({
    data: {
      userId,
      name: combatant.name,
      type: combatant.type,
      shorthand: combatant.shorthand,
      initiative: combatant.initiative,
      initiativeBonus: combatant.initiativeBonus,
      hpMax: combatant.hpMax,
      ac: combatant.ac,
      strMod: combatant.strMod,
      dexMod: combatant.dexMod,
      conMod: combatant.conMod,
      intMod: combatant.intMod,
      wisMod: combatant.wisMod,
      chaMod: combatant.chaMod,
      strSave: combatant.strSave,
      dexSave: combatant.dexSave,
      conSave: combatant.conSave,
      intSave: combatant.intSave,
      wisSave: combatant.wisSave,
      chaSave: combatant.chaSave,
      legendaryResistanceMax: combatant.legendaryResistanceMax,
      notes: combatant.notes,
    },
  })

  revalidatePath("/dashboard")
}

export async function deleteLibraryEntry(id: string) {
  const userId = await getDefaultUserId()

  await prisma.libraryEntry.deleteMany({ where: { id, userId } })

  revalidatePath("/dashboard")
}

export async function duplicateCombatant(id: string) {
  const userId = await getDefaultUserId()

  const src = await prisma.combatant.findFirst({ where: { id, userId } })
  if (!src) return

  const base = src.name
  const existing = await prisma.combatant.findMany({
    where: { userId, name: { startsWith: base } },
    select: { name: true },
  })
  const finalName = existing.length === 0 ? base : `${base} ${existing.length + 1}`

  await prisma.combatant.create({
    data: {
      userId,
      name: finalName,
      type: src.type,
      shorthand: src.shorthand,
      initiative: src.initiative,
      initiativeBonus: src.initiativeBonus,
      hpCurrent: src.hpMax,
      hpMax: src.hpMax,
      ac: src.ac,
      strMod: src.strMod, dexMod: src.dexMod, conMod: src.conMod,
      intMod: src.intMod, wisMod: src.wisMod, chaMod: src.chaMod,
      strSave: src.strSave, dexSave: src.dexSave, conSave: src.conSave,
      intSave: src.intSave, wisSave: src.wisSave, chaSave: src.chaSave,
      legendaryResistanceMax: src.legendaryResistanceMax,
      legendaryActionsMax: src.legendaryActionsMax,
      legendaryActions: src.legendaryActions,
      notes: src.notes,
    },
  })

  revalidatePath("/dashboard")
}

export async function reorderCombatants(orderedIds: string[]) {
  const userId = await getDefaultUserId()

  await Promise.all(
    orderedIds.map((id, index) =>
      prisma.combatant.updateMany({
        where: { id, userId },
        data: { initiative: (orderedIds.length - index) * 10 },
      })
    )
  )

  revalidatePath("/dashboard")
}

export async function updateNotes(id: string, notes: string) {
  const userId = await getDefaultUserId()

  await prisma.combatant.updateMany({ where: { id, userId }, data: { notes } })
}

export async function updateConcentrating(id: string, concentrating: boolean) {
  const userId = await getDefaultUserId()

  await prisma.combatant.updateMany({ where: { id, userId }, data: { concentrating } })
}

export async function updateDeathSaves(id: string, successes: number, failures: number) {
  const userId = await getDefaultUserId()

  await prisma.combatant.updateMany({
    where: { id, userId },
    data: { deathSaveSuccesses: successes, deathSaveFailures: failures },
  })
}

export async function saveEncounter(name: string, log: string[] = []) {
  const userId = await getDefaultUserId()
  if (!name.trim()) return

  const combatants = await prisma.combatant.findMany({
    where: { userId },
    orderBy: { initiative: "desc" },
  })

  await prisma.encounter.create({
    data: {
      userId,
      name: name.trim(),
      snapshot: JSON.stringify({ combatants: combatants.map(toSnapshot), log }),
    },
  })

  revalidatePath("/dashboard")
}

export async function loadEncounter(id: string) {
  const userId = await getDefaultUserId()

  const encounter = await prisma.encounter.findFirst({ where: { id, userId } })
  if (!encounter) return

  const parsed = JSON.parse(encounter.snapshot)
  const snapshots: CombatantSnapshot[] = Array.isArray(parsed) ? parsed : (parsed.combatants ?? [])

  await prisma.combatant.deleteMany({ where: { userId } })

  if (snapshots.length > 0) {
    await prisma.combatant.createMany({
      data: snapshots.map((s) => ({ ...s, userId })),
    })
  }

  revalidatePath("/dashboard")
}

export async function deleteEncounter(id: string) {
  const userId = await getDefaultUserId()

  await prisma.encounter.deleteMany({ where: { id, userId } })

  revalidatePath("/dashboard")
}

export async function importEncounter(formData: FormData) {
  const userId = await getDefaultUserId()

  const file = formData.get("file") as File | null
  if (!file) return

  let snapshots: CombatantSnapshot[]
  try {
    const text = await file.text()
    const parsed = JSON.parse(text)
    if (!Array.isArray(parsed)) return
    snapshots = parsed
  } catch {
    return
  }

  await prisma.combatant.deleteMany({ where: { userId } })

  if (snapshots.length > 0) {
    await prisma.combatant.createMany({
      data: snapshots.map((s) => ({ ...s, userId })),
    })
  }

  revalidatePath("/dashboard")
}
