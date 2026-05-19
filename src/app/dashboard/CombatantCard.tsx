"use client"

import { useState } from "react"
import type { Combatant } from "@/generated/prisma/client"
import { CombatantType } from "@/generated/prisma/enums"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { MiniMap } from "./MiniMap"
import {
  toggleCombatantAction,
  updateHpCurrent,
  updateLegendaryResistance,
  deleteCombatant,
  updateConditions,
  saveToLibrary,
} from "./actions"
import {
  CONDITION_LIST,
  parseConditions,
  hasCondition,
  getExhaustionLevel,
  toggleCondition,
  setExhaustionLevel,
} from "@/lib/conditions"

type ActionField = "actionUsed" | "bonusActionUsed" | "reactionUsed"

const BORDER: Record<string, string> = {
  MONSTER: "border-l-green-500",
  PLAYER: "border-l-blue-500",
  LAIR_ACTION: "border-l-purple-500",
}

const BADGE: Record<string, string> = {
  MONSTER: "border-green-500 text-green-700",
  PLAYER: "border-blue-500 text-blue-700",
  LAIR_ACTION: "border-purple-500 text-purple-700",
}

const TYPE_LABEL: Record<string, string> = {
  MONSTER: "Monster",
  PLAYER: "Player",
  LAIR_ACTION: "Lair Action",
}

function fmtMod(n: number): string {
  return n >= 0 ? `+${n}` : String(n)
}

export function CombatantCard({ combatant }: { combatant: Combatant }) {
  const [actionUsed, setActionUsed] = useState(combatant.actionUsed)
  const [bonusActionUsed, setBonusActionUsed] = useState(combatant.bonusActionUsed)
  const [reactionUsed, setReactionUsed] = useState(combatant.reactionUsed)
  const [hpCurrent, setHpCurrent] = useState(combatant.hpCurrent)
  const [hpEditing, setHpEditing] = useState(false)
  const [hpDelta, setHpDelta] = useState("")
  const [lrMax, setLrMax] = useState(combatant.legendaryResistanceMax)
  const [lrUsed, setLrUsed] = useState(combatant.legendaryResistanceUsed)
  const [conditions, setConditions] = useState<string[]>(() =>
    parseConditions(combatant.conditions)
  )
  const [pickerOpen, setPickerOpen] = useState(false)

  function handleToggle(field: ActionField) {
    const current =
      field === "actionUsed"
        ? actionUsed
        : field === "bonusActionUsed"
          ? bonusActionUsed
          : reactionUsed
    const next = !current
    if (field === "actionUsed") setActionUsed(next)
    else if (field === "bonusActionUsed") setBonusActionUsed(next)
    else setReactionUsed(next)
    void toggleCombatantAction(combatant.id, field, next)
  }

  function cancelHpEdit() {
    setHpEditing(false)
    setHpDelta("")
  }

  function applyHp(sign: 1 | -1) {
    const delta = parseInt(hpDelta, 10)
    if (isNaN(delta) || delta <= 0) { cancelHpEdit(); return }
    const next = Math.max(0, Math.min(combatant.hpMax, hpCurrent + sign * delta))
    setHpCurrent(next)
    cancelHpEdit()
    void updateHpCurrent(combatant.id, next)
  }

  function handleLrUsed() {
    if (lrUsed >= lrMax) return
    const nextUsed = lrUsed + 1
    setLrUsed(nextUsed)
    void updateLegendaryResistance(combatant.id, lrMax, nextUsed)
  }

  function handleLrMax(delta: number) {
    const nextMax = Math.max(0, lrMax + delta)
    const nextUsed = Math.min(lrUsed, nextMax)
    setLrMax(nextMax)
    setLrUsed(nextUsed)
    void updateLegendaryResistance(combatant.id, nextMax, nextUsed)
  }

  function applyConditions(next: string[]) {
    setConditions(next)
    void updateConditions(combatant.id, next)
  }

  function handlePickerToggle(key: string) {
    applyConditions(toggleCondition(conditions, key))
  }

  function handleExhaustionStep(delta: number) {
    const current = getExhaustionLevel(conditions)
    const next = current + delta
    if (next <= 0) {
      applyConditions(setExhaustionLevel(conditions, 0))
    } else {
      applyConditions(setExhaustionLevel(conditions, next))
    }
  }

  const mods = [
    { label: "STR", val: combatant.strMod },
    { label: "DEX", val: combatant.dexMod },
    { label: "CON", val: combatant.conMod },
    { label: "INT", val: combatant.intMod },
    { label: "WIS", val: combatant.wisMod },
    { label: "CHA", val: combatant.chaMod },
  ]

  const isDead = hpCurrent === 0
  const hasDeadCondition = hasCondition(conditions, "dead")
  const activeConditions = CONDITION_LIST.filter((c) => hasCondition(conditions, c.key))
  const exhaustionLevel = getExhaustionLevel(conditions)

  return (
    <div
      className={`rounded-lg border bg-card border-l-4 ${BORDER[combatant.type]} px-4 py-3 transition-opacity ${
        hasDeadCondition ? "opacity-50" : ""
      }`}
    >
      <div className="flex items-start gap-3">
        {/* Initiative badge */}
        <div
          className={`shrink-0 w-12 h-12 flex items-center justify-center rounded border-2 font-bold text-lg ${BADGE[combatant.type]}`}
        >
          {combatant.initiative}
        </div>

        <div className="flex-1 min-w-0 space-y-2">
          {/* Row 1: Name / HP / AC / Delete */}
          <div className="flex items-center gap-3 flex-wrap">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <p className="font-bold truncate uppercase tracking-wide text-sm leading-tight">
                  {combatant.name}
                </p>
                {hasDeadCondition && (
                  <span className="text-xs font-bold text-white bg-red-900 px-1.5 py-0.5 rounded shrink-0">
                    DEAD
                  </span>
                )}
              </div>
              <p className="text-xs text-muted-foreground">{TYPE_LABEL[combatant.type]}</p>
            </div>

            {hpEditing ? (
              <div className="flex items-center gap-1 shrink-0">
                <Input
                  autoFocus
                  type="number"
                  min="1"
                  value={hpDelta}
                  onChange={(e) => setHpDelta(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Escape") cancelHpEdit()
                    if (e.key === "Enter") applyHp(-1)
                  }}
                  className="w-16 h-7 text-sm text-center px-1"
                  placeholder="amt"
                />
                <Button size="sm" variant="destructive" className="h-7 px-2 text-xs" onClick={() => applyHp(-1)}>
                  −Dmg
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  className="h-7 px-2 text-xs border-green-500 text-green-700 hover:bg-green-50"
                  onClick={() => applyHp(1)}
                >
                  +Heal
                </Button>
                <Button size="sm" variant="ghost" className="h-7 w-7 p-0 text-xs" onClick={cancelHpEdit}>
                  ✕
                </Button>
              </div>
            ) : (
              <button
                onClick={() => setHpEditing(true)}
                title="Click to apply damage or healing"
                className={`text-sm shrink-0 hover:underline cursor-pointer ${isDead ? "text-destructive font-bold" : ""}`}
              >
                ♥ {hpCurrent}/{combatant.hpMax}
              </button>
            )}

            <span className="text-sm text-muted-foreground shrink-0">🛡 {combatant.ac}</span>

            <form action={saveToLibrary.bind(null, combatant.id)}>
              <Button
                type="submit"
                variant="ghost"
                size="sm"
                className="h-7 w-7 p-0 text-muted-foreground hover:text-foreground"
                title={`Save ${combatant.name} to library`}
                aria-label={`Save ${combatant.name} to library`}
              >
                ★
              </Button>
            </form>
            <form action={deleteCombatant.bind(null, combatant.id)}>
              <Button
                type="submit"
                variant="ghost"
                size="sm"
                className="h-7 w-7 p-0 text-muted-foreground hover:text-destructive"
                aria-label={`Remove ${combatant.name}`}
              >
                ×
              </Button>
            </form>
          </div>

          {/* Row 2: Ability modifiers */}
          <div className="flex gap-4 text-xs">
            {mods.map(({ label, val }) => (
              <div key={label} className="text-center">
                <div className="text-muted-foreground">{label}</div>
                <div className="font-mono font-medium">{fmtMod(val)}</div>
              </div>
            ))}
          </div>

          {/* Row 3: Action economy + Legendary resistance */}
          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={() => handleToggle("actionUsed")}
              className={`px-2 py-0.5 rounded text-xs font-bold transition-opacity ${
                actionUsed
                  ? "opacity-40 bg-muted text-muted-foreground"
                  : "bg-blue-600 text-white"
              }`}
            >
              ACTION
            </button>
            <button
              onClick={() => handleToggle("bonusActionUsed")}
              className={`px-2 py-0.5 rounded text-xs font-bold transition-opacity ${
                bonusActionUsed
                  ? "opacity-40 bg-muted text-muted-foreground"
                  : "bg-rose-600 text-white"
              }`}
            >
              BONUS
            </button>
            <button
              onClick={() => handleToggle("reactionUsed")}
              className={`px-2 py-0.5 rounded text-xs font-bold transition-opacity ${
                reactionUsed
                  ? "opacity-40 bg-muted text-muted-foreground"
                  : "bg-purple-600 text-white"
              }`}
            >
              REACTION
            </button>

            {/* Legendary resistance — monsters only */}
            {combatant.type === CombatantType.MONSTER && (
              <div className="flex items-center gap-1 ml-auto text-sm">
                <span className="text-xs text-muted-foreground font-medium mr-0.5">LR</span>
                {Array.from({ length: lrMax }).map((_, i) => {
                  const filled = i < lrMax - lrUsed
                  return (
                    <button
                      key={i}
                      onClick={filled ? handleLrUsed : undefined}
                      disabled={!filled}
                      title={filled ? "Use legendary resistance" : "Spent"}
                      className={filled ? "text-amber-500 hover:text-amber-600 cursor-pointer" : "text-muted-foreground cursor-default"}
                    >
                      {filled ? "●" : "○"}
                    </button>
                  )
                })}
                <button
                  onClick={() => handleLrMax(-1)}
                  title="Decrease legendary resistance max"
                  className="text-xs text-muted-foreground hover:text-foreground w-4 text-center"
                >
                  −
                </button>
                <button
                  onClick={() => handleLrMax(1)}
                  title="Increase legendary resistance max"
                  className="text-xs text-muted-foreground hover:text-foreground w-4 text-center"
                >
                  +
                </button>
              </div>
            )}
          </div>

          {/* Row 4: Conditions */}
          <div className="flex items-center gap-1.5 flex-wrap">
            {activeConditions.map((cond) => (
              <button
                key={cond.key}
                onClick={() => handlePickerToggle(cond.key)}
                title={`Remove ${cond.label}`}
                className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium text-white ${cond.color} hover:opacity-80 transition-opacity`}
              >
                {cond.key === "exhaustion"
                  ? `Exhaustion ${exhaustionLevel}`
                  : cond.label}
                <span className="opacity-70">×</span>
              </button>
            ))}

            <Popover open={pickerOpen} onOpenChange={setPickerOpen}>
              <PopoverTrigger
                title="Add condition"
                className="w-6 h-6 rounded border border-dashed border-muted-foreground text-muted-foreground text-xs hover:border-foreground hover:text-foreground transition-colors flex items-center justify-center"
              >
                +
              </PopoverTrigger>
              <PopoverContent className="w-72 p-3" align="start">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">
                  Conditions
                </p>
                <div className="grid grid-cols-3 gap-1.5">
                  {CONDITION_LIST.map((cond) => {
                    const active = hasCondition(conditions, cond.key)
                    const isExhaustion = cond.key === "exhaustion"
                    return (
                      <div key={cond.key} title={cond.description}>
                        {isExhaustion && active ? (
                          <div
                            className={`flex items-center justify-between px-2 py-1 rounded text-xs font-medium text-white ${cond.color}`}
                          >
                            <button
                              onClick={() => handleExhaustionStep(-1)}
                              className="hover:opacity-80 w-4 text-center"
                            >
                              −
                            </button>
                            <button
                              onClick={() => handlePickerToggle(cond.key)}
                              className="hover:opacity-80 font-bold"
                            >
                              {exhaustionLevel}
                            </button>
                            <button
                              onClick={() => handleExhaustionStep(1)}
                              disabled={exhaustionLevel >= 6}
                              className="hover:opacity-80 w-4 text-center disabled:opacity-40"
                            >
                              +
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => handlePickerToggle(cond.key)}
                            className={`w-full px-2 py-1 rounded text-xs font-medium transition-colors ${
                              active
                                ? `text-white ${cond.color} hover:opacity-80`
                                : "border border-muted-foreground text-muted-foreground hover:border-foreground hover:text-foreground"
                            }`}
                          >
                            {cond.label}
                          </button>
                        )}
                      </div>
                    )
                  })}
                </div>
              </PopoverContent>
            </Popover>
          </div>
        </div>

        <MiniMap
          combatantId={combatant.id}
          initialX={combatant.mapX}
          initialY={combatant.mapY}
          type={combatant.type}
        />
      </div>
    </div>
  )
}
