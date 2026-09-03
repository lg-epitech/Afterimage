import { SignInButton } from "@clerk/nextjs";
import { ArrowRight, Search, Sparkles } from "lucide-react";

export function SignedOutLanding() {
  return (
    <section className="landing">
      <div className="landing__glow" aria-hidden="true" />
      <div className="eyebrow">
        <Sparkles size={14} />
        Your private film journal
      </div>
      <h1>
        Keep the films
        <br />
        <span>that stay with you.</span>
      </h1>
      <p className="landing__lede">
        A quiet place for what you watched, who was there, and everything the
        credits couldn&apos;t hold.
      </p>

      <SignInButton mode="modal" forceRedirectUrl="/">
        <button className="landing-search" type="button">
          <Search size={21} strokeWidth={1.8} />
          <span>Search for a film to remember…</span>
          <span className="landing-search__action">
            Begin <ArrowRight size={17} />
          </span>
        </button>
      </SignInButton>

      <div className="landing__details" aria-label="What you can remember">
        <span>Notes &amp; memories</span>
        <i />
        <span>People &amp; places</span>
        <i />
        <span>Rewinds over time</span>
      </div>

      <div className="film-strip" aria-hidden="true">
        <div className="film-strip__card film-strip__card--one">
          <span>Lost in Translation</span>
          <small>Tokyo · 2003</small>
        </div>
        <div className="film-strip__card film-strip__card--two">
          <span>Moonlight</span>
          <small>Miami · 2016</small>
        </div>
        <div className="film-strip__card film-strip__card--three">
          <span>In the Mood for Love</span>
          <small>Hong Kong · 2000</small>
        </div>
      </div>
    </section>
  );
}
