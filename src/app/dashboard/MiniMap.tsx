"use client"

import { useRef, useState } from "react"
import { updateMapPosition } from "./actions"

const DOT_COLOR: Record<string, string> = {
  MONSTER:     "bg-green-500",
  PLAYER:      "bg-blue-500",
  LAIR_ACTION: "bg-purple-500",
}

export function MiniMap({
  combatantId,
  initialX,
  initialY,
  type,
}: {
  combatantId: string
  initialX: number | null
  initialY: number | null
  type: string
}) {
  const [pos, setPos] = useState<{ x: number; y: number } | null>(
    initialX != null && initialY != null ? { x: initialX, y: initialY } : null
  )
  const squareRef = useRef<HTMLDivElement>(null)

  function handleSquareClick(e: React.MouseEvent<HTMLDivElement>) {
    const rect = squareRef.current?.getBoundingClientRect()
    if (!rect) return
    const x = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width))
    const y = Math.max(0, Math.min(1, (e.clientY - rect.top) / rect.height))
    setPos({ x, y })
    void updateMapPosition(combatantId, x, y)
  }

  function handleDotClick(e: React.MouseEvent) {
    e.stopPropagation()
    setPos(null)
    void updateMapPosition(combatantId, null, null)
  }

  const dotColor = DOT_COLOR[type] ?? "bg-gray-500"

  return (
    <div
      ref={squareRef}
      onClick={handleSquareClick}
      title="Click to place position dot"
      className="shrink-0 w-16 h-16 rounded border border-dashed border-muted-foreground/40 relative cursor-crosshair select-none"
      style={{
        backgroundImage:
          "linear-gradient(to right, hsl(var(--muted-foreground)/0.08) 1px, transparent 1px), linear-gradient(to bottom, hsl(var(--muted-foreground)/0.08) 1px, transparent 1px)",
        backgroundSize: "25% 25%",
      }}
    >
      {pos && (
        <button
          onClick={handleDotClick}
          title="Remove position dot"
          className={`absolute w-3 h-3 rounded-full ${dotColor} -translate-x-1/2 -translate-y-1/2 hover:opacity-70 transition-opacity`}
          style={{ left: `${pos.x * 100}%`, top: `${pos.y * 100}%` }}
          aria-label="Remove position dot"
        />
      )}
    </div>
  )
}
