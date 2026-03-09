import { treaty } from "@elysiajs/eden";
import type { App } from "@/app/api/[[...slugs]]/route";

const url =
  process.env.NODE_ENV !== "production"
    ? "localhost:3000"
    : window.location.href;

export const client = treaty<App>(url).api;
