// Browser-side fetch wrappers for the agent API routes.
// KEY SAFETY: this file runs in the browser. It ONLY calls /api/* routes and must never
// import @anthropic-ai/sdk or read ANTHROPIC_API_KEY.
//
// With ?demo=1 in the page URL, the wrappers return the hand-written fixtures in
// public/demo/ after a fake delay, so the live feed still animates with no API key.

import type {
  CaseInput,
  ClerkResponse,
  CourtroomResponse,
  FileInput,
  InspectorResponse,
  LineItem,
  PhotoPair,
  Ruling,
} from "./types";

// ---- Request bodies for each route (shared with app/api/*) ----
export type ClerkRequest = CaseInput;
export interface CourtroomRequest { items: LineItem[]; tenancyMonths: number; moveOutDate: string }
export interface InspectorRequest {
  lineItem: Pick<LineItem, "id" | "description" | "amount">;
  tenancyMonths: number;
  moveIn: FileInput;
  moveOut: FileInput;
}

/**
 * /api/courtroom streams newline-delimited JSON (one object per line) so the UI can
 * show each argument and ruling the moment it exists. The last line is "done".
 */
export type CourtroomStreamEvent =
  | { type: "argument"; side: "landlord" | "tenant"; lineItemId: string; argument: string }
  | { type: "ruling"; ruling: Ruling }
  | { type: "done"; rulings: Ruling[] }
  | { type: "error"; message: string };

/** True when the page URL has ?demo=1. Always false on the server. */
export function isDemo(): boolean {
  if (typeof window === "undefined") return false;
  return new URLSearchParams(window.location.search).get("demo") === "1";
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

async function fixture<T>(name: string, delayMs: number): Promise<T> {
  await sleep(delayMs);
  const res = await fetch(`/demo/${name}.json`);
  if (!res.ok) throw new Error(`Missing fixture ${name}.json`);
  return res.json() as Promise<T>;
}

async function post<T>(path: string, body: unknown): Promise<T> {
  const res = await fetch(path, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`${path} failed: ${res.status} ${await res.text().catch(() => "")}`);
  if (res.headers.get("x-demo-fallback") === "1") console.warn(`${path} returned the demo fixture (fallback)`);
  return res.json() as Promise<T>;
}

// ---------- agents ----------

export async function clerk(input: ClerkRequest): Promise<ClerkResponse> {
  if (isDemo()) return fixture<ClerkResponse>("clerk", 2500);
  return post<ClerkResponse>("/api/clerk", input);
}

/**
 * Runs the courtroom. `onUpdate` fires for every argument/ruling as it arrives.
 * Resolves with the final rulings.
 */
export async function courtroom(
  req: CourtroomRequest,
  onUpdate: (e: CourtroomStreamEvent) => void = () => {},
): Promise<CourtroomResponse> {
  const ids = new Set(req.items.map((i) => i.id));

  if (isDemo()) {
    // Replay the fixture over ~3s: arguments first, then rulings.
    const all = await fixture<CourtroomResponse>("courtroom", 600);
    const rulings = all.rulings.filter((r) => ids.has(r.lineItemId));
    for (const r of rulings) {
      await sleep(500);
      onUpdate({ type: "argument", side: "landlord", lineItemId: r.lineItemId, argument: r.landlordArgument });
      onUpdate({ type: "argument", side: "tenant", lineItemId: r.lineItemId, argument: r.tenantArgument });
    }
    for (const r of rulings) {
      await sleep(600);
      onUpdate({ type: "ruling", ruling: r });
    }
    return { rulings };
  }

  const res = await fetch("/api/courtroom", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(req),
  });
  if (!res.ok || !res.body) throw new Error(`/api/courtroom failed: ${res.status}`);

  // Read the NDJSON stream line by line.
  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  const out: { rulings: Ruling[] | null } = { rulings: null }; // set by the "done" line
  const handle = (line: string) => {
    if (!line.trim()) return;
    const e = JSON.parse(line) as CourtroomStreamEvent;
    if (e.type === "error") throw new Error(e.message);
    if (e.type === "done") out.rulings = e.rulings;
    else onUpdate(e);
  };
  for (;;) {
    const { value, done } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split("\n");
    buffer = lines.pop() ?? "";
    lines.forEach(handle);
  }
  handle(buffer);
  if (!out.rulings) throw new Error("/api/courtroom ended without rulings");
  return { rulings: out.rulings };
}

export async function inspector(req: InspectorRequest): Promise<InspectorResponse> {
  if (isDemo()) {
    const f = await fixture<InspectorResponse>("inspector", 2000);
    return { ...f, lineItemId: req.lineItem.id };
  }
  return post<InspectorResponse>("/api/inspector", req);
}

// ---------- sample files for "Use sample" buttons ----------

/** Fetch a file from /public and return it as base64 (no data: prefix). */
async function loadFile(url: string, mediaType: FileInput["mediaType"]): Promise<FileInput> {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Couldn't load ${url}`);
  const bytes = new Uint8Array(await res.arrayBuffer());
  let binary = "";
  const CHUNK = 0x8000; // avoid call-stack limits on big files
  for (let i = 0; i < bytes.length; i += CHUNK) {
    binary += String.fromCharCode(...bytes.subarray(i, i + CHUNK));
  }
  return { mediaType, data: btoa(binary) };
}

export async function loadSampleStatement(): Promise<FileInput> {
  return loadFile("/demo/statement.jpg", "image/jpeg");
}

export async function loadSamplePhotos(): Promise<PhotoPair> {
  const [moveIn, moveOut] = await Promise.all([
    loadFile("/demo/wall-movein.jpg", "image/jpeg"),
    loadFile("/demo/wall-moveout.jpg", "image/jpeg"),
  ]);
  return { moveIn, moveOut };
}
