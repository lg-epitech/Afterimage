import { clsx } from "clsx";

export function BrandMark({ className }: { className?: string }) {
  return (
    <span className={clsx("brand-mark", className)} aria-hidden="true">
      <span className="brand-mark__orb brand-mark__orb--one" />
      <span className="brand-mark__orb brand-mark__orb--two" />
    </span>
  );
}
