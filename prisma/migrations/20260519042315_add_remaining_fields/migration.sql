-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Combatant" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" TEXT NOT NULL DEFAULT 'MONSTER',
    "shorthand" TEXT NOT NULL DEFAULT '',
    "initiative" INTEGER NOT NULL DEFAULT 0,
    "initiativeBonus" INTEGER NOT NULL DEFAULT 0,
    "hpCurrent" INTEGER NOT NULL DEFAULT 1,
    "hpMax" INTEGER NOT NULL DEFAULT 1,
    "hpTemp" INTEGER NOT NULL DEFAULT 0,
    "ac" INTEGER NOT NULL DEFAULT 10,
    "strMod" INTEGER NOT NULL DEFAULT 0,
    "dexMod" INTEGER NOT NULL DEFAULT 0,
    "conMod" INTEGER NOT NULL DEFAULT 0,
    "intMod" INTEGER NOT NULL DEFAULT 0,
    "wisMod" INTEGER NOT NULL DEFAULT 0,
    "chaMod" INTEGER NOT NULL DEFAULT 0,
    "strSave" INTEGER NOT NULL DEFAULT 0,
    "dexSave" INTEGER NOT NULL DEFAULT 0,
    "conSave" INTEGER NOT NULL DEFAULT 0,
    "intSave" INTEGER NOT NULL DEFAULT 0,
    "wisSave" INTEGER NOT NULL DEFAULT 0,
    "chaSave" INTEGER NOT NULL DEFAULT 0,
    "actionUsed" BOOLEAN NOT NULL DEFAULT false,
    "bonusActionUsed" BOOLEAN NOT NULL DEFAULT false,
    "reactionUsed" BOOLEAN NOT NULL DEFAULT false,
    "conditions" TEXT NOT NULL DEFAULT '[]',
    "legendaryResistanceMax" INTEGER NOT NULL DEFAULT 0,
    "legendaryResistanceUsed" INTEGER NOT NULL DEFAULT 0,
    "legendaryActionsMax" INTEGER NOT NULL DEFAULT 0,
    "legendaryActionsUsed" INTEGER NOT NULL DEFAULT 0,
    "legendaryActions" TEXT NOT NULL DEFAULT '[]',
    "concentrating" BOOLEAN NOT NULL DEFAULT false,
    "deathSaveSuccesses" INTEGER NOT NULL DEFAULT 0,
    "deathSaveFailures" INTEGER NOT NULL DEFAULT 0,
    "notes" TEXT NOT NULL DEFAULT '',
    "mapX" REAL,
    "mapY" REAL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Combatant_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_Combatant" ("ac", "actionUsed", "bonusActionUsed", "chaMod", "chaSave", "conMod", "conSave", "conditions", "createdAt", "dexMod", "dexSave", "hpCurrent", "hpMax", "hpTemp", "id", "initiative", "initiativeBonus", "intMod", "intSave", "legendaryActions", "legendaryActionsMax", "legendaryActionsUsed", "legendaryResistanceMax", "legendaryResistanceUsed", "mapX", "mapY", "name", "notes", "reactionUsed", "shorthand", "strMod", "strSave", "type", "updatedAt", "userId", "wisMod", "wisSave") SELECT "ac", "actionUsed", "bonusActionUsed", "chaMod", "chaSave", "conMod", "conSave", "conditions", "createdAt", "dexMod", "dexSave", "hpCurrent", "hpMax", "hpTemp", "id", "initiative", "initiativeBonus", "intMod", "intSave", "legendaryActions", "legendaryActionsMax", "legendaryActionsUsed", "legendaryResistanceMax", "legendaryResistanceUsed", "mapX", "mapY", "name", "notes", "reactionUsed", "shorthand", "strMod", "strSave", "type", "updatedAt", "userId", "wisMod", "wisSave" FROM "Combatant";
DROP TABLE "Combatant";
ALTER TABLE "new_Combatant" RENAME TO "Combatant";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
