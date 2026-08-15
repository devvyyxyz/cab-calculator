import { PrismaClient } from "@prisma/client";
import type { Species } from "@/lib/cab-types";

const prisma = new PrismaClient();

async function fetchRots() {
  const res = await fetch("https://indieun.com/cab/rots", {
    headers: { Accept: "application/json" },
    cache: "no-store",
  });
  if (!res.ok) throw new Error(`Failed to fetch rots: ${res.status}`);
  const data = (await res.json()) as { Data: Record<string, Species> };
  return Object.entries(data.Data);
}

async function fetchBag() {
  const res = await fetch("https://indieun.com/cab/bag", {
    headers: { Accept: "application/json" },
    cache: "no-store",
  });
  if (!res.ok) throw new Error(`Failed to fetch bag: ${res.status}`);
  const data = (await res.json()) as { Data: Record<string, { Name: string; Description: string; Icon: string }> };
  return Object.entries(data.Data);
}

async function fetchSkins() {
  const res = await fetch("https://indieun.com/cab/skins", {
    headers: { Accept: "application/json" },
    cache: "no-store",
  });
  if (!res.ok) throw new Error(`Failed to fetch skins: ${res.status}`);
  const data = (await res.json()) as { Data: Record<string, { Name: string; Description: string; Icon: string; Speed: number }> };
  return Object.entries(data.Data);
}

const MOVESET_META: Array<{ name: string; energy: number; type: string; demonExclusive: boolean }> = [
  { name: "Charge", energy: 0, type: "utility", demonExclusive: false },
  { name: "Shoot", energy: 2, type: "damage", demonExclusive: false },
  { name: "Shield", energy: 2, type: "healing", demonExclusive: false },
  { name: "Heal", energy: 2, type: "healing", demonExclusive: false },
  { name: "Splash", energy: 2, type: "utility", demonExclusive: false },
  { name: "Feathers", energy: 2, type: "utility", demonExclusive: false },
  { name: "Trident", energy: 2, type: "damage", demonExclusive: false },
  { name: "Zap", energy: 3, type: "damage", demonExclusive: true },
  { name: "Wheel Attack", energy: 3, type: "damage", demonExclusive: false },
  { name: "MrBeast", energy: 3, type: "damage", demonExclusive: false },
  { name: "Fry", energy: 3, type: "damage", demonExclusive: false },
  { name: "Sword", energy: 3, type: "damage", demonExclusive: false },
  { name: "Bite", energy: 3, type: "damage", demonExclusive: false },
  { name: "Bats", energy: 3, type: "damage", demonExclusive: true },
  { name: "Fire Blast", energy: 4, type: "damage", demonExclusive: true },
  { name: "Firework", energy: 4, type: "damage", demonExclusive: true },
  { name: "Bomb", energy: 4, type: "damage", demonExclusive: true },
  { name: "Match", energy: 4, type: "utility", demonExclusive: true },
  { name: "Grow A Garden", energy: 5, type: "healing", demonExclusive: true },
  { name: "Arm", energy: 5, type: "damage", demonExclusive: true },
  { name: "Whirlpool", energy: 6, type: "damage", demonExclusive: true },
];

function getDemand(rarity: number): string {
  if (rarity >= 5) return "high";
  if (rarity >= 4) return "medium";
  if (rarity >= 3) return "low";
  return "very-low";
}

async function main() {
  console.log("Seeding local database...");

  // Clear existing data
  await prisma.species.deleteMany();
  await prisma.bagItem.deleteMany();
  await prisma.moveset.deleteMany();
  await prisma.hoverboard.deleteMany();

  // Seed species (brainrots)
  console.log("Seeding species...");
  const speciesEntries = await fetchRots();
  for (const [name, sp] of speciesEntries) {
    await prisma.species.create({
      data: {
        name,
        fullName: sp.FullName,
        shortenedName: sp.ShortenedName,
        icon: sp.Icon,
        attack: sp.Attack,
        health: sp.Health,
        speed: sp.Speed,
        rarity: sp.Rarity,
        isExclusive: sp.IsExclusive,
        exists: sp.Exists ?? undefined,
        spawnWorld: sp.SpawnLocation?.World ?? undefined,
        spawnZone: sp.SpawnLocation?.Zone ?? undefined,
        demand: getDemand(sp.Rarity),
      },
    });
  }
  console.log(`Seeded ${speciesEntries.length} species`);

  // Seed bag items
  console.log("Seeding bag items...");
  const bagEntries = await fetchBag();
  for (const [name, info] of bagEntries) {
    await prisma.bagItem.create({
      data: {
        name,
        description: info.Description,
        icon: info.Icon,
        demand: "medium",
      },
    });
  }
  console.log(`Seeded ${bagEntries.length} bag items`);

  // Seed movesets
  console.log("Seeding movesets...");
  for (const move of MOVESET_META) {
    await prisma.moveset.create({
      data: {
        name: move.name,
        energy: move.energy,
        type: move.type,
        demonExclusive: move.demonExclusive,
      },
    });
  }
  console.log(`Seeded ${MOVESET_META.length} movesets`);

  // Seed hoverboards (skins)
  console.log("Seeding hoverboards...");
  const skinEntries = await fetchSkins();
  for (const [name, info] of skinEntries) {
    const speed = info.Speed;
    const demand = speed >= 20 ? "high" : speed >= 15 ? "medium" : speed >= 10 ? "low" : "very-low";
    await prisma.hoverboard.create({
      data: {
        name,
        description: info.Description,
        icon: info.Icon,
        speed,
        demand,
      },
    });
  }
  console.log(`Seeded ${skinEntries.length} hoverboards`);

  // Seed news posts
  console.log("Seeding news posts...");
  const newsPosts = [
    {
      title: "Trading calculator, values list, inventory viewer & more",
      description:
        "Hey everyone, I have developed a server official catch a brainrot rotdex site. You can find the site here: https://cab.devvyy.xyz/",
      category: "news",
      channel: "#announcements",
      date: "2025-01-15",
      icon: "📢",
      gradient: "linear-gradient(135deg, #fbbf24, #f59e0b)",
      border: "#1e3a5f",
    },
    {
      title: "New Rotdex Features Released",
      description:
        "Added trade sharing, recent trades page, and damage calculator to the site.",
      category: "updates",
      channel: "#updates",
      date: "2025-02-01",
      icon: "🛠️",
      gradient: "linear-gradient(135deg, #60a5fa, #3b82f6)",
      border: "#1e3a5f",
    },
    {
      title: "Upcoming Event Rot Leaked",
      description:
        "A new limited event rot has been datamined from the game files. Stay tuned for official reveal.",
      category: "leaks",
      channel: "#leaks",
      date: "2025-02-10",
      icon: "🕵️",
      gradient: "linear-gradient(135deg, #f472b6, #ec4899)",
      border: "#1e3a5f",
    },
    {
      title: "Values List Updated",
      description:
        "Updated trading values to be more accurate with in-game trades and demand.",
      category: "updates",
      channel: "#updates",
      date: "2025-02-15",
      icon: "📊",
      gradient: "linear-gradient(135deg, #34d399, #10b981)",
      border: "#1e3a5f",
    },
    {
      title: "New Moveset Teaser",
      description:
        "Unreleased moveset icons found in the latest game patch. Looks like a fire-type AOE move.",
      category: "leaks",
      channel: "#leaks",
      date: "2025-02-20",
      icon: "🔥",
      gradient: "linear-gradient(135deg, #fb923c, #ea580c)",
      border: "#1e3a5f",
    },
  ];
  for (const post of newsPosts) {
    await prisma.newsPost.create({ data: post });
  }
  console.log(`Seeded ${newsPosts.length} news posts`);

  console.log("Seeding complete!");
}

main()
  .catch((e) => {
    console.error("Seeding failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
