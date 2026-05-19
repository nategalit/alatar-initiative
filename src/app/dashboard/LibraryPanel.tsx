"use client"

import { useState } from "react"
import type { LibraryEntry } from "@/generated/prisma/client"
import { Button } from "@/components/ui/button"
import { addFromLibrary, deleteLibraryEntry } from "./actions"

type Filter = "ALL" | "MONSTER" | "PLAYER" | "LAIR_ACTION"

const TYPE_LABEL: Record<string, string> = {
  MONSTER: "Monster",
  PLAYER: "Player",
  LAIR_ACTION: "Lair Action",
}

const TYPE_COLOR: Record<string, string> = {
  MONSTER: "border-green-500 text-green-700",
  PLAYER: "border-blue-500 text-blue-700",
  LAIR_ACTION: "border-purple-500 text-purple-700",
}

const FILTERS: { label: string; value: Filter }[] = [
  { label: "All", value: "ALL" },
  { label: "Monster", value: "MONSTER" },
  { label: "Player", value: "PLAYER" },
  { label: "Lair Action", value: "LAIR_ACTION" },
]

export function LibraryPanel({ entries }: { entries: LibraryEntry[] }) {
  const [filter, setFilter] = useState<Filter>("ALL")

  const visible = filter === "ALL" ? entries : entries.filter((e) => e.type === filter)

  function exportJson() {
    const blob = new Blob([JSON.stringify(entries, null, 2)], { type: "application/json" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = "alatar-library.json"
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="space-y-3">
      {/* Filter chips + export */}
      <div className="flex gap-1.5 flex-wrap items-center">
        {entries.length > 0 && (
          <button
            onClick={exportJson}
            className="ml-auto px-2.5 py-0.5 rounded text-xs border border-muted-foreground text-muted-foreground hover:border-foreground hover:text-foreground transition-colors"
          >
            Export JSON
          </button>
        )}
      </div>
      <div className="flex gap-1.5 flex-wrap">
        {FILTERS.map(({ label, value }) => (
          <button
            key={value}
            onClick={() => setFilter(value)}
            className={`px-2.5 py-0.5 rounded-full text-xs font-medium border transition-colors ${
              filter === value
                ? "bg-foreground text-background border-foreground"
                : "border-muted-foreground text-muted-foreground hover:border-foreground hover:text-foreground"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {entries.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          No library entries yet. Click ★ on a combatant card to save it as a template.
        </p>
      ) : visible.length === 0 ? (
        <p className="text-sm text-muted-foreground">No {TYPE_LABEL[filter]} entries.</p>
      ) : (
        <ul className="space-y-1.5">
          {visible.map((entry) => (
            <li
              key={entry.id}
              className="flex items-center gap-3 rounded-md border px-3 py-2 text-sm"
            >
              <span className="flex-1 font-medium truncate">{entry.name}</span>
              {entry.shorthand && (
                <span className="text-muted-foreground text-xs shrink-0">{entry.shorthand}</span>
              )}
              <span
                className={`text-xs border rounded px-1.5 py-0.5 shrink-0 ${TYPE_COLOR[entry.type]}`}
              >
                {TYPE_LABEL[entry.type]}
              </span>
              <span className="text-muted-foreground text-xs shrink-0">
                HP {entry.hpMax} / AC {entry.ac}
              </span>
              <form action={addFromLibrary.bind(null, entry.id)}>
                <Button type="submit" size="sm" variant="outline" className="h-7 px-2 text-xs">
                  Add
                </Button>
              </form>
              <form action={deleteLibraryEntry.bind(null, entry.id)}>
                <Button
                  type="submit"
                  size="sm"
                  variant="ghost"
                  className="h-7 w-7 p-0 text-muted-foreground hover:text-destructive"
                  aria-label={`Delete ${entry.name} from library`}
                >
                  ×
                </Button>
              </form>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
