import { Landmark, School, Shield, Stethoscope, Store, TrainFront } from "lucide-react";
import type { WorkPath } from "@/learn/workPaths";

export const WORK_ICONS: Record<WorkPath["icon"], typeof Stethoscope> = {
  stethoscope: Stethoscope,
  shield: Shield,
  landmark: Landmark,
  train: TrainFront,
  store: Store,
  school: School,
};
