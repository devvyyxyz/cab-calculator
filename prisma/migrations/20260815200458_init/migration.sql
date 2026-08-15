-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "email" TEXT NOT NULL,
    "name" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "Post" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "title" TEXT NOT NULL,
    "content" TEXT,
    "published" BOOLEAN NOT NULL DEFAULT false,
    "authorId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "Transaction" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "discordId" TEXT,
    "discordName" TEXT,
    "yourOffer" TEXT NOT NULL,
    "theirOffer" TEXT NOT NULL,
    "yourTotal" REAL NOT NULL,
    "theirTotal" REAL NOT NULL,
    "verdict" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "Species" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "fullName" TEXT NOT NULL,
    "shortenedName" TEXT NOT NULL,
    "icon" TEXT NOT NULL,
    "attack" REAL NOT NULL,
    "health" REAL NOT NULL,
    "speed" REAL NOT NULL,
    "rarity" REAL NOT NULL,
    "isExclusive" BOOLEAN NOT NULL DEFAULT false,
    "exists" INTEGER,
    "spawnWorld" INTEGER,
    "spawnZone" INTEGER,
    "demand" TEXT NOT NULL DEFAULT 'medium',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "BagItem" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "icon" TEXT NOT NULL,
    "demand" TEXT NOT NULL DEFAULT 'medium',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "Moveset" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "energy" INTEGER NOT NULL,
    "type" TEXT NOT NULL,
    "demonExclusive" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "Hoverboard" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "icon" TEXT NOT NULL,
    "speed" REAL NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "NewsPost" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "category" TEXT NOT NULL DEFAULT 'news',
    "channel" TEXT NOT NULL,
    "date" TEXT NOT NULL,
    "icon" TEXT,
    "gradient" TEXT,
    "border" TEXT,
    "published" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE INDEX "Transaction_discordId_idx" ON "Transaction"("discordId");

-- CreateIndex
CREATE INDEX "Transaction_createdAt_idx" ON "Transaction"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "Species_name_key" ON "Species"("name");

-- CreateIndex
CREATE INDEX "Species_name_idx" ON "Species"("name");

-- CreateIndex
CREATE INDEX "Species_rarity_idx" ON "Species"("rarity");

-- CreateIndex
CREATE INDEX "Species_demand_idx" ON "Species"("demand");

-- CreateIndex
CREATE UNIQUE INDEX "BagItem_name_key" ON "BagItem"("name");

-- CreateIndex
CREATE INDEX "BagItem_name_idx" ON "BagItem"("name");

-- CreateIndex
CREATE INDEX "BagItem_demand_idx" ON "BagItem"("demand");

-- CreateIndex
CREATE UNIQUE INDEX "Moveset_name_key" ON "Moveset"("name");

-- CreateIndex
CREATE INDEX "Moveset_name_idx" ON "Moveset"("name");

-- CreateIndex
CREATE UNIQUE INDEX "Hoverboard_name_key" ON "Hoverboard"("name");

-- CreateIndex
CREATE INDEX "Hoverboard_name_idx" ON "Hoverboard"("name");

-- CreateIndex
CREATE INDEX "NewsPost_category_idx" ON "NewsPost"("category");

-- CreateIndex
CREATE INDEX "NewsPost_date_idx" ON "NewsPost"("date");
