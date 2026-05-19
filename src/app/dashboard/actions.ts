"use server"

import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"
import { auth, signOut } from "@/auth"
import { prisma } from "@/lib/prisma"
import { CombatantType } from "@/generated/prisma/client"

export async function addCombatant(formData: FormData) {
  const session = await auth()
  if (!session?.user?.id) redirect("/login")

  const name = formData.get("name") as string
  const type = (formData.get("type") as CombatantType) ?? CombatantType.MONSTER
  const initiative = parseInt(formData.get("initiative") as string, 10) || 0
  const hpMax = parseInt(formData.get("hpMax") as string, 10) || 1
  const ac = parseInt(formData.get("ac") as string, 10) || 10

  if (!name?.trim()) return

  await prisma.combatant.create({
    data: {
      userId: session.user.id,
      name: name.trim(),
      type,
      initiative,
      hpCurrent: hpMax,
      hpMax,
      ac,
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

export async function signOutAction() {
  await signOut({ redirectTo: "/login" })
}
