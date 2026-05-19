"use client"

import { useRef, useState } from "react"
import type { Combatant, Encounter } from "@/generated/prisma/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { toSnapshot } from "@/lib/encounter"
import { saveEncounter, loadEncounter, deleteEncounter, importEncounter } from "./actions"

export function EncounterPanel({
  encounters,
  combatants,
}: {
  encounters: Encounter[]
  combatants: Combatant[]
}) {
  const [saveName, setSaveName] = useState("")
  const fileInputRef = useRef<HTMLInputElement>(null)

  function handleExport() {
    const snapshots = combatants.map(toSnapshot)
    const json = JSON.stringify(snapshots, null, 2)
    const blob = new Blob([json], { type: "application/json" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `encounter-${new Date().toISOString().slice(0, 10)}.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  async function handleImport(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    const fd = new FormData()
    fd.append("file", file)
    await importEncounter(fd)
    if (fileInputRef.current) fileInputRef.current.value = ""
  }

  async function handleSave() {
    if (!saveName.trim()) return
    await saveEncounter(saveName)
    setSaveName("")
  }

  return (
    <div className="space-y-3">
      {/* Controls row */}
      <div className="flex flex-wrap items-center gap-2">
        <Input
          value={saveName}
          onChange={(e) => setSaveName(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter") void handleSave() }}
          placeholder="Encounter name…"
          className="h-8 w-48 text-sm"
        />
        <Button
          size="sm"
          className="h-8"
          onClick={() => void handleSave()}
          disabled={!saveName.trim()}
        >
          Save
        </Button>

        <Button
          size="sm"
          variant="outline"
          className="h-8"
          onClick={handleExport}
          disabled={combatants.length === 0}
        >
          Export JSON
        </Button>

        <Button
          size="sm"
          variant="outline"
          className="h-8"
          onClick={() => fileInputRef.current?.click()}
        >
          ↑ Import JSON
        </Button>
        <input
          ref={fileInputRef}
          type="file"
          accept=".json"
          className="hidden"
          onChange={(e) => void handleImport(e)}
        />
      </div>

      {/* Encounter list */}
      {encounters.length === 0 ? (
        <p className="text-sm text-muted-foreground">No saved encounters yet.</p>
      ) : (
        <ul className="space-y-1.5">
          {encounters.map((enc) => {
            let count = 0
            try { count = (JSON.parse(enc.snapshot) as unknown[]).length } catch { /* ignore */ }
            const saved = new Date(enc.createdAt).toLocaleDateString(undefined, {
              month: "short",
              day: "numeric",
              year: "numeric",
            })
            return (
              <li
                key={enc.id}
                className="flex items-center gap-3 rounded-md border px-3 py-2 text-sm"
              >
                <span className="flex-1 font-medium truncate">{enc.name}</span>
                <span className="text-muted-foreground shrink-0">
                  {count} combatant{count !== 1 ? "s" : ""}
                </span>
                <span className="text-muted-foreground shrink-0 text-xs">{saved}</span>
                <form action={loadEncounter.bind(null, enc.id)}>
                  <Button type="submit" size="sm" variant="outline" className="h-7 px-2 text-xs">
                    Load
                  </Button>
                </form>
                <form action={deleteEncounter.bind(null, enc.id)}>
                  <Button
                    type="submit"
                    size="sm"
                    variant="ghost"
                    className="h-7 w-7 p-0 text-muted-foreground hover:text-destructive"
                    aria-label={`Delete ${enc.name}`}
                  >
                    ×
                  </Button>
                </form>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}
