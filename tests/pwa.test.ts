import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import { runInNewContext } from "node:vm";

const source = readFileSync(new URL("../public/sw.js", import.meta.url), "utf8");
const origin = "https://arcade.example";
const pages = ["/", "/survival", "/runner", "/flappy", "/eggswiper"];

function worker() {
  const listeners = new Map<string, (event: unknown) => void>();
  const stores = new Map<string, Map<string, Response>>();
  let online = true;
  const key = (request: string | { url: string }) => new URL(typeof request === "string" ? request : request.url, origin).href;
  const fetch = async (request: string | { url: string }) => {
    if (!online) throw new TypeError("Offline");
    const path = new URL(key(request)).pathname;
    if (pages.includes(path)) {
      return new Response(`<html>${path}<script src="/_next/static/game.js"></script><link href="/_next/static/game.css" rel="stylesheet"></html>`, { headers: { "content-type": "text/html" } });
    }
    return new Response(path);
  };
  const caches = {
    async open(name: string) {
      if (!stores.has(name)) stores.set(name, new Map());
      const store = stores.get(name)!;
      const cache = {
        async match(request: string | { url: string }) { return store.get(key(request))?.clone(); },
        async put(request: string | { url: string }, response: Response) { store.set(key(request), response.clone()); },
        async add(request: string) { await cache.put(request, await fetch(request)); },
        async addAll(requests: string[]) { await Promise.all(requests.map((request) => cache.add(request))); },
      };
      return cache;
    },
    async keys() { return [...stores.keys()]; },
    async delete(name: string) { return stores.delete(name); },
  };
  runInNewContext(source, {
    self: { location: { origin }, clients: { claim: async () => {} }, addEventListener: (type: string, listener: (event: unknown) => void) => listeners.set(type, listener) },
    caches, fetch, URL, Response,
  });
  async function lifecycle(type: string) {
    const pending: Promise<unknown>[] = [];
    listeners.get(type)!({ waitUntil: (promise: Promise<unknown>) => pending.push(promise) });
    await Promise.all(pending);
  }
  async function request(path: string, mode = "navigate", method = "GET") {
    let response: Promise<Response> | undefined;
    const pending: Promise<unknown>[] = [];
    listeners.get("fetch")!({
      request: { url: key(path), mode, method },
      respondWith: (promise: Promise<Response>) => { response = promise; },
      waitUntil: (promise: Promise<unknown>) => pending.push(promise),
    });
    const result = await response;
    await Promise.all(pending);
    return result;
  }
  return { stores, lifecycle, request, offline: () => { online = false; } };
}

test("PWA downloads every game and its scripts/styles before serving offline", async () => {
  const app = worker();
  await app.lifecycle("install");
  app.offline();
  for (const page of pages) {
    const response = await app.request(page);
    assert.equal(response?.status, 200);
    assert.match(await response!.text(), /<html>/);
  }
  assert.equal(await (await app.request("/_next/static/game.js", "cors"))!.text(), "/_next/static/game.js");
  assert.equal(await (await app.request("/_next/static/game.css", "cors"))!.text(), "/_next/static/game.css");
});

test("PWA shows its fallback for uncached offline navigation", async () => {
  const app = worker();
  await app.lifecycle("install");
  app.offline();
  assert.equal(await (await app.request("/unavailable"))!.text(), "/offline.html");
});

test("PWA does not cache API writes, cross-origin requests, or Next router payloads", async () => {
  const app = worker();
  assert.equal(await app.request("/api/scores", "cors", "POST"), undefined);
  assert.equal(await app.request("https://firebase.example/scores", "cors"), undefined);
  assert.equal(await app.request("/runner?_rsc=123", "cors"), undefined);
});

test("PWA activation removes only outdated arcade caches", async () => {
  const app = worker();
  app.stores.set("twiswua-arcade-old", new Map());
  app.stores.set("unrelated-app", new Map());
  await app.lifecycle("install");
  await app.lifecycle("activate");
  assert.equal(app.stores.has("twiswua-arcade-old"), false);
  assert.equal(app.stores.has("unrelated-app"), true);
  assert.equal(app.stores.has("twiswua-arcade-v1"), true);
});
