"use server"

import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"
import { auth, signOut } from "@/auth"
import { prisma } from "@/lib/prisma"

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

  if (!name?.trim()) return

  await prisma.combatant.create({
    data: {
      userId: session.user.id,
      name: name.trim(),
      type: type as "MONSTER" | "PLAYER" | "LAIR_ACTION",
      initiative,
      hpCurrent: hpMax,
      hpMax,
      ac,
      legendaryResistanceMax,
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

export async function signOutAction() {
  await signOut({ redirectTo: "/login" })
}
