/**
 * JSON <-> compact URL-safe text (deflate-raw + base64url), for sharing decks
 * and sign reviews inside a link's #fragment or a file, with no server.
 */
import { base64UrlToBytes, bytesToBase64Url } from "./recordings.ts";

async function pipe(bytes: Uint8Array, stream: CompressionStream | DecompressionStream): Promise<Uint8Array> {
  const body = new Blob([bytes as BlobPart]).stream().pipeThrough(stream);
  return new Uint8Array(await new Response(body).arrayBuffer());
}

/** Stop expanding shared input before it can allocate an unbounded result. */
export async function readBounded(stream: ReadableStream<Uint8Array>, limit: number): Promise<Uint8Array> {
  const reader = stream.getReader();
  const chunks: Uint8Array[] = [];
  let length = 0;
  try {
    while (true) {
      const { value, done } = await reader.read();
      if (done) break;
      length += value.byteLength;
      if (length > limit) throw new Error("Shared data is too large");
      chunks.push(value);
    }
  } catch (error) {
    await reader.cancel().catch(() => {});
    throw error;
  } finally {
    reader.releaseLock();
  }
  const bytes = new Uint8Array(length);
  let offset = 0;
  for (const chunk of chunks) { bytes.set(chunk, offset); offset += chunk.length; }
  return bytes;
}

export async function packJson(value: unknown): Promise<string> {
  return bytesToBase64Url(await pipe(new TextEncoder().encode(JSON.stringify(value)), new CompressionStream("deflate-raw")));
}

/** Parsed JSON, or undefined for anything that is not valid packed text. */
export async function unpackJson(text: string): Promise<unknown> {
  try {
    if (!text || !/^[A-Za-z0-9_-]+$/.test(text) || text.length > 2_000_000) return undefined;
    const compressed = base64UrlToBytes(text);
    const stream = new Blob([compressed as BlobPart]).stream().pipeThrough(new DecompressionStream("deflate-raw"));
    const bytes = await readBounded(stream, 4_000_000);
    return JSON.parse(new TextDecoder().decode(bytes));
  } catch {
    return undefined;
  }
}
