/**
 * Learn's sign player alone, for the Parlance phone app's lessons:
 * /embed/learn?sign=hello shows one ISLRTC sign (signer, 3D guide, official
 * video); /embed/learn?signs=i,deaf plays a phrase. No header or navigation.
 */
import { useSearchParams } from "react-router-dom";
import { useDocumentTitle } from "@/hooks/useDocumentTitle";
import { ReferencePlayer } from "@/features/learn/ReferencePlayer";
import { SignViewer } from "@/features/learn/SignViewer";

const GLOSS = /^[a-z0-9]{1,40}$/;

export function EmbedLearnPage() {
  useDocumentTitle("Sign");
  const [params] = useSearchParams();
  const sign = (params.get("sign") ?? "").trim().toLowerCase();
  const signs = (params.get("signs") ?? "").split(",").map((s) => s.trim().toLowerCase()).filter((s) => GLOSS.test(s)).slice(0, 24);
  return (
    <main className="min-h-dvh bg-canvas p-3">
      {GLOSS.test(sign) ? (
        <SignViewer gloss={sign} compact preferAvatar />
      ) : signs.length ? (
        <ReferencePlayer glosses={signs} label={`The ISLRTC signer signing ${signs.join(" ")}`} caption={(g) => g.toUpperCase()} compact />
      ) : (
        <p className="p-6 text-center text-ink-3">Nothing to show.</p>
      )}
    </main>
  );
}
