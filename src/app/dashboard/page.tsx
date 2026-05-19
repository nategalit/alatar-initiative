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

const STAT_FIELDS = [
  { id: "strMod", label: "STR" },
  { id: "dexMod", label: "DEX" },
  { id: "conMod", label: "CON" },
  { id: "intMod", label: "INT" },
  { id: "wisMod", label: "WIS" },
  { id: "chaMod", label: "CHA" },
]

export default async function DashboardPage() {
  const userId = await getDefaultUserId()

  const [combatants, encounters, libraryEntries] = await Promise.all([
    prisma.combatant.findMany({ where: { userId }, orderBy: { initiative: "desc" } }),
    prisma.encounter.findMany({ where: { userId }, orderBy: { createdAt: "desc" } }),
    prisma.libraryEntry.findMany({ where: { userId }, orderBy: { name: "asc" } }),
  ])

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b px-6 py-3 flex items-center">
        <h1 className="font-semibold tracking-tight">Alatar</h1>
      </header>

      <main className="max-w-3xl mx-auto px-6 py-8 space-y-6">

        {/* ── Add Combatant ── */}
        <section className="rounded-lg border px-5 py-4 space-y-3">
          <h2 className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
            Add Combatant
          </h2>
          <LibrarySearch entries={libraryEntries} />
          <form action={addCombatant} className="space-y-3">
            {/* Primary fields */}
            <div className="flex flex-wrap gap-2 items-end">
              <div className="flex flex-col gap-1 w-32">
                <Label htmlFor="name" className="text-xs">Name</Label>
                <Input id="name" name="name" placeholder="Goblin" required className="h-8" />
              </div>

              <div className="flex flex-col gap-1 w-24">
                <Label htmlFor="type" className="text-xs">Type</Label>
                <select
                  id="type"
                  name="type"
                  defaultValue="MONSTER"
                  className="h-8 rounded-md border border-input bg-background px-2 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
                >
                  <option value="MONSTER">Monster</option>
                  <option value="PLAYER">Player</option>
                  <option value="LAIR_ACTION">Lair Action</option>
                </select>
              </div>

              <InitiativeRoller />

              <div className="flex flex-col gap-1 w-16">
                <Label htmlFor="hpMax" className="text-xs">HP Max</Label>
                <Input id="hpMax" name="hpMax" type="number" placeholder="1" min="1" className="h-8" />
              </div>

              <div className="flex flex-col gap-1 w-12">
                <Label htmlFor="ac" className="text-xs">AC</Label>
                <Input id="ac" name="ac" type="number" placeholder="10" min="0" className="h-8" />
              </div>

              <div className="flex flex-col gap-1 w-12">
                <Label htmlFor="legendaryResistanceMax" className="text-xs">LR</Label>
                <Input id="legendaryResistanceMax" name="legendaryResistanceMax" type="number" placeholder="0" min="0" className="h-8" />
              </div>

              <div className="flex flex-col gap-1 w-12">
                <Label htmlFor="legendaryActionsMax" className="text-xs">LA</Label>
                <Input id="legendaryActionsMax" name="legendaryActionsMax" type="number" placeholder="0" min="0" className="h-8" />
              </div>
            </div>

            {/* Stat modifier row */}
            <div className="flex gap-2 items-end">
              {STAT_FIELDS.map(({ id, label }) => (
                <div key={id} className="flex flex-col items-center gap-1 w-12">
                  <Label htmlFor={id} className="text-xs">{label}</Label>
                  <Input
                    id={id}
                    name={id}
                    type="number"
                    defaultValue="0"
                    className="h-8 px-1 text-center text-xs"
                  />
                </div>
              ))}
            </div>

            {/* Full-width submit */}
            <Button type="submit" className="w-full h-9 text-sm font-medium">
              Add to Initiative
            </Button>
          </form>
        </section>

        {/* ── Initiative Order ── */}
        <section className="rounded-lg border px-5 py-4">
          <InitiativeList combatants={combatants} />
        </section>

        {/* ── Saved Encounters ── */}
        <section className="rounded-lg border px-5 py-4 space-y-3">
          <h2 className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
            Saved Encounters
          </h2>
          <EncounterPanel encounters={encounters} combatants={combatants} />
        </section>

        {/* ── Library ── */}
        <section className="rounded-lg border px-5 py-4 space-y-3">
          <h2 className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
            Library
          </h2>
          <LibraryPanel entries={libraryEntries} />
        </section>

      </main>
    </div>
  )
}
