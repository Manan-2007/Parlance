// Application-level limits for the public AI routes. Everything is in memory,
// per server instance: there is no shared store, so on a multi-instance host
// each instance enforces its own budget. That still bounds what one client, or
// one burst, can spend through a single instance.
export class BodyTooLargeError extends Error {
    constructor() {
        super('Request body is too large.');
        this.name = 'BodyTooLargeError';
    }
}
/**
 * Reads at most `maxBytes` of the body, rejecting a larger declared or actual
 * size before the rest is buffered or parsed.
 */
export async function readBodyText(request, maxBytes) {
    const declared = Number(request.headers.get('content-length'));
    if (Number.isFinite(declared) && declared > maxBytes)
        throw new BodyTooLargeError();
    if (!request.body)
        return '';
    const reader = request.body.getReader();
    const chunks = [];
    let size = 0;
    for (;;) {
        const { done, value } = await reader.read();
        if (done)
            break;
        size += value.byteLength;
        if (size > maxBytes) {
            await reader.cancel().catch(() => { });
            throw new BodyTooLargeError();
        }
        chunks.push(value);
    }
    const bytes = new Uint8Array(size);
    let offset = 0;
    for (const chunk of chunks) {
        bytes.set(chunk, offset);
        offset += chunk.byteLength;
    }
    return new TextDecoder().decode(bytes);
}
/** Fixed-window request counter per key, with a bounded number of tracked keys. */
export function createRateLimiter({ limit, windowMs, maxKeys = 5000 }) {
    const windows = new Map();
    return (key, now = Date.now()) => {
        let entry = windows.get(key);
        if (!entry || now >= entry.resetAt) {
            if (!entry && windows.size >= maxKeys) {
                for (const [tracked, value] of windows)
                    if (now >= value.resetAt)
                        windows.delete(tracked);
                // Too many distinct clients at once: refuse rather than grow without bound.
                if (windows.size >= maxKeys)
                    return { allowed: false, retryAfterSeconds: Math.ceil(windowMs / 1000) };
            }
            entry = { count: 0, resetAt: now + windowMs };
            windows.set(key, entry);
        }
        if (entry.count >= limit)
            return { allowed: false, retryAfterSeconds: Math.max(1, Math.ceil((entry.resetAt - now) / 1000)) };
        entry.count += 1;
        return { allowed: true };
    };
}
/** Caps how many provider calls run at once; `acquire` returns a release function or null. */
export function createConcurrencyLimit(max) {
    let active = 0;
    return {
        acquire() {
            if (active >= max)
                return null;
            active += 1;
            let released = false;
            return () => { if (!released) {
                released = true;
                active -= 1;
            } };
        },
        get active() { return active; },
    };
}
