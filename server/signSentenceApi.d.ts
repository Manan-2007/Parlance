import type { IncomingMessage, ServerResponse } from "node:http";
export function signSentenceApi(request: IncomingMessage, response: ServerResponse, next: () => void): void;
