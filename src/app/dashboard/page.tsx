import { prisma } from "@/lib/prisma"
import { getDefaultUserId } from "@/lib/current-user"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { EncounterPanel } from "./EncounterPanel"
import { InitiativeList } from "./InitiativeList"
import { InitiativeRoller } from "./InitiativeRoller"
import { LibrarySearch } from "./LibrarySearch"
import { LibraryPanel } from "./LibraryPanel"
import { addCombatant } from "./actions"

export default async function DashboardPage() {
  const userId = await getDefaultUserId()

  const [combatants, encounters, libraryEntries] = await Promise.all([
    prisma.combatant.findMany({
      where: { userId },
      orderBy: { initiative: "desc" },
    }),
    prisma.encounter.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
    }),
    prisma.libraryEntry.findMany({
      where: { userId },
      orderBy: { name: "asc" },
    }),
  ])

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b px-6 py-3 flex items-center">
        <h1 className="font-semibold tracking-tight">Alatar</h1>
      </header>

      <main className="max-w-3xl mx-auto px-6 py-8 space-y-8">
        {/* Add combatant form */}
        <section>
          <h2 className="text-xs font-medium uppercase tracking-wider text-muted-foreground mb-3">
            Add Combatant
          </h2>
          <div className="mb-3">
            <LibrarySearch entries={libraryEntries} />
          </div>
          <form action={addCombatant} className="flex flex-wrap gap-3 items-end">
            <div className="flex flex-col gap-1 min-w-36">
              <Label htmlFor="name" className="text-xs">Name</Label>
              <Input id="name" name="name" placeholder="Goblin" required className="h-8" />
            </div>

            <div className="flex flex-col gap-1">
              <Label htmlFor="type" className="text-xs">Type</Label>
              <select
                id="type"
                name="type"
                defaultValue="MONSTER"
                className="h-8 rounded-md border border-input bg-background px-3 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
              >
                <option value="MONSTER">Monster</option>
                <option value="PLAYER">Player</option>
                <option value="LAIR_ACTION">Lair Action</option>
              </select>
            </div>

            <InitiativeRoller />

            <div className="flex flex-col gap-1 w-20">
              <Label htmlFor="hpMax" className="text-xs">HP Max</Label>
              <Input id="hpMax" name="hpMax" type="number" placeholder="1" min="1" className="h-8" />
            </div>

            <div className="flex flex-col gap-1 w-16">
              <Label htmlFor="ac" className="text-xs">AC</Label>
              <Input id="ac" name="ac" type="number" placeholder="10" min="0" className="h-8" />
            </div>

            <div className="flex flex-col gap-1 w-16">
              <Label htmlFor="legendaryResistanceMax" className="text-xs">LR</Label>
              <Input
                id="legendaryResistanceMax"
                name="legendaryResistanceMax"
                type="number"
                placeholder="0"
                min="0"
                className="h-8"
              />
            </div>

            <div className="flex flex-col gap-1 w-16">
              <Label htmlFor="legendaryActionsMax" className="text-xs">LA</Label>
              <Input
                id="legendaryActionsMax"
                name="legendaryActionsMax"
                type="number"
                placeholder="0"
                min="0"
                className="h-8"
              />
            </div>

            <Button type="submit" size="sm" className="h-8">
              Add
            </Button>
          </form>
        </section>

        {/* Initiative list */}
        <section>
          <InitiativeList combatants={combatants} />
        </section>

        {/* Encounters */}
        <section>
          <h2 className="text-xs font-medium uppercase tracking-wider text-muted-foreground mb-3">
            Saved Encounters
          </h2>
          <EncounterPanel encounters={encounters} combatants={combatants} />
        </section>

        {/* Library */}
        <section>
          <h2 className="text-xs font-medium uppercase tracking-wider text-muted-foreground mb-3">
            Library
          </h2>
          <LibraryPanel entries={libraryEntries} />
        </section>
      </main>
    </div>
  )
}
