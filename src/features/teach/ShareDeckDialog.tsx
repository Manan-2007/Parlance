import { useEffect, useState } from "react";
import { Copy, Download } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Dialog } from "@/components/ui/Dialog";
import { toast } from "@/components/ui/Toaster";
import type { Deck } from "@/learn/decks";
import { deckLink, downloadDeck, LONG_LINK } from "./deckFiles";

export function ShareDeckDialog({ deck, open, onClose }: { deck: Deck; open: boolean; onClose: () => void }) {
  const [link, setLink] = useState<string | null>(null);
  useEffect(() => {
    if (!open) return;
    let live = true;
    setLink(null);
    void deckLink(deck).then((value) => live && setLink(value));
    return () => {
      live = false;
    };
  }, [deck, open]);

  const copy = async () => {
    if (!link) return;
    try {
      await navigator.clipboard.writeText(link);
      toast("Link copied");
    } catch {
      toast("Couldn't copy: select the link and copy it");
    }
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title="Share this deck"
      description="Anyone with the link can open the deck in Parlance and save it. The deck travels inside the link itself; Parlance has no server that stores it."
      footer={
        <>
          <Button variant="secondary" onClick={() => downloadDeck(deck)} leading={<Download aria-hidden />}>
            Download file
          </Button>
          <Button onClick={copy} disabled={!link} leading={<Copy aria-hidden />}>
            Copy link
          </Button>
        </>
      }
    >
      <label className="block">
        <span className="sr-only">Deck link</span>
        <input readOnly value={link ?? "Preparing…"} onFocus={(e) => e.currentTarget.select()} className="h-11 w-full rounded-md border border-line-strong bg-subtle px-3 text-sm text-ink-2" />
      </label>
      {link && (
        <p className="mt-2 text-xs leading-5 text-ink-3">
          {link.length > LONG_LINK
            ? `This link is long (${Math.round(link.length / 1000)} k characters) because it carries ${deck.signs.length} recording${deck.signs.length === 1 ? "" : "s"}. Some chat apps cut long links: send the file instead.`
            : `${link.length} characters.`}{" "}
          Recordings in the deck are shared with everyone who opens it.
        </p>
      )}
    </Dialog>
  );
}
