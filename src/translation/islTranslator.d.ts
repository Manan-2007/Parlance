export interface GlossTranslation {
  tokens: string[];
  glossText: string;
  mode: "online" | "offline";
  skipped?: string[];
}
export function translateOffline(text: string): GlossTranslation;
export function translateToGloss(text: string, signal?: AbortSignal): Promise<GlossTranslation>;
