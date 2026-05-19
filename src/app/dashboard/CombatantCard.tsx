"use client"

import { useState } from "react"
import type { Combatant } from "@/generated/prisma/client"
import { CombatantType } from "@/generated/prisma/enums"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { MiniMap, type MapPosition } from "./MiniMap"
import {
  toggleCombatantAction,
  updateHpCurrent,
  updateLegendaryResistance,
  updateLegendaryActionsUsed,
  updateLegendaryActionsList,
  deleteCombatant,
  updateConditions,
  saveToLibrary,
  duplicateCombatant,
  updateConcentrating,
  updateDeathSaves,
  updateCombatantStats,
  updateNotes,
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
  MONSTER:     "border-l-green-500",
  PLAYER:      "border-l-blue-500",
  LAIR_ACTION: "border-l-purple-500",
}

const BADGE: Record<string, string> = {
  MONSTER:     "border-green-500 text-green-700",
  PLAYER:      "border-blue-500 text-blue-700",
  LAIR_ACTION: "border-purple-500 text-purple-700",
}

const TYPE_LABEL: Record<string, string> = {
  MONSTER:     "Monster",
  PLAYER:      "Player",
  LAIR_ACTION: "Lair Action",
}

function fmtMod(n: number): string {
  return n >= 0 ? `+${n}` : String(n)
}

function SmallInput({
  value,
  onChange,
  label,
  width = "w-12",
}: {
  value: number
  onChange: (v: number) => void
  label: string
  width?: string
}) {
  return (
    <div className={`flex flex-col gap-0.5 ${width}`}>
      <span className="text-xs text-muted-foreground text-center leading-none">{label}</span>
      <input
        type="number"
        value={value}
        onChange={(e) => onChange(parseInt(e.target.value, 10) || 0)}
        className="h-7 text-xs rounded border border-input bg-background px-1 text-center focus:outline-none focus:ring-1 focus:ring-ring w-full"
      />
    </div>
  )
}

function ConditionPicker({
  conditions,
  onToggle,
  onExhaustionStep,
}: {
  conditions: string[]
  onToggle: (key: string) => void
  onExhaustionStep: (delta: number) => void
}) {
  const [open, setOpen] = useState(false)
  const exhaustionLevel = getExhaustionLevel(conditions)
  const activeConditions = CONDITION_LIST.filter((c) => hasCondition(conditions, c.key))

  return (
    <div className="flex items-center gap-1.5 flex-wrap">
      {activeConditions.map((cond) => (
        <button
          key={cond.key}
          onClick={() => onToggle(cond.key)}
          title={`Remove ${cond.label}`}
          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium text-white ${cond.color} hover:opacity-80 transition-opacity`}
        >
          {cond.key === "exhaustion" ? `Exhaustion ${exhaustionLevel}` : cond.label}
          <span className="opacity-70">×</span>
        </button>
      ))}

      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger className="flex items-center gap-1 px-2 h-6 rounded border border-dashed border-muted-foreground text-muted-foreground text-xs hover:border-foreground hover:text-foreground transition-colors">
          + Conditions
        </PopoverTrigger>
        <PopoverContent className="w-72 p-3" align="start">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">Conditions</p>
          <div className="grid grid-cols-3 gap-1.5">
            {CONDITION_LIST.map((cond) => {
              const active = hasCondition(conditions, cond.key)
              const isExhaustion = cond.key === "exhaustion"
              return (
                <div key={cond.key} title={cond.description}>
                  {isExhaustion && active ? (
                    <div className={`flex items-center justify-between px-2 py-1 rounded text-xs font-medium text-white ${cond.color}`}>
                      <button onClick={() => onExhaustionStep(-1)} className="hover:opacity-80 w-4 text-center">−</button>
                      <button onClick={() => onToggle(cond.key)} className="hover:opacity-80 font-bold">{exhaustionLevel}</button>
                      <button onClick={() => onExhaustionStep(1)} disabled={exhaustionLevel >= 6} className="hover:opacity-80 w-4 text-center disabled:opacity-40">+</button>
                    </div>
                  ) : (
                    <button
                      onClick={() => onToggle(cond.key)}
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
  )
}

function CardButtons({
  combatantId,
  editOpen,
  onEdit,
}: {
  combatantId: string
  editOpen: boolean
  onEdit: () => void
}) {
  return (
    <div className="flex justify-end gap-0.5 pt-2 border-t border-muted-foreground/20 mt-1">
      <form action={duplicateCombatant.bind(null, combatantId)}>
        <Button type="submit" variant="ghost" size="sm" className="h-7 w-7 p-0 text-muted-foreground hover:text-foreground" title="Duplicate">⧉</Button>
      </form>
      <form action={saveToLibrary.bind(null, combatantId)}>
        <Button type="submit" variant="ghost" size="sm" className="h-7 w-7 p-0 text-muted-foreground hover:text-foreground" title="Save to library">★</Button>
      </form>
      <button
        onClick={onEdit}
        title="Edit stats"
        className={`h-7 w-7 text-sm flex items-center justify-center rounded hover:bg-accent ${editOpen ? "text-foreground bg-accent" : "text-muted-foreground hover:text-foreground"}`}
      >
        ✎
      </button>
      <form action={deleteCombatant.bind(null, combatantId)}>
        <Button type="submit" variant="ghost" size="sm" className="h-7 w-7 p-0 text-muted-foreground hover:text-destructive" title="Remove from initiative">🗑</Button>
      </form>
    </div>
  )
}

export function CombatantCard({
  combatant,
  groupCount,
  onEvent,
  allPositions,
  onPositionChange,
}: {
  combatant: Combatant
  groupCount?: number
  onEvent?: (entry: string) => void
  allPositions: MapPosition[]
  onPositionChange: (id: string, pos: { x: number; y: number } | null) => void
}) {
  const isLairAction = combatant.type === CombatantType.LAIR_ACTION
  const isPlayer = combatant.type === CombatantType.PLAYER

  // Core stats
  const [initiative, setInitiative] = useState(combatant.initiative)
  const [hpMax, setHpMax] = useState(combatant.hpMax)
  const [ac, setAc] = useState(combatant.ac)
  const [strMod, setStrMod] = useState(combatant.strMod)
  const [dexMod, setDexMod] = useState(combatant.dexMod)
  const [conMod, setConMod] = useState(combatant.conMod)
  const [intMod, setIntMod] = useState(combatant.intMod)
  const [wisMod, setWisMod] = useState(combatant.wisMod)
  const [chaMod, setChaMod] = useState(combatant.chaMod)

  // In-combat state
  const [actionUsed, setActionUsed] = useState(combatant.actionUsed)
  const [bonusActionUsed, setBonusActionUsed] = useState(combatant.bonusActionUsed)
  const [reactionUsed, setReactionUsed] = useState(combatant.reactionUsed)
  const [hpCurrent, setHpCurrent] = useState(combatant.hpCurrent)
  const [prevHp, setPrevHp] = useState<number | null>(null)
  const [hpEditing, setHpEditing] = useState(false)
  const [hpDelta, setHpDelta] = useState("")
  const [lrMax, setLrMax] = useState(combatant.legendaryResistanceMax)
  const [lrUsed, setLrUsed] = useState(combatant.legendaryResistanceUsed)
  const [laMax, setLaMax] = useState(combatant.legendaryActionsMax)
  const [laUsed, setLaUsed] = useState(combatant.legendaryActionsUsed)
  const [laList, setLaList] = useState<{ name: string; cost: number }[]>(() => {
    try { return JSON.parse(combatant.legendaryActions) } catch { return [] }
  })
  const [laNewName, setLaNewName] = useState("")
  const [laNewCost, setLaNewCost] = useState(1)
  const [conditions, setConditions] = useState<string[]>(() => parseConditions(combatant.conditions))
  const [concentrating, setConcentrating] = useState(combatant.concentrating)
  const [deathSuccesses, setDeathSuccesses] = useState(combatant.deathSaveSuccesses)
  const [deathFailures, setDeathFailures] = useState(combatant.deathSaveFailures)
  const [notes, setNotes] = useState(combatant.notes)

  // Edit mode
  const [editOpen, setEditOpen] = useState(false)
  const [editInit, setEditInit] = useState(combatant.initiative)
  const [editHpMax, setEditHpMax] = useState(combatant.hpMax)
  const [editAc, setEditAc] = useState(combatant.ac)
  const [editStr, setEditStr] = useState(combatant.strMod)
  const [editDex, setEditDex] = useState(combatant.dexMod)
  const [editCon, setEditCon] = useState(combatant.conMod)
  const [editInt, setEditInt] = useState(combatant.intMod)
  const [editWis, setEditWis] = useState(combatant.wisMod)
  const [editCha, setEditCha] = useState(combatant.chaMod)
  const [editLrMax, setEditLrMax] = useState(combatant.legendaryResistanceMax)
  const [editLaMax, setEditLaMax] = useState(combatant.legendaryActionsMax)

  const isDead = hpCurrent === 0

  // ── HP ──────────────────────────────────────────────────────────────────────

  function cancelHpEdit() { setHpEditing(false); setHpDelta("") }

  function applyHp(sign: 1 | -1) {
    const delta = parseInt(hpDelta, 10)
    if (isNaN(delta) || delta <= 0) { cancelHpEdit(); return }
    const next = Math.max(0, Math.min(hpMax, hpCurrent + sign * delta))
    setPrevHp(hpCurrent)
    setHpCurrent(next)
    cancelHpEdit()
    if (next > 0 && (deathSuccesses > 0 || deathFailures > 0)) {
      setDeathSuccesses(0); setDeathFailures(0)
      void updateDeathSaves(combatant.id, 0, 0)
    }
    if (sign === -1) {
      onEvent?.(`${combatant.name} took ${delta} dmg (${hpCurrent}→${next})`)
      if (concentrating) onEvent?.(`⚠ ${combatant.name} is concentrating!`)
    } else {
      onEvent?.(`${combatant.name} healed ${delta} (${hpCurrent}→${next})`)
    }
    void updateHpCurrent(combatant.id, next)
  }

  function undoHp() {
    if (prevHp === null) return
    setHpCurrent(prevHp); setPrevHp(null)
    void updateHpCurrent(combatant.id, prevHp)
  }

  function handleRevive() {
    setHpCurrent(1); setDeathSuccesses(0); setDeathFailures(0)
    void updateHpCurrent(combatant.id, 1)
    void updateDeathSaves(combatant.id, 0, 0)
  }

  function handleReset() {
    setHpCurrent(hpMax); setDeathSuccesses(0); setDeathFailures(0)
    void updateHpCurrent(combatant.id, hpMax)
    void updateDeathSaves(combatant.id, 0, 0)
  }

  // ── Action economy ──────────────────────────────────────────────────────────

  function handleToggle(field: ActionField) {
    const current = field === "actionUsed" ? actionUsed : field === "bonusActionUsed" ? bonusActionUsed : reactionUsed
    const next = !current
    if (field === "actionUsed") setActionUsed(next)
    else if (field === "bonusActionUsed") setBonusActionUsed(next)
    else setReactionUsed(next)
    void toggleCombatantAction(combatant.id, field, next)
  }

  // ── Legendary resistance ────────────────────────────────────────────────────

  function handleLrUsed() {
    if (lrUsed >= lrMax) return
    const next = lrUsed + 1
    setLrUsed(next)
    void updateLegendaryResistance(combatant.id, lrMax, next)
  }

  function handleLrMax(delta: number) {
    const nextMax = Math.max(0, lrMax + delta)
    const nextUsed = Math.min(lrUsed, nextMax)
    setLrMax(nextMax); setLrUsed(nextUsed)
    void updateLegendaryResistance(combatant.id, nextMax, nextUsed)
  }

  // ── Legendary actions ───────────────────────────────────────────────────────

  function handleLaUse(cost: number) {
    const next = laUsed + cost
    if (next > laMax) return
    setLaUsed(next)
    void updateLegendaryActionsUsed(combatant.id, next)
  }

  function handleLaReset() {
    setLaUsed(0)
    void updateLegendaryActionsUsed(combatant.id, 0)
  }

  function handleLaMax(delta: number) {
    const next = Math.max(0, laMax + delta)
    setLaMax(next)
    if (laUsed > next) { setLaUsed(next); void updateLegendaryActionsUsed(combatant.id, next) }
  }

  function handleLaAdd() {
    const name = laNewName.trim()
    if (!name) return
    const next = [...laList, { name, cost: laNewCost }]
    setLaList(next); setLaNewName(""); setLaNewCost(1)
    void updateLegendaryActionsList(combatant.id, next)
  }

  function handleLaRemove(index: number) {
    const next = laList.filter((_, i) => i !== index)
    setLaList(next)
    void updateLegendaryActionsList(combatant.id, next)
  }

  // ── Conditions ──────────────────────────────────────────────────────────────

  function applyConditions(next: string[]) {
    setConditions(next)
    void updateConditions(combatant.id, next)
  }

  function handlePickerToggle(key: string) {
    const wasActive = hasCondition(conditions, key)
    const cond = CONDITION_LIST.find((c) => c.key === key)
    applyConditions(toggleCondition(conditions, key))
    if (cond) onEvent?.(wasActive ? `${combatant.name} lost ${cond.label}` : `${combatant.name} gained ${cond.label}`)
  }

  function handleExhaustionStep(delta: number) {
    const current = getExhaustionLevel(conditions)
    const next = current + delta
    applyConditions(setExhaustionLevel(conditions, next <= 0 ? 0 : next))
  }

  // ── Concentration ───────────────────────────────────────────────────────────

  function handleConcentrating() {
    const next = !concentrating
    setConcentrating(next)
    void updateConcentrating(combatant.id, next)
  }

  // ── Death saves ─────────────────────────────────────────────────────────────

  function handleDeathSuccess() {
    const next = Math.min(3, deathSuccesses + 1)
    setDeathSuccesses(next)
    void updateDeathSaves(combatant.id, next, deathFailures)
  }

  function handleDeathFailure() {
    const next = Math.min(3, deathFailures + 1)
    setDeathFailures(next)
    void updateDeathSaves(combatant.id, deathSuccesses, next)
  }

  function handleDeathReset() {
    setDeathSuccesses(0); setDeathFailures(0)
    void updateDeathSaves(combatant.id, 0, 0)
  }

  // ── Edit mode ───────────────────────────────────────────────────────────────

  function openEdit() {
    setEditInit(initiative); setEditHpMax(hpMax); setEditAc(ac)
    setEditStr(strMod); setEditDex(dexMod); setEditCon(conMod)
    setEditInt(intMod); setEditWis(wisMod); setEditCha(chaMod)
    setEditLrMax(lrMax); setEditLaMax(laMax)
    setEditOpen(true)
  }

  function handleSaveEdit() {
    setInitiative(editInit); setHpMax(editHpMax); setAc(editAc)
    setStrMod(editStr); setDexMod(editDex); setConMod(editCon)
    setIntMod(editInt); setWisMod(editWis); setChaMod(editCha)
    setLrMax(editLrMax); setLrUsed(Math.min(lrUsed, editLrMax))
    setLaMax(editLaMax); if (laUsed > editLaMax) setLaUsed(editLaMax)
    setEditOpen(false)
    void updateCombatantStats(combatant.id, {
      initiative: editInit, hpMax: editHpMax, ac: editAc,
      strMod: editStr, dexMod: editDex, conMod: editCon,
      intMod: editInt, wisMod: editWis, chaMod: editCha,
      legendaryResistanceMax: editLrMax, legendaryActionsMax: editLaMax,
    })
  }

  // ── Lair action card ────────────────────────────────────────────────────────

  if (isLairAction) {
    return (
      <div className={`rounded-lg border bg-card border-l-4 ${BORDER[combatant.type]} px-4 py-3`}>
        <div className="flex items-start gap-3">
          <div className={`shrink-0 w-12 h-12 flex items-center justify-center rounded border-2 font-bold text-lg ${BADGE[combatant.type]}`}>
            {initiative}
          </div>
          <div className="flex-1 min-w-0 space-y-2">
            <div>
              <div className="flex items-center gap-2">
                <p className="font-bold truncate uppercase tracking-wide text-sm leading-tight">{combatant.name}</p>
                {groupCount && groupCount > 1 && (
                  <span className="text-xs text-muted-foreground shrink-0">×{groupCount}</span>
                )}
              </div>
              <p className="text-xs text-muted-foreground">Lair Action</p>
            </div>

            <ConditionPicker
              conditions={conditions}
              onToggle={handlePickerToggle}
              onExhaustionStep={handleExhaustionStep}
            />

            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              onBlur={() => void updateNotes(combatant.id, notes)}
              placeholder="Lair action description, triggers, effects…"
              rows={2}
              className="w-full text-xs rounded border border-input bg-background px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-ring resize-none"
            />

            {editOpen && (
              <div className="pt-2 border-t border-muted-foreground/30 space-y-2">
                <SmallInput label="Init" value={editInit} onChange={setEditInit} width="w-14" />
                <div className="flex gap-2">
                  <button onClick={handleSaveEdit} className="px-3 py-1 rounded text-xs bg-foreground text-background hover:opacity-90 font-medium">Save</button>
                  <button onClick={() => setEditOpen(false)} className="px-3 py-1 rounded text-xs border border-muted-foreground text-muted-foreground hover:bg-muted">Cancel</button>
                </div>
              </div>
            )}

            <CardButtons combatantId={combatant.id} editOpen={editOpen} onEdit={editOpen ? () => setEditOpen(false) : openEdit} />
          </div>
        </div>
      </div>
    )
  }

  // ── Full card ───────────────────────────────────────────────────────────────

  const mods = [
    { label: "STR", val: strMod }, { label: "DEX", val: dexMod },
    { label: "CON", val: conMod }, { label: "INT", val: intMod },
    { label: "WIS", val: wisMod }, { label: "CHA", val: chaMod },
  ]

  return (
    <div className={`rounded-lg border bg-card border-l-4 ${BORDER[combatant.type]} px-4 py-3 relative overflow-hidden`}>

      {/* Monster death overlay */}
      {isDead && !isPlayer && (
        <div className="absolute inset-0 rounded-lg bg-background/92 flex flex-col items-center justify-center gap-3 z-10">
          <div className="text-4xl leading-none">💀</div>
          <div className="text-base font-bold uppercase tracking-widest">DEAD</div>
          <div className="flex gap-2 flex-wrap justify-center">
            <button onClick={handleRevive} className="px-3 py-1 rounded text-xs border border-green-500 text-green-700 hover:bg-green-50">Revive (1 HP)</button>
            <button onClick={handleReset} className="px-3 py-1 rounded text-xs border border-blue-500 text-blue-700 hover:bg-blue-50">Reset</button>
            <form action={deleteCombatant.bind(null, combatant.id)}>
              <button type="submit" className="px-3 py-1 rounded text-xs border border-destructive text-destructive hover:bg-red-50">Remove</button>
            </form>
          </div>
        </div>
      )}

      {/* Player death overlay */}
      {isDead && isPlayer && (
        <div className="absolute inset-0 rounded-lg bg-background/95 flex flex-col items-center justify-center gap-3 z-10 p-4">
          <div className="text-sm font-bold uppercase tracking-widest text-red-600">☠ Death Saves</div>
          <div className="flex gap-6 items-center">
            <div className="flex items-center gap-1">
              <span className="text-xs text-green-600 font-bold mr-1">✓</span>
              {Array.from({ length: 3 }).map((_, i) => (
                <span key={i} className={`text-xl ${i < deathSuccesses ? "text-green-500" : "text-muted-foreground"}`}>●</span>
              ))}
            </div>
            <div className="flex items-center gap-1">
              <span className="text-xs text-red-600 font-bold mr-1">✗</span>
              {Array.from({ length: 3 }).map((_, i) => (
                <span key={i} className={`text-xl ${i < deathFailures ? "text-red-500" : "text-muted-foreground"}`}>●</span>
              ))}
            </div>
          </div>
          <div className="flex gap-2">
            <button onClick={handleDeathSuccess} disabled={deathSuccesses >= 3} className="px-3 py-1 rounded text-xs border border-green-500 text-green-700 hover:bg-green-50 disabled:opacity-40">✓ Success</button>
            <button onClick={handleDeathFailure} disabled={deathFailures >= 3} className="px-3 py-1 rounded text-xs border border-red-500 text-red-700 hover:bg-red-50 disabled:opacity-40">✗ Failure</button>
            <button onClick={handleDeathReset} className="px-2 py-1 rounded text-xs border border-muted-foreground text-muted-foreground hover:bg-muted">↺</button>
          </div>
          <div className="flex gap-2 mt-1">
            <button onClick={handleRevive} className="px-3 py-1 rounded text-xs border border-green-500 text-green-700 hover:bg-green-50 font-medium">Revive (1 HP)</button>
            <form action={deleteCombatant.bind(null, combatant.id)}>
              <button type="submit" className="px-3 py-1 rounded text-xs border border-destructive text-destructive hover:bg-red-50">Kill</button>
            </form>
          </div>
        </div>
      )}

      <div className="flex items-start gap-3">
        {/* Initiative badge */}
        <div className={`shrink-0 w-12 h-12 flex items-center justify-center rounded border-2 font-bold text-lg ${BADGE[combatant.type]}`}>
          {initiative}
        </div>

        <div className="flex-1 min-w-0 space-y-2">
          {/* Row 1: Name / HP / AC */}
          <div className="flex items-center gap-2 flex-wrap">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <p className="font-bold truncate uppercase tracking-wide text-sm leading-tight">{combatant.name}</p>
                {groupCount && groupCount > 1 && (
                  <span className="text-xs text-muted-foreground shrink-0">×{groupCount}</span>
                )}
                {concentrating && (
                  <span className="text-xs font-medium text-cyan-600 shrink-0" title="Concentrating">◎</span>
                )}
              </div>
              <p className="text-xs text-muted-foreground">{TYPE_LABEL[combatant.type]}</p>
            </div>

            {hpEditing ? (
              <div className="flex items-center gap-1 shrink-0">
                <Input
                  autoFocus type="number" min="1" value={hpDelta}
                  onChange={(e) => setHpDelta(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Escape") cancelHpEdit(); if (e.key === "Enter") applyHp(-1) }}
                  className="w-16 h-7 text-sm text-center px-1" placeholder="amt"
                />
                <Button size="sm" variant="destructive" className="h-7 px-2 text-xs" onClick={() => applyHp(-1)}>−Dmg</Button>
                <Button size="sm" variant="outline" className="h-7 px-2 text-xs border-green-500 text-green-700 hover:bg-green-50" onClick={() => applyHp(1)}>+Heal</Button>
                <Button size="sm" variant="ghost" className="h-7 w-7 p-0 text-xs" onClick={cancelHpEdit}>✕</Button>
              </div>
            ) : (
              <div className="flex items-center gap-1 shrink-0">
                <button
                  onClick={() => setHpEditing(true)}
                  title="Click to apply damage or healing"
                  className={`text-sm hover:underline cursor-pointer ${isDead ? "text-destructive font-bold" : ""}`}
                >
                  ♥ {hpCurrent}/{hpMax}
                </button>
                {prevHp !== null && (
                  <button onClick={undoHp} title="Undo last HP change" className="text-xs text-muted-foreground hover:text-foreground underline">Undo</button>
                )}
              </div>
            )}

            <span className="text-sm text-muted-foreground shrink-0">🛡 {ac}</span>
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

          {/* Row 3: Action economy + Concentration */}
          <div className="flex items-center gap-2 flex-wrap">
            <button onClick={() => handleToggle("actionUsed")}
              className={`px-2 py-0.5 rounded text-xs font-bold transition-opacity ${actionUsed ? "opacity-40 bg-muted text-muted-foreground" : "bg-blue-600 text-white"}`}>
              ACTION
            </button>
            <button onClick={() => handleToggle("bonusActionUsed")}
              className={`px-2 py-0.5 rounded text-xs font-bold transition-opacity ${bonusActionUsed ? "opacity-40 bg-muted text-muted-foreground" : "bg-rose-600 text-white"}`}>
              BONUS
            </button>
            <button onClick={() => handleToggle("reactionUsed")}
              className={`px-2 py-0.5 rounded text-xs font-bold transition-opacity ${reactionUsed ? "opacity-40 bg-muted text-muted-foreground" : "bg-purple-600 text-white"}`}>
              REACTION
            </button>
            <button
              onClick={handleConcentrating}
              title={concentrating ? "Click to end concentration" : "Click to mark concentrating"}
              className={`px-2 py-0.5 rounded text-xs font-bold border transition-colors ${
                concentrating ? "border-cyan-500 text-cyan-700 bg-cyan-50" : "border-muted-foreground text-muted-foreground hover:border-foreground"
              }`}
            >
              {concentrating ? "◎ CONC" : "○ CONC"}
            </button>
          </div>

          {/* Row 4: Conditions */}
          <ConditionPicker
            conditions={conditions}
            onToggle={handlePickerToggle}
            onExhaustionStep={handleExhaustionStep}
          />

          {/* Legendary resistance section */}
          {combatant.type === CombatantType.MONSTER && lrMax > 0 && (
            <div className="flex items-center gap-1 pt-1 border-t border-dashed border-muted-foreground/30 flex-wrap">
              <span className="text-xs text-muted-foreground font-medium mr-0.5">Legendary Resistance</span>
              {Array.from({ length: lrMax }).map((_, i) => {
                const filled = i < lrMax - lrUsed
                return (
                  <button key={i} onClick={filled ? handleLrUsed : undefined} disabled={!filled}
                    title={filled ? "Use legendary resistance" : "Spent"}
                    className={filled ? "text-amber-500 hover:text-amber-600 cursor-pointer" : "text-muted-foreground cursor-default"}>
                    {filled ? "●" : "○"}
                  </button>
                )
              })}
              <button onClick={() => handleLrMax(-1)} className="text-xs text-muted-foreground hover:text-foreground w-4 text-center">−</button>
              <button onClick={() => handleLrMax(1)} className="text-xs text-muted-foreground hover:text-foreground w-4 text-center">+</button>
            </div>
          )}

          {/* Legendary actions section */}
          {combatant.type === CombatantType.MONSTER && laMax > 0 && (
            <div className="space-y-1.5 pt-1 border-t border-dashed border-muted-foreground/30">
              <div className="flex items-center gap-1 flex-wrap">
                <span className="text-xs text-muted-foreground font-medium mr-0.5">Legendary Actions</span>
                {Array.from({ length: laMax }).map((_, i) => (
                  <span key={i} className={i < laUsed ? "text-muted-foreground" : "text-amber-500"}>
                    {i < laUsed ? "○" : "●"}
                  </span>
                ))}
                <button onClick={() => handleLaMax(-1)} className="text-xs text-muted-foreground hover:text-foreground w-4 text-center">−</button>
                <button onClick={() => handleLaMax(1)} className="text-xs text-muted-foreground hover:text-foreground w-4 text-center">+</button>
                <button onClick={handleLaReset} className="ml-1 text-xs text-muted-foreground hover:text-foreground px-1">↺</button>
              </div>
              {laList.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {laList.map((action, i) => {
                    const canUse = laUsed + action.cost <= laMax
                    return (
                      <div key={i} className="flex items-center gap-0.5">
                        <button onClick={() => handleLaUse(action.cost)} disabled={!canUse}
                          className={`px-2 py-0.5 rounded text-xs font-medium border transition-opacity ${
                            canUse ? "border-amber-500 text-amber-700 hover:bg-amber-50" : "opacity-40 border-muted-foreground text-muted-foreground cursor-default"
                          }`}>
                          {action.name} ({action.cost})
                        </button>
                        <button onClick={() => handleLaRemove(i)} className="text-muted-foreground hover:text-destructive text-xs w-4 text-center">×</button>
                      </div>
                    )
                  })}
                </div>
              )}
              <div className="flex items-center gap-1.5">
                <input type="text" value={laNewName} onChange={(e) => setLaNewName(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter") handleLaAdd() }}
                  placeholder="Action name…"
                  className="h-6 text-xs rounded border border-input bg-background px-2 focus:outline-none focus:ring-1 focus:ring-ring flex-1 min-w-0" />
                <input type="number" value={laNewCost} onChange={(e) => setLaNewCost(Math.max(1, parseInt(e.target.value) || 1))}
                  min={1} max={laMax || 3}
                  className="h-6 text-xs rounded border border-input bg-background px-1 focus:outline-none focus:ring-1 focus:ring-ring w-10 text-center" />
                <button onClick={handleLaAdd} disabled={!laNewName.trim()}
                  className="h-6 px-2 text-xs rounded border border-input bg-background hover:bg-accent disabled:opacity-40">
                  + Add
                </button>
              </div>
            </div>
          )}

          {/* Edit panel */}
          {editOpen && (
            <div className="pt-2 border-t border-muted-foreground/30 space-y-2">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Edit Stats</p>
              <div className="flex flex-wrap gap-2 items-end">
                <SmallInput label="Init" value={editInit} onChange={setEditInit} width="w-14" />
                <SmallInput label="HP Max" value={editHpMax} onChange={setEditHpMax} width="w-16" />
                <SmallInput label="AC" value={editAc} onChange={setEditAc} width="w-12" />
                <SmallInput label="LR" value={editLrMax} onChange={setEditLrMax} width="w-12" />
                <SmallInput label="LA" value={editLaMax} onChange={setEditLaMax} width="w-12" />
              </div>
              <div className="flex flex-wrap gap-2 items-end">
                <SmallInput label="STR" value={editStr} onChange={setEditStr} />
                <SmallInput label="DEX" value={editDex} onChange={setEditDex} />
                <SmallInput label="CON" value={editCon} onChange={setEditCon} />
                <SmallInput label="INT" value={editInt} onChange={setEditInt} />
                <SmallInput label="WIS" value={editWis} onChange={setEditWis} />
                <SmallInput label="CHA" value={editCha} onChange={setEditCha} />
              </div>
              <div className="flex gap-2">
                <button onClick={handleSaveEdit} className="px-3 py-1 rounded text-xs bg-foreground text-background hover:opacity-90 font-medium">Save</button>
                <button onClick={() => setEditOpen(false)} className="px-3 py-1 rounded text-xs border border-muted-foreground text-muted-foreground hover:bg-muted">Cancel</button>
              </div>
            </div>
          )}

          {/* Bottom buttons */}
          <CardButtons
            combatantId={combatant.id}
            editOpen={editOpen}
            onEdit={editOpen ? () => setEditOpen(false) : openEdit}
          />
        </div>

        <MiniMap
          combatantId={combatant.id}
          initialX={combatant.mapX}
          initialY={combatant.mapY}
          type={combatant.type}
          allPositions={allPositions}
          onPositionChange={onPositionChange}
        />
      </div>
    </div>
  )
}
