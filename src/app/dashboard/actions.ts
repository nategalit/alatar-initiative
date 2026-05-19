"use server"

import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"
import { auth, signOut } from "@/auth"
import { prisma } from "@/lib/prisma"
import { toSnapshot, type CombatantSnapshot } from "@/lib/encounter"

type ActionField = "actionUsed" | "bonusActionUsed" | "reactionUsed"

export async function addCombatant(formData: FormData) {
  const session = await auth()
  if (!session?.user?.id) redirect("/login")

  const name = formData.get("name") as string
  const type = (formData.get("type") as string) || "MONSTER"
  const initiative = parseInt(formData.get("initiative") as string, 10) || 0
  const hpMax = Math.max(1, parseInt(formData.get("hpMax") as string, 10) || 1)
  const ac = Math.max(0, parseInt(formData.get("ac") as string, 10) || 10)
  const legendaryResistanceMax = Math.max(
    0,
    parseInt(formData.get("legendaryResistanceMax") as string, 10) || 0
  )
  const legendaryActionsMax = Math.max(
    0,
    parseInt(formData.get("legendaryActionsMax") as string, 10) || 0
  )

  const base = name.trim()
  if (!base) return

  const existing = await prisma.combatant.findMany({
    where: { userId: session.user.id, name: { startsWith: base } },
    select: { name: true },
  })
  const finalName = existing.length === 0 ? base : `${base} ${existing.length + 1}`

  await prisma.combatant.create({
    data: {
      userId: session.user.id,
      name: finalName,
      type: type as "MONSTER" | "PLAYER" | "LAIR_ACTION",
      initiative,
      hpCurrent: hpMax,
      hpMax,
      ac,
      legendaryResistanceMax,
      legendaryActionsMax,
    },
  })

  revalidatePath("/dashboard")
}

export async function deleteCombatant(id: string) {
  const session = await auth()
  if (!session?.user?.id) redirect("/login")

  await prisma.combatant.deleteMany({
    where: { id, userId: session.user.id },
  })

  revalidatePath("/dashboard")
}

export async function toggleCombatantAction(
  id: string,
  field: ActionField,
  value: boolean
) {
  const session = await auth()
  if (!session?.user?.id) return

  await prisma.combatant.updateMany({
    where: { id, userId: session.user.id },
    data: { [field]: value },
  })
}

export async function updateHpCurrent(id: string, newHp: number) {
  const session = await auth()
  if (!session?.user?.id) return

  await prisma.combatant.updateMany({
    where: { id, userId: session.user.id },
    data: { hpCurrent: newHp },
  })
}

export async function updateLegendaryResistance(
  id: string,
  max: number,
  used: number
) {
  const session = await auth()
  if (!session?.user?.id) return

  await prisma.combatant.updateMany({
    where: { id, userId: session.user.id },
    data: {
      legendaryResistanceMax: max,
      legendaryResistanceUsed: used,
    },
  })
}

export async function updateConditions(id: string, conditions: string[]) {
  const session = await auth()
  if (!session?.user?.id) return

  await prisma.combatant.updateMany({
    where: { id, userId: session.user.id },
    data: { conditions: JSON.stringify(conditions) },
  })
}

export async function updateLegendaryActionsUsed(id: string, used: number) {
  const session = await auth()
  if (!session?.user?.id) return

  await prisma.combatant.updateMany({
    where: { id, userId: session.user.id },
    data: { legendaryActionsUsed: used },
  })
}

export async function updateLegendaryActionsList(
  id: string,
  actions: { name: string; cost: number }[]
) {
  const session = await auth()
  if (!session?.user?.id) return

  await prisma.combatant.updateMany({
    where: { id, userId: session.user.id },
    data: { legendaryActions: JSON.stringify(actions) },
  })
}

export async function updateMapPosition(id: string, x: number | null, y: number | null) {
  const session = await auth()
  if (!session?.user?.id) return

  await prisma.combatant.updateMany({
    where: { id, userId: session.user.id },
    data: { mapX: x, mapY: y },
  })
}

export async function addFromLibrary(entryId: string) {
  const session = await auth()
  if (!session?.user?.id) return

  const entry = await prisma.libraryEntry.findFirst({
    where: { id: entryId, userId: session.user.id },
  })
  if (!entry) return

  const base = entry.name
  const existing = await prisma.combatant.findMany({
    where: { userId: session.user.id, name: { startsWith: base } },
    select: { name: true },
  })
  const finalName = existing.length === 0 ? base : `${base} ${existing.length + 1}`

  await prisma.combatant.create({
    data: {
      userId: session.user.id,
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
  const session = await auth()
  if (!session?.user?.id) return

  const combatant = await prisma.combatant.findFirst({
    where: { id: combatantId, userId: session.user.id },
  })
  if (!combatant) return

  await prisma.libraryEntry.create({
    data: {
      userId: session.user.id,
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
  const session = await auth()
  if (!session?.user?.id) return

  await prisma.libraryEntry.deleteMany({ where: { id, userId: session.user.id } })

  revalidatePath("/dashboard")
}

export async function duplicateCombatant(id: string) {
  const session = await auth()
  if (!session?.user?.id) return

  const src = await prisma.combatant.findFirst({ where: { id, userId: session.user.id } })
  if (!src) return

  const base = src.name
  const existing = await prisma.combatant.findMany({
    where: { userId: session.user.id, name: { startsWith: base } },
    select: { name: true },
  })
  const finalName = existing.length === 0 ? base : `${base} ${existing.length + 1}`

  await prisma.combatant.create({
    data: {
      userId: session.user.id,
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
  const session = await auth()
  if (!session?.user?.id) return

  await Promise.all(
    orderedIds.map((id, index) =>
      prisma.combatant.updateMany({
        where: { id, userId: session.user.id },
        data: { initiative: (orderedIds.length - index) * 10 },
      })
    )
  )

  revalidatePath("/dashboard")
}

export async function updateNotes(id: string, notes: string) {
  const session = await auth()
  if (!session?.user?.id) return

  await prisma.combatant.updateMany({
    where: { id, userId: session.user.id },
    data: { notes },
  })
}

export async function updateConcentrating(id: string, concentrating: boolean) {
  const session = await auth()
  if (!session?.user?.id) return

  await prisma.combatant.updateMany({
    where: { id, userId: session.user.id },
    data: { concentrating },
  })
}

export async function updateDeathSaves(id: string, successes: number, failures: number) {
  const session = await auth()
  if (!session?.user?.id) return

  await prisma.combatant.updateMany({
    where: { id, userId: session.user.id },
    data: { deathSaveSuccesses: successes, deathSaveFailures: failures },
  })
}

export async function saveEncounter(name: string) {
  const session = await auth()
  if (!session?.user?.id || !name.trim()) return

  const combatants = await prisma.combatant.findMany({
    where: { userId: session.user.id },
    orderBy: { initiative: "desc" },
  })

  await prisma.encounter.create({
    data: {
      userId: session.user.id,
      name: name.trim(),
      snapshot: JSON.stringify(combatants.map(toSnapshot)),
    },
  })

  revalidatePath("/dashboard")
}

export async function loadEncounter(id: string) {
  const session = await auth()
  if (!session?.user?.id) return

  const encounter = await prisma.encounter.findFirst({
    where: { id, userId: session.user.id },
  })
  if (!encounter) return

  const snapshots: CombatantSnapshot[] = JSON.parse(encounter.snapshot)

  await prisma.combatant.deleteMany({ where: { userId: session.user.id } })

  if (snapshots.length > 0) {
    await prisma.combatant.createMany({
      data: snapshots.map((s) => ({ ...s, userId: session.user.id })),
    })
  }

  revalidatePath("/dashboard")
}

export async function deleteEncounter(id: string) {
  const session = await auth()
  if (!session?.user?.id) return

  await prisma.encounter.deleteMany({ where: { id, userId: session.user.id } })

  revalidatePath("/dashboard")
}

export async function importEncounter(formData: FormData) {
  const session = await auth()
  if (!session?.user?.id) return

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

  await prisma.combatant.deleteMany({ where: { userId: session.user.id } })

  if (snapshots.length > 0) {
    await prisma.combatant.createMany({
      data: snapshots.map((s) => ({ ...s, userId: session.user.id })),
    })
  }

  revalidatePath("/dashboard")
}

export async function signOutAction() {
  await signOut({ redirectTo: "/login" })
}
