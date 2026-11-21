/**
 * A tiny key-value store on IndexedDB, shaped like zustand's StateStorage.
 * Used for data too large for localStorage (sign recordings, decks). Falls back
 * to localStorage, then to memory, when IndexedDB is unavailable (some private
 * windows): the app keeps working, it just may not remember.
 */
import type { StateStorage } from "zustand/middleware";

const DB = "parlance";
const STORE = "kv";

let dbPromise: Promise<IDBDatabase | null> | null = null;

function open(): Promise<IDBDatabase | null> {
  dbPromise ??= new Promise((resolve) => {
    try {
      if (typeof indexedDB === "undefined") return resolve(null);
      const request = indexedDB.open(DB, 1);
      request.onupgradeneeded = () => request.result.createObjectStore(STORE);
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => resolve(null);
      request.onblocked = () => resolve(null);
    } catch {
      resolve(null);
    }
  });
  return dbPromise;
}

const memory = new Map<string, string>();

function fallbackGet(key: string): string | null {
  try {
    return window.localStorage.getItem(key);
  } catch {
    return memory.get(key) ?? null;
  }
}

function fallbackSet(key: string, value: string): void {
  try {
    window.localStorage.setItem(key, value);
  } catch {
    memory.set(key, value);
  }
}

function run<T>(mode: IDBTransactionMode, action: (store: IDBObjectStore) => IDBRequest<T>): Promise<T | undefined> {
  return open().then(
    (db) =>
      new Promise<T | undefined>((resolve, reject) => {
        if (!db) return reject(new Error("no indexeddb"));
        const tx = db.transaction(STORE, mode);
        const request = action(tx.objectStore(STORE));
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
      }),
  );
}

export const idbStorage: StateStorage = {
  getItem: (key) => run<string>("readonly", (s) => s.get(key) as IDBRequest<string>).then((v) => v ?? null, () => fallbackGet(key)),
  setItem: (key, value) => run("readwrite", (s) => s.put(value, key)).then(() => undefined, () => fallbackSet(key, value)),
  removeItem: (key) =>
    run("readwrite", (s) => s.delete(key)).then(
      () => undefined,
      () => {
        memory.delete(key);
        try {
          window.localStorage.removeItem(key);
        } catch {
          /* ignore */
        }
      },
    ),
};
