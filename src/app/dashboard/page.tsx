import { auth } from "@/auth"
import { redirect } from "next/navigation"
import { prisma } from "@/lib/prisma"
import { CombatantType } from "@/generated/prisma/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { addCombatant, deleteCombatant, signOutAction } from "./actions"

const TYPE_LABELS: Record<CombatantType, string> = {
  MONSTER: "Monster",
  PLAYER: "Player",
  LAIR_ACTION: "Lair Action",
}

const TYPE_COLORS: Record<CombatantType, string> = {
  MONSTER: "border-green-500 text-green-700",
  PLAYER: "border-blue-500 text-blue-700",
  LAIR_ACTION: "border-purple-500 text-purple-700",
}

export default async function DashboardPage() {
  const session = await auth()
  if (!session?.user?.id) redirect("/login")

  const combatants = await prisma.combatant.findMany({
    where: { userId: session.user.id },
    orderBy: { initiative: "desc" },
  })

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b px-6 py-3 flex items-center justify-between">
        <h1 className="font-semibold tracking-tight">Alatar</h1>
        <div className="flex items-center gap-4">
          <span className="text-sm text-muted-foreground">{session.user.email}</span>
          <form action={signOutAction}>
            <Button variant="outline" size="sm" type="submit">
              Sign out
            </Button>
          </form>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-6 py-8 space-y-8">
        {/* Add combatant form */}
        <section>
          <h2 className="text-sm font-medium uppercase tracking-wider text-muted-foreground mb-3">
            Add Combatant
          </h2>
          <form action={addCombatant} className="flex flex-wrap gap-3 items-end">
            <div className="flex flex-col gap-1 min-w-40">
              <Label htmlFor="name">Name</Label>
              <Input id="name" name="name" placeholder="Goblin" required />
            </div>

            <div className="flex flex-col gap-1">
              <Label htmlFor="type">Type</Label>
              <Select name="type" defaultValue="MONSTER">
                <SelectTrigger id="type" className="w-36">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="MONSTER">Monster</SelectItem>
                  <SelectItem value="PLAYER">Player</SelectItem>
                  <SelectItem value="LAIR_ACTION">Lair Action</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex flex-col gap-1 w-24">
              <Label htmlFor="initiative">Init</Label>
              <Input id="initiative" name="initiative" type="number" placeholder="0" />
            </div>

            <div className="flex flex-col gap-1 w-24">
              <Label htmlFor="hpMax">HP Max</Label>
              <Input id="hpMax" name="hpMax" type="number" placeholder="1" min="1" />
            </div>

            <div className="flex flex-col gap-1 w-20">
              <Label htmlFor="ac">AC</Label>
              <Input id="ac" name="ac" type="number" placeholder="10" min="0" />
            </div>

            <Button type="submit">Add</Button>
          </form>
        </section>

        {/* Initiative list */}
        <section>
          <h2 className="text-sm font-medium uppercase tracking-wider text-muted-foreground mb-3">
            Initiative Order ({combatants.length})
          </h2>

          {combatants.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No combatants yet. Add one above to begin.
            </p>
          ) : (
            <ul className="space-y-2">
              {combatants.map((c) => (
                <li
                  key={c.id}
                  className="flex items-center gap-3 rounded-lg border bg-card px-4 py-3"
                >
                  {/* Initiative badge */}
                  <span
                    className={`w-10 h-10 flex items-center justify-center rounded border-2 font-bold text-sm shrink-0 ${TYPE_COLORS[c.type]}`}
                  >
                    {c.initiative}
                  </span>

                  {/* Name + type */}
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{c.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {TYPE_LABELS[c.type]}
                    </p>
                  </div>

                  {/* Stats */}
                  <div className="flex items-center gap-4 text-sm text-muted-foreground shrink-0">
                    <span>
                      ♥ {c.hpCurrent}/{c.hpMax}
                    </span>
                    <span>AC {c.ac}</span>
                  </div>

                  {/* Delete */}
                  <form
                    action={deleteCombatant.bind(null, c.id)}
                  >
                    <Button
                      variant="ghost"
                      size="sm"
                      type="submit"
                      className="text-muted-foreground hover:text-destructive"
                      aria-label={`Remove ${c.name}`}
                    >
                      ×
                    </Button>
                  </form>
                </li>
              ))}
            </ul>
          )}
        </section>
      </main>
    </div>
  )
}
