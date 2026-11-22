import { Cloud, CloudOff } from "lucide-react";
import { Segmented } from "@/components/ui/Segmented";
import { useSettings, type TranslationMode } from "@/stores/settings";

/**
 * Online (AI, better ISL word order, needs internet) or Offline (instant
 * built-in rules). Shown wherever text becomes signs.
 */
export function TranslationModeSwitch({ disabled = false, note }: { disabled?: boolean; note?: string }) {
  const mode = useSettings((s) => s.translationMode);
  const set = useSettings((s) => s.set);
  return (
    <span className="inline-flex flex-wrap items-center gap-2" title={note}>
      <Segmented<TranslationMode>
        label="Translation mode"
        size="sm"
        value={disabled ? "offline" : mode}
        onChange={(value) => set("translationMode", value)}
        options={[
          { value: "online", label: <><Cloud aria-hidden /> Online</>, disabled, title: "AI translation: better ISL word order, needs internet" },
          { value: "offline", label: <><CloudOff aria-hidden /> Offline</>, title: "Instant built-in rules, works without internet" },
        ]}
      />
      {note && <span className="text-xs text-ink-3">{note}</span>}
    </span>
  );
}
