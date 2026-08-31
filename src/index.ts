import { countdownPage, homePage, notFoundPage, type CountdownData } from "./templates";
import {
  generateId,
  isValidHexColor,
  isValidIsoDate,
  normalizeHexColor,
} from "./utils";

export interface Env {
  COUNTDOWNS: KVNamespace;
}

const MAX_TEXT_LENGTH = 200;

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json; charset=utf-8" },
  });
}

function htmlResponse(html: string, status = 200): Response {
  return new Response(html, {
    status,
    headers: { "content-type": "text/html; charset=utf-8" },
  });
}

async function handleCreateCountdown(request: Request, env: Env): Promise<Response> {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return jsonResponse({ error: "Ungültiger JSON-Body." }, 400);
  }

  if (typeof body !== "object" || body === null) {
    return jsonResponse({ error: "Ungültiger JSON-Body." }, 400);
  }

  const { targetDateTime, text, color } = body as Record<string, unknown>;

  if (typeof targetDateTime !== "string" || !isValidIsoDate(targetDateTime)) {
    return jsonResponse({ error: "Ungültiges Zieldatum." }, 400);
  }

  if (typeof text !== "string" || text.trim().length === 0) {
    return jsonResponse({ error: "Bitte einen Text angeben." }, 400);
  }
  if (text.length > MAX_TEXT_LENGTH) {
    return jsonResponse({ error: `Text darf maximal ${MAX_TEXT_LENGTH} Zeichen lang sein.` }, 400);
  }

  if (typeof color !== "string" || !isValidHexColor(color)) {
    return jsonResponse({ error: "Ungültige Hintergrundfarbe." }, 400);
  }

  const data: CountdownData = {
    targetDateTime: new Date(targetDateTime).toISOString(),
    text: text.trim(),
    color: normalizeHexColor(color),
    createdAt: new Date().toISOString(),
  };

  let id = generateId();
  for (let attempt = 0; attempt < 5; attempt++) {
    const existing = await env.COUNTDOWNS.get(id);
    if (!existing) break;
    id = generateId();
  }

  await env.COUNTDOWNS.put(id, JSON.stringify(data));

  return jsonResponse({ id, url: `/c/${id}` }, 201);
}

async function handleGetCountdown(id: string, env: Env): Promise<Response> {
  const raw = await env.COUNTDOWNS.get(id);
  if (!raw) {
    return htmlResponse(notFoundPage(), 404);
  }

  const data = JSON.parse(raw) as CountdownData;
  return htmlResponse(countdownPage(data));
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    const { pathname } = url;

    if (pathname === "/" && request.method === "GET") {
      return htmlResponse(homePage());
    }

    if (pathname === "/api/countdowns" && request.method === "POST") {
      return handleCreateCountdown(request, env);
    }

    const countdownMatch = pathname.match(/^\/c\/([a-zA-Z0-9]+)$/);
    if (countdownMatch && request.method === "GET") {
      return handleGetCountdown(countdownMatch[1], env);
    }

    return htmlResponse(notFoundPage(), 404);
  },
};
