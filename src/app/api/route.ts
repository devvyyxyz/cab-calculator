import { NextRequest, NextResponse } from "next/server";

const DOCS = `# CAB: Rot Dex API

Base URL: \`https://cab.devvyy.xyz/api\`

All endpoints return JSON unless noted. Most data is proxied from \`https://indieun.com/cab\` with 1-hour caching.

---

## Game Data

### \`GET /cab/rots\`
Returns all brainrot species.

### \`GET /cab/bag\`
Returns all bag items.

### \`GET /cab/skins\`
Returns all hoverboard skins.

### \`GET /cab/movesets\`
Returns all movesets.

### \`GET /cab/icons/:filename\`
Returns an icon PNG image. Example: \`/cab/icons/80.png\`

---

## News

### \`GET /news\`
Returns all news posts. Supports query params: \`?category=news\`, \`?category=updates\`, \`?category=leaks\`

### \`POST /news\`
Create a news post (requires auth).

### \`GET /news/:id\`
Returns a single news post.

### \`PATCH /news/:id\`
Update a news post (requires auth).

### \`DELETE /news/:id\`
Delete a news post (requires auth).

---

## Roblox

### \`GET /roblox/avatar?userId=:id\`
Returns a Roblox user's avatar URL.

### \`GET /roblox/user?username=:name\`
Returns Roblox user info by username.

---

## Share

### \`POST /share\`
Create a trade share. Returns a share ID.

### \`GET /share/:id/image\`
Returns a PNG image of the trade share card.

---

## Transactions

### \`GET /transactions\`
Returns transaction history (requires auth).

---

## Notes

- Icons are served via \`/api/cab/icons/:filename\`
- All \`/api/cab/*\` routes are cached for 1 hour
- News CRUD endpoints are restricted to non-production environments
`;

export async function GET(_req: NextRequest) {
  return new NextResponse(DOCS, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "no-store",
    },
  });
}
