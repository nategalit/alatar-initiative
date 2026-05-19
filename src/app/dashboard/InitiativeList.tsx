"use client"

import { useState } from "react"
import type { Combatant } from "@/generated/prisma/client"
import { Button } from "@/components/ui/button"
import { CombatantCard } from "./CombatantCard"

function useLocalStorage<T>(key: string, initial: T) {
  const [value, setValue] = useState<T>(() => {
    if (typeof window === "undefined") return initial
    try {
      const item = localStorage.getItem(key)
      return item !== null ? (JSON.parse(item) as T) : initial
    } catch {
      return initial
    }
  })
  function set(next: T) {
    setValue(next)
    try { localStorage.setItem(key, JSON.stringify(next)) } catch { /* ignore */ }
  }
  return [value, set] as const
}

export function InitiativeList({ combatants }: { combatants: Combatant[] }) {
  const [round, setRound] = useLocalStorage("alatar-round", 1)
  const [turnIndex, setTurnIndex] = useLocalStorage("alatar-turn", 0)

  const count = combatants.length
  const safeIndex = count > 0 ? Math.min(turnIndex, count - 1) : 0
  const activeCombatant = combatants[safeIndex]

  function next() {
    if (count === 0) return
    const nextIndex = (safeIndex + 1) % count
    if (nextIndex === 0) setRound(round + 1)
    setTurnIndex(nextIndex)
  }

  function prev() {
    if (count === 0) return
    const prevIndex = (safeIndex - 1 + count) % count
    if (prevIndex === count - 1) setRound(Math.max(1, round - 1))
    setTurnIndex(prevIndex)
  }

  function reset() {
    setRound(1)
    setTurnIndex(0)
  }

  return (
    <div className="space-y-3">
      {/* Header + tracker controls */}
      <div className="flex items-center gap-2 flex-wrap">
        <h2 className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
          Initiative Order — {count} combatant{count !== 1 ? "s" : ""}
        </h2>
        <div className="ml-auto flex items-center gap-1.5">
          <span className="text-xs text-muted-foreground font-medium">Round {round}</span>
          <Button
            size="sm"
            variant="outline"
            className="h-6 px-2 text-xs"
            onClick={prev}
            disabled={count === 0}
          >
            ← Prev
          </Button>
          {activeCombatant && (
            <span className="text-xs font-bold uppercase tracking-wide px-2">
              {activeCombatant.name}
            </span>
          )}
          <Button
            size="sm"
            variant="outline"
            className="h-6 px-2 text-xs"
            onClick={next}
            disabled={count === 0}
          >
            Next →
          </Button>
          <Button
            size="sm"
            variant="ghost"
            className="h-6 px-2 text-xs text-muted-foreground"
            onClick={reset}
            title="Reset combat to round 1"
          >
            ↺
          </Button>
        </div>
      </div>

      {/* Card list */}
      {count === 0 ? (
        <p className="text-sm text-muted-foreground">
          No combatants yet. Add one above to begin.
        </p>
      ) : (
        <ul className="space-y-3">
          {combatants.map((c, i) => (
            <li
              key={c.id}
              className={
                i === safeIndex
                  ? "ring-2 ring-primary rounded-lg"
                  : ""
              }
            >
              <CombatantCard combatant={c} />
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
