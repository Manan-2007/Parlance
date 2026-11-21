import type { ComponentType } from "react";
import { Clock3, Ear, Hand, ShoppingBag, Siren, Stethoscope } from "lucide-react";
import { lessonIds, lessonKey, type Unit, type UnitIcon } from "@/learn/curriculum";
import type { LessonRecord } from "@/stores/learn";

export const UNIT_ICONS: Record<UnitIcon, ComponentType<{ className?: string; "aria-hidden"?: boolean }>> = {
  hand: Hand,
  ear: Ear,
  stethoscope: Stethoscope,
  siren: Siren,
  clock: Clock3,
  shopping: ShoppingBag,
};

export function unitProgress(unit: Unit, lessons: Record<string, LessonRecord>): { done: number; total: number; next: string | null } {
  const ids = lessonIds(unit);
  const done = ids.filter((id) => lessons[lessonKey(unit.id, id)]).length;
  const next = ids.find((id) => !lessons[lessonKey(unit.id, id)]) ?? null;
  return { done, total: ids.length, next };
}
