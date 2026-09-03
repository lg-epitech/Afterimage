import { Show, SignInButton, UserButton } from "@clerk/nextjs";
import { LogIn } from "lucide-react";
import { BrandMark } from "@/components/brand-mark";

export function SiteHeader() {
  return (
    <header className="site-header">
      <a className="brand" href="#top" aria-label="Afterimage home">
        <BrandMark />
        <span className="brand__word">Afterimage</span>
      </a>

      <Show
        when="signed-in"
        fallback={
          <SignInButton mode="modal" forceRedirectUrl="/">
            <button className="button button--quiet" type="button">
              <LogIn size={16} strokeWidth={1.8} />
              Sign in
            </button>
          </SignInButton>
        }
      >
        <div className="header-actions">
          <nav className="desktop-nav" aria-label="Primary navigation">
            <a href="#journal">Journal</a>
            <a href="#rewind">Rewind</a>
          </nav>
          <UserButton
            appearance={{
              elements: {
                avatarBox: "afterimage-avatar",
              },
            }}
          />
        </div>
      </Show>
    </header>
  );
}
