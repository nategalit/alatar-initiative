"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core"
import {
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
  arrayMove,
} from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"
import type { Combatant } from "@/generated/prisma/client"
import { Button } from "@/components/ui/button"
import { CombatantCard } from "./CombatantCard"
import { reorderCombatants } from "./actions"

function useLocalStorage<T>(key: string, initial: T) {
  const [value, setValue] = useState<T>(initial)

  useEffect(() => {
    try {
      const item = localStorage.getItem(key)
      if (item !== null) setValue(JSON.parse(item) as T)
    } catch { /* ignore */ }
  }, [key])

  function set(next: T) {
    setValue(next)
    try { localStorage.setItem(key, JSON.stringify(next)) } catch { /* ignore */ }
  }
  return [value, set] as const
}

function SortableItem({
  id,
  children,
  active,
}: {
  id: string
  children: React.ReactNode
  active: boolean
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  }

  return (
    <li
      ref={setNodeRef}
      style={style}
      className={active ? "ring-2 ring-primary rounded-lg" : ""}
    >
      <div className="flex gap-1 items-start">
        <button
          {...attributes}
          {...listeners}
          type="button"
          className="mt-3 px-1 text-muted-foreground hover:text-foreground cursor-grab active:cursor-grabbing touch-none"
          title="Drag to reorder"
        >
          ⠿
        </button>
        <div className="flex-1 min-w-0">{children}</div>
      </div>
    </li>
  )
}

const MAX_LOG = 30

export function InitiativeList({ combatants: initial }: { combatants: Combatant[] }) {
  const [combatants, setCombatants] = useState(initial)
  const [round, setRound] = useLocalStorage("alatar-round", 1)
  const [turnIndex, setTurnIndex] = useLocalStorage("alatar-turn", 0)
  const [log, setLog] = useState<string[]>([])
  const [logOpen, setLogOpen] = useState(false)
  const [timerDuration, setTimerDuration] = useState(60)
  const [timerLeft, setTimerLeft] = useState<number | null>(null)
  const [timerRunning, setTimerRunning] = useState(false)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  // Sync when server re-renders with new combatant list
  useEffect(() => { setCombatants(initial) }, [initial])

  const sensors = useSensors(useSensor(PointerSensor))

  const count = combatants.length
  const safeIndex = count > 0 ? Math.min(turnIndex, count - 1) : 0
  const activeCombatant = combatants[safeIndex]

  const nameCounts = combatants.reduce<Record<string, number>>((acc, c) => {
    acc[c.name] = (acc[c.name] ?? 0) + 1
    return acc
  }, {})

  const appendLog = useCallback((entry: string) => {
    setLog((prev) => [entry, ...prev].slice(0, MAX_LOG))
  }, [])

  // Timer tick
  useEffect(() => {
    if (timerRunning && timerLeft !== null && timerLeft > 0) {
      timerRef.current = setInterval(() => {
        setTimerLeft((t) => {
          if (t === null || t <= 1) return 0
          return t - 1
        })
      }, 1000)
    }
    return () => { if (timerRef.current) clearInterval(timerRef.current) }
  }, [timerRunning, timerLeft !== null && timerLeft > 0 ? "running" : "stopped"]) // eslint-disable-line react-hooks/exhaustive-deps

  // When timer hits 0
  useEffect(() => {
    if (timerLeft === 0 && timerRunning) {
      setTimerRunning(false)
      if (activeCombatant) {
        appendLog(`⏰ Time's up: ${activeCombatant.name}`)
      }
    }
  }, [timerLeft]) // eslint-disable-line react-hooks/exhaustive-deps

  function startTimer() {
    setTimerLeft(timerDuration)
    setTimerRunning(true)
  }

  function pauseTimer() {
    setTimerRunning(false)
  }

  function resetTimer() {
    setTimerRunning(false)
    setTimerLeft(null)
  }

  function advanceTurn(dir: "next" | "prev") {
    if (count === 0) return
    let nextIndex: number
    if (dir === "next") {
      nextIndex = (safeIndex + 1) % count
      if (nextIndex === 0) {
        const newRound = round + 1
        setRound(newRound)
        appendLog(`── Round ${newRound} ──`)
      }
    } else {
      nextIndex = (safeIndex - 1 + count) % count
      if (nextIndex === count - 1) setRound(Math.max(1, round - 1))
    }
    setTurnIndex(nextIndex)
    const next = combatants[nextIndex]
    if (next) appendLog(`Turn: ${next.name}`)
    // Reset timer for new turn
    if (timerLeft !== null) {
      setTimerLeft(timerDuration)
      setTimerRunning(true)
    }
  }

  function reset() {
    setRound(1)
    setTurnIndex(0)
    setLog([])
    resetTimer()
  }

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event
    if (!over || active.id === over.id) return

    const oldIndex = combatants.findIndex((c) => c.id === active.id)
    const newIndex = combatants.findIndex((c) => c.id === over.id)
    if (oldIndex === -1 || newIndex === -1) return

    const reordered = arrayMove(combatants, oldIndex, newIndex)
    setCombatants(reordered)

    // Keep active combatant the same after reorder
    const activeId = activeCombatant?.id
    if (activeId) {
      const newActiveIndex = reordered.findIndex((c) => c.id === activeId)
      if (newActiveIndex !== -1) setTurnIndex(newActiveIndex)
    }

    void reorderCombatants(reordered.map((c) => c.id))
  }

  const timerDisplay = timerLeft !== null
    ? `${Math.floor(timerLeft / 60)}:${String(timerLeft % 60).padStart(2, "0")}`
    : `${timerDuration}s`

  return (
    <div className="space-y-3">
      {/* Header + tracker controls */}
      <div className="flex items-center gap-2 flex-wrap">
        <h2 className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
          Initiative Order — {count} combatant{count !== 1 ? "s" : ""}
        </h2>
        <div className="ml-auto flex items-center gap-1.5 flex-wrap">
          <span className="text-xs text-muted-foreground font-medium">Round {round}</span>
          <Button
            size="sm"
            variant="outline"
            className="h-6 px-2 text-xs"
            onClick={() => advanceTurn("prev")}
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
            onClick={() => advanceTurn("next")}
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

          {/* Timer */}
          <div className="flex items-center gap-1 border rounded px-1.5 h-6">
            {timerLeft === null ? (
              <>
                <input
                  type="number"
                  min={5}
                  max={600}
                  value={timerDuration}
                  onChange={(e) => setTimerDuration(Math.max(5, parseInt(e.target.value) || 60))}
                  className="w-10 text-xs bg-transparent text-center focus:outline-none"
                  title="Timer duration (seconds)"
                />
                <span className="text-xs text-muted-foreground">s</span>
                <button
                  type="button"
                  onClick={startTimer}
                  disabled={count === 0}
                  className="text-xs text-muted-foreground hover:text-foreground disabled:opacity-40"
                  title="Start turn timer"
                >
                  ▶
                </button>
              </>
            ) : (
              <>
                <span className={`text-xs font-mono ${timerLeft <= 10 ? "text-red-500" : ""}`}>
                  {timerDisplay}
                </span>
                {timerRunning ? (
                  <button
                    type="button"
                    onClick={pauseTimer}
                    className="text-xs text-muted-foreground hover:text-foreground"
                    title="Pause timer"
                  >
                    ⏸
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => setTimerRunning(true)}
                    className="text-xs text-muted-foreground hover:text-foreground"
                    title="Resume timer"
                  >
                    ▶
                  </button>
                )}
                <button
                  type="button"
                  onClick={resetTimer}
                  className="text-xs text-muted-foreground hover:text-foreground"
                  title="Stop timer"
                >
                  ✕
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Card list */}
      {count === 0 ? (
        <p className="text-sm text-muted-foreground">
          No combatants yet. Add one above to begin.
        </p>
      ) : (
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <SortableContext items={combatants.map((c) => c.id)} strategy={verticalListSortingStrategy}>
            <ul className="space-y-3">
              {combatants.map((c, i) => (
                <SortableItem key={c.id} id={c.id} active={i === safeIndex}>
                  <CombatantCard
                    combatant={c}
                    groupCount={nameCounts[c.name]}
                    onEvent={appendLog}
                  />
                </SortableItem>
              ))}
            </ul>
          </SortableContext>
        </DndContext>
      )}

      {/* Combat log */}
      {log.length > 0 && (
        <div className="border rounded-md">
          <button
            type="button"
            onClick={() => setLogOpen((o) => !o)}
            className="w-full text-left px-3 py-2 text-xs font-medium text-muted-foreground hover:text-foreground flex justify-between items-center"
          >
            <span>Combat Log ({log.length})</span>
            <span>{logOpen ? "▲" : "▼"}</span>
          </button>
          {logOpen && (
            <pre className="px-3 pb-3 text-xs text-muted-foreground whitespace-pre-wrap leading-5 max-h-48 overflow-y-auto">
              {log.join("\n")}
            </pre>
          )}
        </div>
      )}
    </div>
  )
}
