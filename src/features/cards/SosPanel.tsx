/**
 * Send your location to your emergency contact, using the phone's own SMS,
 * WhatsApp or share sheet. Parlance sends nothing itself: the person still
 * presses Send in their messaging app.
 */
import { useState } from "react";
import { MapPin, MessageCircle, MessageSquareText, Phone, Share2, UserRoundPlus } from "lucide-react";
import { toast } from "@/components/ui/Toaster";
import { cn } from "@/lib/cn";
import { smsLink, sosMessage, whatsappLink, type Position } from "@/lib/visitCard";
import { useCards } from "@/stores/cards";
import { EMERGENCY_NUMBERS } from "./cardData";

function locate(): Promise<Position | null> {
  if (!("geolocation" in navigator)) return Promise.resolve(null);
  return new Promise((resolve) => {
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => resolve({ latitude: coords.latitude, longitude: coords.longitude, accuracy: coords.accuracy }),
      () => resolve(null),
      { enableHighAccuracy: true, timeout: 8000, maximumAge: 60_000 },
    );
  });
}

type Channel = "sms" | "whatsapp" | "share";

export function SosPanel({ onAddContact }: { onAddContact: () => void }) {
  const profile = useCards((s) => s.profile);
  const [busy, setBusy] = useState<Channel | null>(null);
  const hasContact = Boolean(profile.contactPhone.trim());
  const canShare = typeof navigator !== "undefined" && "share" in navigator;
  const whatsappOk = hasContact && whatsappLink(profile.contactPhone, "") !== null;

  const send = async (channel: Channel) => {
    setBusy(channel);
    const position = await locate();
    const message = sosMessage(profile, position);
    setBusy(null);
    if (!position) toast("Couldn't get your location. The message says so; add where you are if you can.", "warning");
    if (channel === "sms") {
      window.location.href = smsLink(profile.contactPhone, message);
    } else if (channel === "whatsapp") {
      const link = whatsappLink(profile.contactPhone, message);
      if (link) window.open(link, "_blank", "noopener");
    } else {
      try {
        await navigator.share({ text: message });
      } catch {
        // dismissed
      }
    }
  };

  const action = (channel: Channel, label: string, Icon: typeof MessageCircle, disabled = false) => (
    <button
      type="button"
      disabled={disabled || busy !== null}
      onClick={() => void send(channel)}
      className="press inline-flex h-12 items-center gap-2 rounded-full bg-white px-5 text-base font-bold text-danger hover:bg-white/90 disabled:opacity-60"
    >
      <Icon className="size-5" aria-hidden />
      {busy === channel ? "Finding you…" : label}
    </button>
  );

  return (
    <section aria-labelledby="sos-title" className="relative overflow-hidden rounded-[2rem] bg-danger p-6 text-white sm:p-8">
      <div aria-hidden className="pointer-events-none absolute -top-24 -right-20 size-72 rounded-full border-[22px] border-white/10" />
      <div className="relative">
        <p className="inline-flex items-center gap-2 text-sm font-bold text-white/80">
          <MapPin className="size-4" aria-hidden /> SOS
        </p>
        <h2 id="sos-title" className="mt-2 text-[1.75rem] leading-8 font-extrabold tracking-[-0.03em] text-white sm:text-[2rem] sm:leading-9">
          {hasContact ? `Send your location to ${profile.contactName || "your contact"}` : "Add someone to send your location to"}
        </h2>
        <p className="mt-2 max-w-2xl text-[0.9375rem] leading-6 text-white/85">
          {hasContact
            ? "Parlance writes the message with a map link and opens your messaging app. You press Send there. It says you are Deaf and asks them to message, not call."
            : "Choose an emergency contact once. Then one tap here opens a message to them with your location."}
        </p>
        <div className="mt-5 flex flex-wrap gap-2">
          {hasContact ? (
            <>
              {action("sms", "Text message", MessageSquareText)}
              {whatsappOk && action("whatsapp", "WhatsApp", MessageCircle)}
              {canShare && action("share", "Other app", Share2)}
              <button type="button" onClick={onAddContact} className="press inline-flex h-12 items-center rounded-full px-4 text-[0.9375rem] font-bold text-white underline-offset-4 hover:underline">
                Change contact
              </button>
            </>
          ) : (
            <button
              type="button"
              onClick={onAddContact}
              className="press inline-flex h-12 items-center gap-2 rounded-full bg-white px-5 text-base font-bold text-danger hover:bg-white/90"
            >
              <UserRoundPlus className="size-5" aria-hidden /> Add emergency contact
            </button>
          )}
        </div>
        <div className="mt-6 border-t border-white/20 pt-5">
          <p className="text-sm font-bold text-white/80">Emergency numbers in India</p>
          <ul className="mt-2 flex flex-wrap gap-2">
            {EMERGENCY_NUMBERS.map(({ number, label }) => (
              <li key={number}>
                <a
                  href={`tel:${number}`}
                  className={cn("press inline-flex h-11 items-center gap-2 rounded-full bg-white/15 px-4 text-[0.9375rem] font-bold text-white hover:bg-white/25")}
                >
                  <Phone className="size-4" aria-hidden />
                  <span className="tabular-nums">{number}</span>
                  <span className="font-semibold text-white/80">{label}</span>
                </a>
              </li>
            ))}
          </ul>
          <p className="mt-3 max-w-2xl text-sm leading-5 text-white/80">Can't make a voice call? Show the ambulance or police card below to someone nearby and ask them to call.</p>
        </div>
      </div>
    </section>
  );
}
