import { Show, SignInButton, UserButton } from "@clerk/nextjs";
import { BrandMark } from "@/components/brand-mark";

export function SiteHeader() {
  return (
    <header className="topbar">
      <a className="wordmark" href="#top" aria-label="Afterimage home">
        <BrandMark />
        <span>Afterimage</span>
      </a>

      <Show
        when="signed-in"
        fallback={
          <SignInButton mode="modal" forceRedirectUrl="/">
            <button className="btn btn--ghost" type="button">
              Sign in
            </button>
          </SignInButton>
        }
      >
        <div className="topbar__end">
          <nav className="topbar__nav" aria-label="Sections">
            <a href="#journal">Journal</a>
            <a href="#rewind">Rewind</a>
          </nav>
          <UserButton
            appearance={{
              elements: {
                avatarBox: "topbar__avatar",
              },
            }}
          />
        </div>
      </Show>
    </header>
  );
}
