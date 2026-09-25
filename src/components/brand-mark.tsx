import { clsx } from "clsx";

/**
 * A still and its negative: the picture flips at the midline, the way an
 * afterimage comes back inverted. Keep in sync with `src/app/icon.svg`.
 */
export function BrandMark({ className }: { className?: string }) {
  return (
    <svg
      className={clsx("mark", className)}
      viewBox="0 0 40 40"
      aria-hidden="true"
    >
      <path d="M9 0H20V40H9A9 9 0 0 1 0 31V9A9 9 0 0 1 9 0Z" fill="#34343b" />
      <path d="M20 0H31A9 9 0 0 1 40 9V31A9 9 0 0 1 31 40H20Z" fill="var(--accent)" />
      <path d="M20 8a12 12 0 0 0 0 24z" fill="var(--text)" />
      <path d="M20 8a12 12 0 0 1 0 24z" fill="var(--bg)" />
    </svg>
  );
}
