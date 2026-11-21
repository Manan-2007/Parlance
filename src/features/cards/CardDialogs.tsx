/** Small forms used by the cards: About me, filling a blank, and adding a card. */
import { useEffect, useId, useState, type FormEvent, type ReactNode } from "react";
import { Button } from "@/components/ui/Button";
import { Dialog } from "@/components/ui/Dialog";
import type { Profile } from "@/lib/visitCard";
import { useCards } from "@/stores/cards";

export const inputClass =
  "h-12 w-full rounded-[1rem] border border-line-strong bg-paper-50 px-4 text-base text-ink placeholder:text-ink-3 focus:border-navy";
export const textareaClass =
  "min-h-24 w-full rounded-[1rem] border border-line-strong bg-paper-50 px-4 py-3 text-base leading-6 text-ink placeholder:text-ink-3 focus:border-navy";

export function TextField({
  label,
  hint,
  value,
  onChange,
  placeholder,
  multiline,
  type = "text",
  autoComplete,
  lang,
}: {
  label: string;
  hint?: ReactNode;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  multiline?: boolean;
  type?: string;
  autoComplete?: string;
  lang?: string;
}) {
  const id = useId();
  const hintId = `${id}-hint`;
  return (
    <div className="grid gap-1.5">
      <label htmlFor={id} className="text-[0.9375rem] font-bold text-navy">
        {label}
      </label>
      {hint && (
        <p id={hintId} className="-mt-1 text-sm leading-5 text-ink-3">
          {hint}
        </p>
      )}
      {multiline ? (
        <textarea id={id} lang={lang} value={value} maxLength={600} placeholder={placeholder} aria-describedby={hint ? hintId : undefined} onChange={(e) => onChange(e.target.value)} className={textareaClass} />
      ) : (
        <input id={id} lang={lang} type={type} value={value} maxLength={type === "tel" ? 20 : 120} placeholder={placeholder} autoComplete={autoComplete} aria-describedby={hint ? hintId : undefined} onChange={(e) => onChange(e.target.value)} className={inputClass} />
      )}
    </div>
  );
}

const PROFILE_FIELDS: { key: keyof Profile; label: string; placeholder: string; hint?: string; type?: string; autoComplete?: string; multiline?: boolean }[] = [
  { key: "name", label: "Your name", placeholder: "Name", autoComplete: "name" },
  { key: "contactName", label: "Emergency contact", placeholder: "Their name", hint: "Someone who can come or call for you." },
  { key: "contactPhone", label: "Their phone number", placeholder: "+91 98765 43210", type: "tel", autoComplete: "off" },
  { key: "bloodGroup", label: "Blood group", placeholder: "For example: B+" },
  { key: "allergies", label: "Allergies", placeholder: "For example: penicillin, peanuts", multiline: true },
  { key: "medicines", label: "Medicines you take", placeholder: "Name and dose", multiline: true },
  { key: "conditions", label: "Medical conditions", placeholder: "For example: diabetes, epilepsy", multiline: true },
];

/** "About me": details that fill the emergency and medical cards. */
export function AboutMeDialog({ open, onClose, focus }: { open: boolean; onClose: () => void; focus?: keyof Profile }) {
  const profile = useCards((s) => s.profile);
  const setProfile = useCards((s) => s.setProfile);
  const [draft, setDraft] = useState(profile);
  useEffect(() => {
    if (open) setDraft(profile);
    // reset only when opened
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const save = (event?: FormEvent) => {
    event?.preventDefault();
    setProfile(draft);
    onClose();
  };

  // Asked for a detail? Put it first (the contact's name and number together).
  const wanted: (keyof Profile)[] = !focus ? [] : focus === "contactName" || focus === "contactPhone" ? ["contactName", "contactPhone"] : [focus];
  const fields = [...PROFILE_FIELDS.filter((f) => wanted.includes(f.key)), ...PROFILE_FIELDS.filter((f) => !wanted.includes(f.key))];

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title="About me"
      description="These fill in your emergency and medical cards. They are saved on this device only and are never sent anywhere."
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={() => save()}>Save</Button>
        </>
      }
    >
      <form onSubmit={save} className="grid max-h-[55vh] gap-4 overflow-y-auto pb-1">
        {fields.map((field) => (
          <TextField
            key={field.key}
            label={field.label}
            hint={field.hint}
            placeholder={field.placeholder}
            type={field.type}
            autoComplete={field.autoComplete}
            multiline={field.multiline}
            value={draft[field.key]}
            onChange={(value) => setDraft((d) => ({ ...d, [field.key]: value }))}
          />
        ))}
        <button type="submit" hidden />
      </form>
    </Dialog>
  );
}

/** Fill a card's blank ("One ticket, please, to: ___") before showing it. */
export function FillDialog({
  open,
  title,
  label,
  placeholder,
  onClose,
  onShow,
}: {
  open: boolean;
  title: string;
  label: string;
  placeholder: string;
  onClose: () => void;
  onShow: (value: string) => void;
}) {
  const [value, setValue] = useState("");
  useEffect(() => {
    if (open) setValue("");
  }, [open]);
  const submit = (event?: FormEvent) => {
    event?.preventDefault();
    onShow(value.trim());
  };
  return (
    <Dialog
      open={open}
      onClose={onClose}
      title={title}
      description="Add the detail, or leave it empty and point or write instead."
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={() => submit()}>Show card</Button>
        </>
      }
    >
      <form onSubmit={submit}>
        <TextField label={label} placeholder={placeholder} value={value} onChange={setValue} />
      </form>
    </Dialog>
  );
}

/** Add your own card to a place. Hindi is optional. */
export function AddCardDialog({ open, placeId, placeTitle, onClose }: { open: boolean; placeId: string; placeTitle: string; onClose: () => void }) {
  const addCard = useCards((s) => s.addCard);
  const [en, setEn] = useState("");
  const [hi, setHi] = useState("");
  useEffect(() => {
    if (open) {
      setEn("");
      setHi("");
    }
  }, [open]);
  const save = (event?: FormEvent) => {
    event?.preventDefault();
    if (!en.trim()) return;
    addCard(placeId, en, hi);
    onClose();
  };
  return (
    <Dialog
      open={open}
      onClose={onClose}
      title={`Add a card · ${placeTitle}`}
      description="Something you often need to say here. Saved on this device."
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={() => save()} disabled={!en.trim()}>
            Add card
          </Button>
        </>
      }
    >
      <form onSubmit={save} className="grid gap-4">
        <TextField label="What the card says" placeholder="For example: I have an appointment at 10." value={en} onChange={setEn} />
        <TextField label="In Hindi (optional)" placeholder="हिन्दी में" value={hi} onChange={setHi} lang="hi" />
        <button type="submit" hidden />
      </form>
    </Dialog>
  );
}
