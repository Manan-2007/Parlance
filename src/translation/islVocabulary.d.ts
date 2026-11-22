export const SUPPORTED_TOKENS: readonly string[];
export function readableSignLabel(token: string): string;
export function playbackKind(token: string): 'word' | 'number' | 'fingerspelling';
export function sanitizeTokens(input: unknown): string[];
