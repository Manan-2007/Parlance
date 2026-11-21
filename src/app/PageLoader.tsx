import { SigningLoader } from "@/components/ui/SigningLoader";

export function PageLoader() {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-3">
      <SigningLoader label="Loading Parlance" size="lg" />
    </div>
  );
}
