import { treaty } from "@elysiajs/eden";
import type { App } from "@/app/api/[[...slugs]]/route";

const baseUrl = process.env.NEXT_PUBLIC_APP_URL;

if (!baseUrl) {
  throw new Error("NEXT_PUBLIC_APP_URL is not set");
}

export const client = treaty<App>(baseUrl).api;
