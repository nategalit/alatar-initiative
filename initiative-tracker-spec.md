# D&D Initiative Tracker — Feature Specification

A personal project initiative tracker for running D&D combat as a DM, built first as a web app, with a native app version to follow.

---

## 1. Platform & Architecture

- **Web app first** (whichever framework is fastest to iterate in — likely React/Next.js or SvelteKit).
- **Native app second** — wrapping the web app via Tauri or Electron is the cheapest path; revisit if a native experience is needed.
- **Account system** with authentication (email/password at minimum; OAuth optional).
- **Persistent storage** server-side so data survives across sessions and devices.
- **Encounters as JSON** — importable/exportable files, in addition to server-side storage. Lets users back up, share, or hand-edit encounters offline.
- Consider an **offline/local-only mode** that works without an account, with optional cloud sync.

---

## 2. Core Concepts

- **Combatant** — a single entry in the initiative order. Three subtypes:
  - **Monster** (DM-controlled, color-coded green in mockup)
  - **Player** (PC-controlled, color-coded blue in mockup)
  - **Lair Action** (special separator entry that fires at a fixed initiative count, e.g., 20)
- **Encounter** — a saved set of combatants, conditions, and configuration that can be loaded into combat.
- **Round** — one full pass through the initiative order.
- **Turn** — a single combatant's slice within a round.

---

## 3. Combatant Card (per-unit display)

Based on the mockup, each combatant card shows:

- **Initiative number** — large, top-left, in a small boxed display.
- **Name** — bold, truncated with ellipsis if too long (e.g., "BOSSY MCL...").
- **HP** — current/max with heart icon (e.g., "43/89 ♥").
- **AC** — value with shield icon (e.g., "16 🛡").
- **Six ability modifiers** — STR / DEX / CON / INT / WIS / CHA, displayed as signed modifiers (+2, -1, etc.).
- **Action economy toggles** (color-coded buttons, clickable from the card without opening detail):
  - ACTION (blue)
  - BONUS ACTION (red/pink)
  - REACTION (magenta)
- **Legendary Resistance counter** — filled/unfilled circles showing remaining uses (DM/monster only).
- **Mini-map square** — small drawable area on the right for placing a position dot. Used to disambiguate identical minis (e.g., five goblins) by recording their position on the battlemap. Click to place/move dot; pencil icon to edit.
- **Side color border** — green for monsters, blue for players.

### Action Economy Behavior
- All three toggles reset at the start of the combatant's turn.
- Reaction also resets at the top of each round (depending on house rules — make this configurable).
- Visual state should be obvious at a glance (lit = available, dimmed = used).

---

## 4. Conditions

- Toggleable conditions that **snap onto** a combatant with a visual indicator (icon, color overlay, or border treatment).
- Standard 5e conditions to support: blinded, charmed, deafened, frightened, grappled, incapacitated, invisible, paralyzed, petrified, poisoned, prone, restrained, stunned, unconscious, exhaustion (with levels 1–6), plus a **dead** state.
- Multiple conditions per combatant.
- Quick-toggle from the card (no need to open detail view).
- Optional: hover/tap shows the condition's mechanical effects.

---

## 5. Quick-Access Interactions

A core principle: **most common actions should not require opening a detail panel**.

- Toggle action / bonus action / reaction directly from the card.
- Toggle conditions directly from the card.
- Apply damage / healing with a quick input (e.g., click HP, type number, +/- toggle).
- Advance turn with one button or keyboard shortcut.

---

## 6. Names & Identification

- **Shorthand system** — save a combatant as a short alias (e.g., "Agravain" → "Agvn") and reuse it from a menu. Especially useful for recurring NPCs and monster types.
- **Truncation** — long names truncate with ellipsis on the card; full name visible on hover or in detail view.
- **Numbering** — when multiple instances of the same monster type are added (e.g., three goblins), auto-suffix with numbers or letters (Goblin 1, Goblin 2, Goblin 3 or Goblin A/B/C).

---

## 7. Mini-Map Position Tracking

- Per-combatant drawable square showing position relative to the encounter's battlemap.
- Click to place a single dot; click again to move it.
- Solves the "which goblin is which" problem when running identical minis.
- The square is intentionally small and abstract — not a full virtual tabletop, just a positional reminder.

---

## 8. DM-Specific Features

- **Legendary actions** — selectable list per legendary creature, with use counts that reset at the top of each round.
- **Legendary resistance** — counter of remaining uses, decrementable from the card.
- **Lair actions** — added as their own entry in initiative order at a fixed count (typically 20 on a tie loss).
- **Full HP visibility** — DMs see exact HP for monsters; consider a player-facing view that hides exact HP (see §10).

---

## 9. Stats & Saving Throws

- HP (current/max), with damage/healing input.
- Temporary HP as a separate field.
- AC.
- Six ability modifiers (STR/DEX/CON/INT/WIS/CHA).
- **Saving throw bonuses** per ability — separate from raw modifier (since proficiency may apply).
- *(Consider)* Skill bonuses for skill checks during combat.
- *(Consider)* Initiative bonus stored per combatant for auto-rolling.

---

## 10. Views & Sharing *(open question — see §15)*

Worth deciding early:

- Is this a **single-screen DM tool** only?
- Or does it have a **player-facing view** (hides monster HP, shows only condition icons, etc.)?
- If shared, is it via a read-only link, a shared session, or a separate logged-in role?

---

## 11. Encounter Management

- **Preload encounters** — define a set of monsters ahead of time so during session prep you only need to add players.
- **Save / load encounters** — server-side library plus JSON export/import.
- **Monster library** — reusable monster templates separate from any specific encounter.
- **Player library** — reusable PC entries (since the same party recurs).
- **Quick-add from library** — type-ahead search for monsters and PCs.

---

## 12. Combat Flow

- **Initiative roll** — manual entry, or auto-roll using initiative bonus.
- **Sort by initiative** — descending; ties resolved by DEX modifier or manual reorder.
- **Round counter** — visible somewhere prominent.
- **Current turn indicator** — clear highlight on the active combatant.
- **Next/previous turn** — buttons and keyboard shortcuts.
- **Add / remove / duplicate combatants mid-combat**.
- **Drag to reorder** initiative if needed.

---

## 13. Suggested Additional Features

Things not in the source suggestions but commonly wanted in initiative trackers:

- **Concentration tracking** — flag a combatant as concentrating; visual indicator and reminder when they take damage.
- **Death saves** — automatic UI for downed players (3 successes / 3 failures with quick toggle).
- **Damage type / resistance / vulnerability** — optional fields on monsters, surfaced when applying damage.
- **Notes per combatant** — free-text field for tactics, motivations, or session notes.
- **Combat log / history** — running record of damage, heals, conditions added, turns advanced. Useful for "wait, who hit them last round?"
- **Undo last action** — at minimum for damage/heal mistakes.
- **Encounter timer** — optional per-turn timer to keep play moving.
- **Initiative groups** — let multiple identical monsters share one initiative slot.

---

## 14. Source Suggestions Log

Captured from friends in Discord, attributed for reference:

- **Y'rcen (Max):** AC, dead/death indicator (skull).
- **Myst Flowers (Jeremy):** Toggleable Action / Bonus Action / Reaction buttons accessible without entering the unit; row format `UNIT NAME | HP | AC | m. | act | b.act | react | [position square]`; mini-map/drawable square per unit for tracking identical minis; saving throw bonuses.
- **Auntie Metijak (Ellen):** Legendary action selection for DM; legendary resistance and HP tracking; toggleable conditions that snap onto units (invisible, unconscious, poisoned, etc.).
- **The theTy guy:** Shorthand for monster and player names (e.g., save "Agravain" as "Agvn"); preload monsters for encounters so only players need slotting in.

---

## 15. Open Questions

Decide these before or during early implementation — they shape data models and UI:

1. **DM-only or DM + Player view?** Affects auth model and data exposure.
2. **Real-time multi-user?** Does the DM share a live session with players, or is it solo?
3. **Single system (5e) or system-agnostic?** Hardcoding 5e conditions/stats is faster; abstracting them is more flexible.
4. **Stat block import** — pull from open APIs (Open5e, dnd5eapi.co) or manual entry only?
5. **Mobile responsiveness** — does the web version need to work on phone/tablet, or desktop only?
6. **Where does the mini-map dot live** — per-combatant square only, or also a shared "battlemap overview" view showing all dots together?
7. **Pricing / hosting** — self-hosted personal use, or designed to scale to other DMs?

---

## 16. Suggested Build Order

For a Claude Code build, roughly:

1. Auth + basic data persistence (boring foundation).
2. Combatant model + add/remove + initiative sort.
3. Card UI matching the mockup (HP, AC, stats, action toggles).
4. Conditions system.
5. Encounter save/load (server + JSON export).
6. Monster + player libraries with shorthand.
7. Mini-map position squares.
8. Legendary actions/resistance, lair actions.
9. Combat log / undo / quality-of-life features.
10. Native app wrapper.
