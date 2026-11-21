import type { IncomingMessage, ServerResponse } from "node:http";
export function signVideoApi(request: IncomingMessage, response: ServerResponse, next: () => void): void;
