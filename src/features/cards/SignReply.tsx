/**
 * The 3D signer performing one reply. Loaded only when someone asks to see a
 * reply in sign, so the cards themselves stay light and work offline.
 */
import { useEffect, useState } from "react";
import type { PlayerState, QueueItem, SignPlayer } from "@/avatar/playback";
import { useSignQueue } from "@/services/signs/useSignQueue";
import { SignerStage } from "@/features/speech-to-sign/SignerStage";
import { playbackKind, readableSignLabel } from "@/translation/islVocabulary.js";

const IDLE: PlayerState = { index: 0, progress: 0, playing: false, finished: false, transitioning: false };

/** Plays [text] after translating it, or exact avatar [tokens] when given. */
export default function SignReply({ text, tokens }: { text: string; tokens?: readonly string[] }) {
  const signs = useSignQueue();
  const [queue, setQueue] = useState<QueueItem[]>([]);
  const [player, setPlayer] = useState<SignPlayer | null>(null);
  const [state, setState] = useState<PlayerState>(IDLE);
  const { translate } = signs;

  const tokenKey = tokens?.join(" ");
  useEffect(() => {
    let live = true;
    if (tokenKey) {
      setState(IDLE);
      setQueue(tokenKey.split(" ").map((gloss) => ({ gloss, label: readableSignLabel(gloss), missing: false, kind: playbackKind(gloss) })));
      return;
    }
    void translate(text).then((result) => {
      if (!live || !result) return;
      setState(IDLE);
      setQueue([...result.queue]);
    });
    return () => {
      live = false;
    };
  }, [text, tokenKey, translate]);

  return (
    <div className="h-full min-h-[22rem] overflow-hidden rounded-[2rem]">
      <SignerStage queue={queue} loading={signs.status === "loading"} state={state} onState={setState} player={player} onPlayer={setPlayer} />
    </div>
  );
}
