import { clsx } from "clsx";

/**
 * A bright disc and the fainter, offset copy the eye keeps after looking away.
 */
export function BrandMark({ className }: { className?: string }) {
  return (
    <span className={clsx("mark", className)} aria-hidden="true">
      <span className="mark__ghost" />
      <span className="mark__light" />
    </span>
  );
}
