/**
 * The 3D signer alone, for the Parlance phone app ("See it in sign"): it opens
 * /embed/sign?text=… in a web view and the signer plays the text in ISL.
 * No header, no navigation, nothing else on the page.
 */
import { lazy, Suspense } from "react";
import { useSearchParams } from "react-router-dom";
import { useDocumentTitle } from "@/hooks/useDocumentTitle";
import { avatarTokenFor } from "@/learn/lessonPlan";
import { sanitizeTokens } from "@/translation/islVocabulary.js";

const SignReply = lazy(() => import("@/features/cards/SignReply"));

export function EmbedSignPage() {
  useDocumentTitle("Signer");
  const [params] = useSearchParams();
  const text = (params.get("text") ?? "").slice(0, 600).trim();
  // ?glosses=i,deaf plays those ISLRTC signs in order (a Learn phrase), when
  // the avatar has every one; otherwise the text is translated as usual.
  const glosses = (params.get("glosses") ?? "").split(",").map((g) => g.trim().toLowerCase()).filter(Boolean).slice(0, 12);
  const mapped = glosses.map((g) => avatarTokenFor(g));
  // ?tokens=HELLO,YOU,HOW plays avatar tokens already translated by the app's
  // online (AI) translation; anything unknown is dropped.
  const given = sanitizeTokens((params.get("tokens") ?? "").split(",").slice(0, 40));
  const tokens = given.length ? given : glosses.length && mapped.every(Boolean) ? (mapped as string[]) : undefined;
  return (
    <main className="flex h-dvh flex-col bg-canvas p-2">
      {text || tokens ? (
        <Suspense fallback={<p className="m-auto text-ink-3">Loading the signer…</p>}>
          <div className="min-h-0 flex-1">
            <SignReply text={text} tokens={tokens} />
          </div>
        </Suspense>
      ) : (
        <p className="m-auto text-ink-3">Nothing to sign.</p>
      )}
    </main>
  );
}
