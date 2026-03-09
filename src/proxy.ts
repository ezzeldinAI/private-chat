import { randomBytes } from "node:crypto";
import { type NextRequest, NextResponse } from "next/server";
import { redis } from "./lib/redis";

const PATHNAME_REGEX = /^\/room\/([^/]+)$/;

// Atomically checks slot availability and adds the token in one Redis round-trip.
// Returns: 'joined' | 'full' | 'not-found'
const JOIN_SCRIPT = `
local connected_raw = redis.call('HGET', KEYS[1], 'connected')
if not connected_raw then
  return 'not-found'
end
local connected = cjson.decode(connected_raw)
if #connected >= tonumber(ARGV[2]) then
  return 'full'
end
table.insert(connected, ARGV[1])
redis.call('HSET', KEYS[1], 'connected', cjson.encode(connected))
return 'joined'
`;

export const proxy = async (req: NextRequest) => {
  const pathname = req.nextUrl.pathname;

  const roomMatch = pathname.match(PATHNAME_REGEX);
  if (!roomMatch) {
    return NextResponse.redirect(new URL("/", req.url));
  }

  const roomId = roomMatch[1];

  const meta = await redis.hgetall<{ connected: string[]; createdAt: number }>(
    `meta:${roomId}`
  );

  if (!meta) {
    return NextResponse.redirect(new URL("/?error=room-not-found", req.url));
  }

  const existingToken = req.cookies.get("x-auth-token")?.value;

  // USER IS ALLOWED TO JOIN ROOM
  if (existingToken && meta.connected.includes(existingToken)) {
    return NextResponse.next();
  }

  // ATOMICALLY CHECK SLOT AVAILABILITY AND ADD TOKEN
  const token = randomBytes(32).toString("hex");
  const result = await redis.eval(
    JOIN_SCRIPT,
    [`meta:${roomId}`],
    [token, "2"]
  );

  if (result === "full") {
    return NextResponse.redirect(new URL("/?error=room-full", req.url));
  }

  if (result === "not-found") {
    return NextResponse.redirect(new URL("/?error=room-not-found", req.url));
  }

  const response = NextResponse.next();

  response.cookies.set("x-auth-token", token, {
    path: "/",
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
  });

  return response;
};

export const config = {
  matcher: "/room/:path*",
};
