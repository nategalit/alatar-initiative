"use client"

import { useState, useRef } from "react"
import type { LibraryEntry } from "@/generated/prisma/client"
import { Input } from "@/components/ui/input"
import { addFromLibrary } from "./actions"

const TYPE_LABEL: Record<string, string> = {
  MONSTER: "Monster",
  PLAYER: "Player",
  LAIR_ACTION: "Lair Action",
}

const TYPE_COLOR: Record<string, string> = {
  MONSTER: "text-green-700",
  PLAYER: "text-blue-700",
  LAIR_ACTION: "text-purple-700",
}

export function LibrarySearch({ entries }: { entries: LibraryEntry[] }) {
  const [query, setQuery] = useState("")
  const [open, setOpen] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  const q = query.trim().toLowerCase()
  const matches = (
    q
      ? entries.filter(
          (e) =>
            e.name.toLowerCase().includes(q) ||
            (e.shorthand && e.shorthand.toLowerCase().includes(q))
        )
      : entries
  ).slice(0, 8)

  async function handleSelect(entry: LibraryEntry) {
    setQuery("")
    setOpen(false)
    await addFromLibrary(entry.id)
  }

  if (entries.length === 0) return null

  return (
    <div className="relative">
      <Input
        ref={inputRef}
        value={query}
        onChange={(e) => { setQuery(e.target.value); setOpen(true) }}
        onFocus={() => setOpen(true)}
        onBlur={() => setTimeout(() => setOpen(false), 150)}
        onKeyDown={(e) => { if (e.key === "Escape") { setQuery(""); setOpen(false) } }}
        placeholder="Quick-add from library…"
        className="h-8 text-sm"
      />
      {open && matches.length > 0 && (
        <ul className="absolute z-50 mt-1 w-full rounded-md border bg-popover shadow-md text-sm">
          {matches.map((entry) => (
            <li key={entry.id}>
              <button
                onMouseDown={(e) => { e.preventDefault(); void handleSelect(entry) }}
                className="w-full flex items-center gap-3 px-3 py-1.5 hover:bg-accent text-left"
              >
                <span className="flex-1 font-medium truncate">{entry.name}</span>
                {entry.shorthand && (
                  <span className="text-muted-foreground text-xs shrink-0">{entry.shorthand}</span>
                )}
                <span className={`text-xs shrink-0 ${TYPE_COLOR[entry.type]}`}>
                  {TYPE_LABEL[entry.type]}
                </span>
                <span className="text-muted-foreground text-xs shrink-0">
                  HP {entry.hpMax} / AC {entry.ac}
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
