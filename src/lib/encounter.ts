import type { Combatant } from "@/generated/prisma/client"

export type CombatantSnapshot = Omit<Combatant, "id" | "userId" | "createdAt" | "updatedAt">

export function toSnapshot(c: Combatant): CombatantSnapshot {
  const { id, userId, createdAt, updatedAt, ...rest } = c
  return rest
}
