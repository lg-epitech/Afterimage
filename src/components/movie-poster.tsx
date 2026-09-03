import Image from "next/image";
import { Film } from "lucide-react";
import { clsx } from "clsx";

export function posterUrl(path: string | null, size: "w185" | "w342" = "w342") {
  return path ? `https://image.tmdb.org/t/p/${size}${path}` : null;
}

export function MoviePoster({
  path,
  title,
  className,
  sizes = "(max-width: 640px) 72px, 160px",
  preload = false,
}: {
  path: string | null;
  title: string;
  className?: string;
  sizes?: string;
  preload?: boolean;
}) {
  const src = posterUrl(path);

  return (
    <div className={clsx("movie-poster", className)}>
      {src ? (
        <Image
          src={src}
          alt={`${title} poster`}
          fill
          sizes={sizes}
          preload={preload}
        />
      ) : (
        <div className="movie-poster__fallback" aria-label={`No poster for ${title}`}>
          <Film size={25} strokeWidth={1.4} />
          <span>{title.slice(0, 1)}</span>
        </div>
      )}
    </div>
  );
}
