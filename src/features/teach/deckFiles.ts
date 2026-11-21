import { deckToFile, encodeDeck, type Deck } from "@/learn/decks";

/** Links longer than this may be cut off by chat apps; offer the file instead. */
export const LONG_LINK = 8000;

export async function deckLink(deck: Deck): Promise<string> {
  return `${window.location.origin}/app/learn/deck#${await encodeDeck(deck)}`;
}

export function downloadDeck(deck: Deck): void {
  const blob = new Blob([deckToFile(deck)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `${deck.title.replace(/[^\w\- ]+/g, "").trim().replace(/\s+/g, "-").toLowerCase() || "deck"}.parlance-deck.json`;
  document.body.append(link);
  link.click();
  link.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export function readFile(file: File): Promise<string> {
  return file.size > 4_000_000 ? Promise.reject(new Error("too large")) : file.text();
}
