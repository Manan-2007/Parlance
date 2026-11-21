import { useMemo } from "react";
import qrcode from "qrcode-generator";
import { cn } from "@/lib/cn";

/** A QR code drawn as one SVG path (crisp at any size, prints well). */
export function QrCode({ value, label, className }: { value: string; label: string; className?: string }) {
  const { size, path } = useMemo(() => {
    const qr = qrcode(0, "M");
    qr.addData(value, "Byte");
    qr.make();
    const count = qr.getModuleCount();
    let d = "";
    for (let row = 0; row < count; row += 1) {
      for (let col = 0; col < count; col += 1) {
        if (qr.isDark(row, col)) d += `M${col + 2} ${row + 2}h1v1h-1z`;
      }
    }
    return { size: count + 4, path: d };
  }, [value]);

  return (
    <svg viewBox={`0 0 ${size} ${size}`} role="img" aria-label={label} className={cn("block bg-white", className)} shapeRendering="crispEdges">
      <path d={path} fill="#233059" />
    </svg>
  );
}
