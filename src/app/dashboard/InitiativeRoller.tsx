"use client"

import { useState } from "react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

export function InitiativeRoller() {
  const [value, setValue] = useState("")

  function roll() {
    setValue(String(Math.floor(Math.random() * 20) + 1))
  }

  return (
    <div className="flex flex-col gap-1 w-24">
      <Label htmlFor="initiative" className="text-xs">Init</Label>
      <div className="flex gap-0.5">
        <Input
          id="initiative"
          name="initiative"
          type="number"
          placeholder="0"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          className="h-8 w-14"
        />
        <button
          type="button"
          onClick={roll}
          title="Roll d20"
          className="h-8 w-8 rounded border border-input bg-background text-sm hover:bg-accent flex items-center justify-center shrink-0"
        >
          🎲
        </button>
      </div>
    </div>
  )
}
