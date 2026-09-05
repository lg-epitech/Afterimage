import Image from "next/image";
import { clsx } from "clsx";

export type PosterSize = "w185" | "w342" | "w500";

export function posterUrl(path: string | null, size: PosterSize = "w342") {
  return path ? `https://image.tmdb.org/t/p/${size}${path}` : null;
}

export function backdropUrl(path: string | null, size: "w780" | "w1280" = "w780") {
  return path ? `https://image.tmdb.org/t/p/${size}${path}` : null;
}

export function MoviePoster({
  path,
  title,
  className,
  sizes = "(max-width: 640px) 72px, 160px",
  size = "w342",
  preload = false,
}: {
  path: string | null;
  title: string;
  className?: string;
  sizes?: string;
  size?: PosterSize;
  preload?: boolean;
}) {
  const src = posterUrl(path, size);

  return (
    <div className={clsx("poster", className)}>
      {src ? (
        <Image
          src={src}
          alt={`${title} poster`}
          fill
          sizes={sizes}
          preload={preload}
        />
      ) : (
        <div className="poster__empty" aria-label={`No poster for ${title}`}>
          <span>{title.slice(0, 1)}</span>
        </div>
      )}
    </div>
  );
}
