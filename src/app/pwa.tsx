/**
 * Installable app: the service worker (production builds only) keeps the app
 * shell, cards, captions and lessons available offline; the install button
 * appears only when the browser offers installation, or shows how on iPhone.
 */
import { useEffect, useState, useSyncExternalStore } from "react";
import { Download, Share } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Dialog } from "@/components/ui/Dialog";

interface InstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

let deferred: InstallPromptEvent | null = null;
const listeners = new Set<() => void>();
const notify = () => listeners.forEach((listener) => listener());

if (typeof window !== "undefined") {
  window.addEventListener("beforeinstallprompt", (event) => {
    event.preventDefault();
    deferred = event as InstallPromptEvent;
    notify();
  });
  window.addEventListener("appinstalled", () => {
    deferred = null;
    notify();
  });
}

export function registerServiceWorker() {
  // Only the site at the root installs; a copy under a sub-path (the signer
  // the Parlance phone app embeds) must not control the pages above it.
  if (!import.meta.env.PROD || import.meta.env.BASE_URL !== "/" || !("serviceWorker" in navigator)) return;
  window.addEventListener("load", () => {
    void navigator.serviceWorker.register("/sw.js").catch(() => {});
  });
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

const standalone = () =>
  typeof window !== "undefined" &&
  (window.matchMedia("(display-mode: standalone)").matches || (navigator as Navigator & { standalone?: boolean }).standalone === true);

const isIos = () => typeof navigator !== "undefined" && /iphone|ipad|ipod/i.test(navigator.userAgent);

/** "prompt" when the browser can install, "ios" for Safari's manual steps, null when installed or unavailable. */
export function useInstall(): { mode: "prompt" | "ios" | null; install: () => Promise<void> } {
  const available = useSyncExternalStore(subscribe, () => deferred !== null, () => false);
  const [installed, setInstalled] = useState(standalone);
  useEffect(() => {
    const query = window.matchMedia("(display-mode: standalone)");
    const update = () => setInstalled(standalone());
    query.addEventListener("change", update);
    return () => query.removeEventListener("change", update);
  }, []);
  const mode = installed ? null : available ? "prompt" : isIos() ? "ios" : null;
  const install = async () => {
    if (!deferred) return;
    await deferred.prompt();
    await deferred.userChoice.catch(() => null);
    deferred = null;
    notify();
  };
  return { mode, install };
}

export function InstallAppButton({ variant = "secondary" }: { variant?: "secondary" | "primary" | "inverse" }) {
  const { mode, install } = useInstall();
  const [help, setHelp] = useState(false);
  if (!mode) return null;
  return (
    <>
      <Button variant={variant} onClick={() => (mode === "prompt" ? void install() : setHelp(true))} leading={<Download aria-hidden />}>
        Install app
      </Button>
      <Dialog open={help} onClose={() => setHelp(false)} title="Add Parlance to your home screen">
        <ol className="grid gap-3 pb-5 text-[0.9375rem] leading-6 text-ink-2">
          <li className="flex gap-3">
            <span className="inline-flex size-7 shrink-0 items-center justify-center rounded-full bg-sun-400 text-sm font-bold text-navy">1</span>
            <span>
              In Safari, tap the Share button <Share className="inline size-4 align-[-2px]" aria-label="Share" />.
            </span>
          </li>
          <li className="flex gap-3">
            <span className="inline-flex size-7 shrink-0 items-center justify-center rounded-full bg-sun-400 text-sm font-bold text-navy">2</span>
            <span>Choose <strong className="font-bold text-navy">Add to Home Screen</strong>, then Add.</span>
          </li>
          <li className="flex gap-3">
            <span className="inline-flex size-7 shrink-0 items-center justify-center rounded-full bg-sun-400 text-sm font-bold text-navy">3</span>
            <span>Open Parlance from its icon. Cards and captions then open even without signal.</span>
          </li>
        </ol>
      </Dialog>
    </>
  );
}
