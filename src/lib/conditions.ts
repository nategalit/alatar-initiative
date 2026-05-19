export const CONDITION_LIST = [
  { key: "blinded",       label: "Blinded",       color: "bg-slate-500",  description: "Auto-fail sight checks; attacks at disadvantage" },
  { key: "charmed",       label: "Charmed",        color: "bg-pink-500",   description: "Can't attack charmer; charmer has advantage on social" },
  { key: "deafened",      label: "Deafened",       color: "bg-slate-400",  description: "Auto-fail hearing checks" },
  { key: "frightened",    label: "Frightened",     color: "bg-yellow-600", description: "Disadvantage while source visible; can't move closer" },
  { key: "grappled",      label: "Grappled",       color: "bg-orange-600", description: "Speed 0; ends if grappler incapacitated" },
  { key: "incapacitated", label: "Incapacitated",  color: "bg-red-500",    description: "No actions or reactions" },
  { key: "invisible",     label: "Invisible",      color: "bg-slate-600",  description: "Attacks at advantage; attacks against at disadvantage" },
  { key: "paralyzed",     label: "Paralyzed",      color: "bg-red-600",    description: "Incapacitated; auto-fail STR/DEX saves; melee hits crit" },
  { key: "petrified",     label: "Petrified",      color: "bg-stone-500",  description: "Stone; incapacitated; resistance all damage" },
  { key: "poisoned",      label: "Poisoned",       color: "bg-green-700",  description: "Disadvantage on attacks and ability checks" },
  { key: "prone",         label: "Prone",          color: "bg-amber-700",  description: "Attacks at disadvantage; melee against at advantage" },
  { key: "restrained",    label: "Restrained",     color: "bg-orange-700", description: "Speed 0; attacks at disadvantage; against at advantage" },
  { key: "stunned",       label: "Stunned",        color: "bg-purple-600", description: "Incapacitated; auto-fail STR/DEX; attacks against adv." },
  { key: "unconscious",   label: "Unconscious",    color: "bg-red-800",    description: "Incapacitated + prone; hits from 5ft crit" },
  { key: "exhaustion",    label: "Exhaustion",     color: "bg-purple-700", description: "Levels 1–6; cumulative penalties" },
  { key: "dead",          label: "Dead",           color: "bg-red-900",    description: "The creature is dead" },
] as const

export type ConditionKey = (typeof CONDITION_LIST)[number]["key"]

export function parseConditions(raw: string): string[] {
  try {
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

export function hasCondition(conditions: string[], key: string): boolean {
  if (key === "exhaustion") return conditions.some((c) => c.startsWith("exhaustion:"))
  return conditions.includes(key)
}

export function getExhaustionLevel(conditions: string[]): number {
  const entry = conditions.find((c) => c.startsWith("exhaustion:"))
  if (!entry) return 0
  return parseInt(entry.split(":")[1] ?? "0", 10)
}

export function toggleCondition(conditions: string[], key: string): string[] {
  if (hasCondition(conditions, key)) {
    if (key === "exhaustion") return conditions.filter((c) => !c.startsWith("exhaustion:"))
    return conditions.filter((c) => c !== key)
  }
  if (key === "exhaustion") return [...conditions, "exhaustion:1"]
  return [...conditions, key]
}

export function setExhaustionLevel(conditions: string[], level: number): string[] {
  const without = conditions.filter((c) => !c.startsWith("exhaustion:"))
  if (level <= 0) return without
  return [...without, `exhaustion:${Math.min(6, level)}`]
}
