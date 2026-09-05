import Image from "next/image";

const tmdbLogo =
  "https://www.themoviedb.org/assets/2/v4/logos/v2/blue_short-8e7b30f73a4020692ccca9c88bafe5dcb6f8a62a4c6bc55cd9ba82bb2cd95f6c.svg";

export function SiteFooter() {
  return (
    <footer className="foot">
      <span className="foot__name">Afterimage</span>
      <div className="foot__credit">
        <a
          href="https://www.themoviedb.org"
          target="_blank"
          rel="noreferrer"
          aria-label="The Movie Database"
        >
          <Image src={tmdbLogo} alt="TMDB" width={84} height={11} unoptimized />
        </a>
        <p>
          Film details and images come from TMDB. This product uses the TMDB
          API but is not endorsed or certified by TMDB.
        </p>
      </div>
    </footer>
  );
}
